'use client'

import { useState } from 'react'
import useSWR from 'swr'
import clsx from 'clsx'
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { fetchLiquidity } from '@/lib/fetchers'
import { ChartSkeleton } from './Skeleton'
import type { ApiResponse, LiquidityData } from '@/lib/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg-card border border-border-card rounded px-3 py-2 text-xs">
      <p className="text-text-muted mb-1">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <p key={p.name} className="font-mono" style={{ color: p.color }}>
          {p.name === 'stablecoin' ? 'Stablecoin' : 'DeFi TVL'}: ${p.value?.toFixed(1)}B
        </p>
      ))}
    </div>
  )
}

const PERIODS = [
  { label: '90D', value: '90' },
  { label: '180D', value: '180' },
  { label: '365D', value: '365' },
]

export default function LiquidityChart() {
  const [days, setDays] = useState('180')

  const { data, error, isLoading } = useSWR<ApiResponse<LiquidityData>>(
    `/api/liquidity?days=${days}`,
    fetchLiquidity
  )

  if (isLoading) return <ChartSkeleton height={300} />

  if (error || !data) {
    return (
      <div className="rounded-lg border border-border-card bg-bg-card p-4 h-[300px] flex items-center justify-center">
        <p className="text-sm text-down">Failed to load liquidity data</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border-card bg-bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-primary">Stablecoin Supply vs DeFi TVL</h2>
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
        <ComposedChart data={data.data} margin={{ top: 4, right: 48, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6E7681', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v.slice(5)}
            interval="preserveStartEnd"
          />
          {/* Left axis: Stablecoin supply (billions) */}
          <YAxis
            yAxisId="stable"
            orientation="left"
            tick={{ fill: '#3FB950', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v.toFixed(0)}B`}
            width={52}
          />
          {/* Right axis: DeFi TVL (billions) */}
          <YAxis
            yAxisId="tvl"
            orientation="right"
            tick={{ fill: '#E3B341', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v.toFixed(0)}B`}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
            formatter={(value) => (
              <span style={{ color: value === 'stablecoin' ? '#3FB950' : '#E3B341' }}>
                {value === 'stablecoin' ? 'Stablecoin Supply' : 'DeFi TVL'}
              </span>
            )}
          />
          <Line
            yAxisId="stable"
            type="monotone"
            dataKey="stablecoin"
            stroke="#3FB950"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
          />
          <Line
            yAxisId="tvl"
            type="monotone"
            dataKey="tvl"
            stroke="#E3B341"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
