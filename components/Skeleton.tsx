import clsx from 'clsx'

interface SkeletonProps {
  className?: string
}

export default function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse rounded bg-bg-row',
        className
      )}
    />
  )
}

// 预置几个常用尺寸，方便各组件直接复用
export function KpiCardSkeleton() {
  return (
    <div className="rounded-lg border border-border-card bg-bg-card p-4 flex flex-col gap-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-16" />
    </div>
  )
}

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div
      className="rounded-lg border border-border-card bg-bg-card p-4 flex items-center justify-center"
      style={{ height }}
    >
      <div className="w-full h-full animate-pulse rounded bg-bg-row" />
    </div>
  )
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-border-card bg-bg-card overflow-hidden">
      <div className="p-4 border-b border-border-card">
        <Skeleton className="h-4 w-32" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border-card last:border-0">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-24 ml-auto" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  )
}
