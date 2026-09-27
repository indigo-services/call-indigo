# Runbook — incident response

**Kind:** dated · **Trigger:** the live site is wrong, down, or serving something
unintended · **Target:** identify within 10 minutes, mitigate within 30 ·
**Last verified:** 2026-09-27 at `2f009a2`

> Written for a person under pressure. Short sentences, exact commands. The *why* lives
> in [`deployment.md`](./deployment.md) and [`observability.md`](./observability.md).

---

## 1. First: is it actually broken?

Before anything else, separate the three things that look identical from the outside.

| Symptom | Likely | Go to |
|---|---|---|
| The whole site fails to load | DNS, TLS, or a Vercel platform incident | §2 |
| The site loads, but a **deep link or a refresh** 404s | The SPA rewrite is missing or was removed | §3 |
| The site loads, but **the old version** is being served | The deploy did not happen, or did not ship | §4 |
| The site loads, but an image is missing | A moved or renamed asset | §5 |
| The site is fine, but **`/admin` shows the sign-in page** | Working as intended — the gate is client-side and per-tab | **Not an incident.** See [`security.md`](./security.md) |
| **The contact form submitted but no email arrived** | Working as intended — there is no backend | **Not an incident.** See [`observability.md` §2](./observability.md#2-what-we-cannot-see) |

> **The last two rows are the two most likely false alarms.** Both are documented
> behaviour, not defects. Check them before escalating.

## 2. The whole site is down

**Diagnose:**

```bash
curl -sS -o /dev/null -w 'http=%{http_code}\n' https://call-indigo.com/
```

- `http=200` → it is up. The problem is local — DNS cache, a VPN, or a browser
  extension. Re-check on a phone over cellular.
- `http=5xx` → the host is failing. Go to the Vercel dashboard and read the deployment
  status and the runtime logs.
- No response at all → check [vercel-status.com](https://www.vercel-status.com/) **first**.
  A platform incident needs no action from us.

> ⚠️ **`curl -w '%{size_download}'` reports `0` on Git Bash / Windows** while printing
> `http=200`. Never use it as evidence. Use `-o /dev/null -w '%{http_code}'`, or fetch to
> a file and `stat -c%s` it.

## 3. Deep links 404 (but the homepage works)

**This is the SPA rewrite.** It is the single hosting rule in `vercel.json`:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

**Verify it is present:**

```bash
cat vercel.json
```

If the rewrite is missing, **that is the incident.** Restore it and deploy. If it is
present, the problem is a route the router does not know — see
[`../20-development/architecture.md`](../20-development/architecture.md#seam-1--srcapptsx-the-route-table).

## 4. The old version is still being served

**This is the author gate until proven otherwise.** Read
[`deployment.md` §3](./deployment.md#3-the-author-gate) in full; the short version:

**Diagnose — read the commit status, do not guess from the UI:**

```bash
TOKEN=$(printf 'protocol=https\nhost=github.com\n\n' | git credential fill 2>/dev/null | sed -n 's/^password=//p')

curl -s -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/indigo-services/call-indigo/commits/$(git rev-parse --short HEAD)/status"
```

**Read `.state`, `.statuses[].description`, and especially `.target_url`.**

- `description` contains **"Git author … must have access to the project on Vercel"**
  → the author gate. The fix is in [`deployment.md` §3.3](./deployment.md#33-fixes-cheapest-first).
- `state: "success"` but the site is unchanged → **the status is not proof.** Verify
  with the fingerprint procedure, [`deployment.md` §5](./deployment.md#5-proving-a-deploy-actually-shipped-the-code).

**Prove what is actually being served** — grep the **JS bundle**, not the HTML shell:

```bash
# Find the bundle the site is actually serving
curl -sS https://call-indigo.com/ | grep -o 'assets/index-[A-Za-z0-9_-]*\.js'
```

## 5. An image is missing or wrong

The marketing pages reference images at `/assets/images/…` from **two** places:
`public/assets/images/` on disk, and `url()` values inside `src/index.css`.

**Check both.** A rename that updates the disk but not the CSS (or the reverse) produces
a broken background with a green suite, because the class-coverage check validates the
class name, not the file it points at.

```bash
# Is the file actually in the build?
ls dist/assets/images/ | grep -i <name>
```

> ⚠️ **Some image slots are NATURAL-SIZE** — the file's own pixels *are* its rendered
> box. Read the slot's classes before swapping a file, or the page moves. And **never
> overwrite a photo another route renders.**

## 6. Roll back

**Vercel keeps every deployment.** The fastest rollback is to promote a previous
deployment from the Vercel dashboard — no commit, no build, seconds.

**By commit**, if the host's rollback is unavailable:

```bash
# Find the last known-good commit
git log --oneline -20

# Revert forward (never rewrite main's history)
git revert --no-commit <bad-sha>..HEAD
git commit -m "revert: roll back to <good-sha>"
git push origin main
```

> **Do not `git push --force` to `main`.** A revert is a new commit; a force-push
> rewrites shared history and will be refused by branch protection if it is enabled.

**Point of no return:** once a *new* commit is deployed on top of the bad one, the
Vercel "promote previous deployment" shortcut still works — deployments are immutable —
but the repository's history now contains the bad change, so a revert is required
rather than a rollback.

## 7. Tell people

| Who | What |
|---|---|
| **The client** | *"The site is [down / showing an old version]. We know, we're on it, expected back within [time]."* Do not explain the author gate. |
| **The team** | The commit status `description` and `target_url` — verbatim, not paraphrased. The URL names the fix. |

## 8. After

**Write it down.** Append to [`../50-sessions/devlog/`](../50-sessions/devlog/) and, if
the incident changed how we work, add the rule to
[`../20-development/patterns.md`](../20-development/patterns.md) with the incident as
the evidence.

**A runbook that is not updated after its first real use is a runbook that will be wrong
the second time.**
