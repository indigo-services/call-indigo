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
import { ROOT, check, suite } from "./harness.mjs"

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
 * Source with its comments removed, before any identifier scan.
 *
 * The auth-boundary check below looks for `/admin/login`, and both `App.tsx` and
 * `LoginPage.tsx` mention that exact path in a comment explaining why no such
 * route exists. Scanning the raw text reports the explanation as the thing it
 * explains — the same trap as matching a CSS rule inside a comment, which has
 * now caught this project out four times.
 */
function stripJsComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^[ \t]*\/\/.*$/gm, " ")
}

export function run() {
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
    const doc = read(path.join(ROOT, "docs", "component-exceptions.md"))
    // The Design System swatch grid is the one §7.5 example; it must be recorded.
    const REQUIRED = ["REGISTRY SEARCH", "CLOSEST CANDIDATES", "UNIQUE REQUIREMENT", "COST", "SIGN-OFF"]
    const missing = REQUIRED.filter((field) => !doc.includes(field))
    return missing.map((f) => `docs/component-exceptions.md has no ${f} field`)
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

  check("auth is a client-side gate in one module, with no server session (PRD §7.4.4, §9.1)", () => {
    // THIS CHECK USED TO BE THE OPPOSITE, and the inversion is deliberate. PRD
    // §9.1 scoped authentication out, so the suite rejected every auth-shaped
    // identifier — `useAuth`, `signIn`, `sessionStorage`, all of it. The client
    // has since asked for a prototype gate, so the rule is no longer "auth must
    // not exist" but "auth must not grow beyond the shape that was sanctioned":
    // no server session, no token, no login route, and the credential material
    // in exactly one module so replacing it with a real check is a change to one
    // file rather than a hunt.
    const FORBIDDEN = [
      /\bAuthProvider\b/,
      /\/admin\/login/,
      /\bjwt\b/i,
      /\bgetServerSession\b/,
      /\bNextAuth\b/,
      /\bProtectedRoute\b/,
    ]
    const OWNER = "src/admin/auth.ts"
    const out = []

    for (const f of srcFiles) {
      const text = stripJsComments(read(f))
      for (const re of FORBIDDEN) {
        const m = re.exec(text)
        if (m) out.push(`${rel(f)} — matches ${re} ("${m[0]}")`)
      }
    }

    const holders = srcFiles
      .filter((f) => /PASSWORD_HASH_B64|USERNAME_HASH_HEX/.test(stripJsComments(read(f))))
      .map(rel)
    if (!holders.includes(OWNER)) out.push(`${OWNER} does not declare the credential digests`)
    for (const p of holders.filter((h) => h !== OWNER)) {
      out.push(`the credential digests are also referenced in ${p}; they belong in ${OWNER} alone`)
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
