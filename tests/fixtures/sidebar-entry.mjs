/**
 * Test-only entry point for the rendered sidebar checks (#106).
 *
 * Three exports from **one** esbuild bundle, and that is the whole reason this
 * file exists. `AppSidebar` calls `useAdminAccess()` and `Sidebar` calls
 * `useSidebar()`; both read React contexts, and a context object is only equal
 * to itself. Loading `app-sidebar.tsx` and `access-context.ts` as two `load()`
 * calls would bundle each one separately, so the provider the test renders would
 * be a different context object from the one the component reads. The failure is
 * a thrown error rather than a wrong value, but it is a dead end either way.
 *
 * `SidebarProvider` is here for the same reason. It is not a stand-in for
 * `AdminLayout`: it supplies the sidebar's own collapse state and the tooltip
 * provider, which the real shell mounts around this component.
 *
 * Nothing imports this file except `tests/policy.mjs`. It is not linted (eslint
 * covers `**\/*.{ts,tsx}`) and it is not type-checked (tsconfig includes `src`),
 * so it must stay this small: re-exports only, no logic that could rot unwatched.
 */
export { AppSidebar } from "../../src/components/app-sidebar"
export { AdminAccessContext } from "../../src/admin/access-context"
export { SidebarProvider } from "../../src/components/ui/sidebar"
