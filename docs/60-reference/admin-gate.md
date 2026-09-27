# The `/admin` gate — a client-side prototype credential

**Kind:** dated · **Last verified:** 2026-09-27 at `2f009a2`
**Status:** implemented 2026-09-26 · **Release:** v2.0.rc1 (pre-release)
**Supersedes:** `docs/dashboard-scope.md` §9.1 ("No authentication")

The client asked for a username and password on the dashboard. This document is the
reconciliation: what was built, what it does and does not protect, how to rotate the
credential, and how the claims below were verified.

---

## 1. What this is, and what it is not

| | |
|---|---|
| **It is** | a gate that keeps `/admin` off the public internet for anyone who has not been handed the credentials |
| **It is not** | access control. There is no server, so there is nowhere for a secret to hide from the browser |
| **Bypassable by** | anyone who opens devtools and sets the session key. This is not a flaw to be fixed; it is what "no backend" means |

**The property that makes it worth having.** Neither credential is in the bundle.
The password is a salted PBKDF2-HMAC-SHA-256 digest at 210,000 iterations; the
username is a salted SHA-256. `grep`ping the built JavaScript for either finds
nothing — verified, see §5 — so the only way in from a stolen bundle is an offline
dictionary attack against a deliberately slow KDF, rather than reading a literal
out of the source.

**The upgrade path.** `verifyCredentials` is the only function that knows how a
credential is proved; `signIn` / `signOut` / `readSession` are the only ones that
know where a session lives. Moving to a real server means replacing those and
returning a signed `httpOnly` cookie. `tests/policy.mjs` fails if the credential
digests appear anywhere outside `src/admin/auth.ts`, so the containment cannot rot
by accident.

## 2. Where the pieces live

| Piece | File |
|---|---|
| The credential, the KDF, the session store | `src/admin/auth.ts` |
| The sign-in page | `src/admin/LoginPage.tsx` |
| The route guard | `src/admin/RequireAuth.tsx` — wraps `AdminLayout` in `src/App.tsx` |
| Sign out | `src/components/app-sidebar.tsx` (sidebar footer) |
| Credential rotation | `scripts/_gen-admin-credential.cjs` |
| Structural checks | `tests/auth.mjs` |
| Behavioural checks | `scripts/_probe_admin_gate.cjs` |

The guard wraps the **layout**, not the pages. A guard on the child routes would
still render the sidebar, breadcrumb and navigation to a stranger.

It renders `LoginPage` **in place of** its children rather than redirecting to
`/admin/login`, so the URL a visitor asked for is the URL they land on once they
are through — no `?next=` round trip, and no redirect loop to get wrong.

## 3. The credential

```
USERNAME_SALT_HEX  16 bytes, hex
USERNAME_HASH_HEX  SHA-256(salt ‖ username), hex
PASSWORD_SALT_B64  16 bytes, base64
PASSWORD_HASH_B64  PBKDF2-HMAC-SHA-256(password, salt, 210000), 32 bytes, base64
```

`210,000` is the widely-quoted 2023 OWASP baseline for this digest; the current
floor is 600,000. The cost of the hash *is* the security property here, so
`tests/auth.mjs` fails below 100,000 rather than letting a future edit trade it
away for a faster test run.

Both halves are **always** derived and compared, even once the username is known to
be wrong. Returning early would make a wrong username measurably faster than a
wrong password, which tells an attacker which half they got right.

Session: `call-indigo:auth:v1:session` in **`sessionStorage`** — deliberately not
`localStorage` (the flag should die with the tab on a shared machine), and
deliberately **outside** the `call-indigo:v1:` data namespace, because "Reset demo
data" on `/admin/security` clears that namespace and resetting fixtures should not
sign the operator out. Expires after 12 hours.

## 4. Rotating the credential

```bash
ADMIN_USER='someone' ADMIN_PASS='a-good-password' node scripts/_gen-admin-credential.cjs
```

Paste the four printed constants over the ones in `src/admin/auth.ts`, then:

