/**
 * ContactPage — /contact, the public inquiry form.
 *
 * This is the one marketing page that is NOT a prototype mirror, so it is
 * written as ordinary React against the ported design-system classes rather
 * than as a `BODY_HTML` string. Chrome (top bar, header, footer, legal dialogs)
 * comes from `SiteChrome`; the form itself is bespoke, which PRD §8 permits on
 * the marketing side — the registry-only rule (§7) scopes to `/admin`.
 *
 * Submissions go through `api.createInquiry()`. Because that writes to the same
 * store the dashboard reads, an inquiry submitted here appears immediately in
 * `/admin/inquiries` — the two pages are connected by the data layer, not by a
 * page knowing about the other.
 *
 * Validation is deliberately inline and dependency-free: the field count is
 * small, and a form library would be the only thing in the marketing bundle
 * pulling its weight less than the form does.
 */
import { useId, useRef, useState, type FormEvent } from "react"
import { Captcha, type CaptchaHandle } from "@/marketing/Captcha"
import { api } from "@/lib/data/api"
import { SERVICES, URGENCIES, MEMBER_ANSWERS, type MemberAnswer, type PropertyType, type Service, type Urgency } from "@/lib/data/types"
import { SiteChrome } from "@/marketing/SiteChrome"

/* ── Form model ──────────────────────────────────────────────────────────── */

interface FormValues {
  /** Answered first, before the name — see the fieldset in the form body. */
  member: MemberAnswer | ""
  name: string
  email: string
  phone: string
  propertyType: PropertyType | ""
  service: Service | ""
  urgency: Urgency
  message: string
  /** Honeypot — not a real question. Bots fill it; humans never see it. */
  company: string
}

type FieldName = keyof FormValues
type Errors = Partial<Record<FieldName, string>>

const INITIAL: FormValues = {
  member: "",
  name: "",
  email: "",
  phone: "",
  propertyType: "",
  service: "",
  urgency: "soon",
  message: "",
  company: "",
}

/** Intentionally permissive — the goal is to catch typos, not to police email. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * Honeypot field: visually hidden, not focusable, ignored by assistive tech.
 * Humans never see it, so a filled value means a bot filled everything it
 * found. Silently swallowed on submit — the user must never learn it exists.
 */
const HONEYPOT_STYLE: React.CSSProperties = {
  position: "absolute",
  left: -9999,
  width: 1,
  height: 1,
  overflow: "hidden",
}

function validate(v: FormValues): Errors {
  const e: Errors = {}

  /* Checked first so that `Object.keys(e)[0]` — which is what onSubmit uses to
     decide where to put the focus — is also the topmost field on the page. */
  if (v.member === "") e.member = "Let us know if you're already a member."

  if (v.name.trim().length < 2) e.name = "Please enter your name."

  if (v.email.trim() === "") e.email = "Please enter an email address."
  else if (!EMAIL.test(v.email.trim())) e.email = "That doesn't look like an email address."

  const digits = v.phone.replace(/\D/g, "")
  if (v.phone.trim() === "") e.phone = "Please enter a phone number."
  else if (digits.length < 10) e.phone = "Please enter a 10-digit phone number."

  if (v.propertyType === "") e.propertyType = "Let us know if this is a home or a facility."

  if (v.service === "") e.service = "Pick the service that's closest — we can re-scope it later."

  if (v.message.trim().length < 10) {
    e.message = "A sentence or two about the work helps us quote it accurately."
  }

  return e
}

/* ── Field primitives ────────────────────────────────────────────────────── */

const FIELD_BASE =
  "w-full rounded-[10px] border bg-white px-4 py-3 font-medium text-ink placeholder:text-body/70 " +
  "outline-none transition focus:border-sky focus:ring-2 focus:ring-sky/30"

function borderFor(invalid: boolean): string {
  return invalid ? "border-[#d1453b]" : "border-line"
}

interface FieldProps {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  children: React.ReactNode
}

