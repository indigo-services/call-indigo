/**
 * Captcha — self-contained human check for the public inquiry form.
 *
 * rc1 has no server, so a third-party widget (reCAPTCHA, Turnstile) would have
 * nowhere to verify its token and would add a network dependency for nothing.
 * This component gives the same gate with zero dependencies, and hides the
 * mechanism behind a two-method handle (isValid / reset) plus a plain input,
 * so swapping in a managed widget later is a one-file change on the page.
 *
 * The challenge is a small random arithmetic question with the numbers spelled
 * out — cheap for a person, annoying for the dumbest class of form-filling
 * scrapers. It is deliberately not strong cryptography; the honeypot beside it
 * and, eventually, a server-side check are the other layers.
 */
import { useEffect, useState } from "react"

export interface CaptchaHandle {
  /** True when the typed answer solves the current challenge. */
  isValid: () => boolean
  /** Fresh challenge, cleared input. Call after a successful send. */
  reset: () => void
}

interface CaptchaProps {
  /** DOM id for the input — the page derives label/error wiring from it. */
  id: string
  /** Shows the error styling/message (the page sets it after a failed attempt). */
  error?: boolean
  /** Ref to the input so the page can move focus here after a failed submit. */
  inputRef: React.RefObject<HTMLInputElement | null>
  /** Page-owned handle for isValid()/reset() in the submit path. */
  handleRef: React.RefObject<CaptchaHandle | null>
  /** Fires on every keystroke (and reset) so the page can clear its error state. */
  onAnswerChange: (value: string) => void
}

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"]
const VERBS = ["plus", "added to"]

interface Challenge {
  a: number
  b: number
  verb: string
}

function freshChallenge(): Challenge {
  return {
    a: 2 + Math.floor(Math.random() * 8), // 2–9
    b: 1 + Math.floor(Math.random() * 9), // 1–9
    verb: VERBS[Math.floor(Math.random() * VERBS.length)],
  }
}

export function Captcha({ id, error, inputRef, handleRef, onAnswerChange }: CaptchaProps) {
  const [challenge, setChallenge] = useState<Challenge>(freshChallenge)
  const [answer, setAnswer] = useState("")

  function reset() {
    setChallenge(freshChallenge())
    setAnswer("")
    onAnswerChange("")
  }

  // Re-publish the handle on every render so the page's submit closure always
  // sees the current challenge, and drop it on unmount.
  useEffect(() => {
    handleRef.current = {
      isValid: () => Number.parseInt(answer, 10) === challenge.a + challenge.b,
      reset,
    }
    return () => {
      handleRef.current = null
    }
  })

  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-[14px] font-bold text-ink">
        Human check — what is {WORDS[challenge.a]} {challenge.verb} {WORDS[challenge.b]}?
      </label>
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          id={id}
          name="captcha"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={2}
          required
          value={answer}
          onChange={(e) => {
            const next = e.target.value.replace(/\D/g, "").slice(0, 2)
            setAnswer(next)
            onAnswerChange(next)
          }}
          aria-required="true"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full max-w-[140px] rounded-[10px] border bg-white px-4 py-3 font-medium text-ink outline-none transition focus:border-sky focus:ring-2 focus:ring-sky/30 ${
            error ? "border-[#d1453b]" : "border-line"
          }`}
          placeholder="Answer"
        />
        <button
          type="button"
          onClick={reset}
          aria-label="Get a new question"
          className="grid size-9 shrink-0 place-items-center rounded-full border border-line bg-white text-body transition hover:border-sky hover:text-ink"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <path d="M21 3v6h-6" />
          </svg>
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[13px] font-semibold text-[#d1453b]">
          Please answer the check — it helps us keep spam out of the queue.
        </p>
      ) : null}
    </div>
  )
}
