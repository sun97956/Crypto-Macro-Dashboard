'use client'

import { useState } from 'react'
import { useSWRConfig } from 'swr'
import { formatUpdatedAt } from '@/lib/formatters'
import clsx from 'clsx'

interface HeaderProps {
  lastUpdated: Date | null
  onRefreshComplete: (date: Date) => void
}

export default function Header({ lastUpdated, onRefreshComplete }: HeaderProps) {
  const { mutate } = useSWRConfig()
  const [loading, setLoading] = useState(false)

  const handleRefresh = async () => {
    setLoading(true)
    try {
      await mutate((key) => typeof key === 'string' && key.startsWith('/api/'))
      onRefreshComplete(new Date())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary tracking-wide">
          Macro Dashboard
        </h1>
        <p className="text-xs text-text-muted mt-0.5">
          Crypto & Macroeconomic Overview
        </p>
      </div>

      <div className="flex items-center gap-4">
        {lastUpdated && (
          <span className="text-xs text-text-muted font-mono">
            Last updated: {formatUpdatedAt(lastUpdated.toISOString())}
          </span>
        )}

        <button
          onClick={handleRefresh}
          disabled={loading}
          className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono border transition-colors',
            loading
              ? 'border-border-card text-text-muted cursor-not-allowed'
              : 'border-blue text-blue hover:bg-blue hover:text-bg-page cursor-pointer'
          )}
        >
          <span
            className={clsx('inline-block', loading && 'animate-spin')}
          >
            ↻
          </span>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </div>
  )
}
