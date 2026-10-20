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
import { ROOT, check, load, suite } from "./harness.mjs"

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

/**
 * Source with its comments removed, before identifier scans. This prevents
 * explanatory comments from being mistaken for imports or code paths.
 */
function stripJsComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^[ \t]*\/\/.*$/gm, " ")
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

  // The THIRD import boundary, and until now the only one with no test.
  //
  // `CONTRIBUTING.md` lists it under "What we will not merge": *"A page importing
  // `@/lib/data/backend` directly instead of going through `@/lib/data/api`."* A
  // promise in a contributing guide that no check can see is the exact defect this
  // suite exists to close — and it is the shape of the rule, not an accident: the
  // two boundaries above were asserted, so this one read as asserted too.
  //
  // `backend.ts` is the storage engine; `api.ts` is the only facade onto it. A page
  // that reaches past the facade to the engine is what PRD §16.2 F2 is about.
  const BACKEND_OWNER = "src/lib/data/api.ts"
  const BACKEND_IMPORT = /from\s+["']@\/lib\/data\/backend["']/

  check("only the data-layer facade imports the backend (CONTRIBUTING.md, PRD §16.2 F2)", () => {
    const out = []
    if (!existsSync(path.join(ROOT, BACKEND_OWNER))) {
      return [`${BACKEND_OWNER} is missing — the facade this rule names does not exist`]
    }
    for (const f of srcFiles) {
      if (rel(f) === BACKEND_OWNER) continue
      if (BACKEND_IMPORT.test(stripJsComments(read(f)))) {
        out.push(`${rel(f)} imports @/lib/data/backend directly; go through @/lib/data/api`)
      }
    }
    // POSITIVE CONTROL. Every file above could pass while the data layer was
    // disconnected — if the facade stopped importing the engine, the scan would find
    // no offenders because there would be no edge left to offend. Assert the ONE
    // allowed edge, so a broken facade fails here instead of reading as compliance.
    if (!BACKEND_IMPORT.test(stripJsComments(read(path.join(ROOT, BACKEND_OWNER))))) {
      out.push(`${BACKEND_OWNER} no longer imports the backend — the allowed edge is gone, so this check is measuring nothing`)
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
  const externalItems = routesModel.ADMIN_EXTERNAL_NAV.flatMap((g) => g.items)
  const externalHtml = await (async () => {
    const { renderToStaticMarkup } = await import("react-dom/server")
    const { createElement } = await import("react")
    return renderToStaticMarkup(createElement(externalNav.ExternalNavLinks))
  })()

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

  check("the sidebar renders the external group", () => {
    // The one thing the two checks above cannot see: whether the group is
    // mounted at all. A component that passes its own tests but is never
    // rendered is the exact failure this repo has paid for before.
    const sidebar = stripJsComments(read(path.join(ROOT, "src", "components", "app-sidebar.tsx")))
    const out = []
    if (!/<ExternalNavLinks\s*\/>/.test(sidebar)) out.push("app-sidebar.tsx does not render <ExternalNavLinks />")
    if (!/ADMIN_NAV\.map/.test(sidebar)) out.push("app-sidebar.tsx no longer renders ADMIN_NAV — the internal groups are gone")
    return out
  })

  check("Clerk owns admin identity while data authorization remains a backend responsibility", () => {
    const out = []
    const adminArea = read(path.join(ROOT, "src", "admin", "AdminArea.tsx"))
    const guard = read(path.join(ROOT, "src", "admin", "RequireAuth.tsx"))
    const helper = read(path.join(ROOT, "src", "admin", "clerkAuth.ts"))
    if (!/@clerk\/react/.test(adminArea) || !/ClerkProvider/.test(adminArea)) out.push("AdminArea.tsx does not mount ClerkProvider")
    if (!/useAuth\(\)/.test(guard) || !/resolveAdminAccess\(/.test(guard)) out.push("RequireAuth does not gate the admin UI with Clerk identity and the single access resolver")
    // The organization must be PINNED, not merely read: `creator_role` is
    // org:admin on this instance, so a check that accepted any organization's
    // admin would let anyone who can create one grant themselves access.
    if (!/membership\?\.organization\?\.id === ADMIN_ORG_ID/.test(helper)) out.push("the access resolver does not pin the organization that grants access")
    if (/publicMetadata/.test(helper)) out.push("the access resolver still reads the retired flat role flag")
    if (!/not server authorization/i.test(guard)) out.push("the client-only authorization limit is not stated in the guard")
    if (existsSync(path.join(ROOT, "src", "admin", "auth.ts"))) out.push("the removed shared credential implementation still exists")
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
}
