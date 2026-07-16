'use client'

import useSWR from 'swr'
import { fetchMacroFred } from '@/lib/fetchers'
import { KpiCardSkeleton } from './Skeleton'
import type { ApiResponse, MacroFredData } from '@/lib/types'

// 单值卡:利率类用原值,CPI/PPI 为同比 %
const SERIES_CARDS = [
  { key: 'FEDFUNDS' as const, label: 'Fed Funds Rate', unit: '%', yoy: false },
  { key: 'DGS10' as const, label: '10Y Treasury', unit: '%', yoy: false },
  { key: 'CPI' as const, label: 'CPI (YoY)', unit: '%', yoy: true },
  { key: 'PPI' as const, label: 'PPI (YoY)', unit: '%', yoy: true },
]

function fmt(v: string, yoy: boolean): string {
  const n = parseFloat(v)
  return yoy ? n.toFixed(1) : n.toString()
}

export default function MacroCards() {
  const { data, error, isLoading } = useSWR<ApiResponse<MacroFredData>>(
    '/api/macro/fred',
    fetchMacroFred
  )

  // DXY:取最新值 + 近 ~30 交易日变化(真实 ICE 美元指数)
  const dxy = data?.data.DXY ?? []
  const dxyLatest = dxy.at(-1)
  const dxyPrev = dxy.length > 22 ? dxy[dxy.length - 23] : dxy[0]
  const dxyChange = dxyLatest && dxyPrev ? dxyLatest.value - dxyPrev.value : 0

  return (
    <div className="rounded-lg border border-border-card bg-bg-card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-primary">Macro Indicators</h2>
        <span className="text-xs text-text-muted border border-border-card rounded px-1.5 py-0.5">
          FRED · Yahoo
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1">
        {SERIES_CARDS.map(({ key, label, unit, yoy }) => {
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
                {fmt(series.value, yoy)}{unit}
              </p>
              <p className="text-xs text-text-muted mt-0.5">{series.date}</p>
            </div>
          )
        })}

        {/* DXY 美元指数(真实 ICE,跨整行) */}
        {isLoading ? (
          <div className="col-span-2"><KpiCardSkeleton /></div>
        ) : error || !dxyLatest ? (
          <div className="col-span-2 rounded border border-border-card bg-bg-row p-3">
            <p className="text-xs text-text-muted">Dollar Index (DXY)</p>
            <p className="text-sm text-down mt-1">—</p>
          </div>
        ) : (
          <div className="col-span-2 rounded border border-border-card bg-bg-row p-3">
            <p className="text-xs text-purple uppercase tracking-wider">Dollar Index (DXY)</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-xl font-mono font-semibold text-text-primary">
                {dxyLatest.value.toFixed(2)}
              </p>
              <span
                className={
                  'text-xs font-mono ' + (dxyChange > 0 ? 'text-up' : dxyChange < 0 ? 'text-down' : 'text-text-muted')
                }
              >
                {dxyChange > 0 ? '▲' : dxyChange < 0 ? '▼' : ''}
                {Math.abs(dxyChange).toFixed(2)} · 30d
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">{dxyLatest.date}</p>
          </div>
        )}
      </div>
    </div>
  )
}
