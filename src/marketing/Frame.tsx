/**
 * Frame — the three-layer frame model (PRD §3.3).
 *
 *   viewport
 *    └── .pad-rl   → --gut     viewport edge → card edge
 *         └── .mbox → --inset  card edge     → section text
 *              └── .shell → --col  max text column (≥1200 only)
 *
 * This is the layout contract rc1 must not break. The CSS classes live in
 * src/index.css (ported verbatim from the prototype). This component wraps
 * them so marketing sections compose cleanly.
 *
 * STUB — implement during rc1 porting.
 */
export function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="pad-rl">
      <div className="mbox">
        <div className="shell">{children}</div>
      </div>
    </div>
  )
}
