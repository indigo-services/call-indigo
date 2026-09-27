# Deployment

**Kind:** dated · **Owner:** the repo · **Last verified:** 2026-09-27 at `2f009a2`

---

## 1. What is configured

**One file, one rule** [M: `vercel.json`]:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**That rewrite is load-bearing.** This is a client-rendered SPA: the server has one
HTML file, and every route (`/residential`, `/admin/inquiries`, …) is resolved in the
browser. Without the catch-all, a deep link or a refresh on any route other than `/`
returns a 404 from the host. It shipped in `eadaf31`.

| Setting | Value | Where |
|---|---|---|
| Build command | `npm run build` (`tsc -b && vite build`) | `package.json` |
| Output | `dist/` | Vite default |
| Node | `^20.19.0 \|\| >=22.12.0` | `package.json` `engines`, `.nvmrc` |

## 2. Hostnames

| Hostname | Behaviour |
|---|---|
| `call-indigo.com` | **Production.** Serves this codebase. |
| `call-indigo.vercel.app` | **307-redirects** to `call-indigo.com` |

> ⚠️ **Confirm which hostname actually serves the project before declaring a deploy
> live.** A custom domain can belong to a *different* Vercel project. Check for a
> different framework's fingerprints — `/_next/static/` means Next.js, not this build.

## 3. The author gate

**The rule: when a push succeeds but nothing deploys, the gate is usually *who*
authored the commit, not what is in it. The token used to push is almost never the
lever.**

From Vercel's own documentation, verbatim:

> *"The Hobby Plan does not support collaboration for private repositories. If you need
> collaboration, upgrade to the Pro Plan."*
>
> *"To deploy commits under a Hobby team, the commit author must be the **owner of the
> Hobby team** containing the Vercel project connected to the Git repository. This is
> verified by comparing the Login Connections Hobby team's owner with the commit
> author."*

So on **Hobby + private**, only the team owner's commits deploy. Everyone else is
blocked, no matter which credential they push with.

### 3.1 Read the status before theorising

The commit status API carries the provider's own diagnosis, including a `target_url`
that usually names the fix. `gh` is often **not** logged in even when `git` works —
they use different credential stores. Recover the token `git` already has:

```bash
TOKEN=$(printf 'protocol=https\nhost=github.com\n\n' | git credential fill 2>/dev/null | sed -n 's/^password=//p')

curl -s -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/indigo-services/call-indigo/commits/$SHA/status"
```

Read **all** of `state`, each `statuses[].context`, `.description`, and especially
**`.target_url`**.

**Compare several commits.** The discriminating signal is a *difference* between
commits — tabulate `author` against `state` for the last 6–8.

### 3.2 The error names the symptom; `target_url` names the party

`"Git author <login> must have access to the project on Vercel to create deployments."`
reads like *"fix the author email"* — and that reading is wrong often enough to be
dangerous. In the worked case the **same author email** deployed successfully on an
older commit, so the email alone could not be the rule.

The `target_url` is the answer — a team-invite link:

```
vercel.com/teams/invite?gitUserLogin=<OUTSIDER>&teamId=<TEAM_ID>&teamName=<TEAM>&…
```

Extract `gitUserLogin` and `teamName`. That identifies both the blocked party and the
team whose ownership is required. `gitUserId` disambiguates from the commit's
`user.name`, which is free text and frequently differs from the GitHub login.

### 3.3 Fixes, cheapest first

| # | Fix | Cost | Note |
|---|---|---|---|
| 1 | **Re-author the commit as the team owner** | Free, immediate | Identify the owner empirically: it is the author of the commit that *did* deploy |
| 2 | **Make the repository public** | Free | *"Collaboration is free for public repositories."* Exposes source |
| 3 | **Upgrade the Vercel team to Pro**, then invite the blocked user | Paid | |

**Fix 1, in full:**

```bash
# 1. Record the old SHA and PROVE the tree is unchanged (empty output = only authorship moved)
git diff <old-sha> HEAD --stat

# 2. Set BOTH author and committer
GIT_COMMITTER_NAME="Owner Name" GIT_COMMITTER_EMAIL="owner@example.com" \
  git commit --amend --no-edit --author="Owner Name <owner@example.com>"

# 3. --force-with-lease, never --force: it aborts if the remote moved
git push --force-with-lease=<branch>:<expected-old-sha> origin <branch>
```

**Durable form.** Amending fixes one commit. To stop it recurring, set the repo-local
identity — `git config user.name … && git config user.email …` — and accept that every
future commit appears under that identity. That is a convention change, and it should
be agreed rather than assumed.

> **A GitHub PAT does not help. A GitHub plan upgrade does not help.** The plan that
> gates this is **Vercel's**. This is the most common wrong assumption and it costs
> money.

### 3.4 This repository's position

The commit author on `main` is **`Indigo Services <indigobuildops@gmail.com>`**
[M: `git log -3 --format='%an <%ae>'`].

**The repository was made public on 2026-09-27.** Per fix 2 above, making a repository
public makes collaboration free on Vercel, which is the constraint the author gate
enforces. **Whether the gate is therefore lifted for this project is [P] and
unverified** — it depends on the Vercel project's plan and connection, neither of which
this pass read. See §6.

## 4. How a release is recorded

The repository's convention is **prose in `CHANGELOG.md`**, not an automated deploy
log. Each entry records what shipped and cites the commit SHAs.

**That is a gap, not a design.** An automated deploy log — provider, URL, SHA, time,
result — is Phase 5 of the documentation plan
([`../40-project/prd/phase-5-observability-and-automation.md`](../40-project/prd/phase-5-observability-and-automation.md)).

## 5. Proving a deploy actually shipped the code

> **A `success` status is not proof the change is live.**

1. **Bundle sizes are a strong fingerprint.** A production `index-<hash>.js` byte count
   should equal the locally measured one **exactly**.
2. **For an SPA, the served HTML is only a shell.** Grep the **JS bundle**, not the
   HTML, for content markers.
3. **Minification renames identifiers.** Search for **string literals and class names**
   — a hex colour, a custom class, a copy string — never a function name.
4. **Confirm the hostname.** See §2.

### 5.1 Two pitfalls that produce a false "clean"

- ⚠️ **Do not use one asset's value as the fingerprint for a whole family.** Grep the
  family: a sibling asset may carry a different but equally superseded value, so a
  single-value probe reads as clean while the old branding is still served.
- ⚠️ **`curl -o /dev/null -w '%{size_download}'` silently reports `0` on Git Bash /
  Windows** while still printing `http=200` — which reads exactly like an empty
  response, and can exit 23 and break an `&&` chain. **When a byte count is evidence,
  fetch to a real file and `stat -c%s` it.**

## 6. What is not verified

**Read this before assuming a push deploys.** None of the following was confirmed by
this pass:

| Unverified | Why it matters | How to check |
|---|---|---|
| **Whether the Vercel project is connected to this GitHub remote, or deploys from a CLI.** | `vercel.json` proves the *configuration*, not the *trigger*. | Read the Vercel project's Git connection. |
| **Whether the author gate still applies** after the repo went public (§3.4). | It determines whether a non-owner's commit deploys. | Push a commit from a non-owner identity and read the commit status (§3.1). |
| **Whether `main` is branch-protected on the remote.** | CI blocks a merge only if the branch requires it. | `gh api repos/indigo-services/call-indigo/branches/main/protection` |
| **The Vercel plan and team owner.** | It is the input to the whole author-gate rule. | The Vercel project settings. |

---

**Last verified:** 2026-09-27 at `2f009a2`