```bash
npm test
ADMIN_USER='…' ADMIN_PASS='…' scripts/_devshot.sh --run scripts/_probe_admin_gate.cjs
```

The script refuses a password under 12 characters, and never echoes it back.

⚠️ **The generator's KDF must match `auth.ts` exactly.** If they disagree, every
sign-in fails with no visible reason. Two things stop that being a silent trap: the
iteration count is a single exported constant, and `tests/auth.mjs` runs a
known-answer test proving WebCrypto's PBKDF2 and Node's produce identical bytes.

## 5. What was verified, and how

**Structural (`tests/auth.mjs`, 18 checks, run by `npm test`)** — the KDF cost, the
salt/digest encodings, the absence of any long literal in `auth.ts` that is not a
declared salt, digest, key or accounted-for code word, the session's namespace and
expiry, the guard's placement, and the absence of the copy that used to say there
was no authentication. Three of those are paired with positive controls — a fixture
containing a plaintext password, a fixture containing the old sentences — because a
scanner that returns nothing for anything would otherwise make them vacuous.

**The credentials are absent from the shipped bundle** — checked directly, and the
result is the reason the scheme exists:

```
username in bundle: 0
password in bundle: 0
PBKDF2 present    : 1
pwd hash present  : 1
```

**Behavioural (`scripts/_probe_admin_gate.cjs`, 8/8 in a real browser)** — the suite
cannot test a sign-in: `renderToStaticMarkup` runs no effects and has no layout, and
the whole gate is a store subscription over `sessionStorage` plus an async PBKDF2.

```
[PASS] a stranger sees the sign-in page — no session, no dashboard
[PASS] no dashboard chrome leaks around the sign-in page
[PASS] wrong credentials are rejected — "That username and password do not match." after 173ms
[PASS] a rejected attempt leaves the dashboard closed
[PASS] right credentials open the dashboard — dashboard in 250ms
[PASS] the session survives a reload
[PASS] a new tab is NOT signed in
[PASS] Sign out ends the session
```

The last three are the interesting ones: they are the difference between a session
and a flag that happens to be set. "A new tab is NOT signed in" is the measurement
that proves the `sessionStorage` claim.

The probe reads the credentials from `ADMIN_USER` / `ADMIN_PASS` and reports the
credential-dependent steps as **SKIPPED** when they are unset — never as passed. A
probe that quietly succeeds when it could not run is the failure mode this project
has had to dig out of its own suite more than once.

## 6. Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| Someone reads the password out of the bundle | **Low** | It is not there; only a PBKDF2 digest at 210k iterations is |
| The gate is mistaken for real security | **High** | Four on-screen surfaces say it is a prototype gate; the Security page says it is not access control; this document exists |
| The password is weak, so the digest falls to a dictionary | **Medium** | `_gen-admin-credential.cjs` refuses < 12 chars; `tests/auth.mjs` fails if the credential is one of seven obvious guesses |
| The KDF parameters drift apart from the generator's | **Medium** | One exported iteration constant, plus a known-answer test that fails if the two implementations disagree |
| The gate is bypassed and nobody notices | **High** | Unfixable client-side. Only a server-issued session addresses it — see §7 |
| A stale "there is no authentication" claim reappears | **Medium** | `tests/auth.mjs` scans `src/` for the sentences and fails, with a positive control |

## 7. What a real implementation would still need

Client-side gating is the right size for a prototype the client is showing around,
and the wrong size for anything with real data behind it. Before this dashboard is
pointed at anything real:

1. **A server-issued session.** An `httpOnly`, `Secure`, `SameSite` cookie from a
   real endpoint, so the check cannot be skipped by setting a local flag.
2. **Per-user accounts, or none.** There is one shared credential and no identity,
   so nothing can be attributed to a person and the audit trail is nil.
3. **Server-side rate limiting.** The 173ms reject is a KDF cost, not a throttle;
   nothing stops a script trying passwords as fast as the client can derive them.
4. **A revocation path.** Rotating today means rebuilding and redeploying, because
   the credential is a build-time constant.

Items 1 and 4 are what PRD §16.2 F1 is still owed.
