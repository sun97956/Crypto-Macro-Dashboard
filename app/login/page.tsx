import { signIn } from '@/auth'

export default function LoginPage() {
  const hasGitHub = !!process.env.AUTH_GITHUB_ID
  const hasGoogle = !!process.env.AUTH_GOOGLE_ID

  return (
    <main className="min-h-screen bg-bg-page text-text-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-border-card bg-bg-card p-8">
        <h1 className="text-xl font-semibold tracking-wide">Macro Dashboard</h1>
        <p className="text-xs text-text-muted mt-1 mb-6">
          Crypto &amp; Macroeconomic Overview — sign in to continue
        </p>

        <div className="flex flex-col gap-3">
          {hasGitHub && (
            <form
              action={async () => {
                'use server'
                await signIn('github', { redirectTo: '/' })
              }}
            >
              <button
                type="submit"
                className="w-full rounded border border-border-card bg-bg-row px-4 py-2.5 text-sm font-medium hover:border-blue hover:text-blue transition-colors"
              >
                Sign in with GitHub
              </button>
            </form>
          )}

          {hasGoogle && (
            <form
              action={async () => {
                'use server'
                await signIn('google', { redirectTo: '/' })
              }}
            >
              <button
                type="submit"
                className="w-full rounded border border-border-card bg-bg-row px-4 py-2.5 text-sm font-medium hover:border-blue hover:text-blue transition-colors"
              >
                Sign in with Google
              </button>
            </form>
          )}

          {!hasGitHub && !hasGoogle && (
            <p className="text-sm text-down">
              No login provider configured. Set AUTH_GITHUB_ID / AUTH_GOOGLE_ID.
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
