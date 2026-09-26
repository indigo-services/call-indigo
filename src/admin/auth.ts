/**
 * The dashboard gate — a username and a password, for a prototype.
 *
 * ⚠️ READ THIS BEFORE TRUSTING IT WITH ANYTHING.
 *
 * This is a **client-side** gate. There is no server, so there is nowhere for a
 * secret to live that the browser cannot reach, and anyone willing to open
 * devtools can set the session flag by hand and walk straight in. It is not
 * access control, and it is not a substitute for one.
 *
 * What it *does* do, and why it is still worth having:
 *
 *   · **Neither credential is in the bundle.** The username is stored as a
 *     salted SHA-256, and the password as a salted PBKDF2-HMAC-SHA-256 digest at
 *     210,000 iterations. So grepping the built JavaScript for the password
 *     finds nothing, and recovering it from the digest means an offline
 *     dictionary attack against a deliberately slow KDF rather than a
 *     `String ===`. That is the whole difference between this and the
 *     `if (input === "hunter2")` a prototype usually ships with.
 *   · It keeps the dashboard off the public internet for anyone who has not been
 *     handed the credentials — which is the actual requirement while the client
 *     is showing this around.
 *
 * THE UPGRADE PATH. When this stops being a prototype: move `verifyCredentials`
 * behind a real server (or an identity provider) and have it return a signed,
 * `httpOnly` session cookie. The swap is contained on purpose — `verifyCredentials`
 * is the only function that knows how a credential is proved, and `signIn` /
 * `signOut` / `readSession` are the only ones that know where a session lives.
 * Nothing else in the app imports a hash or touches storage.
 *
 * WHY THE USERNAME IS HASHED TOO, AND MORE CHEAPLY. The username is not a
 * secret, so a plain salted SHA-256 is enough to keep it off a casual grep. The
 * slow KDF is reserved for the password, which is the thing worth slowing an
 * attacker down for. Hashing both means the bundle contains neither.
 */
import { useSyncExternalStore } from "react"

/**
 * PBKDF2-HMAC-SHA-256 iterations. OWASP's current floor for this digest is
 * 600,000; 210,000 is the widely-quoted 2023 baseline and keeps a sign-in under
 * roughly half a second on a laptop. Exported so the suite can assert it — the
 * cost of the hash *is* the security property, and it must not be quietly
 * lowered to make a test faster.
 */
export const PBKDF2_ITERATIONS = 210_000

/** Salt (hex) and digest (hex) for the operator's username. */
export const USERNAME_SALT_HEX = "ed33f4d5065a8362a08b1934d18b9246"
export const USERNAME_HASH_HEX = "c3e6e219064c4af0f681ed7318ddd019834601664c5d1461dc25adef1da27a49"

/** Salt (base64) and 32-byte digest (base64) for the password. */
export const PASSWORD_SALT_B64 = "RIj/teDxqvzo0hKcQ+5ldw=="
export const PASSWORD_HASH_B64 = "cwsfH4ucZ+iOzrKhlXRagAVLG2Lq/6ZBCLehIXKRgGA="

/**
 * Where the session flag lives.
 *
 * Deliberately **not** under the data namespace (`call-indigo:v1:`), because
 * "Reset demo data" on /admin/security clears that namespace — and resetting the
 * fixtures should not sign the operator out.
 *
 * `sessionStorage` rather than `localStorage`: the flag dies with the tab, which
 * is the right default for a shared or demo machine.
 */
export const SESSION_KEY = "call-indigo:auth:v1:session"

/** Twelve hours — long enough to survive a working day, not a week. */
export const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000

/* ── byte helpers ─────────────────────────────────────────────────────────── */

const encoder = new TextEncoder()

/**
 * These three are typed `Uint8Array<ArrayBuffer>` rather than plain
 * `Uint8Array` on purpose. `Uint8Array` defaults to `Uint8Array<ArrayBufferLike>`,
 * which includes `SharedArrayBuffer` — and WebCrypto's `BufferSource` will not
 * accept that, so `deriveBits` fails to typecheck. Returning the narrower type
 * here is what keeps the cast out of the call site.
 */
function bytesFromHex(hex: string): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return out
}

function hexFromBytes(bytes: Uint8Array): string {
  let out = ""
  for (const b of bytes) out += b.toString(16).padStart(2, "0")
  return out
}

function bytesFromBase64(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

/**
 * Constant-time comparison.
 *
 * There is no remote attacker here to mount a timing attack against, so this
 * buys nothing today. It costs nothing either, and it means the comparison does
 * not have to be revisited when the check moves to a server — which is exactly
 * the kind of detail that gets missed in that move.
 */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

/* ── the KDF ──────────────────────────────────────────────────────────────── */

/**
 * PBKDF2-HMAC-SHA-256 via WebCrypto.
 *
 * `deriveBits` rather than `deriveKey`: a key object would then have to be
 * exported before it could be compared, and `deriveBits` is the same computation
 * without that step. Node's `crypto.pbkdf2Sync` produces identical bytes for
 * identical inputs, which is what lets the suite check this against a vector it
 * computes itself — see `tests/auth.mjs`.
 */
async function derivePassword(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<Uint8Array<ArrayBuffer>> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"])
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    256,
  )
  return new Uint8Array(bits)
}

async function sha256Hex(salt: Uint8Array, value: string): Promise<string> {
  const joined = new Uint8Array(salt.length + encoder.encode(value).length)
  joined.set(salt, 0)
  joined.set(encoder.encode(value), salt.length)
  return hexFromBytes(new Uint8Array(await crypto.subtle.digest("SHA-256", joined)))
}

