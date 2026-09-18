/**
 * Components page — /admin/components.
 *
 * An inventory of the shadcn primitives in `src/components/ui/`. The export
 * names are read out of the modules themselves at build time rather than typed
 * into a fixture, so this page cannot go stale when a primitive is re-added by
 * the CLI or gains a sub-component.
 *
 * PRD §7.4's provenance rule lives here in spirit: every file listed is a
 * registry file, and the note at the bottom is what keeps it that way.
 */
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Copy, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/admin/PageHeader"

const MODULES = import.meta.glob("/src/components/ui/*.tsx", { eager: true }) as Record<
  string,
  Record<string, unknown>
>

interface Primitive {
  name: string
  file: string
  importPath: string
  exports: string[]
}

const PRIMITIVES: Primitive[] = Object.entries(MODULES)
  .map(([path, mod]) => {
    const file = path.slice(path.lastIndexOf("/") + 1)
    const name = file.replace(/\.tsx$/, "")
    return {
      name,
      file,
      importPath: `@/components/ui/${name}`,
      exports: Object.keys(mod)
        .filter((k) => k !== "default")
        .sort(),
    }
  })
  .sort((a, b) => a.name.localeCompare(b.name))

const TOTAL_EXPORTS = PRIMITIVES.reduce((n, p) => n + p.exports.length, 0)

export default function ComponentsPage() {
  const [query, setQuery] = useState("")

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q === "") return PRIMITIVES
    return PRIMITIVES.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.exports.some((e) => e.toLowerCase().includes(q)),
    )
  }, [query])

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Copied to clipboard")
    } catch {
      toast.error("Clipboard unavailable in this context")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Components"
        description={`${PRIMITIVES.length} registry primitives, ${TOTAL_EXPORTS} exports, from src/components/ui/.`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
          <CardDescription>
            Matches a filename or any export inside it — so “Sheet” finds sheet.tsx and
            “Sidebar” finds every piece of the sidebar family.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search primitives and exports…"
              aria-label="Search components"
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {shown.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nothing matches “{query}”.
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((p) => {
            const snippet = `import { ${p.exports.join(", ")} } from "${p.importPath}"`
            return (
              <li key={p.name}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">{p.name}</CardTitle>
                        <CardDescription className="truncate font-mono text-xs">
                          {p.file}
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copy(snippet)}
                        aria-label={`Copy import for ${p.name}`}
                      >
                        <Copy className="size-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5">
                      {p.exports.map((e) => (
                        <Badge key={e} variant="secondary" className="font-mono text-[11px]">
                          {e}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Provenance</CardTitle>
          <CardDescription>
            Every file above must be unmodified registry output (PRD §7.4). Editing one
            breaks that guarantee — it is checked by re-adding with{" "}
            <code className="text-xs">npx shadcn@latest add --all --overwrite</code> in a
            scratch worktree and asserting the diff is empty. A bespoke component needed
            under <code className="text-xs">/admin</code> goes through the five-field
            exception in <code className="text-xs">docs/component-exceptions.md</code>.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
