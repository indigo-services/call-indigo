/**
 * Assets page — /admin/assets.
 *
 * Lists what actually ships in `public/assets/images/`, discovered at build time
 * rather than from a hand-maintained list, so an added or removed file shows up
 * here without anyone remembering to update a fixture.
 *
 * `import.meta.glob` is used for its **keys** only: the lazy form returns a map
 * of paths to dynamic imports, and we read the paths without ever calling them,
 * so nothing here pulls image bytes into the bundle. The served URL is derived
 * from the filename, because files in `public/` are served from the root.
 *
 * Read-only by design — uploading and replacing assets is PRD §16.2 F5 and needs
 * a real backend to write to.
 */
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Copy, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/admin/PageHeader"
import type { AssetGroup, AssetRecord } from "@/lib/data/types"

/* Keys only — the values are unused dynamic imports. */
const FILE_PATHS = Object.keys(import.meta.glob("/public/assets/images/*"))

function classify(name: string): AssetGroup {
  const n = name.toLowerCase()
  if (/^(tc-)?logo|logo-vector|footer-logo/.test(n)) return "Logos"
  if (n.includes("icon") || n.includes("mark") || n.startsWith("favicon") || n.includes("apple-touch") || n.includes("dots"))
    return "Brand"
  if (/^(services|repair|about|check|choose|work|banner|hero|cta|sub-banner|price-estimation|testimonial)/.test(n))
    return "Photography"
  return "Brand"
}

const ASSETS: AssetRecord[] = FILE_PATHS.map((key) => {
  const name = key.slice(key.lastIndexOf("/") + 1)
  const dot = name.lastIndexOf(".")
  return {
    name,
    path: `/assets/images/${name}`,
    ext: dot === -1 ? "?" : name.slice(dot + 1).toLowerCase(),
    group: classify(name),
  }
}).sort((a, b) => a.name.localeCompare(b.name))

const GROUPS: ReadonlyArray<AssetGroup | "All"> = ["All", "Brand", "Logos", "Photography"]

export default function AssetsPage() {
  const [query, setQuery] = useState("")
  const [group, setGroup] = useState<AssetGroup | "All">("All")

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ASSETS.filter(
      (a) => (group === "All" || a.group === group) && (q === "" || a.name.toLowerCase().includes(q)),
    )
  }, [query, group])

  async function copy(asset: AssetRecord) {
    try {
      await navigator.clipboard.writeText(asset.path)
      toast.success(`Copied ${asset.path}`)
    } catch {
      // Clipboard needs a secure context and permission; fall back to showing it.
      toast.error("Clipboard unavailable — the path is shown on the card.")
    }
  }

  const counts = GROUPS.reduce<Record<string, number>>((acc, g) => {
    acc[g] = g === "All" ? ASSETS.length : ASSETS.filter((a) => a.group === g).length
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assets"
        description={`The ${ASSETS.length} images the marketing pages serve, from public/assets/images/.`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
          <CardDescription>
            Found by scanning the directory at build time. Uploading is PRD §16.2 F5 —
            it needs a backend to write to.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search filenames…"
              aria-label="Search assets"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {GROUPS.map((g) => (
              <Button
                key={g}
                size="sm"
                variant={group === g ? "default" : "outline"}
                onClick={() => setGroup(g)}
              >
                {g}
                <span className="ml-1.5 text-xs opacity-70">{counts[g]}</span>
              </Button>
            ))}
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
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((asset) => (
            <li key={asset.name}>
              <Card className="h-full gap-3 overflow-hidden py-0">
                <div className="flex h-32 items-center justify-center border-b border-border bg-muted p-2">
                  {asset.ext === "svg" || /\.(png|jpe?g|gif|webp|avif)$/.test(asset.name) ? (
                    <img
                      src={asset.path}
                      alt=""
                      loading="lazy"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">.{asset.ext}</span>
                  )}
                </div>
                <div className="px-4 pb-4">
                  <p className="truncate text-sm font-medium" title={asset.name}>
                    {asset.name}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <Badge variant="secondary">{asset.group}</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copy(asset)}
                      aria-label={`Copy path for ${asset.name}`}
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
