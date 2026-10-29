/** Clerk's hosted sign-in flow, displayed in place of the requested admin page. */
import { SignIn } from "@clerk/react"

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-muted/40 p-6">
      <div className="w-full max-w-md space-y-5">
        <SignIn routing="hash" fallbackRedirectUrl="/admin/inquiries" />
      </div>
    </main>
  )
}
