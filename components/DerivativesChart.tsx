'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import clsx from 'clsx'
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { fetchDerivatives } from '@/lib/fetchers'
import { formatOI, formatFunding } from '@/lib/formatters'
import { ChartSkeleton } from './Skeleton'
import type { ApiResponse, DerivativesData } from '@/lib/types'

const FUNDING = '#E3B341'
const OI = '#58A6FF'

const PERIODS = [
  { label: '30D', value: '30' },
  { label: '90D', value: '90' },
  { label: '180D', value: '180' },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fr = payload.find((p: any) => p.dataKey === 'fundingRate')?.value
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const oi = payload.find((p: any) => p.dataKey === 'openInterest')?.value
  return (
    <div className="bg-bg-card border border-border-card rounded px-3 py-2 text-xs">
      <p className="text-text-muted mb-1">{label}</p>
      {fr != null && (
        <p className="font-mono" style={{ color: FUNDING }}>资金费率: {formatFunding(fr)}</p>
      )}
      {oi != null && (
        <p className="font-mono" style={{ color: OI }}>未平仓量: {formatOI(oi)}</p>
      )}
    </div>
  )
}

/** 组合信号:结合 OI 趋势与资金费率水平给出一句判断 */
function interpret(data: DerivativesData): { tone: 'up' | 'down' | 'neutral'; text: string } {
  if (data.length < 2) return { tone: 'neutral', text: '数据不足' }
  const first = data[0].openInterest
  const last = data[data.length - 1].openInterest
  const oiChange = (last - first) / first

  const recentFunding = data
    .slice(-7)
    .map((d) => d.fundingRate)
    .filter((v): v is number => v != null)
  const avgFunding = recentFunding.length
    ? recentFunding.reduce((a, b) => a + b, 0) / recentFunding.length
    : 0

  const oiUp = oiChange > 0.05
  const oiDown = oiChange < -0.05
  const fundingHigh = avgFunding > 0.01
  const fundingNeg = avgFunding < 0

  const oiPct = (oiChange * 100).toFixed(1)

  if (oiUp && fundingHigh)
    return { tone: 'down', text: `OI 增 ${oiPct}% 且资金费率高企(${formatFunding(avgFunding)})— 杠杆过热,警惕多头踩踏` }
  if (oiUp && !fundingNeg)
    return { tone: 'up', text: `OI 增 ${oiPct}% 且资金费率温和 — 新资金进场,健康增仓` }
  if (oiDown && fundingNeg)
    return { tone: 'down', text: `OI 降 ${oiPct}% 且资金费率转负 — 去杠杆,空头主导` }
  if (oiDown)
    return { tone: 'neutral', text: `OI 降 ${oiPct}% — 杠杆消退,持仓收缩` }
  if (fundingNeg)
    return { tone: 'up', text: `资金费率转负(${formatFunding(avgFunding)})— 空头拥挤,可能酝酿轧空` }
  return { tone: 'neutral', text: `OI 与资金费率均处中性区间` }
}

export default function DerivativesChart() {
  const [days, setDays] = useState('90')

  const { data, error, isLoading } = useSWR<ApiResponse<DerivativesData>>(
    `/api/derivatives?days=${days}`,
    fetchDerivatives
  )

  const signal = useMemo(
    () => (data ? interpret(data.data) : null),
    [data]
  )

  if (isLoading) return <ChartSkeleton height={340} />

  if (error || !data) {
    return (
      <div className="rounded-lg border border-border-card bg-bg-card p-4 h-[340px] flex items-center justify-center">
        <p className="text-sm text-down">Failed to load derivatives data</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border-card bg-bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-primary">Funding Rate & Open Interest</h2>
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

      <ResponsiveContainer width="100%" height={220}>
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
          {/* 左轴:资金费率(%) */}
          <YAxis
            yAxisId="funding"
            orientation="left"
            tick={{ fill: FUNDING, fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v.toFixed(3)}%`}
            width={52}
          />
          {/* 右轴:OI(十亿美元) */}
          <YAxis
            yAxisId="oi"
            orientation="right"
            tick={{ fill: OI, fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v.toFixed(1)}B`}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
            formatter={(value) => (
              <span className="text-text-muted">
                {value === 'fundingRate' ? '资金费率(8h)' : '未平仓量'}
              </span>
            )}
          />
          <ReferenceLine yAxisId="funding" y={0} stroke="#30363D" />
          <Line
            yAxisId="funding"
            type="monotone"
            dataKey="fundingRate"
            stroke={FUNDING}
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            activeDot={{ r: 3 }}
          />
          <Line
            yAxisId="oi"
            type="monotone"
            dataKey="openInterest"
            stroke={OI}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* 组合信号解读 */}
      {signal && (
        <div
          className={clsx(
            'mt-3 px-3 py-2 rounded text-xs font-medium border',
            signal.tone === 'up' && 'text-up border-up/30 bg-up/5',
            signal.tone === 'down' && 'text-down border-down/30 bg-down/5',
            signal.tone === 'neutral' && 'text-text-muted border-border-card'
          )}
        >
          <span className="uppercase tracking-wider text-[10px] opacity-70 mr-2">Signal</span>
          {signal.text}
        </div>
      )}
    </div>
  )
}
