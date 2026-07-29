'use client'

import { signOut } from 'next-auth/react'

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono border border-border-card text-text-muted hover:border-down hover:text-down transition-colors cursor-pointer"
    >
      Sign out
    </button>
  )
}
