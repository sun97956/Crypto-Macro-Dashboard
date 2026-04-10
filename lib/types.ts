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

export interface MacroFredData {
  FEDFUNDS: FredSeries
  DGS10: FredSeries
  CPIAUCSL: FredSeries
  DEXUSEU: FredSeries
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
