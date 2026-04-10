import type {
  ApiResponse,
  CryptoPricesData,
  CryptoGlobalData,
  CryptoChartData,
  M2BtcData,
  MacroFredData,
  SentimentData,
} from './types'

/**
 * 通用 SWR fetcher
 * 非 2xx 响应会抛出错误，SWR 会捕获并写入 error 状态
 */
export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed: ${res.status}`)
  }
  return res.json()
}

// ─── 各模块专用 fetcher（带类型） ─────────────────────────────────

export const fetchCryptoPrices = (url: string) =>
  fetcher<ApiResponse<CryptoPricesData>>(url)

export const fetchCryptoGlobal = (url: string) =>
  fetcher<ApiResponse<CryptoGlobalData>>(url)

export const fetchCryptoChart = (url: string) =>
  fetcher<ApiResponse<CryptoChartData>>(url)

export const fetchM2Btc = (url: string) =>
  fetcher<ApiResponse<M2BtcData>>(url)

export const fetchMacroFred = (url: string) =>
  fetcher<ApiResponse<MacroFredData>>(url)

export const fetchSentiment = (url: string) =>
  fetcher<ApiResponse<SentimentData>>(url)