/**
 * Test-only handle on the KDF.
 *
 * The stored digests were generated outside the browser, so the thing that makes
 * them checkable is that **this** PBKDF2 and the one that produced them agree on
 * identical inputs. `tests/auth.mjs` proves that with a known-answer test against
 * Node's `crypto.pbkdf2Sync` — which it can only do if it can call this. It takes
 * no secret and reveals nothing; it is exported rather than kept private purely
 * so the suite does not have to duplicate the implementation it is checking.
 */
export const derivePasswordForTest = derivePassword

/**
 * Prove a credential pair.
 *
 * **Both halves are always derived and compared**, even once the username is
 * known to be wrong. Returning early on a bad username would make a wrong
 * username measurably faster than a wrong password, which tells an attacker
 * which half they got right. It also means this always pays the full KDF cost.
 */
export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  const usernameOk = timingSafeEqual(
    bytesFromHex(await sha256Hex(bytesFromHex(USERNAME_SALT_HEX), username)),
    bytesFromHex(USERNAME_HASH_HEX),
  )
  const passwordOk = timingSafeEqual(
    await derivePassword(password, bytesFromBase64(PASSWORD_SALT_B64), PBKDF2_ITERATIONS),
    bytesFromBase64(PASSWORD_HASH_B64),
  )
  return usernameOk && passwordOk
}

/* ── the session ──────────────────────────────────────────────────────────── */

/**
 * `sessionStorage` throws in private-mode Safari and when storage is disabled
 * outright. There is no in-memory fallback here on purpose: the fallback would
 * be a session that silently vanishes on reload, which reads as a broken login.
 * Refusing to sign in, with a message that says why, is the honest failure.
 */
function sessionStore(): Storage | null {
  if (typeof window === "undefined") return null
  try {
    const probe = `${SESSION_KEY}:probe`
    window.sessionStorage.setItem(probe, "1")
    window.sessionStorage.removeItem(probe)
    return window.sessionStorage
  } catch {
    return null
  }
}

/** Is there an unexpired session in this tab? Never throws. */
export function readSession(): boolean {
  const store = sessionStore()
  if (!store) return false
  try {
    const raw = store.getItem(SESSION_KEY)
    if (raw === null) return false
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== "object" || parsed === null) return false
    const exp = (parsed as { exp?: unknown }).exp
    return typeof exp === "number" && exp > Date.now()
  } catch {
    // Hand-edited or corrupt: treat it as no session rather than take the app down.
    return false
  }
}

/* ── the store ────────────────────────────────────────────────────────────── */

export interface AuthState {
  signedIn: boolean
}

/**
 * The snapshot is replaced, never mutated, so `useSyncExternalStore` can compare
 * it by identity. `SERVER_SNAPSHOT` is a single frozen object for the same
 * reason: a fresh `{ signedIn: false }` on every call would re-render forever.
 */
const SERVER_SNAPSHOT: AuthState = { signedIn: false }
let snapshot: AuthState = SERVER_SNAPSHOT

const listeners = new Set<() => void>()

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getSnapshot(): AuthState {
  return snapshot
}

export function getServerSnapshot(): AuthState {
  return SERVER_SNAPSHOT
}

function setSignedIn(value: boolean): void {
  if (snapshot.signedIn === value) return
  snapshot = { signedIn: value }
  for (const listener of listeners) listener()
}

/**
 * Seed the store from whatever this tab already holds.
 *
 * Called at module load rather than in an effect, so the very first render
 * already knows: an effect would render the sign-in page first and then swap to
 * the dashboard, which looks like a flicker on every reload.
 */
export function hydrateSession(): void {
  setSignedIn(readSession())
}

hydrateSession()

/* ── the public surface ───────────────────────────────────────────────────── */

export type SignInResult = { ok: true } | { ok: false; reason: "invalid" | "unavailable" }

/**
 * Check a credential pair and, on success, open a session.
 *
 * `unavailable` is separated from `invalid` so the page can say "this browser
 * will not let us store a session" instead of wrongly blaming the password.
 */
export async function signIn(username: string, password: string): Promise<SignInResult> {
  if (typeof crypto === "undefined" || !crypto.subtle) return { ok: false, reason: "unavailable" }

  let ok: boolean
  try {
    ok = await verifyCredentials(username, password)
  } catch {
    // A KDF failure is not a wrong password; do not tell the operator it was.
    return { ok: false, reason: "unavailable" }
  }
  if (!ok) return { ok: false, reason: "invalid" }

  const store = sessionStore()
  if (!store) return { ok: false, reason: "unavailable" }
  try {
    const now = Date.now()
    store.setItem(SESSION_KEY, JSON.stringify({ at: now, exp: now + SESSION_MAX_AGE_MS }))
  } catch {
    return { ok: false, reason: "unavailable" }
  }

  setSignedIn(true)
  return { ok: true }
}

export function signOut(): void {
  try {
    sessionStore()?.removeItem(SESSION_KEY)
  } catch {
    // Nothing useful to do — the in-memory flag below is the authority anyway.
  }
  setSignedIn(false)
}

/**
 * React binding for the store. `useSyncExternalStore` rather than context so the
 * sidebar's sign-out button and the route guard cannot drift apart, and so no
 * provider has to be threaded through `App.tsx`.
 */
export function useAuth(): AuthState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
