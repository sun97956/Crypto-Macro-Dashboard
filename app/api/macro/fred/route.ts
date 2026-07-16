import { NextResponse } from 'next/server'
import { upstreamFetch } from '@/lib/upstream'
import type { MacroFredData, FredSeries, FredHistoryPoint } from '@/lib/types'

const FRED_API_KEY = process.env.FRED_API_KEY!
const BASE = 'https://api.stlouisfed.org/fred/series/observations'

// 取最新单值。units='pc1' 时返回同比 %(用于 CPI/PPI)
async function fetchSeries(id: string, units = 'lin'): Promise<FredSeries> {
  const url = `${BASE}?series_id=${id}&api_key=${FRED_API_KEY}&file_type=json&units=${units}&sort_order=desc&limit=5`
  const res = await upstreamFetch(url)
  const json = await res.json()
  const obs: Array<{ value: string; date: string }> = json.observations
  const latest = obs.find((o) => o.value !== '.')
  if (!latest) throw new Error(`No valid data for ${id}`)
  return { value: latest.value, date: latest.date }
}

async function fetchHistory(id: string, limit = 365): Promise<FredHistoryPoint[]> {
  const url = `${BASE}?series_id=${id}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=${limit}`
  const res = await upstreamFetch(url)
  const json = await res.json()
  const obs: Array<{ value: string; date: string }> = json.observations
  return obs
    .filter((o) => o.value !== '.')
    .map((o) => ({ date: o.date, value: parseFloat(o.value) }))
    .reverse()
}

// 真实 ICE 美元指数(~100),来自 Yahoo Finance DX-Y.NYB。
// FRED 的 DTWEXBGS 是"广义美元指数"(~120),并非市场常说的 DXY。
async function fetchDXY(): Promise<FredHistoryPoint[]> {
  try {
    const url =
      'https://query1.finance.yahoo.com/v8/finance/chart/DX-Y.NYB?interval=1d&range=1y'
    const res = await upstreamFetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    const json = await res.json()
    const result = json?.chart?.result?.[0]
    const ts: number[] = result?.timestamp ?? []
    const closes: (number | null)[] = result?.indicators?.quote?.[0]?.close ?? []
    const out: FredHistoryPoint[] = []
    for (let i = 0; i < ts.length; i++) {
      const v = closes[i]
      if (v != null) {
        out.push({ date: new Date(ts[i] * 1000).toISOString().slice(0, 10), value: v })
      }
    }
    return out
  } catch {
    return [] // DXY 失败不影响其余宏观数据
  }
}

export async function GET() {
  try {
    const [FEDFUNDS, DGS10, CPI, PPI, DXY, SP500, NASDAQ100] = await Promise.all([
      fetchSeries('FEDFUNDS'),
      fetchSeries('DGS10'),
      fetchSeries('CPIAUCSL', 'pc1'), // CPI 同比
      fetchSeries('PPIFIS', 'pc1'),   // PPI 最终需求 同比
      fetchDXY(),
      fetchHistory('SP500', 365),
      fetchHistory('NASDAQ100', 365),
    ])

    const data: MacroFredData = { FEDFUNDS, DGS10, CPI, PPI, DXY, SP500, NASDAQ100 }

    return NextResponse.json(
      { data, updatedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate=3600' } }
    )
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message, code: 500 },
      { status: 500 }
    )
  }
}
