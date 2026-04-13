'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { fetchSentiment } from '@/lib/fetchers'
import { ChartSkeleton } from './Skeleton'
import clsx from 'clsx'
import type { ApiResponse, SentimentData, FearGreedClassification } from '@/lib/types'

const COLOR_MAP: Record<FearGreedClassification, string> = {
  'Extreme Fear': '#F85149',
  'Fear': '#E3B341',
  'Neutral': '#8B949E',
  'Greed': '#3FB950',
  'Extreme Greed': '#26a641',
}

function getLineColor(data: SentimentData): string {
  if (!data.length) return '#8B949E'
  const latest = data[data.length - 1]
  return COLOR_MAP[latest.classification]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-bg-card border border-border-card rounded px-3 py-2 text-xs">
      <p className="text-text-muted">{d.date}</p>
      <p className="font-mono font-semibold text-text-primary mt-0.5">
        {d.value}{' '}
        <span style={{ color: COLOR_MAP[d.classification as FearGreedClassification] }}>
          {d.classification}
        </span>
      </p>
    </div>
  )
}

const PERIODS = [
  { label: '30D', value: '30' },
  { label: '90D', value: '90' },
  { label: '365D', value: '365' },
]

export default function FearGreedChart() {
  const [limit, setLimit] = useState('30')

  const { data, error, isLoading } = useSWR<ApiResponse<SentimentData>>(
    `/api/sentiment?limit=${limit}`,
    fetchSentiment
  )

  if (isLoading) return <ChartSkeleton height={300} />

  if (error || !data) {
    return (
      <div className="rounded-lg border border-border-card bg-bg-card p-4 h-[300px] flex items-center justify-center">
        <p className="text-sm text-down">Failed to load sentiment data</p>
      </div>
    )
  }

  const latest = data.data[data.data.length - 1]
  const lineColor = getLineColor(data.data)

  return (
    <div className="rounded-lg border border-border-card bg-bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-text-primary">Fear & Greed Index</h2>
          {latest && (
            <span
              className="text-sm font-mono font-semibold"
              style={{ color: lineColor }}
            >
              {latest.value} — {latest.classification}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {PERIODS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setLimit(value)}
              className={clsx(
                'px-2.5 py-1 text-xs rounded font-mono transition-colors',
                limit === value
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
        <LineChart data={data.data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6E7681', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v.slice(5)} // "MM-DD"
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#6E7681', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={25} stroke="#F85149" strokeDasharray="4 4" strokeOpacity={0.5} />
          <ReferenceLine y={50} stroke="#8B949E" strokeDasharray="4 4" strokeOpacity={0.5} />
          <ReferenceLine y={75} stroke="#3FB950" strokeDasharray="4 4" strokeOpacity={0.5} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: lineColor }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex gap-4 mt-2 justify-center">
        {(['Extreme Fear', 'Fear', 'Neutral', 'Greed', 'Extreme Greed'] as FearGreedClassification[]).map((label) => (
          <span key={label} className="flex items-center gap-1 text-xs text-text-muted">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: COLOR_MAP[label] }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
