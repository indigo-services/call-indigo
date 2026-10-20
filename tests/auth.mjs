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
  const routesModel = await load("src/admin/routes.ts", "admin-routes")

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

  /* ── Access resolution (issue #74) ───────────────────────────────────────
   *
   * One resolver, so this is the only place the rules can be wrong. The cases
   * below are the rules themselves, not examples of them: the retired flat flag
   * must grant nothing, and an admin of some OTHER organization must not pass.
   */

  check("admin access comes only from a membership of the pinned organization", () => {
    const org = clerkAuth.ADMIN_ORG_ID
    const membership = (role, id = org) => ({ organization: { id }, role })
    const cases = [
      ["no user at all", null, false],
      ["an undefined user", undefined, false],
      ["a user object with no memberships field", {}, false],
      ["an empty membership list", { memberships: [] }, false],
      ["a null membership list", { memberships: null }, false],
      // If the retired flag still granted access, the organization model would be
      // decoration and this whole change would be cosmetic.
      ["the retired flat role flag on its own", { memberships: [], publicMetadata: { role: "admin" } }, false],
      // Pinning. Clerk's creator_role on this instance is org:admin, so "any
      // organization where I am an admin" is reachable by anyone who can create
      // one. Comparing the id is what makes the role mean something.
      ["admin of a DIFFERENT organization", { memberships: [membership("org:admin", "org_someone_elses_org")] }, false],
      ["member of the right organization", { memberships: [membership("org:member")] }, true],
      ["admin of the right organization", { memberships: [membership("org:admin")] }, true],
      ["a custom role in the right organization", { memberships: [membership("org:auditor")] }, false],
      ["a role differing only in case", { memberships: [membership("org:Admin")] }, false],
      // The active session is the same fact from a second endpoint, not a second
      // rule — and it is trusted only for the pinned organization.
      ["the active session for the right organization", { activeOrgId: org, activeOrgRole: "org:admin" }, true],
      ["the active session for a different organization", { activeOrgId: "org_elsewhere", activeOrgRole: "org:admin" }, false],
      ["the active session with no role", { activeOrgId: org, activeOrgRole: null }, false],
    ]
    return cases.flatMap(([label, subject, expected]) => {
      const got = clerkAuth.resolveAdminAccess(subject)
      return got.allowed === expected ? [] : [`${label}: allowed=${got.allowed}, expected ${expected}`]
    })
  })

  check("the reason for a denial distinguishes no membership from a wrong role", () => {
    // The two produce different instructions on screen. Reporting one as the
    // other sends the operator to ask for the wrong thing.
    const org = clerkAuth.ADMIN_ORG_ID
    const out = []
    const missing = clerkAuth.resolveAdminAccess({ memberships: [] })
    const wrongRole = clerkAuth.resolveAdminAccess({ memberships: [{ organization: { id: org }, role: "org:auditor" }] })
    if (missing.reason !== "no-membership") out.push(`no membership reports reason "${missing.reason}"`)
    if (wrongRole.reason !== "insufficient-role") out.push(`a custom role reports reason "${wrongRole.reason}"`)
    if (missing.role !== null || wrongRole.role !== null) out.push("a denied result carries a role")
    if (missing.features.size !== 0 || wrongRole.features.size !== 0) out.push("a denied result carries features")
    return out
  })

  check("a member gets the inbox and settings, and nothing else", () => {
    const access = clerkAuth.resolveAdminAccess({
      memberships: [{ organization: { id: clerkAuth.ADMIN_ORG_ID }, role: "org:member" }],
    })
    const visible = clerkAuth.ALL_ADMIN_FEATURES.filter((f) => clerkAuth.can(access, f))
    const out = []
    if (!visible.includes("inbox")) out.push("a member cannot see the inbox — the page the role exists for")
    if (!visible.includes("settings")) out.push("a member cannot see settings, which holds their own profile and security")
    if (visible.includes("design")) out.push("a member can see the brand system")
    if (visible.includes("reference")) out.push("a member can see the engineering documentation")
    if (visible.length !== 2) out.push(`a member sees ${visible.length} areas (${visible.join(", ")}), expected exactly 2`)
    return out
  })

  check("an admin sees every page the nav model declares, and a member does not", () => {
    const admin = clerkAuth.resolveAdminAccess({
      memberships: [{ organization: { id: clerkAuth.ADMIN_ORG_ID }, role: "org:admin" }],
    })
    const member = clerkAuth.resolveAdminAccess({
      memberships: [{ organization: { id: clerkAuth.ADMIN_ORG_ID }, role: "org:member" }],
    })
    const out = []
    // Without this, a typo in an item's `feature` would hide that page from
    // everyone — including the role that is supposed to see all of it — and
    // nothing else in the suite looks at feature values.
    if (routesModel.ADMIN_ROUTES.length === 0) out.push("ADMIN_ROUTES is empty — this check would pass vacuously")
    for (const item of routesModel.ADMIN_ROUTES) {
      if (!clerkAuth.can(admin, item.feature)) {
        out.push(`${item.path} is hidden from an admin (feature "${item.feature}") — unknown area, or no role grants it`)
      }
    }
    const memberPaths = routesModel.ADMIN_ROUTES.filter((i) => clerkAuth.can(member, i.feature)).map((i) => i.path)
    if (memberPaths.length === 0) out.push("a member sees no pages at all")
    for (const path of ["/admin/design", "/admin/assets", "/admin/components", "/admin/docs"]) {
      if (memberPaths.includes(path)) out.push(`a member can reach ${path}`)
    }
    return out
  })

  check("the retired flat role flag is read nowhere under src/", () => {
    // The one thing a per-case test cannot see: a second gate somewhere else
    // that still trusts the old flag. Nothing in src/ may name it — including
    // comments, which is why the resolver describes it in prose instead.
    const files = walkFiles(path.join(ROOT, "src")).filter((f) => /\.(?:ts|tsx)$/.test(f))
    return files
      .filter((f) => readFileSync(f, "utf8").includes("publicMetadata"))
      .map((f) => `${path.relative(ROOT, f).split(path.sep).join("/")} still reads the retired flag`)
  })

  check("the guard waits for Clerk, checks identity and role, then renders the shell", () => {
    const src = read("src/admin/RequireAuth.tsx")
    const out = []
    if (!/useAuth\(\)/.test(src) || !/useUser\(\)/.test(src)) out.push("RequireAuth does not read Clerk auth and user state")
    if (!/if \(!isLoaded \|\| \(isSignedIn && !isUserLoaded\)\)/.test(src)) out.push("RequireAuth does not wait for both Clerk states to load")
    if (!/if \(!isSignedIn\) return <LoginPage \/>/.test(src)) out.push("signed-out visitors do not receive the Clerk sign-in page")
    if (!/if \(!access\.allowed\)/.test(src)) out.push("the guard does not deny when the resolver refuses")
    if (!/resolveAdminAccess\(\{/.test(src)) out.push("the guard does not call the single access resolver")
    if (!/memberships: user\?\.organizationMemberships/.test(src)) out.push("the guard does not pass the organization memberships")
    if (!/activeOrgId: orgId,/.test(src) || !/activeOrgRole: orgRole/.test(src)) {
      out.push("the guard does not pass the session's active organization, so an admin who has not selected one is locked out")
    }
    if (!/<AdminAccessContext\.Provider value=\{access\}>\{children\}<\/AdminAccessContext\.Provider>/.test(src)) {
      out.push("the resolved access is not provided to the shell")
    }
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
    // The runbook must name what actually grants access. Until #74 it said to set
    // the public metadata role — an instruction that would now lock an operator
    // out while they believed they had followed every step.
    if (!/Admin members? of the/.test(environments) || !/Indigo Services/.test(environments)) {
      out.push("environment runbook does not say that an Admin membership of the Indigo Services organization is what grants access")
    }
    if (!/invitation by itself does not/i.test(environments)) out.push("environment runbook does not distinguish invitation from admin role")
    if (!/Invite-only/.test(adr)) out.push("ADR does not record the invited-admin access policy")
    return out
  })

}
