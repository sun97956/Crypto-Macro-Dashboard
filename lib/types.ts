// ─── 通用 API 响应包装 ────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T
  updatedAt: string
}

export interface ApiError {
  error: string
  code: number
}

// ─── 加密货币价格 ─────────────────────────────────────────────────
export interface CoinPrice {
  symbol: string
  name: string
  price: number
  change24h: number
  change7d: number
  marketCap: number
}

export type CryptoPricesData = CoinPrice[]

// ─── 全球市场数据 ─────────────────────────────────────────────────
export interface CryptoGlobalData {
  totalMarketCap: number
  totalMarketCapChange24h: number
  btcDominance: number
  ethDominance: number
  stablecoinMarketCap: number
}

// ─── BTC 历史价格（走势图） ───────────────────────────────────────
export interface ChartPoint {
  date: string
  price: number
}

export type CryptoChartData = ChartPoint[]

// ─── M2 vs BTC 双轴图 ─────────────────────────────────────────────
export interface M2BtcPoint {
  month: string  // "2020-01"
  btc: number    // BTC 月末价格
  m2: number     // M2 供应量（十亿美元）
}

export type M2BtcData = M2BtcPoint[]

// ─── FRED 宏观指标 ────────────────────────────────────────────────
export interface FredSeries {
  value: string
  date: string
}

export interface FredHistoryPoint {
  date: string
  value: number
}

export interface MacroFredData {
  FEDFUNDS: FredSeries
  DGS10: FredSeries
  DXY: FredHistoryPoint[]
  SP500: FredHistoryPoint[]
  NASDAQ100: FredHistoryPoint[]
}

// ─── 恐贪指数 ─────────────────────────────────────────────────────
export type FearGreedClassification =
  | 'Extreme Fear'
  | 'Fear'
  | 'Neutral'
  | 'Greed'
  | 'Extreme Greed'

export interface FearGreedPoint {
  date: string
  value: number
  classification: FearGreedClassification
}

export type SentimentData = FearGreedPoint[]

// ─── 全球市场数据（扩展 ethDominance） ───────────────────────────

// ─── BTC / ETH Dominance 历史 ─────────────────────────────────────
export interface DominancePoint {
  date: string
  btcDominance: number
  ethDominance: number
}

export type DominanceData = DominancePoint[]

// ─── Stablecoin 市值 + DeFi TVL ──────────────────────────────────
export interface LiquidityPoint {
  date: string
  stablecoin: number  // 单位：十亿美元
  tvl: number         // 单位：十亿美元
}

export type LiquidityData = LiquidityPoint[]

// ─── 标普 500 / 纳斯达克历史 ──────────────────────────────────────
export interface StockPoint {
  date: string
  sp500: number | null
  nasdaq: number | null
}

export type StockData = StockPoint[]

// ─── ETF 净流入 ───────────────────────────────────────────────────
export interface EtfFlowPoint {
  date: string
  btcFlow: number        // 当日 BTC ETF 净流入,单位:百万美元
  ethFlow: number        // 当日 ETH ETF 净流入,单位:百万美元
  btcCumulative: number  // BTC ETF 累计净流入,单位:十亿美元
  ethCumulative: number  // ETH ETF 累计净流入,单位:十亿美元
}

export type EtfFlowData = EtfFlowPoint[]

// ─── 衍生品市场结构 ───────────────────────────────────────────────
export interface DerivativesPoint {
  date: string
  fundingRate: number | null    // 资金费率,百分比(如 0.01 = 0.01%);无数据为 null
  openInterest: number          // 未平仓量名义美元,单位:十亿
  longShortRatio: number | null // 多空持仓人数比;无数据为 null
}

export type DerivativesData = DerivativesPoint[]

// ─── 综合周期信号 ─────────────────────────────────────────────────
export type CycleStage = 'Risk-On' | 'Neutral' | 'Risk-Off'

export interface SignalLayer {
  name: string                              // 层级名,如"流动性"
  score: number                             // -1 ~ +1
  signal: 'bullish' | 'neutral' | 'bearish'
  detail: string                            // 一句话解读
}

export interface CycleSignal {
  stage: CycleStage
  score: number                             // -100 ~ +100 综合分
  layers: SignalLayer[]
}

export type SignalData = CycleSignal
