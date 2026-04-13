'use client'

import useSWR from 'swr'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { fetchMacroFred } from '@/lib/fetchers'
import { ChartSkeleton } from './Skeleton'
import clsx from 'clsx'
import { useState, useMemo } from 'react'
import type { ApiResponse, MacroFredData, StockPoint } from '@/lib/types'

const PERIODS = [
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg-card border border-border-card rounded px-3 py-2 text-xs">
      <p className="text-text-muted mb-1">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <p key={p.name} className="font-mono" style={{ color: p.color }}>
          {p.name}: {p.value?.toLocaleString('en-US', { maximumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  )
}

export default function StockChart() {
  const [period, setPeriod] = useState(2) // default 1Y

  const { data, error, isLoading } = useSWR<ApiResponse<MacroFredData>>(
    '/api/macro/fred',
    fetchMacroFred
  )

  const chartData = useMemo<StockPoint[]>(() => {
    if (!data) return []
    const days = PERIODS[period].days
    const cutoff = Date.now() - days * 86400 * 1000
    const sp500 = data.data.SP500.filter((p) => new Date(p.date).getTime() >= cutoff)
    const nasdaq = data.data.NASDAQ100.filter((p) => new Date(p.date).getTime() >= cutoff)

    // 以 SP500 日期为基准，merge nasdaq
    const nasdaqMap = new Map(nasdaq.map((p) => [p.date, p.value]))
    return sp500.map((p) => ({
      date: p.date,
      sp500: p.value,
      nasdaq: nasdaqMap.get(p.date) ?? null,
    }))
  }, [data, period])

  if (isLoading) return <ChartSkeleton height={300} />

  if (error || !data) {
    return (
      <div className="rounded-lg border border-border-card bg-bg-card p-4 h-[300px] flex items-center justify-center">
        <p className="text-sm text-down">Failed to load stock data</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border-card bg-bg-card p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-primary">S&P 500 / NASDAQ 100</h2>
        <div className="flex gap-1">
          {PERIODS.map(({ label }, i) => (
            <button
              key={label}
              onClick={() => setPeriod(i)}
              className={clsx(
                'px-2.5 py-1 text-xs rounded font-mono transition-colors',
                period === i
                  ? 'bg-blue text-bg-page'
                  : 'text-text-muted border border-border-card hover:border-blue hover:text-blue'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 4, right: 48, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6E7681', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => {
              const d = new Date(v)
              return `${d.getMonth() + 1}/${d.getDate()}`
            }}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="sp"
            orientation="left"
            tick={{ fill: '#58A6FF', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            width={52}
          />
          <YAxis
            yAxisId="nq"
            orientation="right"
            tick={{ fill: '#D2A8FF', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
            formatter={(value) => (
              <span style={{ color: value === 'sp500' ? '#58A6FF' : '#D2A8FF' }}>
                {value === 'sp500' ? 'S&P 500' : 'NASDAQ 100'}
              </span>
            )}
          />
          <Line
            yAxisId="sp"
            type="monotone"
            dataKey="sp500"
            stroke="#58A6FF"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
          />
          <Line
            yAxisId="nq"
            type="monotone"
            dataKey="nasdaq"
            stroke="#D2A8FF"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
