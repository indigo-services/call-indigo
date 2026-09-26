/**
 * The sign-in page — rendered by `RequireAuth` in place of the dashboard.
 *
 * It deliberately renders at the *requested* URL rather than redirecting to an
 * `/admin/login` route. A redirect needs a `?next=` parameter to come back, and
 * that parameter is a small open-redirect surface for no benefit here; the guard
 * simply shows this instead of its children and the URL never moves.
 *
 * WHAT THE COPY IS ALLOWED TO SAY. It must not imply this is real access
 * control, and it must not hint at which half of the credential was wrong. The
 * prototype note is there because the alternative — a login form that looks like
 * a bank's — is the thing that gets a prototype pointed at real data by mistake.
 */
import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn } from "@/admin/auth"

const WRONG = "That username and password do not match."
const NO_STORAGE =
  "This browser would not let the page store a session, so signing in cannot work here. A normal (non-private) window should."

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setError(null)
    setBusy(true)
    // `signIn` never throws — every failure comes back as a reason — so there is
    // no try/finally here. If that ever changes, the busy flag must be cleared
    // on the way out or the button sticks disabled.
    const result = await signIn(username, password)
    if (result.ok) return
    setError(result.reason === "unavailable" ? NO_STORAGE : WRONG)
    setBusy(false)
  }

  return (
    <div className="grid min-h-screen place-items-center bg-muted/40 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Admin sign-in</CardTitle>
          <CardDescription>
            Call Indigo dashboard. This is a prototype gate — not real access control.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-describedby={error ? "signin-error" : undefined}
              />
            </div>

            {error ? (
              <p id="signin-error" role="alert" className="text-sm font-medium text-destructive">
                {error}
              </p>
            ) : null}

            <Button type="submit" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
