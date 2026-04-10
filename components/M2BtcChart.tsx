'use client'

import useSWR from 'swr'
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { fetchM2Btc } from '@/lib/fetchers'
import { formatPrice, formatM2 } from '@/lib/formatters'
import { ChartSkeleton } from './Skeleton'
import type { ApiResponse, M2BtcData } from '@/lib/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg-card border border-border-card rounded px-3 py-2 text-xs">
      <p className="text-text-muted mb-1">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <p key={p.name} className="font-mono" style={{ color: p.color }}>
          {p.name === 'btc'
            ? `BTC: ${formatPrice(p.value)}`
            : `M2: ${formatM2(p.value)}`}
        </p>
      ))}
    </div>
  )
}

export default function M2BtcChart() {
  const { data, error, isLoading } = useSWR<ApiResponse<M2BtcData>>(
    '/api/crypto/m2btc',
    fetchM2Btc
  )

  if (isLoading) return <ChartSkeleton height={300} />

  if (error || !data) {
    return (
      <div className="rounded-lg border border-border-card bg-bg-card p-4 h-[300px] flex items-center justify-center">
        <p className="text-sm text-down">Failed to load M2 vs BTC data</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border-card bg-bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-primary">M2 Money Supply vs BTC</h2>
        <span className="text-xs text-text-muted">2020 — Present (Monthly)</span>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data.data} margin={{ top: 4, right: 48, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
          <XAxis
            dataKey="month"
            tick={{ fill: '#6E7681', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v.slice(0, 7)}
            interval={5}
          />
          {/* 左轴：M2（十亿美元） */}
          <YAxis
            yAxisId="m2"
            orientation="left"
            tick={{ fill: '#D2A8FF', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}T`}
            width={44}
          />
          {/* 右轴：BTC 价格 */}
          <YAxis
            yAxisId="btc"
            orientation="right"
            tick={{ fill: '#58A6FF', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            width={44}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
            formatter={(value) => (
              <span style={{ color: value === 'btc' ? '#58A6FF' : '#D2A8FF' }}>
                {value === 'btc' ? 'BTC Price' : 'M2 Supply'}
              </span>
            )}
          />
          <Line
            yAxisId="m2"
            type="monotone"
            dataKey="m2"
            stroke="#D2A8FF"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
          />
          <Line
            yAxisId="btc"
            type="monotone"
            dataKey="btc"
            stroke="#58A6FF"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
