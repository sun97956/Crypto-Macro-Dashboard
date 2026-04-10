import clsx from 'clsx'
import { KpiCardSkeleton } from './Skeleton'

interface KpiCardProps {
  title: string
  value: string
  change?: number
  changeLabel?: string
  subLabel?: string       // 纯文字副标签（不带百分比，如恐贪分类）
  accent?: 'blue' | 'purple' | 'yellow'
  loading?: boolean
  error?: boolean
}

export default function KpiCard({
  title,
  value,
  change,
  changeLabel = '24h',
  subLabel,
  accent = 'blue',
  loading,
  error,
}: KpiCardProps) {
  if (loading) return <KpiCardSkeleton />

  if (error) {
    return (
      <div className="rounded-lg border border-border-card bg-bg-card p-4 flex flex-col gap-1">
        <p className="text-xs text-text-muted uppercase tracking-wider">{title}</p>
        <p className="text-sm text-down">Failed to load</p>
      </div>
    )
  }

  const accentClass = {
    blue: 'text-blue',
    purple: 'text-purple',
    yellow: 'text-warning',
  }[accent]

  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0

  return (
    <div className="rounded-lg border border-border-card bg-bg-card p-4 flex flex-col gap-1">
      <p className="text-xs text-text-muted uppercase tracking-wider">{title}</p>

      <p className={clsx('text-3xl font-mono font-semibold', accentClass)}>
        {value}
      </p>

      {change !== undefined && (
        <p
          className={clsx('text-xs font-mono flex items-center gap-1', {
            'text-up': isPositive,
            'text-down': isNegative,
            'text-text-muted': !isPositive && !isNegative,
          })}
        >
          <span>{isPositive ? '▲' : isNegative ? '▼' : '●'}</span>
          <span>{Math.abs(change).toFixed(2)}% {changeLabel}</span>
        </p>
      )}

      {subLabel && (
        <p className="text-xs text-text-muted truncate">{subLabel}</p>
      )}
    </div>
  )
}
