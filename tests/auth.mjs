/**
 * Clerk integration — SDK, environment boundary, role policy, and admin UI wiring.
 *
 * This suite verifies the client integration without requesting or printing
 * Clerk credentials. Live sign-in still depends on a configured Clerk instance
 * and an account whose public metadata contains role: "admin".
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"
import { ROOT, check, load, suite } from "./harness.mjs"

const read = (relativePath) => readFileSync(path.join(ROOT, relativePath), "utf8")

function walkFiles(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) walkFiles(full, files)
    else files.push(full)
  }
  return files
}

export async function run() {
  suite("Clerk authentication", "tests/auth.mjs")

  const pkg = JSON.parse(read("package.json"))
  const lock = JSON.parse(read("package-lock.json"))
  const clerkAuth = await load("src/admin/clerkAuth.ts", "clerkAuth")

  check("the React Core 3 SDK is a direct runtime dependency", () => {
    const spec = pkg.dependencies?.["@clerk/react"]
    const resolved = lock.packages?.["node_modules/@clerk/react"]?.version
    const out = []
    if (!spec || !/^\^?6\./.test(spec)) out.push(`package.json has @clerk/react ${String(spec)}, expected Core 3 v6`)
    if (!resolved || !/^6\./.test(resolved)) out.push(`package-lock.json resolves @clerk/react ${String(resolved)}, expected Core 3 v6`)
    if (pkg.dependencies?.["@clerk/nextjs"]) out.push("this Vite app must not depend on @clerk/nextjs")
    return out
  })

  check("the admin route loads Clerk only when a publishable key is present", () => {
    const src = read("src/admin/AdminArea.tsx")
    const app = read("src/App.tsx")
    const out = []
    if (!/import \{ ClerkProvider \} from "@clerk\/react"/.test(src)) out.push("AdminArea does not import ClerkProvider")
    if (!/import\.meta\.env\.VITE_CLERK_PUBLISHABLE_KEY/.test(src)) out.push("AdminArea does not read the Vite publishable key")
    if (!/<ClerkProvider\b[\s\S]*?publishableKey=\{clerkPublishableKey\}[\s\S]*?>/.test(src)) out.push("ClerkProvider is not passed the publishable key")
    if (!/if \(!clerkPublishableKey\)/.test(src)) out.push("missing Clerk configuration does not stop the admin area")
    if (!/lazy\(\(\) => import\("@\/admin\/AdminArea"\)\)/.test(app)) out.push("App does not defer Clerk loading until the admin route")
    return out
  })

  check("Vite maps the Marketplace public key and filters out the server secret", () => {
    const src = read("vite.config.ts")
    const out = []
    if (!/loadEnv\(mode, process\.cwd\(\), \["VITE_", "NEXT_PUBLIC_"\]\)/.test(src)) {
      out.push("Vite does not restrict loaded environment variables to VITE_* and NEXT_PUBLIC_*")
    }
    if (!/env\.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY\s*\?\?\s*env\.VITE_CLERK_PUBLISHABLE_KEY/.test(src)) {
      out.push("the Vercel Marketplace publishable key is not mapped to the Vite key")
    }
    if (/env\.CLERK_SECRET_KEY|define\s*:\s*\{[^}]*CLERK_SECRET_KEY/s.test(src)) {
      out.push("Vite reads or defines CLERK_SECRET_KEY")
    }
    const envExample = read(".env.example")
    if (!/NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=/.test(envExample)) out.push(".env.example does not document the Marketplace publishable key")
    return out
  })

  check("admin role matching fails closed for missing or non-admin metadata", () => {
    const cases = [
      [null, false],
      [undefined, false],
      [{}, false],
      [{ publicMetadata: null }, false],
      [{ publicMetadata: {} }, false],
      [{ publicMetadata: { role: "member" } }, false],
      [{ publicMetadata: { role: "Admin" } }, false],
      [{ publicMetadata: { role: "admin" } }, true],
    ]
    return cases.flatMap(([user, expected]) =>
      clerkAuth.hasAdminRole(user) === expected
        ? []
        : [`hasAdminRole(${JSON.stringify(user)}) returned ${clerkAuth.hasAdminRole(user)}, expected ${expected}`],
    )
  })

  check("the guard waits for Clerk, checks identity and role, then renders the shell", () => {
    const src = read("src/admin/RequireAuth.tsx")
    const out = []
    if (!/useAuth\(\)/.test(src) || !/useUser\(\)/.test(src)) out.push("RequireAuth does not read Clerk auth and user state")
    if (!/if \(!isLoaded \|\| \(isSignedIn && !isUserLoaded\)\)/.test(src)) out.push("RequireAuth does not wait for both Clerk states to load")
    if (!/if \(!isSignedIn\) return <LoginPage \/>/.test(src)) out.push("signed-out visitors do not receive the Clerk sign-in page")
    if (!/if \(!hasAdminRole\(user\)\)/.test(src)) out.push("the role check does not deny users without admin metadata")
    if (!/return <>\{children\}<\/>/.test(src)) out.push("the protected children are not rendered after authorization")
    if (!/Admin sign-in is not configured/.test(src)) out.push("missing environment keys have no clear admin setup state")
    return out
  })

  check("the whole admin shell stays behind RequireAuth", () => {
    const src = read("src/admin/AdminArea.tsx")
    return /<RequireAuth clerkConfigured>\s*<AdminLayout\s*\/>\s*<\/RequireAuth>/.test(src)
      ? []
      : ["AdminArea does not wrap AdminLayout in the Clerk role gate"]
  })

  check("the sign-in widget uses hash routing and returns to the requested admin area", () => {
    const src = read("src/admin/LoginPage.tsx")
    const out = []
    if (!/import \{ SignIn \} from "@clerk\/react"/.test(src)) out.push("LoginPage does not use Clerk's prebuilt sign-in component")
    if (!/<SignIn routing="hash" fallbackRedirectUrl="\/admin\/inquiries" \/>/.test(src)) out.push("SignIn routing or post-sign-in destination is missing")
    if (/type="password"|from "@\/admin\/auth"/.test(src)) out.push("LoginPage retains the removed custom credential flow")
    return out
  })

  check("the sidebar displays Clerk identity and exposes account management and sign-out", () => {
    const src = read("src/components/app-sidebar.tsx")
    const out = []
    if (!/UserButton, useClerk, useUser/.test(src)) out.push("sidebar does not use Clerk account controls")
    if (!/user\?\.fullName/.test(src)) out.push("sidebar does not show the Clerk user's name")
    if (!/<UserButton\s*\/>/.test(src)) out.push("sidebar has no Clerk account menu")
    if (!/signOut\(\{ redirectUrl: "\/" \}\)/.test(src)) out.push("sidebar has no Clerk sign-out action")
    if (/from "@\/admin\/auth"/.test(src)) out.push("sidebar still imports the removed auth module")
    return out
  })

  check("the obsolete shared credential implementation is removed", () => {
    const source = walkFiles(path.join(ROOT, "src"))
      .filter((file) => /\.(?:ts|tsx)$/.test(file))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n")
    return existsSync(path.join(ROOT, "src/admin/auth.ts"))
      ? ["src/admin/auth.ts still exists"]
      : /PASSWORD_HASH_B64|USERNAME_HASH_HEX|PBKDF2_ITERATIONS/.test(source)
        ? ["a credential hash from the retired prototype remains under src/"]
        : []
  })

  check("security copy distinguishes Clerk identity from server authorization", () => {
    const guard = read("src/admin/RequireAuth.tsx")
    const security = read("src/admin/SecurityPage.tsx")
    const out = []
    if (!/not server authorization/i.test(guard)) out.push("RequireAuth does not state its client-side authorization limit")
    if (!/Clerk manages your password, multi-factor authentication, and active sessions/.test(security)) {
      out.push("SecurityPage still suggests local controls manage real account security")
    }
    if (/src\/admin\/auth\.ts|prototype gate|Change password/.test(security)) out.push("SecurityPage retains copy from the retired credential prototype")
    return out
  })

  check("admin access requires invite-only instance policy and a separate Clerk role", () => {
    const environments = read("docs/30-operations/environments.md")
    const adr = read("docs/40-project/decisions/0005-clerk-admin-identity.md")
    const out = []
    if (!/Invite-only/.test(environments)) out.push("environment runbook does not require Clerk Invite-only mode")
    if (!/publicMetadata\.role\s*=\s*[\"']admin/.test(environments)) out.push("environment runbook does not specify the trusted admin role")
    if (!/invitation by itself does not/i.test(environments)) out.push("environment runbook does not distinguish invitation from admin role")
    if (!/Invite-only/.test(adr)) out.push("ADR does not record the invited-admin access policy")
    return out
  })

}
