'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { fetchCryptoChart } from '@/lib/fetchers'
import { formatPrice } from '@/lib/formatters'
import { ChartSkeleton } from './Skeleton'
import clsx from 'clsx'
import type { ApiResponse, CryptoChartData } from '@/lib/types'

const PERIODS = [
  { label: '7D', value: '7' },
  { label: '30D', value: '30' },
  { label: '90D', value: '90' },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-bg-card border border-border-card rounded px-3 py-2 text-xs">
      <p className="text-text-muted">{d.date}</p>
      <p className="font-mono font-semibold text-blue mt-0.5">{formatPrice(d.price)}</p>
    </div>
  )
}

export default function PriceChart() {
  const [days, setDays] = useState('30')

  const { data, error, isLoading } = useSWR<ApiResponse<CryptoChartData>>(
    `/api/crypto/chart?days=${days}`,
    fetchCryptoChart
  )

  return (
    <div className="rounded-lg border border-border-card bg-bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-primary">BTC Price</h2>
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

      {isLoading && <ChartSkeleton height={280} />}

      {(error || (!isLoading && !data)) && (
        <div className="h-[280px] flex items-center justify-center">
          <p className="text-sm text-down">Failed to load chart data</p>
        </div>
      )}

      {data && !isLoading && (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data.data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="btcGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#58A6FF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#58A6FF" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              tick={{ fill: '#6E7681', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              domain={['auto', 'auto']}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#58A6FF"
              strokeWidth={2}
              fill="url(#btcGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#58A6FF' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
