/**
 * Clerk integration — SDK, environment boundary, role policy, and admin UI wiring.
 *
 * This suite verifies the client integration without requesting or printing
 * Clerk credentials. Live sign-in still depends on a configured Clerk instance
 * and an account whose public metadata contains role: "admin".
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"
import { ROOT, check, load, stripJsComments, suite } from "./harness.mjs"

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
  // The Team screen's rules, in a module with no JSX: the page itself pulls in
  // Radix's `Select`, whose CJS dependencies cannot be imported here — so anything
  // defined inside the page could only be grepped, never called.
  const roster = await load("src/admin/team-roster.ts", "team-roster")

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
      const got = clerkAuth.resolveOrgAccess(subject)
      return got.allowed === expected ? [] : [`${label}: allowed=${got.allowed}, expected ${expected}`]
    })
  })

  check("the reason for a denial distinguishes no membership from a wrong role", () => {
    // The two produce different instructions on screen. Reporting one as the
    // other sends the operator to ask for the wrong thing.
    const org = clerkAuth.ADMIN_ORG_ID
    const out = []
    const missing = clerkAuth.resolveOrgAccess({ memberships: [] })
    const wrongRole = clerkAuth.resolveOrgAccess({ memberships: [{ organization: { id: org }, role: "org:auditor" }] })
    if (missing.allowed) out.push("an empty membership list was allowed")
    if (wrongRole.allowed) out.push("an unrecognised role was allowed")
    if (!missing.allowed && missing.reason !== "no-membership") out.push(`no membership reports reason "${missing.reason}"`)
    if (!wrongRole.allowed && wrongRole.reason !== "insufficient-role") out.push(`an unrecognised role reports reason "${wrongRole.reason}"`)
    // A denial that carried capabilities would be a grant wearing a denial's face.
    if ("capabilities" in missing || "capabilities" in wrongRole) out.push("a denied result carries capabilities")
    return out
  })

  check("the Clerk floor is the narrowest reading of a role, never the widest", () => {
    // This is what the shell renders from between the Clerk check and `/api/me` —
    // and for good if that call fails. It must never show a page the server would
    // refuse, so a member's floor is one area, not two. Until #100 this file granted
    // a member the Settings page that `api/settings.ts` answered `403` to.
    const access = clerkAuth.resolveOrgAccess({
      memberships: [{ organization: { id: clerkAuth.ADMIN_ORG_ID }, role: "org:member" }],
    })
    if (!access.allowed) return ["a member of Indigo Services was refused the dashboard entirely"]

    const features = clerkAuth.featuresForCapabilities(access.capabilities)
    const visible = clerkAuth.ALL_ADMIN_FEATURES.filter((f) => features.has(f))
    const out = []
    if (!visible.includes("inbox")) out.push("a member cannot see the inbox — the one area every staff level has")
    if (visible.includes("settings")) out.push("a member's floor includes settings, which needs settings:read")
    if (visible.includes("design")) out.push("a member's floor includes the brand system")
    if (visible.includes("reference")) out.push("a member's floor includes the engineering documentation")
    if (visible.length !== 1) out.push(`a member's floor is ${visible.length} areas (${visible.join(", ")}), expected exactly 1`)
    return out
  })

  check("an admin's floor is every page the nav model declares, and a member's is not", () => {
    const org = clerkAuth.ADMIN_ORG_ID
    const floor = (role) => {
      const access = clerkAuth.resolveOrgAccess({ memberships: [{ organization: { id: org }, role }] })
      return access.allowed ? clerkAuth.accessFrom(access.orgRole, access.capabilities) : null
    }
    const admin = floor("org:admin")
    const member = floor("org:member")
    const out = []
    if (!admin) return ["an admin of Indigo Services was refused the dashboard"]
    if (!member) return ["a member of Indigo Services was refused the dashboard entirely"]

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
    if (memberPaths.length >= routesModel.ADMIN_ROUTES.length) {
      out.push(`a member sees ${memberPaths.length} of ${routesModel.ADMIN_ROUTES.length} pages — as many as an admin`)
    }
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
    if (!/if \(!org\.allowed\)/.test(src)) out.push("the guard does not deny when the organization check refuses")
    if (!/resolveOrgAccess\(\{/.test(src)) out.push("the guard does not call the single organization resolver")
    if (!/memberships: user\?\.organizationMemberships/.test(src)) out.push("the guard does not pass the organization memberships")
    if (!/activeOrgId: orgId,/.test(src) || !/activeOrgRole: orgRole/.test(src)) {
      out.push("the guard does not pass the session's active organization, so an admin who has not selected one is locked out")
    }
    // Hook order: the capability fetch has to run before the first early return,
    // or signing in would change the number of hooks between renders.
    const hookAt = src.indexOf("useCapabilities(")
    const firstReturnAt = src.indexOf("if (!isLoaded")
    if (hookAt === -1) out.push("the guard never asks the server for its capabilities")
    else if (firstReturnAt !== -1 && hookAt > firstReturnAt) {
      out.push("useCapabilities is called after an early return — the hook order would change on sign-in")
    }
    if (!/<AdminAccessContext\.Provider value=\{access\}>\{children\}<\/AdminAccessContext\.Provider>/.test(src)) {
      out.push("the resolved access is not provided to the shell")
    }
    if (!/Admin sign-in is not configured/.test(src)) out.push("missing environment keys have no clear admin setup state")
    return out
  })

  check("a manager's nav is what they can act on, not what they can read", () => {
    // `settings:read` opens exactly one page: the Team roster (#102), which it can
    // render completely — every person, every level, and a select it cannot move.
    // It does NOT open the settings pages, because those are forms whose only
    // action is Save and saving needs `settings:write`; a manager with a page of
    // disabled controls would be the quieter version of the lie #100 removed.
    const manager = clerkAuth.accessFrom("service_manager", [
      "inbox:read",
      "inbox:write",
      "inbox:delete",
      "settings:read",
      "reference:read",
    ])
    const visible = clerkAuth.ALL_ADMIN_FEATURES.filter((f) => clerkAuth.can(manager, f))
    const out = []
    if (!visible.includes("inbox")) out.push("a manager cannot see the inbox")
    if (!visible.includes("reference")) out.push("a manager cannot see the reference docs")
    if (!visible.includes("team")) out.push("a manager cannot see the roster, which settings:read is for")
    if (visible.includes("settings")) out.push("a manager sees settings, which they cannot save")
    if (visible.includes("design")) out.push("a manager sees the brand system, which they cannot save")

    const rep = clerkAuth.accessFrom("service_rep", ["inbox:read", "inbox:write"])
    if (clerkAuth.can(rep, "settings")) out.push("a rep sees settings")
    if (clerkAuth.can(rep, "reference")) out.push("a rep sees the reference docs")
    // A rep has no `settings:read`, so the roster is not theirs either. The page is
    // about other people's access, and it is the one page where the levels are all
    // visible at once.
    if (clerkAuth.can(rep, "team")) out.push("a rep sees the roster, which needs settings:read")
    return out
  })

  check("the roster offers only what the level allows, and a missing row is not a withdrawn one", () => {
    // Four states the screen must tell apart. They are one boolean away from each
    // other, and getting one wrong is not a cosmetic bug: `canRestore` on a member
    // with no row **creates a level** when pressed.
    const member = (over) => ({
      userId: "user_2someone",
      name: "Dana Reyes",
      email: "dana@example.com",
      imageUrl: "",
      orgRole: "org:member",
      role: null,
      active: false,
      ...over,
    })
    const admin = { canWrite: true, isSelf: false }
    const out = []

    // No row: a select, and NOTHING else. The level is set, not restored.
    const fresh = roster.rowState(member({}), admin)
    if (!fresh.editable) out.push("a member with no row cannot be given a level")
    if (fresh.canRestore) out.push("a member with no row was offered Restore — that would create a level by accident")
    if (fresh.canWithdraw) out.push("a member with no row was offered Remove access")
    if (fresh.showInactive) out.push("a member with no row was labelled Inactive — they never had a level")

    // A live row: a select and Remove access.
    const active = roster.rowState(member({ role: "service_rep", active: true }), admin)
    if (!active.editable || !active.canWithdraw) out.push("an active rep cannot be changed or withdrawn")
    if (active.canRestore) out.push("an active rep was offered Restore")

    // A withdrawn row: the level is still shown and Restore is the action.
    const withdrawn = roster.rowState(member({ role: "service_rep", active: false }), admin)
    if (!withdrawn.canRestore || !withdrawn.showInactive) out.push("a withdrawn rep cannot be restored")
    if (withdrawn.canWithdraw) out.push("a withdrawn rep was offered Remove access again")

    // A Clerk admin: no control at all, whatever the row says — their level is
    // never read, so a select there writes a value that never applies.
    const boss = roster.rowState(member({ orgRole: "org:admin", role: "service_rep", active: true }), admin)
    if (boss.editable || boss.canWithdraw || boss.canRestore) out.push("a Clerk admin's row was made editable")
    if (boss.showInactive) out.push("a Clerk admin was labelled Inactive")

    // Yourself: the endpoint refuses it, so the control is not offered.
    const self = roster.rowState(member({ role: "service_rep", active: true }), { canWrite: true, isSelf: true })
    if (self.editable || self.canWithdraw) out.push("an operator was offered a control on their own row")

    // A manager: everything visible, nothing offered.
    const reader = roster.rowState(member({ role: "service_rep", active: true }), { canWrite: false, isSelf: false })
    if (reader.editable || reader.canWithdraw) out.push("a manager without settings:write was offered a control")

    // And the access column, which is the same rule the server applies.
    if (roster.accessText(member({ orgRole: "org:admin" })) !== "Admin") {
      out.push("a Clerk admin with no row was not shown as an admin")
    }
    if (roster.accessText(member({})) !== "Read-only inbox") out.push("a member with no row was not shown as read-only")
    if (roster.accessText(member({ role: "service_manager", active: true })) !== "Service Manager") {
      out.push("a live manager was not shown as one")
    }
    if (roster.accessText(member({ role: "service_manager", active: false })) !== "Read-only inbox") {
      out.push("a withdrawn manager was not shown as read-only")
    }
    return out
  })

  check("a recorded level change reads as what happened, including the first assignment", () => {
    // #114. The audit panel is the only place these facts are visible, so a wrong
    // sentence is a wrong record. The three shapes are not one template: a first
    // assignment has nothing to transition *from*, and an access change is not a
    // level change at all — `Service Rep → Service Rep` would be a line that
    // appears to do nothing.
    const entry = (over) => ({
      id: 1,
      actorId: "user_2boss",
      subjectId: "user_2rep",
      fromRole: null,
      toRole: "service_rep",
      fromActive: null,
      toActive: true,
      at: "2026-10-28T12:00:00Z",
      ...over,
    })
    const out = []
    const says = (over, expected, why) => {
      const got = roster.changeText(entry(over))
      if (got !== expected) out.push(`${why}: said ${JSON.stringify(got)}, expected ${JSON.stringify(expected)}`)
    }

    says({}, "Set to Service Rep", "a first assignment")
    // A first assignment with `active: false` — a level nobody can use yet. It is
    // legal and rare, and without this branch the row would claim a level while the
    // person still could not sign in.
    says({ toActive: false }, "Set to Service Rep · no access", "a first assignment with no access")
    says(
      { fromRole: "service_rep", fromActive: true, toRole: "service_manager" },
      "Service Rep → Service Manager",
      "a promotion",
    )
    says(
      { fromRole: "service_rep", fromActive: true, toRole: "service_rep", toActive: false },
      "Access withdrawn",
      "a withdrawal",
    )
    says(
      { fromRole: "service_rep", fromActive: false, toRole: "service_rep", toActive: true },
      "Access restored",
      "a restoration",
    )
    // Both at once: the case where a summary loses information, and the one this
    // function exists for.
    says(
      { fromRole: "service_rep", fromActive: true, toRole: "service_manager", toActive: false },
      "Service Rep → Service Manager · Access withdrawn",
      "a promotion and a withdrawal in one write",
    )
    // ⚠️ The no-op case is unreachable through the writer — the SQL only records a
    // change — but the renderer still has to say something honest if a row ever
    // arrives that records none, rather than drawing an empty cell.
    says(
      { fromRole: "service_rep", fromActive: true, toRole: "service_rep", toActive: true },
      "No change recorded",
      "a row that records no change",
    )

    // The actor is an id, resolved against the roster. A person who has left the
    // organization is dropped from the roster and their past changes remain, so the
    // fallback has to be the id — "someone" cannot be looked up in Clerk later.
    const people = [{ userId: "user_2boss", name: "Jaden Black" }]
    if (roster.personName("user_2boss", people) !== "Jaden Black") {
      out.push("a known actor was not resolved to their name")
    }
    if (roster.personName("user_2gone", people) !== "user_2gone") {
      out.push("an actor no longer on the roster did not fall back to their id")
    }
    return out
  })

  check("a route the nav hides cannot be reached by typing its URL", () => {
    // The sidebar filters links; it does not unmount routes. Without a guard at the
    // outlet, a Service Rep who types /admin/settings gets a page that loads (the
    // `site` read is public) and answers 403 on every save.
    const src = read("src/admin/AdminLayout.tsx")
    const out = []
    if (!/useAdminAccess\(\)/.test(src)) out.push("the layout does not read the resolved capabilities")
    if (!/findAdminRoute\(/.test(src)) out.push("the layout does not resolve the current route")
    if (!/can\(access, route\.feature\)/.test(src)) {
      out.push("the layout does not check the route's feature against the capabilities")
    }
    if (!/\{denied \? .* : <Outlet \/>\}/.test(src)) {
      out.push("the outlet is rendered unconditionally — the URL is unguarded")
    }
    // ⚠️ Presence is not enough. A second, unconditional `<Outlet />` beside the
    // guarded one renders the page regardless, and the assertion above still
    // matches. Measured: adding one passed the check above before this line existed.
    const outlets = (src.match(/<Outlet \/>/g) ?? []).length
    if (outlets !== 1) out.push(`${outlets} <Outlet /> elements — an unguarded one bypasses the nav filter`)
    return out
  })

  check("the inbox hides the actions a caller's capabilities do not include", () => {
    // The page-level gate is not enough. A Service Rep *reaches* the inbox, so the
    // drawer is where a capability has to become a visible boundary — a Delete
    // button that answers 403 is the same lie as a Settings page a member cannot
    // save, one level down.
    const src = read("src/admin/InquiriesPage.tsx")
    const out = []
    if (!/useAdminAccess\(\)/.test(src)) out.push("the inbox does not read the resolved capabilities")
    if (!/capabilities\.has\("inbox:delete"\)/.test(src)) out.push("the delete control is not gated on inbox:delete")
    if (!/capabilities\.has\("inbox:write"\)/.test(src)) out.push("the edit controls are not gated on inbox:write")
    if (!/disabled=\{!canWrite\}/.test(src)) out.push("the status or notes control is not disabled for a read-only caller")
    if (!/\{canDelete \? \(/.test(src)) out.push("the delete block is not conditional on canDelete")
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
    // Checked per name rather than as one literal string: the import list gained
    // `useAuth` when the inbox moved to the server (A2), and an assertion on the
    // exact text would call a correct change a regression.
    for (const name of ["UserButton", "useClerk", "useUser"]) {
      if (!new RegExp(`import \\{[^}]*\\b${name}\\b[^}]*\\} from "@clerk/react"`).test(src)) {
        out.push(`sidebar does not import ${name} from @clerk/react`)
      }
    }
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
    // The docblock above the component explains what was removed and names the
    // control it removed, so a raw match would fail on the explanation. Only the
    // rendered code counts — the same trap that made #93's first guard red.
    const code = stripJsComments(security)
    const out = []
    if (!/not server authorization/i.test(guard)) out.push("RequireAuth does not state its client-side authorization limit")
    if (!/Clerk manages your password, multi-factor authentication, and active sessions/.test(code)) {
      out.push("SecurityPage still suggests local controls manage real account security")
    }
    if (/src\/admin\/auth\.ts|prototype gate|Change password/.test(code)) out.push("SecurityPage retains copy from the retired credential prototype")

    // #95's acceptance criterion, which had nothing watching it: the page shows
    // the Clerk card and nothing else. `resetDemoData` cleared a browser record
    // that no screen read; the control is gone, and a control that clears nothing
    // must not come back.
    if (/resetDemoData|Reset demo data/.test(code)) {
      out.push("SecurityPage offers a reset control again — the browser store it cleared no longer exists")
    }
    // Access has come from an organization membership since #74, not from a flag on
    // the user. The card said "the admin role in your Clerk public metadata" until
    // #95, which described an authorization rule that had been wrong for months on
    // the one page whose subject is access.
    if (/public metadata|publicMetadata/i.test(code)) {
      out.push("SecurityPage says access comes from public metadata; it comes from an organization membership")
    }
    if (!/Indigo Services/.test(code)) {
      out.push("SecurityPage does not name the organization that grants access")
    }
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
