/**
 * policy — the release gates from PRD §7.4 and §14 that are checkable from the
 * source tree.
 *
 * These are the rules the brief calls "normative … a release gate, not a
 * guideline", so they get a test rather than a reviewer's memory. Every one of
 * them is a claim that can silently rot: the route table drifts from the
 * sidebar, someone imports across the marketing/admin boundary, a
 * `tailwind.config.js` reappears.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"
import { MemoryRouter } from "react-router-dom"
import { ROOT, check, load, stripJsComments, suite } from "./harness.mjs"

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

function read(p) {
  return readFileSync(p, "utf8")
}

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, "/")
}

export async function run() {
  const srcFiles = walk(path.join(ROOT, "src"))
  const adminFiles = srcFiles.filter((f) => rel(f).startsWith("src/admin/"))
  const uiFiles = srcFiles.filter((f) => rel(f).startsWith("src/components/ui/"))
  const appSource = read(path.join(ROOT, "src", "App.tsx"))
  const routesSource = read(path.join(ROOT, "src", "admin", "routes.ts"))
  const pkg = JSON.parse(read(path.join(ROOT, "package.json")))

  /* ── Component policy (PRD §7) ─────────────────────────────────────────── */

  suite("Component policy (PRD §7)", "tests/policy.mjs")

  check("no admin file imports from the marketing front end (PRD §7.4.2)", () =>
    adminFiles
      .filter((f) => /from\s+["']@\/marketing\//.test(read(f)))
      .map((f) => rel(f)),
  )

  check("the marketing front end does not import admin code either (PRD §8.3)", () =>
    srcFiles
      .filter((f) => rel(f).startsWith("src/marketing/"))
      .filter((f) => /from\s+["']@\/admin\//.test(read(f)))
      .map((f) => rel(f)),
  )

  // The THIRD import boundary, and until #95 it was the only one with no test.
  //
  // `CONTRIBUTING.md` lists it under "What we will not merge": *"A page calling
  // `/api/*` directly instead of going through `@/lib/data/api`."* A promise in a
  // contributing guide that no check can see is the exact defect this suite exists
  // to close — and it is the shape of the rule, not an accident: the two boundaries
  // above were asserted, so this one read as asserted too.
  //
  // The rule used to be phrased against `backend.ts`, a local engine that only
  // `api.ts` might import. #95 deleted the engine, so the old assertion had nothing
  // left to measure — its own positive control ("the facade must import the engine")
  // would have failed the build for a correct deletion. The boundary it was standing
  // for did not go away, though: it moved outwards. Pages still must not reach past
  // the facade, and the thing they would reach for now is `fetch("/api/…")`.
  const API_OWNER = "src/lib/data/api.ts"
  const API_CALL = /fetch\(\s*[`"']\/api\//

  check("only the data-layer facade calls the API (CONTRIBUTING.md, PRD §16.2 F2)", () => {
    const out = []
    if (!existsSync(path.join(ROOT, API_OWNER))) {
      return [`${API_OWNER} is missing — the facade this rule names does not exist`]
    }
    for (const f of srcFiles) {
      if (rel(f) === API_OWNER) continue
      if (API_CALL.test(stripJsComments(read(f)))) {
        out.push(`${rel(f)} calls /api/* directly; go through @/lib/data/api`)
      }
    }
    // POSITIVE CONTROL. Every file above could pass while the facade was the one
    // bypassed — if `api.ts` stopped calling the API, the scan would find no
    // offenders because there would be no calls left to offend. Assert the allowed
    // edge, so a facade that fetches nothing fails here instead of reading as
    // compliance. The count is not asserted: it is a number that moves every time a
    // screen is added, and a stale minimum would fail for the wrong reason.
    if (!API_CALL.test(stripJsComments(read(path.join(ROOT, API_OWNER))))) {
      out.push(`${API_OWNER} no longer calls /api/* — the allowed edge is gone, so this check is measuring nothing`)
    }
    return out
  })

  // The registry surface PRD §7.2 enumerates. A file here that is not on the
  // list was hand-written, which §7.1 forbids.
  const REGISTRY = new Set([
    "accordion", "alert", "alert-dialog", "aspect-ratio", "attachment", "avatar", "badge",
    "breadcrumb", "bubble", "button", "button-group", "calendar", "card", "carousel", "chart",
    "checkbox", "collapsible", "combobox", "command", "context-menu", "data-table", "date-picker",
    "dialog", "direction", "drawer", "dropdown-menu", "empty", "field", "hover-card", "input",
    "input-group", "input-otp", "item", "kbd", "label", "marker", "menubar", "message",
    "message-scroller", "native-select", "navigation-menu", "pagination", "popover", "progress",
    "questionnaire", "radio-group", "resizable", "scroll-area", "select", "separator", "sheet",
    "sidebar", "skeleton", "slider", "sonner", "spinner", "switch", "table", "tabs", "textarea",
    "toast", "toggle", "toggle-group", "tooltip", "typography",
  ])

  check("every src/components/ui file is a documented registry component (PRD §7.1)", () =>
    uiFiles
      .map((f) => path.basename(f, path.extname(f)))
      .filter((name) => !REGISTRY.has(name))
      .map((name) => `${name}.tsx is not a registry component name`),
  )

  check("no hand-written dashboard primitives outside components/ui", () => {
    const banned = /^(button|input|card|badge|table|dialog|select|dropdown-menu|tabs|tooltip|skeleton|sheet|sidebar)\.(tsx|ts)$/
    return adminFiles
      .filter((f) => banned.test(path.basename(f)))
      .map((f) => `${rel(f)} — use \`npx shadcn@latest add\` instead`)
  })

  check("components.json keeps the documented shadcn configuration", () => {
    const file = path.join(ROOT, "components.json")
    if (!existsSync(file)) return ["components.json is missing"]
    const cfg = JSON.parse(read(file))
    const out = []
    if (cfg.style !== "new-york") out.push(`style is "${cfg.style}", expected "new-york"`)
    if (cfg.tailwind?.css !== "src/index.css") out.push(`css is "${cfg.tailwind?.css}"`)
    if (cfg.iconLibrary !== "lucide") out.push(`iconLibrary is "${cfg.iconLibrary}", expected "lucide"`)
    if (cfg.aliases?.components !== "@/components") out.push(`aliases.components is "${cfg.aliases?.components}"`)
    return out
  })

  check("every custom component has an exception record (PRD §7.5)", () => {
    // Path updated 2026-09-27 when docs/ was restructured into numbered domains.
    // This check is why the move was safe: it read a hard-coded path, and the suite
    // failed the moment the file moved — which is the correct behaviour, and the
    // reason the restructure was a separate phase rather than a corrections pass.
    const RECORD = "docs/60-reference/component-exceptions.md"
    const doc = read(path.join(ROOT, "docs", "60-reference", "component-exceptions.md"))
    // The Design System swatch grid is the one §7.5 example; it must be recorded.
    const REQUIRED = ["REGISTRY SEARCH", "CLOSEST CANDIDATES", "UNIQUE REQUIREMENT", "COST", "SIGN-OFF"]
    const missing = REQUIRED.filter((field) => !doc.includes(field))
    return missing.map((f) => `${RECORD} has no ${f} field`)
  })

  /* ── Routing (PRD §5.2) ────────────────────────────────────────────────── */

  suite("Routing (PRD §5)", "tests/policy.mjs")

  const navPaths = [...routesSource.matchAll(/path:\s*"(\/admin\/[^"]+)"/g)].map((m) => m[1])
  // The admin child routes are declared relative to the `/admin` parent, so
  // anything relative in App.tsx is an admin page; `*` is the redirect.
  const routePaths = [...appSource.matchAll(/<Route\s+path="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((p) => p !== "*" && !p.startsWith("/"))
    .map((p) => `/admin/${p}`)

  check("the sidebar model and the router agree on every /admin page", () => {
    const out = []
    for (const p of navPaths) if (!routePaths.includes(p)) out.push(`${p} is in routes.ts but not in App.tsx`)
    for (const p of routePaths) if (!navPaths.includes(p)) out.push(`${p} is in App.tsx but not in routes.ts`)
    return out
  })

  check("unknown /admin paths redirect rather than render a page (PRD §5.2)", () => {
    const block = /<Route\s+path="\/admin"[\s\S]*?<\/Route>/.exec(appSource)?.[0] ?? ""
    if (!block) return ["no /admin route block found"]
    const star = /<Route\s+path="\*"\s+element=\{<(\w+)[^}]*\/>\}/.exec(block)
    if (!star) return ['no path="*" inside /admin']
    if (star[1] !== "Navigate") return [`/admin catch-all renders <${star[1]}>, not a redirect`]
    return []
  })

  /* ── External links (issue #70) ──────────────────────────────────────────
   *
   * The sidebar now carries a group that leaves the app. Two things could go
   * wrong silently, and neither is visible in a source read:
   *
   *   1. an external URL ends up in `ADMIN_ROUTES`, where the breadcrumb looks
   *      it up by pathname — the crumb would read "Not found" on every page;
   *   2. an external item is rendered as a router `Link`, which pushes a path
   *      onto this app's history and renders the admin shell at a URL that is
   *      not ours.
   *
   * (1) is asserted against the real `findAdminRoute`; (2) against the rendered
   * anchor. A grep for `target="_blank"` would pass on a comment.
   */
  suite("External nav (issue #70)", "tests/policy.mjs")

  const routesModel = await load("src/admin/routes.ts", "admin-routes")
  const externalNav = await load("src/admin/ExternalNav.tsx", "external-nav")
  const clerkAuth = await load("src/admin/clerkAuth.ts", "policy-clerk-auth")
  const externalItems = routesModel.ADMIN_EXTERNAL_NAV.flatMap((g) => g.items)

  // Rendered against two real access objects, not against a bare component.
  // #104 is the reason: the group rendered correctly for everybody, so a check
  // that only proves it renders could not see the defect.
  const { renderToStaticMarkup } = await import("react-dom/server")
  const { createElement } = await import("react")
  const renderExternal = (access) =>
    renderToStaticMarkup(createElement(externalNav.ExternalNavLinks, { access }))
  const adminAccess = clerkAuth.accessFrom("admin", clerkAuth.KNOWN_CAPABILITIES)
  const repAccess = clerkAuth.accessFrom("service_rep", ["inbox:read", "inbox:write"])
  const externalHtml = renderExternal(adminAccess)
  const repExternalHtml = renderExternal(repAccess)

  check("every external nav item is an absolute https URL", () => {
    if (externalItems.length === 0) return ["ADMIN_EXTERNAL_NAV is empty — this check would pass vacuously"]
    return externalItems
      .filter((i) => !/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(?:[/?#]|$)/i.test(i.href))
      .map((i) => `${i.title} — href "${i.href}" is not an absolute https URL`)
  })

  check("no external href is a router path, so the breadcrumb cannot match one", () => {
    // The breadcrumb resolves `findAdminRoute(location.pathname)`. An external
    // item must be invisible to it: present in ADMIN_ROUTES and the crumb reads
    // "Not found" for a page that is not ours.
    const out = []
    for (const item of externalItems) {
      const hit = routesModel.findAdminRoute(item.href)
      if (hit) out.push(`${item.title} — ${item.href} resolves as the admin route "${hit.title}"`)
    }
    // Positive control: the resolver DOES find real routes, so an empty result
    // above is "no external collisions", not "the resolver is broken".
    if (!routesModel.findAdminRoute("/admin/inquiries")) {
      out.push("findAdminRoute() cannot resolve /admin/inquiries — the check above proves nothing")
    }
    return out
  })

  check("external items render as new-tab anchors, not router links", () => {
    const out = []
    const anchors = [...externalHtml.matchAll(/<a\b[^>]*>/g)].map((m) => m[0])
    if (anchors.length !== externalItems.length) {
      out.push(`rendered ${anchors.length} anchors for ${externalItems.length} items`)
    }
    for (const item of externalItems) {
      const tag = anchors.find((a) => a.includes(`href="${item.href}"`))
      if (!tag) {
        out.push(`${item.title} — no anchor with href="${item.href}"`)
        continue
      }
      if (!/target="_blank"/.test(tag)) out.push(`${item.title} — missing target="_blank"`)
      if (!/rel="noopener noreferrer"/.test(tag)) out.push(`${item.title} — missing rel="noopener noreferrer"`)
      if (!/>[^<]*$/.test(tag) && !tag.endsWith(">")) out.push(`${item.title} — malformed anchor`)
    }
    // A router `Link` renders an anchor with a resolved `href` and no `target`,
    // so the target check above already catches it. This asserts the component
    // does not import the router at all — a `Link` used for a *different* item
    // in the same file would otherwise slip past.
    const src = read(path.join(ROOT, "src", "admin", "ExternalNav.tsx"))
    if (/from\s+["']react-router/.test(src)) out.push("ExternalNav.tsx imports react-router")
    return out
  })

  check("the sidebar renders the external group, with the caller's access", () => {
    // The one thing the two checks above cannot see: whether the group is
    // mounted at all. A component that passes its own tests but is never
    // rendered is the exact failure this repo has paid for before.
    const sidebar = stripJsComments(read(path.join(ROOT, "src", "components", "app-sidebar.tsx")))
    const out = []
    if (!/<ExternalNavLinks\s+access=\{access\}\s*\/>/.test(sidebar)) {
      out.push("app-sidebar.tsx does not render <ExternalNavLinks access={access} /> — the group is ungated")
    }
    if (!/ADMIN_NAV\.map/.test(sidebar)) out.push("app-sidebar.tsx no longer renders ADMIN_NAV — the internal groups are gone")
    return out
  })

  check("the external group is gated: a rep sees no anchor, an admin sees every one", () => {
    // Issue #104. The defect was never that the group failed to render — it
    // rendered for everybody. So the assertion that carries this is the
    // NEGATIVE one, and the admin count exists only to prove the component
    // still works: a component that returned null would satisfy the rep case
    // and hide the whole group from the people who need it.
    const out = []
    const anchors = (html) => [...html.matchAll(/<a\b[^>]*>/g)].length

    const repAnchors = anchors(repExternalHtml)
    if (repAnchors !== 0) {
      out.push(`a service_rep sees ${repAnchors} external links, expected 0 — they cannot open any of them`)
    }

    if (externalItems.length === 0) out.push("ADMIN_EXTERNAL_NAV is empty — the counts below prove nothing")
    const adminAnchors = anchors(externalHtml)
    if (adminAnchors !== externalItems.length) {
      out.push(`an admin sees ${adminAnchors} external links, expected ${externalItems.length}`)
    }

    // An empty group label is still a promise of something a rep cannot reach.
    for (const group of routesModel.ADMIN_EXTERNAL_NAV) {
      if (repExternalHtml.includes(group.label)) out.push(`a service_rep sees the "${group.label}" group label`)
    }

    // The groups are asserted BY NAME, not counted. Every count above is derived
    // from `ADMIN_EXTERNAL_NAV`, so a group deleted from the array leaves all of
    // them green — the checks would be measuring a smaller thing and calling it
    // correct. `policy.mjs` hard-codes the internal nav's shape for exactly this
    // reason (`:279`, `:286`), and this is the external half of it.
    const labels = routesModel.ADMIN_EXTERNAL_NAV.map((g) => g.label).join(", ")
    if (labels !== "Dashboards, Business accounts") {
      out.push(`the external groups are "${labels}", expected "Dashboards, Business accounts"`)
    }

    // Each item must name a feature area, and all of them are `accounts` today.
    // A missing `feature` is a type error, but a *wrong* one is not, and it is
    // the only thing between a social profile and a rep's sidebar.
    for (const item of externalItems) {
      if (item.feature !== "accounts") {
        out.push(`${item.title} — feature is "${item.feature}", expected "accounts"`)
      }
    }

    // The decision must be the capability, not a role string. If either of
    // these flips, the gate moved to a second rule that can drift from the
    // server's — which is what #100 spent a release removing.
    if (clerkAuth.can(repAccess, "accounts")) out.push("a service_rep holds the accounts feature")
    if (!clerkAuth.can(adminAccess, "accounts")) out.push("an admin does not hold the accounts feature")

    return out
  })

  /* ── The nav shape (issue #73) ────────────────────────────────────────────
   *
   * Regrouping is presentation, so the risk is not that the sidebar looks wrong —
   * it is that a path quietly stops being reachable, or that a page moves from one
   * permission area to another while the labels are being shuffled. Both are
   * invisible in a screenshot of the sidebar.
   */

  const navModel = await load("src/admin/routes.ts", "admin-routes")

  check("the sidebar is Inbox plus Settings, and every admin page is still reachable", () => {
    const out = []
    const labels = navModel.ADMIN_NAV.map((g) => g.label)
    // Positive control: an empty model would satisfy every loop below.
    if (navModel.ADMIN_ROUTES.length !== 10) {
      out.push(`ADMIN_ROUTES has ${navModel.ADMIN_ROUTES.length} pages, expected 10`)
    }
    if (labels.join(", ") !== "Inbox, Settings") {
      out.push(`ADMIN_NAV groups are [${labels.join(", ")}], expected [Inbox, Settings]`)
    }
    const settings = navModel.ADMIN_NAV.find((g) => g.label === "Settings")
    if (!settings || settings.items.length !== 9) {
      out.push(`Settings holds ${settings?.items.length ?? 0} sub-panes, expected 9`)
    }
    // Reachability, per path, through the resolver the breadcrumb uses — not by
    // counting the array, which would pass even if every path were duplicated.
    for (const item of navModel.ADMIN_ROUTES) {
      const hit = navModel.findAdminRoute(item.path)
      if (!hit) out.push(`${item.path} is in the nav but findAdminRoute() cannot resolve it`)
      else if (hit.title !== item.title) out.push(`${item.path} resolves to "${hit.title}", nav says "${item.title}"`)
    }
    const paths = navModel.ADMIN_ROUTES.map((i) => i.path)
    if (new Set(paths).size !== paths.length) out.push("a path appears twice in ADMIN_ROUTES")
    return out
  })

  check("regrouping did not move a page between permission areas", () => {
    // Issue #73 moves Design and Reference UNDER Settings. That is a label change.
    // #74 grants access by `feature`, so if a regroup also retagged an item, the
    // sidebar would look right while access changed underneath it.
    const EXPECTED = {
      "/admin/inquiries": "inbox",
      "/admin/settings": "settings",
      "/admin/profile": "settings",
      "/admin/notifications": "settings",
      "/admin/security": "settings",
      // Its own area, not `settings`: the roster is the one page a manager can use
      // with `settings:read` alone. Retagging it `settings` would hide it from the
      // person most likely to notice a missing rep — a permission change disguised
      // as a nav tidy-up, which is exactly what this check exists to catch.
      "/admin/team": "team",
      "/admin/design": "design",
      "/admin/assets": "design",
      "/admin/components": "design",
      "/admin/docs": "reference",
    }
    const out = []
    if (Object.keys(EXPECTED).length !== navModel.ADMIN_ROUTES.length) {
      out.push(`the expectation lists ${Object.keys(EXPECTED).length} paths but the nav has ${navModel.ADMIN_ROUTES.length}`)
    }
    for (const item of navModel.ADMIN_ROUTES) {
      const want = EXPECTED[item.path]
      if (!want) out.push(`${item.path} is not in the expectation — add it deliberately`)
      else if (item.feature !== want) out.push(`${item.path} has feature "${item.feature}", expected "${want}"`)
    }
    return out
  })

  check("Clerk owns admin identity while data authorization remains a backend responsibility", () => {
    const out = []
    const adminArea = read(path.join(ROOT, "src", "admin", "AdminArea.tsx"))
    const guard = read(path.join(ROOT, "src", "admin", "RequireAuth.tsx"))
    const helper = read(path.join(ROOT, "src", "admin", "clerkAuth.ts"))
    if (!/@clerk\/react/.test(adminArea) || !/ClerkProvider/.test(adminArea)) out.push("AdminArea.tsx does not mount ClerkProvider")
    if (!/useAuth\(\)/.test(guard) || !/resolveOrgAccess\(/.test(guard)) out.push("RequireAuth does not gate the admin UI with Clerk identity and the single organization resolver")
    // The organization must be PINNED, not merely read: `creator_role` is
    // org:admin on this instance, so a check that accepted any organization's
    // admin would let anyone who can create one grant themselves access.
    if (!/membership\?\.organization\?\.id === ADMIN_ORG_ID/.test(helper)) out.push("the access resolver does not pin the organization that grants access")
    if (/publicMetadata/.test(helper)) out.push("the access resolver still reads the retired flat role flag")
    if (!/not server authorization/i.test(guard)) out.push("the client-only authorization limit is not stated in the guard")
    if (existsSync(path.join(ROOT, "src", "admin", "auth.ts"))) out.push("the removed shared credential implementation still exists")
    return out
  })

  /* ── The two links every role gets (issue #106) ───────────────────────────
   *
   * The defect was never an absence. The home link and an account control both
   * existed for every role — as a 12px footnote and as a bare `<UserButton />`
   * avatar — and the client reported both as missing, which is the correct
   * reading of a screenshot. So the assertions that carry this are per ROLE and
   * on rendered markup: "the sidebar contains a `Your account` control" would
   * have been satisfied by a treatment nobody could find.
   *
   * ⚠️ The load-bearing half is a NEGATIVE, and it is the issue's title: a
   * `service_rep` must not be sent to `/admin/profile`. That page is tagged
   * `settings`, so `AdminLayout` swaps the outlet for the refusal screen, and
   * `PUT /api/settings?key=profile` answers 403 even if it rendered. The thing
   * to catch is a future "tidy-up" pointing the account control there — which
   * works for an admin, and therefore survives review by one. Hence the admin
   * sidebar is the positive control for the rep's zero.
   *
   * Rendered through `tests/fixtures/sidebar-entry.mjs`; see that file for why
   * the provider, the component and the access context must come from one
   * bundle, and `load()` in `harness.mjs` for why `react-router-dom` is external
   * to it.
   */

  suite("Sidebar home and account links (issue #106)", "tests/policy.mjs")

  const sidebarEntry = await load("tests/fixtures/sidebar-entry.mjs", "sidebar-entry", {
    stubClerk: true,
  })

  // A real `MemoryRouter`, not a stand-in: `react-router-dom` is external to the
  // bundle (see `load()`), so this is the same module instance the component
  // reads. That makes `href` the router's own resolution rather than a stub's
  // passthrough — and it means a render without this wrapper fails with
  // react-router's message instead of a silent second context.
  const renderSidebar = (access) =>
    renderToStaticMarkup(
      createElement(
        MemoryRouter,
        { initialEntries: ["/admin/inquiries"] },
        createElement(
          sidebarEntry.SidebarProvider,
          null,
          createElement(
            sidebarEntry.AdminAccessContext.Provider,
            { value: access },
            createElement(sidebarEntry.AppSidebar),
          ),
        ),
      ),
    )

  const adminSidebar = renderSidebar(adminAccess)
  const repSidebar = renderSidebar(repAccess)

  /** Every anchor tag in a rendered string, as its source text. */
  const anchorTags = (html) => [...html.matchAll(/<a\b[^>]*>/g)].map((m) => m[0])

  check("an admin and a rep are both offered a labelled home link and a labelled account control", () => {
    const out = []
    for (const [who, html] of [["an admin", adminSidebar], ["a service_rep", repSidebar]]) {
      if (!html.includes("Back to the site")) out.push(`${who} is not shown the home link by name`)
      if (!html.includes("Your account")) out.push(`${who} is not shown a labelled account control`)
      // Counted, not merely found: two anchors to "/" would mean the footnote
      // survived beside the nav item, which is the treatment #106 removed.
      const home = anchorTags(html).filter((a) => /href="\/"/.test(a))
      if (home.length !== 1) {
        out.push(`${who} has ${home.length} anchors to "/", expected exactly 1`)
      }
    }
    // POSITIVE CONTROL. If the component rendered nothing, the `includes` above
    // would each report themselves — but if it rendered without its nav, only
    // this sees it. The brand header links to the inbox for every role.
    if (!adminSidebar.includes('href="/admin/inquiries"')) {
      out.push("the rendered admin sidebar has no link to /admin/inquiries — the render is empty or the header is gone")
    }
    return out
  })

  check("a rep is never handed a link to /admin/profile", () => {
    const out = []
    const count = (html) => anchorTags(html).filter((a) => /href="\/admin\/profile"/.test(a)).length

    const rep = count(repSidebar)
    if (rep !== 0) {
      out.push(`a service_rep is shown ${rep} links to /admin/profile — AdminLayout refuses that page for them`)
    }

    // POSITIVE CONTROL: the same scan finds the page for an admin, through
    // Settings > Profile. Without it an empty render, or a broken pattern, would
    // satisfy the rep case and read as a pass.
    const admin = count(adminSidebar)
    if (admin !== 1) {
      out.push(`an admin is shown ${admin} links to /admin/profile, expected 1 (Settings > Profile)`)
    }
    return out
  })

  /* ── Stack (PRD §4, §14) ───────────────────────────────────────────────── */

  suite("Stack (PRD §4, §14)", "tests/policy.mjs")

  check("Tailwind v4 is wired through the Vite plugin, not PostCSS (PRD §4.1)", () => {
    const out = []
    if (!/@tailwindcss\/vite/.test(read(path.join(ROOT, "vite.config.ts")))) {
      out.push("vite.config.ts does not use @tailwindcss/vite")
    }
    const version = pkg.devDependencies?.["@tailwindcss/vite"]
    if (!version) out.push("package.json has no @tailwindcss/vite devDependency")
    else if (!/^\^?4\./.test(version)) out.push(`@tailwindcss/vite is ${version}, expected v4`)
    return out
  })

  check("the lint config ignores generated output, so a local run is not a seven-minute no-op", () => {
    // #111, measured 2026-10-27: `eslint.config.js` ignored `dist` but not
    // `.preview`, where every build leaves a full copy behind (the safe-delete
    // guard refuses to empty `dist`, so it is moved aside instead) — 6,088
    // minified `.js` files, plus 42 esbuild bundles in `tests/.tmp` up to 8,000
    // lines each. A bare `eslint` ran **seven minutes without finishing**; with
    // these two entries it takes 25 s.
    //
    // ⚠️ CI never saw it, because neither directory exists in a clean checkout.
    // That is exactly why the entry is asserted here rather than left to be
    // noticed: the failure is invisible on the machine that decides the gate, and
    // costs the contributor the one check they could have run before pushing.
    const src = read(path.join(ROOT, "eslint.config.js"))
    const block = /ignores:\s*\[([\s\S]*?)\]/.exec(src)
    if (!block) return ["eslint.config.js has no ignores array — this check would pass vacuously"]
    const entries = [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1])
    if (entries.length === 0) return ["the ignores array is empty"]
    const out = []
    for (const required of ["dist", ".preview", "tests/.tmp"]) {
      if (!entries.includes(required)) {
        out.push(`eslint does not ignore ${required} — a local lint walks generated output`)
      }
    }
    return out
  })

  check("no tailwind.config.js, no postcss.config.js, no tailwindcss-animate (PRD §14)", () => {
    const out = []
    for (const f of ["tailwind.config.js", "tailwind.config.ts", "tailwind.config.cjs", "postcss.config.js", "postcss.config.cjs"]) {
      if (existsSync(path.join(ROOT, f))) out.push(`${f} exists`)
    }
    const all = { ...pkg.dependencies, ...pkg.devDependencies }
    if (all["tailwindcss-animate"]) out.push("tailwindcss-animate is still a dependency")
    if (all["tailwindcss"] && !/^\^?4\./.test(all["tailwindcss"])) {
      out.push(`tailwindcss is ${all["tailwindcss"]}, expected v4`)
    }
    return out
  })

  check("the design tokens are declared in exactly one file (PRD §6.1)", () => {
    const out = []
    const indexCss = read(path.join(ROOT, "src", "index.css"))
    if (!/@import\s+["']tailwindcss["']/.test(indexCss)) out.push("src/index.css does not import tailwindcss")
    for (const f of srcFiles.filter((f) => f.endsWith(".css") && rel(f) !== "src/index.css")) {
      out.push(`${rel(f)} is a second stylesheet`)
    }
    // A stale duplicate inside the prototype is the defect §6.1 removed; it must
    // not be reachable as a build input.
    const stale = path.join(ROOT, "valvoro-prototype", "css", "tw.css")
    if (existsSync(stale)) {
      const vite = read(path.join(ROOT, "vite.config.ts"))
      if (/tw\.css/.test(vite)) out.push("vite.config.ts still references the prototype's tw.css")
    }
    return out
  })

  check("the theme-color meta carries a v2 token (PRD §15 Q5)", () => {
    const html = read(path.join(ROOT, "index.html"))
    const m = /<meta\s+name="theme-color"\s+content="([^"]+)"/.exec(html)
    if (!m) return ["no theme-color meta"]
    if (m[1].toLowerCase() === "#1f1c4a") return ["theme-color is still the v1 indigo #1f1c4a"]
    return []
  })

  check("every command the README tells you to run actually exists", () => {
    // Parsed from README.md rather than hardcoded. A hardcoded list cannot catch
    // a command the README starts promising later, and stale documentation is
    // this repo's own named largest historical liability.
    const readme = read(path.join(ROOT, "README.md"))
    const out = []
    const seen = new Set()
    for (const m of readme.matchAll(/npm (?:run )?([a-z][\w:-]*)/g)) {
      const name = m[1]
      if (name === "install") continue // not a script — it is npm's own verb
      if (seen.has(name)) continue
      seen.add(name)
      if (!pkg.scripts?.[name]) {
        out.push(`README says "npm run ${name}" but package.json has no "${name}" script`)
      }
    }
    // The scripts the gates themselves depend on, named or not.
    for (const name of ["dev", "build", "lint", "typecheck", "test"]) {
      if (!pkg.scripts?.[name]) out.push(`package.json has no "${name}" script`)
    }
    return out
  })

  /* ── Release hygiene ────────────────────────────────────────────────────── */

  suite("Release hygiene", "tests/policy.mjs")

  check("the version is one number in four places, and the changelog has an entry for it", () => {
    // v2.0.2's own changelog entry names this failure and then left it
    // unasserted: "`package-lock.json` had been drifting since v2.0.0. Its two
    // root version fields still read `2.0.0-rc1` while `package.json` shipped
    // `2.0.1` — two releases stale, and nothing failed, because no check
    // asserted it." That is the same claim-without-a-producer shape as the
    // README check-count drift, and it was still true in v2.3.0 — the drift was
    // fixed, the *reason* it happened was not.
    //
    // ⚠️ The lockfile carries the root version **twice**, and it also contains
    // other packages that legitimately sit at the same number: at v2.1.0 there
    // were three occurrences of `"version": "2.1.0"`, and the third is
    // `fast-json-stable-stringify`. A `replace_all` on the version string
    // rewrites a dependency and leaves `resolved`/`integrity` pointing at a
    // different tarball, which `npm ci` refuses — so this is checked as data,
    // not as text.
    const lock = JSON.parse(read(path.join(ROOT, "package-lock.json")))
    const out = []
    if (lock.version !== pkg.version) {
      out.push(`package-lock.json version is ${String(lock.version)}, package.json is ${pkg.version}`)
    }
    const rootVersion = lock.packages?.[""]?.version
    if (rootVersion !== pkg.version) {
      out.push(`package-lock.json packages[""].version is ${String(rootVersion)}, package.json is ${pkg.version}`)
    }

    // The README states the version a reader should treat as current, which is
    // the one place a stale number is read as fact rather than as history.
    const stated = /\*\*Current version:\*\*\s*(v[\d.]+)/.exec(read(path.join(ROOT, "README.md")))
    if (!stated) out.push("README.md no longer states a current version")
    else if (stated[1] !== `v${pkg.version}`) out.push(`README.md says ${stated[1]}, package.json is ${pkg.version}`)

    // And the entry has to exist, or the tag and the release notes disagree
    // about what shipped. Matching on the heading means a release cannot be cut
    // by bumping a number alone.
    const changelog = read(path.join(ROOT, "CHANGELOG.md"))
    const heading = new RegExp(`^## \\[v${pkg.version.replace(/\./g, "\\.")}\\]`, "m")
    if (!heading.test(changelog)) out.push(`CHANGELOG.md has no "## [v${pkg.version}]" section`)

    return out
  })

  /* ── Where work lives (GitHub is the system of record) ────────────────────
   *
   * The two backlog documents are frozen, and the way they fail is by being read as a queue:
   * on 2026-10-29 `roadmap.md` was dated *"last verified 2026-10-28"* and still named #93 and
   * #114 as open — both merged. The notice is the only thing telling a later session, human or
   * otherwise, that the list underneath it is history rather than a plan.
   *
   * Asserted on the HEADER, not the file: the bodies are meant to stay as they were, so a scan
   * of the whole document would pass on a quotation of the notice anywhere inside it.
   */
  suite("Where work lives (GitHub is the system of record)", "tests/policy.mjs")

  check("the two frozen backlog documents say so, and point at the issue tracker", () => {
    const out = []
    for (const p of ["docs/40-project/roadmap.md", "docs/40-project/tasks.md"]) {
      const head = read(p).split("\n").slice(0, 16).join("\n")
      if (!/Frozen \d{4}-\d{2}-\d{2}/.test(head)) {
        out.push(`${p} does not declare itself frozen in its first 16 lines`)
      }
      if (!/github\.com\/indigo-services\/call-indigo\/issues/.test(head)) {
        out.push(`${p} does not point at the issue tracker`)
      }
    }
    return out
  })
}
