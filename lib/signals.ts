import { formatFlow } from './formatters'
import type {
  MacroFredData,
  EtfFlowData,
  LiquidityData,
  DominanceData,
  DerivativesData,
  SentimentData,
  SignalLayer,
  CycleSignal,
  CycleStage,
} from './types'

// ─── 工具函数 ─────────────────────────────────────────────────────
const clamp = (v: number, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, v))

function pctChange(first: number, last: number): number {
  if (!first) return 0
  return (last - first) / Math.abs(first)
}

function toSignal(score: number): 'bullish' | 'neutral' | 'bearish' {
  if (score > 0.2) return 'bullish'
  if (score < -0.2) return 'bearish'
  return 'neutral'
}

// ─── 各层打分(score ∈ -1 ~ +1) ─────────────────────────────────

/** 流动性:美元指数走弱 = 流动性宽松 = 利多 */
export function scoreLiquidity(fred?: MacroFredData): SignalLayer {
  const name = '流动性'
  const dxy = fred?.DXY ?? []
  if (dxy.length < 30)
    return { name, score: 0, signal: 'neutral', detail: '美元指数数据不足' }
  const win = dxy.slice(-90)
  const change = pctChange(win[0].value, win[win.length - 1].value)
  const score = clamp(-change * 20) // DXY 跌 5% → +1
  const pct = (change * 100).toFixed(1)
  return {
    name,
    score,
    signal: toSignal(score),
    detail: `美元指数 ${change >= 0 ? '走强' : '走弱'} ${Math.abs(+pct)}%,流动性${change >= 0 ? '收紧' : '宽松'}`,
  }
}

/** 机构需求:BTC ETF 近 7 日累计净流入 */
export function scoreInstitutional(etf?: EtfFlowData): SignalLayer {
  const name = '机构需求'
  if (!etf || etf.length === 0)
    return { name, score: 0, signal: 'neutral', detail: 'ETF 数据不足' }
  const last7 = etf.slice(-7)
  const sum = last7.reduce((a, b) => a + b.btcFlow, 0) // 百万美元
  const score = clamp(sum / 3000) // ±$3B/7d → ±1
  return {
    name,
    score,
    signal: toSignal(score),
    detail: `BTC ETF 近 7 日净流入 ${formatFlow(sum)},机构${sum >= 0 ? '买入' : '卖出'}`,
  }
}

/**
 * 资金流入:以稳定币供应为主信号(价格稳定,增减反映真实资金进出),
 * DeFi TVL 为次要参考且限幅——TVL 以美元计价会被币价放大,不宜主导。
 */
export function scoreCapitalFlow(liq?: LiquidityData): SignalLayer {
  const name = '资金流入'
  if (!liq || liq.length < 2)
    return { name, score: 0, signal: 'neutral', detail: '链上流动性数据不足' }
  const stableChg = pctChange(liq[0].stablecoin, liq[liq.length - 1].stablecoin)
  const tvlChg = pctChange(liq[0].tvl, liq[liq.length - 1].tvl)
  // 稳定币主导(±5% → ±1);TVL 先限幅到 ±20% 再小权重叠加
  const score = clamp(stableChg * 20 + clamp(tvlChg, -0.2, 0.2) * 1.5)
  return {
    name,
    score,
    signal: toSignal(score),
    detail: `稳定币供应 ${(stableChg * 100).toFixed(1)}%(主) · DeFi TVL ${(tvlChg * 100).toFixed(1)}%`,
  }
}

/** 风险偏好:BTC 占比下降 = 资金轮动至山寨 = 风险偏好上升 */
export function scoreRiskAppetite(dom?: DominanceData): SignalLayer {
  const name = '风险偏好'
  if (!dom || dom.length < 2)
    return { name, score: 0, signal: 'neutral', detail: 'Dominance 数据不足' }
  const change = dom[dom.length - 1].btcDominance - dom[0].btcDominance // 百分点
  const score = clamp(-change / 3) // BTC.D 降 3pp → +1
  return {
    name,
    score,
    signal: toSignal(score),
    detail: `BTC 占比 ${change >= 0 ? '上升' : '下降'} ${Math.abs(change).toFixed(1)}pp,${change >= 0 ? '资金回避风险' : '资金轮动山寨'}`,
  }
}

/** 市场结构:资金费率温和偏正最佳,过高=过热,转负=偏空 */
export function scoreMarketStructure(deriv?: DerivativesData): SignalLayer {
  const name = '市场结构'
  if (!deriv || deriv.length === 0)
    return { name, score: 0, signal: 'neutral', detail: '衍生品数据不足' }
  const recent = deriv
    .slice(-7)
    .map((d) => d.fundingRate)
    .filter((v): v is number => v != null)
  if (recent.length === 0)
    return { name, score: 0, signal: 'neutral', detail: '资金费率数据不足' }
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length

  let score: number
  let note: string
  if (avg > 0.02) {
    score = -0.5
    note = '杠杆过热'
  } else if (avg < 0) {
    score = -0.3
    note = '情绪偏空'
  } else {
    score = clamp((avg / 0.01) * 0.8, 0, 0.8)
    note = '杠杆健康'
  }
  return {
    name,
    score,
    signal: toSignal(score),
    detail: `资金费率均值 ${avg.toFixed(3)}%,${note}`,
  }
}

/** 情绪:恐贪指数反向指标,极度恐慌利多、极度贪婪利空 */
export function scoreSentiment(sent?: SentimentData): SignalLayer {
  const name = '情绪'
  if (!sent || sent.length === 0)
    return { name, score: 0, signal: 'neutral', detail: '恐贪指数数据不足' }
  const latest = sent[sent.length - 1]
  const score = clamp((50 - latest.value) / 40) // 值10→+1(恐慌利多), 值90→-1
  return {
    name,
    score,
    signal: toSignal(score),
    detail: `恐贪指数 ${latest.value}(${latest.classification}),${latest.value < 30 ? '极度恐慌,反向看多' : latest.value > 70 ? '贪婪,警惕回调' : '情绪中性'}`,
  }
}

// ─── 综合汇总 ─────────────────────────────────────────────────────
const WEIGHTS: Record<string, number> = {
  流动性: 0.2,
  机构需求: 0.25,
  资金流入: 0.15,
  风险偏好: 0.15,
  市场结构: 0.15,
  情绪: 0.1,
}

export interface SignalInputs {
  fred?: MacroFredData
  etf?: EtfFlowData
  liquidity?: LiquidityData
  dominance?: DominanceData
  derivatives?: DerivativesData
  sentiment?: SentimentData
}

export function computeCycleSignal(inputs: SignalInputs): CycleSignal {
  const layers: SignalLayer[] = [
    scoreLiquidity(inputs.fred),
    scoreInstitutional(inputs.etf),
    scoreCapitalFlow(inputs.liquidity),
    scoreRiskAppetite(inputs.dominance),
    scoreMarketStructure(inputs.derivatives),
    scoreSentiment(inputs.sentiment),
  ]

  const weighted = layers.reduce(
    (acc, l) => acc + l.score * (WEIGHTS[l.name] ?? 0),
    0
  )
  const score = Math.round(weighted * 100) // -100 ~ +100

  const stage: CycleStage =
    score > 30 ? 'Risk-On' : score < -30 ? 'Risk-Off' : 'Neutral'

  return { stage, score, layers }
}
