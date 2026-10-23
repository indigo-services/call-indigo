/**
 * ExternalNav — the sidebar group that leaves the app.
 *
 * Every other sidebar entry is a react-router `Link`, because moving between
 * dashboard pages is client-side and keeps the loaded state warm.
 * These three are the opposite: they go to Clerk, Vercel and GitHub, which are
 * separate applications. A `Link` would push a path onto this router's history
 * and render the admin shell at a URL that is not ours.
 *
 * So they are real `<a>` elements with `target="_blank"` and
 * `rel="noopener noreferrer"`:
 *
 *   · `noopener` stops the opened page from reaching back through
 *     `window.opener` and navigating this tab;
 *   · `noreferrer` also suppresses the `Referer` header, so a dashboard vendor
 *     does not learn the URL of an internal admin page.
 *
 * The component deliberately renders no `SidebarMenuButton`. That primitive
 * calls `useSidebar()`, which throws outside a `SidebarProvider` — and this group
 * is asserted on rendered output in `tests/policy.mjs`, where there is no
 * provider. The four context-free primitives below carry the same layout.
 */
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { ADMIN_EXTERNAL_NAV } from "@/admin/routes"

/** The class string `SidebarMenuButton` applies, quoted so the two match. */
const LINK_CLASS =
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0"

export function ExternalNavLinks() {
  return (
    <>
      {ADMIN_EXTERNAL_NAV.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((item) => (
              <SidebarMenuItem key={item.href}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={LINK_CLASS}
                  // The arrow is the only visual difference from an internal
                  // item, and it is the honest one: this leaves the app.
                  title={`${item.title} — opens in a new tab`}
                >
                  <item.icon />
                  <span>{item.title}</span>
                  <svg
                    viewBox="0 0 24 24"
                    className="ml-auto size-3 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M7 17L17 7M9 7h8v8" />
                  </svg>
                </a>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}
