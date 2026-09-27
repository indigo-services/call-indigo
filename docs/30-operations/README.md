# 30 — Operations: DevOps

How this ships, what can be seen, and what to do when it breaks.

| Document | Kind | Answers |
|---|---|---|
| [`deployment.md`](./deployment.md) | dated | Vercel, the SPA rewrite, the **deploy-author gate**, and how to prove a deploy actually shipped |
| [`environments.md`](./environments.md) | dated | Local / preview / production, and what differs |
| [`observability.md`](./observability.md) | dated | What we can see, and what we cannot |
| [`runbook-incident.md`](./runbook-incident.md) | dated | Rollback, bad deploy, broken asset |
| [`security.md`](./security.md) | dated | The posture index — and the gaps |

---

## The short version

| | |
|---|---|
| **Host** | Vercel, from this repository |
| **Production** | `call-indigo.com` |
| **Preview** | `call-indigo.vercel.app` — **307-redirects to the custom domain** |
| **Build** | `npm run build` → `dist/` |
| **The one hosting rule** | `vercel.json` rewrites `/(.*)` → `/index.html`. **Load-bearing for a client-rendered SPA** — without it, a deep link 404s |
| **CI** | `.github/workflows/ci.yml` — four gates on push to `main` and on every PR |
| **The trap** | **Deploys are gated on the commit *author*, not the token.** See [`deployment.md`](./deployment.md#3-the-author-gate) |

> ⚠️ **What is not verified, and it matters:** this pass did **not** confirm how the
> Vercel project is connected. `vercel.json` proves the *configuration*; it does not
> prove the *trigger*. Read [`deployment.md` §6](./deployment.md#6-what-is-not-verified)
> before assuming a push deploys.
