/**
 * PageHeader — the heading block every dashboard page opens with.
 *
 * Exists so the eight dashboard pages cannot drift apart in type scale or
 * spacing, and so an action (a Save button, a filter) has a defined home.
 */
import type { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  description: string
  /** Actions rendered on the right, e.g. a Save button. */
  children?: ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
    </div>
  )
}
