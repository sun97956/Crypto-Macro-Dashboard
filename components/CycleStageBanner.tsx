'use client'

import useSWR from 'swr'
import clsx from 'clsx'
import {
  fetchMacroFred, fetchEtfFlow, fetchLiquidity,
  fetchDominance, fetchDerivatives, fetchSentiment,
} from '@/lib/fetchers'
import { computeCycleSignal } from '@/lib/signals'
import type {
  ApiResponse, MacroFredData, EtfFlowData, LiquidityData,
  DominanceData, DerivativesData, SentimentData,
} from '@/lib/types'

const STAGE_STYLE = {
  'Risk-On': { color: '#3FB950', label: 'RISK-ON', sub: 'Risk appetite rising — tailwind' },
  Neutral: { color: '#E3B341', label: 'NEUTRAL', sub: 'Mixed signals — diverging' },
  'Risk-Off': { color: '#F85149', label: 'RISK-OFF', sub: 'Risk appetite contracting — headwind' },
}

const DOT = {
  bullish: '#3FB950',
  neutral: '#8B949E',
  bearish: '#F85149',
}

export default function CycleStageBanner() {
  const fred = useSWR<ApiResponse<MacroFredData>>('/api/macro/fred', fetchMacroFred)
  const etf = useSWR<ApiResponse<EtfFlowData>>('/api/etf?days=30', fetchEtfFlow)
  const liq = useSWR<ApiResponse<LiquidityData>>('/api/liquidity?days=180', fetchLiquidity)
  const dom = useSWR<ApiResponse<DominanceData>>('/api/crypto/dominance?days=90', fetchDominance)
  const deriv = useSWR<ApiResponse<DerivativesData>>('/api/derivatives?days=30', fetchDerivatives)
  const sent = useSWR<ApiResponse<SentimentData>>('/api/sentiment?limit=30', fetchSentiment)

  const signal = computeCycleSignal({
    fred: fred.data?.data,
    etf: etf.data?.data,
    liquidity: liq.data?.data,
    dominance: dom.data?.data,
    derivatives: deriv.data?.data,
    sentiment: sent.data?.data,
  })

  const anyLoading = fred.isLoading || etf.isLoading || dom.isLoading || deriv.isLoading
  const style = STAGE_STYLE[signal.stage]

  // 综合分 -100~100 映射到 0~100% 的指针位置
  const markerPos = ((signal.score + 100) / 200) * 100

  return (
    <div className="rounded-lg border border-border-card bg-bg-card p-5 mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* 左:核心判断 */}
        <div className="flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-border-card pb-4 lg:pb-0 lg:pr-6">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
            Market Cycle Stage
          </p>
          <div className="flex items-baseline gap-3">
            <span
              className="text-4xl font-bold tracking-tight"
              style={{ color: anyLoading ? '#8B949E' : style.color }}
            >
              {anyLoading ? '…' : style.label}
            </span>
            <span className="text-lg font-mono text-text-muted">
              {anyLoading ? '' : (signal.score > 0 ? '+' : '') + signal.score}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-1">{anyLoading ? 'Computing composite signal…' : style.sub}</p>

          {/* 综合分刻度条 -100 ~ +100 */}
          <div className="mt-4">
            <div
              className="relative h-2 rounded-full"
              style={{
                background: 'linear-gradient(90deg, #F85149 0%, #E3B341 50%, #3FB950 100%)',
              }}
            >
              {!anyLoading && (
                <div
                  className="absolute -top-1 w-1 h-4 bg-text-primary rounded-full"
                  style={{ left: `calc(${markerPos}% - 2px)` }}
                />
              )}
            </div>
            <div className="flex justify-between text-[10px] text-text-muted font-mono mt-1">
              <span>Risk-Off</span>
              <span>Neutral</span>
              <span>Risk-On</span>
            </div>
          </div>
        </div>

        {/* 右:各层信号 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
          {signal.layers.map((layer) => (
            <div key={layer.name} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: anyLoading ? '#30363D' : DOT[layer.signal] }}
                />
                <span className="text-sm font-medium text-text-primary">{layer.name}</span>
                <span className="text-[10px] font-mono text-text-muted ml-auto">
                  {anyLoading ? '' : (layer.score > 0 ? '+' : '') + layer.score.toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-text-muted leading-snug pl-4">
                {anyLoading ? 'Loading…' : layer.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
