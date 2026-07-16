'use client'

import { useState } from 'react'
import useSWR from 'swr'
import clsx from 'clsx'
import {
  ComposedChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { fetchEtfFlow } from '@/lib/fetchers'
import { formatFlow } from '@/lib/formatters'
import { ChartSkeleton } from './Skeleton'
import type { ApiResponse, EtfFlowData } from '@/lib/types'

const UP = '#3FB950'
const DOWN = '#F85149'
const LINE = '#58A6FF'

interface Props {
  asset: 'btc' | 'eth'
}

const PERIODS = [
  { label: '30D', value: '30' },
  { label: '90D', value: '90' },
  { label: '180D', value: '180' },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeTooltip(flowKey: string, cumKey: string, label: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function CustomTooltip({ active, payload, label: date }: any) {
    if (!active || !payload?.length) return null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flow = payload.find((p: any) => p.dataKey === flowKey)?.value
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cum = payload.find((p: any) => p.dataKey === cumKey)?.value
    return (
      <div className="bg-bg-card border border-border-card rounded px-3 py-2 text-xs">
        <p className="text-text-muted mb-1">{date}</p>
        <p className="font-mono" style={{ color: flow >= 0 ? UP : DOWN }}>
          {label} 净流入: {formatFlow(flow)}
        </p>
        <p className="font-mono" style={{ color: LINE }}>
          累计: ${cum?.toFixed(1)}B
        </p>
      </div>
    )
  }
}

export default function EtfFlowChart({ asset }: Props) {
  const [days, setDays] = useState('90')

  const { data, error, isLoading } = useSWR<ApiResponse<EtfFlowData>>(
    `/api/etf?days=${days}`,
    fetchEtfFlow
  )

  const title = asset === 'btc' ? 'BTC Spot ETF Flows' : 'ETH Spot ETF Flows'
  const flowKey = asset === 'btc' ? 'btcFlow' : 'ethFlow'
  const cumKey = asset === 'btc' ? 'btcCumulative' : 'ethCumulative'
  const assetLabel = asset === 'btc' ? 'BTC' : 'ETH'

  if (isLoading) return <ChartSkeleton height={300} />

  if (error || !data) {
    return (
      <div className="rounded-lg border border-border-card bg-bg-card p-4 h-[300px] flex items-center justify-center">
        <p className="text-sm text-down">Failed to load ETF flow data</p>
      </div>
    )
  }

  const Tip = makeTooltip(flowKey, cumKey, assetLabel)

  return (
    <div className="rounded-lg border border-border-card bg-bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
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
        <ComposedChart data={data.data} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6E7681', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v.slice(5)}
            interval="preserveStartEnd"
          />
          {/* 左轴:每日净流入(百万) */}
          <YAxis
            yAxisId="flow"
            orientation="left"
            tick={{ fill: '#6E7681', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}M`}
            width={44}
          />
          {/* 右轴:累计净流入(十亿) */}
          <YAxis
            yAxisId="cum"
            orientation="right"
            tick={{ fill: LINE, fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v.toFixed(0)}B`}
            width={44}
          />
          <Tooltip content={<Tip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
            formatter={(value) => (
              <span className="text-text-muted">
                {value === flowKey ? '每日净流入' : '累计净流入'}
              </span>
            )}
          />
          <ReferenceLine yAxisId="flow" y={0} stroke="#30363D" />
          <Bar yAxisId="flow" dataKey={flowKey} fill={UP} isAnimationActive={false}>
            {data.data.map((d, i) => (
              <Cell key={i} fill={(d[flowKey as keyof typeof d] as number) >= 0 ? UP : DOWN} />
            ))}
          </Bar>
          <Line
            yAxisId="cum"
            type="monotone"
            dataKey={cumKey}
            stroke={LINE}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
