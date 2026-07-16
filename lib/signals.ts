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

/** Liquidity: weaker dollar = easier liquidity = bullish */
export function scoreLiquidity(fred?: MacroFredData): SignalLayer {
  const name = 'Liquidity'
  const dxy = fred?.DXY ?? []
  if (dxy.length < 30)
    return { name, score: 0, signal: 'neutral', detail: 'Insufficient dollar index data' }
  const win = dxy.slice(-90)
  const change = pctChange(win[0].value, win[win.length - 1].value)
  const score = clamp(-change * 20) // DXY down 5% → +1
  const pct = (change * 100).toFixed(1)
  return {
    name,
    score,
    signal: toSignal(score),
    detail: `Dollar index ${change >= 0 ? 'up' : 'down'} ${Math.abs(+pct)}%, liquidity ${change >= 0 ? 'tightening' : 'easing'}`,
  }
}

/** Institutional demand: BTC ETF net flow over the last 7 days */
export function scoreInstitutional(etf?: EtfFlowData): SignalLayer {
  const name = 'Institutional'
  if (!etf || etf.length === 0)
    return { name, score: 0, signal: 'neutral', detail: 'Insufficient ETF data' }
  const last7 = etf.slice(-7)
  const sum = last7.reduce((a, b) => a + b.btcFlow, 0) // USD millions
  const score = clamp(sum / 3000) // ±$3B/7d → ±1
  return {
    name,
    score,
    signal: toSignal(score),
    detail: `BTC ETF 7d net flow ${formatFlow(sum)}, institutions ${sum >= 0 ? 'buying' : 'selling'}`,
  }
}

/**
 * Capital flow: stablecoin supply is the primary signal (price-stable, so
 * changes reflect real capital in/out); DeFi TVL is secondary and capped
 * because USD-denominated TVL is inflated by price moves.
 */
export function scoreCapitalFlow(liq?: LiquidityData): SignalLayer {
  const name = 'Capital Flow'
  if (!liq || liq.length < 2)
    return { name, score: 0, signal: 'neutral', detail: 'Insufficient on-chain data' }
  const stableChg = pctChange(liq[0].stablecoin, liq[liq.length - 1].stablecoin)
  const tvlChg = pctChange(liq[0].tvl, liq[liq.length - 1].tvl)
  // Stablecoin-dominant (±5% → ±1); TVL clamped to ±20% then small weight
  const score = clamp(stableChg * 20 + clamp(tvlChg, -0.2, 0.2) * 1.5)
  return {
    name,
    score,
    signal: toSignal(score),
    detail: `Stablecoin supply ${(stableChg * 100).toFixed(1)}% (primary) · DeFi TVL ${(tvlChg * 100).toFixed(1)}%`,
  }
}

/** Risk appetite: falling BTC dominance = rotation into alts = higher risk appetite */
export function scoreRiskAppetite(dom?: DominanceData): SignalLayer {
  const name = 'Risk Appetite'
  if (!dom || dom.length < 2)
    return { name, score: 0, signal: 'neutral', detail: 'Insufficient dominance data' }
  const change = dom[dom.length - 1].btcDominance - dom[0].btcDominance // percentage points
  const score = clamp(-change / 3) // BTC.D down 3pp → +1
  return {
    name,
    score,
    signal: toSignal(score),
    detail: `BTC dominance ${change >= 0 ? 'up' : 'down'} ${Math.abs(change).toFixed(1)}pp, ${change >= 0 ? 'risk-off rotation' : 'rotation into alts'}`,
  }
}

/** Market structure: mild positive funding is best; too high = overheated, negative = bearish */
export function scoreMarketStructure(deriv?: DerivativesData): SignalLayer {
  const name = 'Market Structure'
  if (!deriv || deriv.length === 0)
    return { name, score: 0, signal: 'neutral', detail: 'Insufficient derivatives data' }
  const recent = deriv
    .slice(-7)
    .map((d) => d.fundingRate)
    .filter((v): v is number => v != null)
  if (recent.length === 0)
    return { name, score: 0, signal: 'neutral', detail: 'Insufficient funding data' }
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length

  let score: number
  let note: string
  if (avg > 0.02) {
    score = -0.5
    note = 'leverage overheated'
  } else if (avg < 0) {
    score = -0.3
    note = 'bearish tilt'
  } else {
    score = clamp((avg / 0.01) * 0.8, 0, 0.8)
    note = 'leverage healthy'
  }
  return {
    name,
    score,
    signal: toSignal(score),
    detail: `Avg funding ${avg.toFixed(3)}%, ${note}`,
  }
}

/** Sentiment: Fear & Greed as a contrarian signal — extreme fear bullish, extreme greed bearish */
export function scoreSentiment(sent?: SentimentData): SignalLayer {
  const name = 'Sentiment'
  if (!sent || sent.length === 0)
    return { name, score: 0, signal: 'neutral', detail: 'Insufficient Fear & Greed data' }
  const latest = sent[sent.length - 1]
  const score = clamp((50 - latest.value) / 40) // 10→+1 (fear=bullish), 90→-1
  return {
    name,
    score,
    signal: toSignal(score),
    detail: `Fear & Greed ${latest.value} (${latest.classification}), ${latest.value < 30 ? 'extreme fear — contrarian bullish' : latest.value > 70 ? 'greed — watch for pullback' : 'neutral'}`,
  }
}

// ─── Weighted aggregate ───────────────────────────────────────────
const WEIGHTS: Record<string, number> = {
  Liquidity: 0.2,
  Institutional: 0.25,
  'Capital Flow': 0.15,
  'Risk Appetite': 0.15,
  'Market Structure': 0.15,
  Sentiment: 0.1,
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
