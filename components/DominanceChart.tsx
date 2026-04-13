'use client'

import { useState } from 'react'
import useSWR from 'swr'
import clsx from 'clsx'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { fetchDominance } from '@/lib/fetchers'
import { ChartSkeleton } from './Skeleton'
import type { ApiResponse, DominanceData } from '@/lib/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg-card border border-border-card rounded px-3 py-2 text-xs">
      <p className="text-text-muted mb-1">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <p key={p.name} className="font-mono" style={{ color: p.color }}>
          {p.name === 'btcDominance' ? 'BTC' : 'ETH'}: {p.value?.toFixed(2)}%
        </p>
      ))}
    </div>
  )
}

const PERIODS = [
  { label: '30D', value: '30' },
  { label: '90D', value: '90' },
  { label: '365D', value: '365' },
]

export default function DominanceChart() {
  const [days, setDays] = useState('90')

  const { data, error, isLoading } = useSWR<ApiResponse<DominanceData>>(
    `/api/crypto/dominance?days=${days}`,
    fetchDominance
  )

  if (isLoading) return <ChartSkeleton height={300} />

  if (error || !data) {
    return (
      <div className="rounded-lg border border-border-card bg-bg-card p-4 h-[300px] flex items-center justify-center">
        <p className="text-sm text-down">Failed to load dominance data</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border-card bg-bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-primary">BTC / ETH Dominance</h2>
        <div className="flex gap-1">
          {PERIODS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setDays(value)}
              className={clsx(
                'px-2.5 py-1 text-xs rounded font-mono transition-colors',
                days === value
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
        <LineChart data={data.data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6E7681', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v.slice(5)}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fill: '#6E7681', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
            width={44}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
            formatter={(value) => (
              <span style={{ color: value === 'btcDominance' ? '#58A6FF' : '#D2A8FF' }}>
                {value === 'btcDominance' ? 'BTC Dominance' : 'ETH Dominance'}
              </span>
            )}
          />
          <Line
            type="monotone"
            dataKey="btcDominance"
            stroke="#58A6FF"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="ethDominance"
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
