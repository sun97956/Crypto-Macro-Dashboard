'use client'

import useSWR from 'swr'
import clsx from 'clsx'
import { fetchDerivatives } from '@/lib/fetchers'
import { formatFunding } from '@/lib/formatters'
import { KpiCardSkeleton } from './Skeleton'
import type { ApiResponse, DerivativesData } from '@/lib/types'

const UP = '#3FB950'
const DOWN = '#F85149'

export default function LongShortGauge() {
  const { data, error, isLoading } = useSWR<ApiResponse<DerivativesData>>(
    '/api/derivatives?days=30',
    fetchDerivatives
  )

  if (isLoading) return <KpiCardSkeleton />

  if (error || !data) {
    return (
      <div className="rounded-lg border border-border-card bg-bg-card p-4 flex items-center justify-center h-full">
        <p className="text-sm text-down">Failed to load</p>
      </div>
    )
  }

  // 取最近有多空比与资金费率的点
  const withRatio = data.data.filter((d) => d.longShortRatio != null)
  const latest = withRatio.at(-1)
  const ratio = latest?.longShortRatio ?? 0

  const withFunding = data.data.filter((d) => d.fundingRate != null)
  const funding = withFunding.at(-1)?.fundingRate ?? 0

  // ratio = 多头账户 / 空头账户 → 多头占比
  const longShare = ratio > 0 ? (ratio / (1 + ratio)) * 100 : 50
  const shortShare = 100 - longShare

  const fundingPositive = funding >= 0

  const ratioTone = ratio > 1.2 ? 'text-up' : ratio < 0.85 ? 'text-down' : 'text-text-primary'

  return (
    <div className="rounded-lg border border-border-card bg-bg-card p-4 flex flex-col gap-4 h-full">
      <h2 className="text-sm font-semibold text-text-primary">Positioning</h2>

      {/* 多空持仓比 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-text-muted uppercase tracking-wider">Long / Short Ratio</span>
          <span className={clsx('text-2xl font-mono font-semibold', ratioTone)}>
            {ratio.toFixed(2)}
          </span>
        </div>
        {/* 多空占比条 */}
        <div className="flex h-2.5 rounded-full overflow-hidden bg-bg-page">
          <div style={{ width: `${longShare}%`, backgroundColor: UP }} />
          <div style={{ width: `${shortShare}%`, backgroundColor: DOWN }} />
        </div>
        <div className="flex justify-between text-[10px] font-mono">
          <span style={{ color: UP }}>Long {longShare.toFixed(0)}%</span>
          <span style={{ color: DOWN }}>Short {shortShare.toFixed(0)}%</span>
        </div>
      </div>

      {/* 当前资金费率 */}
      <div className="flex items-baseline justify-between border-t border-border-card pt-3">
        <span className="text-xs text-text-muted uppercase tracking-wider">Funding (8h)</span>
        <span
          className="text-2xl font-mono font-semibold"
          style={{ color: fundingPositive ? UP : DOWN }}
        >
          {formatFunding(funding)}
        </span>
      </div>

      <p className="text-[11px] text-text-muted leading-relaxed">
        {ratio > 1.2
          ? 'Accounts skew long, bullish positioning'
          : ratio < 0.85
          ? 'Accounts skew short, bearish positioning'
          : 'Longs and shorts roughly balanced'}
        {' · '}
        {fundingPositive ? 'Longs pay shorts, trend leans long' : 'Shorts pay longs, trend leans short'}
      </p>
    </div>
  )
}
