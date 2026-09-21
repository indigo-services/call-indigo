/**
 * service-area — the ZIP availability decision.
 *
 * The one check in the suite that is a unit test rather than a rendered-markup
 * assertion, because the decision is a pure function. It is here for a specific
 * reason: the prototype told every visitor we cover them.
 *
 * `valvoro-prototype/js/main.js` revealed the result on any three characters
 * typed, and the markup shipped a hardcoded success message — so "00000" was
 * told "we cover your area with same-day service". Neither claim was true: the
 * business covers three counties, and same-day service is not a published fact
 * about it. The decision now has boundaries, so the boundaries are asserted.
 *
 * The served ZIP blocks are a proxy for the county list (Hays, Travis,
 * Williamson), not the list itself. That is deliberate and it is why an
 * unserved ZIP gets an invitation to call rather than a refusal — the test
 * below pins that wording too, so it cannot quietly become a "no".
 */
import { check, load, suite } from "./harness.mjs"

export async function run() {
  const { checkServiceArea } = await load("src/marketing/service-area.ts", "service-area")

  suite("Service area (ZIP check)", "src/marketing/service-area.ts")

  check("a served ZIP is accepted", () => {
    const out = []
    // 786xx — Buda, Kyle, San Marcos and the corridor between.
    for (const zip of ["78610", "78640", "78666"]) {
      const v = checkServiceArea(zip)
      if (!v.valid) out.push(`${zip} — rejected as malformed`)
      else if (!v.served) out.push(`${zip} — reported as outside the service area`)
      else if (!v.message.includes(zip)) out.push(`${zip} — message does not name the ZIP: "${v.message}"`)
    }
    // 787xx — Austin.
    for (const zip of ["78701", "78748", "78759"]) {
      const v = checkServiceArea(zip)
      if (!v.served) out.push(`${zip} — reported as outside the service area`)
    }
    return out
  })

  check("a ZIP+4 is accepted on the same block", () => {
    const v = checkServiceArea("78701-1234")
    if (!v.valid) return [`rejected as malformed: "${v.message}"`]
    if (!v.served) return ["78701-1234 reported as outside the service area"]
    return []
  })

  check("an unserved ZIP is not refused outright", () => {
    // 90210 is Beverly Hills. The answer must leave the door open, because the
    // ZIP blocks are a proxy for the county list rather than the list itself.
    const v = checkServiceArea("90210")
    const out = []
    if (!v.valid) out.push("rejected as malformed instead of answered")
    if (v.served) out.push("reported as inside the service area")
    if (!/call/i.test(v.message)) out.push(`does not offer a way to call: "${v.message}"`)
    if (!/\b512\b/.test(v.message)) out.push(`does not carry the phone number: "${v.message}"`)
    return out
  })

  check("the block boundaries are where the regex says they are", () => {
    // One either side of each edge. A regression that widened the match to any
    // five digits, or narrowed it to 786/787 exactly, shows up here.
    const expect = {
      78599: false, // just below 786xx
      78600: true, // first 786xx
      78699: true, // last 786xx
      78700: true, // first 787xx
      78799: true, // last 787xx
      78800: false, // just above 787xx
      10000: false, // the "00000" family — five digits, not a served block
    }
    const out = []
    for (const [zip, served] of Object.entries(expect)) {
      const v = checkServiceArea(zip)
      if (!v.valid) out.push(`${zip} — rejected as malformed`)
      else if (v.served !== served) out.push(`${zip} — served=${v.served}, expected ${served}`)
    }
    return out
  })

  check("malformed input is rejected, not guessed at", () => {
    // The old check accepted all of these as long as three characters arrived.
    const out = []
    for (const bad of ["", "   ", "787", "7870", "787012", "abcde", "7870a", "78701-12", "78701-12345"]) {
      const v = checkServiceArea(bad)
      if (v.valid) out.push(`"${bad}" — accepted as a ZIP`)
      if (v.served) out.push(`"${bad}" — reported as inside the service area`)
    }
    return out
  })

  check("surrounding whitespace does not change the verdict", () => {
    const out = []
    for (const [raw, served] of [["  78701  ", true], ["\t78666\n", true], [" 90210 ", false]]) {
      const v = checkServiceArea(raw)
      if (!v.valid) out.push(`"${raw}" — rejected as malformed`)
      else if (v.served !== served) out.push(`"${raw}" — served=${v.served}, expected ${served}`)
    }
    return out
  })

  check("every verdict carries a message and no unverifiable promise", () => {
    const out = []
    for (const zip of ["78701", "90210", "nonsense", ""]) {
      const v = checkServiceArea(zip)
      if (!v.message) out.push(`"${zip}" — no message`)
      // "same-day" was in the shipped copy and is not a published fact about
      // this business; the counties and the phone number are.
      if (/same.day/i.test(v.message)) out.push(`"${zip}" — promises same-day service: "${v.message}"`)
    }
    return out
  })
}