function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  return (
    <div className="grid gap-2">
      <label htmlFor={htmlFor} className="text-[14px] font-bold text-ink">
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${htmlFor}-hint`} className="text-[13px] text-body">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-[13px] font-semibold text-[#d1453b]">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function ContactPage() {
  const uid = useId()
  const [values, setValues] = useState<FormValues>(INITIAL)
  const [errors, setErrors] = useState<Errors>({})
  const [submitted, setSubmitted] = useState(false)
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [reference, setReference] = useState<string | null>(null)
  const [captchaError, setCaptchaError] = useState(false)

  const captchaInputRef = useRef<HTMLInputElement>(null)
  const captchaHandleRef = useRef<CaptchaHandle | null>(null)

  const formRef = useRef<HTMLFormElement>(null)
  const successRef = useRef<HTMLDivElement>(null)

  const fid = (name: FieldName) => `${uid}-${name}`

  function set<K extends FieldName>(name: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [name]: value }))
    // Clear a field's error as soon as the user has touched it, so the message
    // does not sit there contradicting what they just typed.
    setErrors((prev) => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFailure(null)

    const found = validate(values)
    setErrors(found)
    setSubmitted(true)

    if (Object.keys(found).length > 0) {
      // Move focus to the first problem rather than leaving the user to hunt.
      const first = (Object.keys(found) as FieldName[])[0]
      const el = formRef.current?.querySelector<HTMLElement>(`#${CSS.escape(fid(first))}`)
      el?.focus()
      return
    }

    // Honeypot first: a filled trap means a bot — drop it silently. The user
    // sees the normal success path so scrapers learn nothing.
    if (values.company) {
      setReference("REF-CONFIRMED")
      return
    }

    if (!captchaHandleRef.current?.isValid()) {
      setCaptchaError(true)
      captchaInputRef.current?.focus()
      return
    }

    setPending(true)
    try {
      const created = await api.createInquiry({
        member: values.member as MemberAnswer,
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        propertyType: values.propertyType as PropertyType,
        service: values.service as Service,
        urgency: values.urgency,
        message: values.message.trim(),
      })
      setReference(created.id)
      setValues(INITIAL)
      setErrors({})
      setSubmitted(false)
      setCaptchaError(false)
      captchaHandleRef.current?.reset()
      // Focus the confirmation so screen-reader users hear the result.
      requestAnimationFrame(() => successRef.current?.focus())
    } catch {
      setFailure("Something went wrong sending that. Please call (512) 608-4999 instead.")
    } finally {
      setPending(false)
    }
  }

  return (
    <SiteChrome active="contact">
      {/* ── Heading band ─────────────────────────────────────────────── */}
      <div className="pad-rl">
        <section className="mbox slab bg-mist pad-140">
          <div className="shell grid items-end gap-10 lg:grid-cols-[1.15fr_.85fr]">
            <div>
              <span className="eyebrow">Get in Touch</span>
              <h2 className="h-section">Tell us what needs fixing.</h2>
              <p className="mt-4 max-w-[620px] text-[16px] leading-[26px]">
                Send the details and the Indigo team will come back with a scope and a
                time. Every new customer gets a free inspection of their entire address,
                so it is worth listing anything else you have been meaning to look at.
              </p>
            </div>
            <div className="grid gap-3 text-[15px]">
              <a
                href="tel:+15126084999"
                className="flex items-center gap-3 font-bold text-ink hover:text-brand"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sky text-white">
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
                  </svg>
                </span>
                (512) 608-4999
              </a>
              <a
                href="mailto:support@call-indigo.com"
                className="flex items-center gap-3 font-bold text-ink hover:text-brand"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sky text-white">
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m2 7 10 6 10-6" />
                  </svg>
                </span>
                support@call-indigo.com
              </a>
              <p className="mt-1 text-[14px] text-body">
                Emergency work: call rather than writing. Typical arrival is 30–60 minutes.
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="spacer" />

      {/* ── The form ─────────────────────────────────────────────────── */}
      <div className="pad-rl">
        <section className="mbox slab pad-140">
          <div className="shell grid gap-12 lg:grid-cols-[1.35fr_.65fr] lg:gap-[70px]">
            {/* Confirmation replaces nothing — it sits above the form, so the
                user can send a second inquiry without a navigation. */}
            {reference ? (
              <div
                ref={successRef}
                tabIndex={-1}
                role="status"
                className="rounded-panel border border-line bg-mist p-6 outline-none md:p-8"
              >
                <span className="grid size-12 place-items-center rounded-full bg-sky text-[22px] font-bold text-white">
                  ✓
                </span>
                <h3 className="mt-4 text-[22px] font-extrabold text-ink">
                  Thanks — that's with our team.
                </h3>
                <p className="mt-2 text-[15px] leading-[25px]">
                  Reference <strong className="text-ink">{reference}</strong>. Someone will
                  call or email within one business day. If it is urgent, call{" "}
                  <a href="tel:+15126084999" className="font-bold text-brand hover:underline">
                    (512) 608-4999
                  </a>
                  .
                </p>
                <button
                  type="button"
                  onClick={() => setReference(null)}
                  className="pill mt-6"
                >
                  <span>Send another</span>
                  <span className="pill-circle">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 17L17 7M9 7h8v8" />
                    </svg>
                  </span>
                </button>
              </div>
            ) : null}

            <form ref={formRef} noValidate onSubmit={onSubmit} className="grid gap-6">
              <div>
                <span className="eyebrow">Request Service</span>
                <h3 className="text-[26px] font-extrabold leading-tight text-ink">
                  Inquiry form
                </h3>
              </div>

              {failure ? (
                <p role="alert" className="rounded-[10px] border border-[#d1453b] bg-[#fdf2f1] px-4 py-3 text-[14px] font-semibold text-[#a3312a]">
                  {failure}
                </p>
              ) : null}

              {/* Answered before the name, because it is the one question that
                  changes what the rest of the form means to the person filling
                  it in: a member is already in our system, and their address is
                  on file.

                  Built as a real `fieldset`/`legend` rather than the `Field`
                  primitive, because `Field` labels a single control by `htmlFor`
                  and a radio group has no single control to point at. The group
                  carries `id={fid("member")}` + `tabIndex={-1}` so that the
                  focus-the-first-problem path in `onSubmit` has somewhere to
                  land — it looks the id up with `querySelector`. */}
              <fieldset
                id={fid("member")}
                tabIndex={-1}
                aria-invalid={submitted && !!errors.member}
                aria-describedby={submitted && errors.member ? `${fid("member")}-error` : undefined}
                className="grid gap-3"
              >
                <legend className="mb-1 text-[14px] font-bold text-ink">Already a member?</legend>
                <div className="flex flex-wrap gap-3">
                  {MEMBER_ANSWERS.map((m) => {
                    const chosen = values.member === m.value
                    return (
                      <label
                        key={m.value}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-[10px] border px-5 py-3 text-[15px] font-bold text-ink transition ${
                          chosen ? "border-sky bg-sky/10" : "border-line bg-white hover:border-sky/60"
                        }`}
                      >
                        <input
                          type="radio"
                          name="member"
                          value={m.value}
                          checked={chosen}
                          onChange={() => set("member", m.value)}
                          className="size-4 accent-[#30c3eb]"
                        />
                        {m.label}
                      </label>
                    )
                  })}
                </div>
                {submitted && errors.member ? (
                  <p id={`${fid("member")}-error`} role="alert" className="text-[13px] font-semibold text-[#d1453b]">
                    {errors.member}
                  </p>
                ) : null}
              </fieldset>

              <div className="grid gap-6 md:grid-cols-2">
                <Field label="Your name" htmlFor={fid("name")} error={submitted ? errors.name : undefined}>
                  <input
                    id={fid("name")}
                    name="name"
                    autoComplete="name"
                    required
                    value={values.name}
                    onChange={(e) => set("name", e.target.value)}
                    aria-invalid={submitted && !!errors.name}
                    aria-describedby={submitted && errors.name ? `${fid("name")}-error` : undefined}
                    className={`${FIELD_BASE} ${borderFor(submitted && !!errors.name)}`}
                    placeholder="Amanda Reyes"
                  />
                </Field>

                <Field label="Phone" htmlFor={fid("phone")} error={submitted ? errors.phone : undefined}>
                  <input
                    id={fid("phone")}
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={values.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    aria-invalid={submitted && !!errors.phone}
                    aria-describedby={submitted && errors.phone ? `${fid("phone")}-error` : undefined}
                    className={`${FIELD_BASE} ${borderFor(submitted && !!errors.phone)}`}
                    placeholder="(512) 555-0142"
                  />
                </Field>
              </div>

              <Field label="Email" htmlFor={fid("email")} error={submitted ? errors.email : undefined}>
                <input
                  id={fid("email")}
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={values.email}
                  onChange={(e) => set("email", e.target.value)}
                  aria-invalid={submitted && !!errors.email}
                  aria-describedby={submitted && errors.email ? `${fid("email")}-error` : undefined}
                  className={`${FIELD_BASE} ${borderFor(submitted && !!errors.email)}`}
                  placeholder="you@example.com"
                />
              </Field>

              <div className="grid gap-6 md:grid-cols-2">
                <Field
                  label="Property type"
                  htmlFor={fid("propertyType")}
                  error={submitted ? errors.propertyType : undefined}
                >
                  <select
                    id={fid("propertyType")}
                    name="propertyType"
                    required
                    value={values.propertyType}
                    onChange={(e) => set("propertyType", e.target.value as PropertyType | "")}
                    aria-invalid={submitted && !!errors.propertyType}
                    aria-describedby={submitted && errors.propertyType ? `${fid("propertyType")}-error` : undefined}
                    className={`${FIELD_BASE} ${borderFor(submitted && !!errors.propertyType)}`}
                  >
                    <option value="">Select…</option>
                    <option value="residential">Residential — a home</option>
                    <option value="commercial">Commercial — a facility</option>
                  </select>
                </Field>

                <Field label="Service" htmlFor={fid("service")} error={submitted ? errors.service : undefined}>
                  <select
                    id={fid("service")}
                    name="service"
                    required
                    value={values.service}
                    onChange={(e) => set("service", e.target.value as Service | "")}
                    aria-invalid={submitted && !!errors.service}
                    aria-describedby={submitted && errors.service ? `${fid("service")}-error` : undefined}
                    className={`${FIELD_BASE} ${borderFor(submitted && !!errors.service)}`}
                  >
                    <option value="">Select…</option>
                    {SERVICES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <fieldset className="grid gap-3">
                <legend className="mb-1 text-[14px] font-bold text-ink">How soon?</legend>
                <div className="grid gap-3 sm:grid-cols-3">
                  {URGENCIES.map((u) => {
                    const chosen = values.urgency === u.value
                    return (
                      <label
                        key={u.value}
                        className={`flex cursor-pointer flex-col gap-0.5 rounded-[10px] border px-4 py-3 transition ${
                          chosen ? "border-sky bg-sky/10" : "border-line bg-white hover:border-sky/60"
                        }`}
                      >
                        <span className="flex items-center gap-2 text-[14px] font-bold text-ink">
                          <input
                            type="radio"
                            name="urgency"
                            value={u.value}
                            checked={chosen}
                            onChange={() => set("urgency", u.value)}
                            className="size-4 accent-[#30c3eb]"
                          />
                          {u.label}
                        </span>
                        <span className="pl-6 text-[12.5px] text-body">{u.hint}</span>
                      </label>
                    )
                  })}
                </div>
              </fieldset>

              <Field
                label="What needs doing?"
                htmlFor={fid("message")}
                error={submitted ? errors.message : undefined}
                hint={`${values.message.length} characters — include the address area and any access notes.`}
              >
                <textarea
                  id={fid("message")}
                  name="message"
                  rows={5}
                  required
                  value={values.message}
                  onChange={(e) => set("message", e.target.value)}
                  aria-invalid={submitted && !!errors.message}
                  aria-describedby={
                    submitted && errors.message ? `${fid("message")}-error` : `${fid("message")}-hint`
                  }
                  className={`${FIELD_BASE} ${borderFor(submitted && !!errors.message)} resize-y`}
                  placeholder="Water is pooling under the kitchen sink. I've shut the valve off. The cabinet floor is soaked."
                />
              </Field>

              {/* Honeypot: hidden from people, irresistible to autofill bots. */}
              <div style={HONEYPOT_STYLE} aria-hidden="true">
                <label htmlFor={fid("company")}>Company</label>
                <input
                  id={fid("company")}
                  name="company"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={values.company}
                  onChange={(e) => set("company", e.target.value)}
                />
              </div>

              <Captcha
                id={`${uid}-captcha`}
                error={submitted && captchaError}
                inputRef={captchaInputRef}
                handleRef={captchaHandleRef}
                onAnswerChange={() => setCaptchaError(false)}
              />

              <div className="flex flex-wrap items-center gap-5">
                <button type="submit" disabled={pending} className="pill pill-lg disabled:opacity-70">
                  <span>{pending ? "Sending…" : "Send inquiry"}</span>
                  <span className="pill-circle">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 17L17 7M9 7h8v8" />
                    </svg>
                  </span>
                </button>
                <p className="max-w-[320px] text-[13px] leading-[20px] text-body">
                  We use your details only to answer this request. Nothing is sold or shared.
                </p>
              </div>
            </form>

            {/* ── Facts column ───────────────────────────────────────── */}
            <aside className="grid content-start gap-6">
              <div className="rounded-panel border border-line bg-mist p-6">
                <h3 className="text-[17px] font-bold text-ink">What happens next</h3>
                <ol className="mt-4 grid gap-3 text-[14px] leading-[22px]">
                  <li className="flex gap-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-sky text-[12px] font-bold text-white">1</span>
                    We read it and call you back within one business day.
                  </li>
                  <li className="flex gap-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-sky text-[12px] font-bold text-white">2</span>
                    Simple work gets a phone estimate. Bigger jobs get a walk-through.
                  </li>
                  <li className="flex gap-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-sky text-[12px] font-bold text-white">3</span>
                    Approved work is scheduled around the property's needs.
                  </li>
                </ol>
              </div>

              <div className="rounded-panel border border-line p-6">
                <h3 className="text-[17px] font-bold text-ink">The details</h3>
                <dl className="mt-3 grid gap-2 text-[14px] leading-[22px]">
                  <div>
                    <dt className="font-bold text-ink">Service area</dt>
                    <dd>Hays, Travis, and Williamson counties</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-ink">Address</dt>
                    <dd>1005 Meredith Drive, Austin, TX 78748</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-ink">Licence</dt>
                    <dd>RMP: 45574</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-ink">Hours</dt>
                    <dd>Emergency line answered 24/7</dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        </section>
      </div>

      <div className="spacer" />
    </SiteChrome>
  )
}
