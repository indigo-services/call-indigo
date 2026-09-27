# Observability

**Kind:** dated · **Owner:** the repo · **Last verified:** 2026-09-27 at `2f009a2`

**The honest summary: this project has almost no observability, and that is a known
and deliberate state rather than an oversight.** It is a marketing site with a
client-side demo dashboard. Nothing here takes a payment, stores a personal record, or
has an uptime obligation that a status page would serve.

This document exists so the gap is **written down** rather than rediscovered.

---

## 1. What we can see

| Signal | Where | Latency | Who looks |
|---|---|---|---|
| **Build result** | GitHub Actions, `.github/workflows/ci.yml` | On push / PR | Anyone |
| **Deploy result** | The commit status on GitHub (see [`deployment.md` §3.1](./deployment.md#31-read-the-status-before-theorising)) | Minutes | Anyone |
| **Runtime errors** | **The browser console.** Not collected. | — | Whoever is looking |
| **Traffic** | Vercel's own dashboard | ~real time | Whoever has Vercel access |
| **Form submissions** | The visitor's own `localStorage` | — | **Nobody but that visitor** |

## 2. What we cannot see

| Cannot see | Consequence |
|---|---|
| **Any runtime error a visitor hit** | There is no error reporter. A broken interaction is invisible until someone reproduces it by hand. |
| **Any form submission** | `/contact` writes to the **submitter's** `localStorage`. **The business never receives it.** This is the single most important thing on this page. |
| **Which routes are used** | No analytics. PRD §16.2 and the client's requirements rule it out — see [`security.md`](./security.md). |
| **Core Web Vitals / real-user performance** | Vercel's dashboard has some of this; nothing is recorded in the repo. |
| **Whether the deploy is serving the intended build** | Only by the manual fingerprint procedure in [`deployment.md` §5](./deployment.md#5-proving-a-deploy-actually-shipped-the-code). |

> ⚠️ **"The form works" means the form works *in that browser*.** A demo where the
> client fills in the contact form on their own laptop and then checks their inbox will
> find nothing, because there is no backend. **Say this out loud before a demo** — it is
> the most likely thing to be mistaken for a bug in a room full of people.

## 3. Why there is no analytics

**It is a requirement, not a deferral.** Three constraints, all recorded:

1. **The client's requirements rule out cookies and third-party trackers.**
2. **`CONTRIBUTING.md` names it in "What we will not merge"** — *"Anything that adds a
   cookie, analytics, or a third-party captcha."*
3. **`README.md`'s known limitations** states that no cookie is set and no analytics is
   loaded.

A future change that adds analytics is therefore not a small change — it reverses a
recorded client decision. **Name the collision rather than making it quietly.**

## 4. What a useful next step would look like

Ordered by value per unit of risk. **None of these is committed work.**

| # | What | Why first | The constraint |
|---|---|---|---|
| 1 | **A real backend for `/contact`** (PRD §16.2 **F2**) | The form currently tells the business nothing. This is the only observability gap with a business consequence. | It is the biggest change in the project — it is the whole reason the `api.ts` seam exists |
| 2 | **A deploy log**, written per release | Cheap, no runtime risk, and it closes the "did it ship?" question permanently | Phase 5 of the docs plan |
| 3 | **An uptime check** on `call-indigo.com` | The only thing a visitor notices is the site being down | External service; a decision, not a default |
| 4 | **Error reporting** | Real value, but it is a third-party script | **Collides with §3.** Would need the client's explicit agreement |
| 5 | **Analytics** | Would answer "which routes are used" | **Collides with §3.** Not recommended |

**Recommendation:** do #1 and #2. Do not do #4 or #5 without the client reversing their
own requirement in writing.

## 5. How a problem is found today

By a person using the site. That is the whole mechanism.

The practical consequence for anyone changing this codebase: **a change that is correct
in `npm test` and wrong in a browser will not be caught by anything except a browser.**
See [`../20-development/testing.md` §4](./../20-development/testing.md#4-what-this-does-not-cover)
for exactly which classes of defect the suite cannot see.

---

**Last verified:** 2026-09-27 at `2f009a2`
