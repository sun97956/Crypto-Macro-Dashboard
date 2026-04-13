'use client'

import useSWR from 'swr'
import { fetchMacroFred } from '@/lib/fetchers'
import { KpiCardSkeleton } from './Skeleton'
import type { ApiResponse, MacroFredData } from '@/lib/types'

const CARDS = [
  { key: 'FEDFUNDS' as const, label: 'Fed Funds Rate', unit: '%' },
  { key: 'DGS10' as const, label: '10Y Treasury', unit: '%' },
]

export default function MacroCards() {
  const { data, error, isLoading } = useSWR<ApiResponse<MacroFredData>>(
    '/api/macro/fred',
    fetchMacroFred
  )

  return (
    <div className="rounded-lg border border-border-card bg-bg-card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-primary">Macro Indicators</h2>
        <span className="text-xs text-text-muted border border-border-card rounded px-1.5 py-0.5">
          Source: FRED
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1">
        {CARDS.map(({ key, label, unit }) => {
          if (isLoading) return <KpiCardSkeleton key={key} />
          if (error || !data) {
            return (
              <div key={key} className="rounded border border-border-card bg-bg-row p-3">
                <p className="text-xs text-text-muted">{label}</p>
                <p className="text-sm text-down mt-1">—</p>
              </div>
            )
          }
          const series = data.data[key]
          return (
            <div key={key} className="rounded border border-border-card bg-bg-row p-3">
              <p className="text-xs text-purple uppercase tracking-wider">{label}</p>
              <p className="text-xl font-mono font-semibold text-text-primary mt-1">
                {series.value}{unit}
              </p>
              <p className="text-xs text-text-muted mt-0.5">{series.date}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
