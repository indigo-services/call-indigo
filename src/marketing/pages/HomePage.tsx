/**
 * Home page — exact duplicate of valvoro-prototype/index.html (PRD §5.1).
 *
 * This is a STUB. During rc1 implementation, port the 13 sections from the
 * static prototype mechanically, using the bespoke components in src/marketing/.
 * Parity is verified by the harness in tests/ (PRD §13).
 *
 * Section ids (measured [M] from index.html):
 *   about, area, brands, choose, contact, estimate, faq, process,
 *   results, reviews, services, top
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* TODO: port the 13 home sections from valvoro-prototype/index.html */}
      <div className="flex items-center justify-center min-h-screen text-body">
        <p className="text-lg">Home page — to be ported from the static prototype (PRD §5.1)</p>
      </div>
    </div>
  )
}
