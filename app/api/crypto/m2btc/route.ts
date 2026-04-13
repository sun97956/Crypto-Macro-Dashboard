import { NextResponse } from 'next/server'
import { upstreamFetch } from '@/lib/upstream'
import type { M2BtcData } from '@/lib/types'

const CG_API_KEY = process.env.COINGECKO_API_KEY!
const FRED_API_KEY = process.env.FRED_API_KEY!

// 2020-01-01 的 Unix 时间戳（秒）
const START_TS = Math.floor(new Date('2020-01-01').getTime() / 1000)
const NOW_TS = Math.floor(Date.now() / 1000)

async function fetchBtcMonthly(): Promise<Map<string, number>> {
  const url = `https://pro-api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${START_TS}&to=${NOW_TS}`
  const res = await upstreamFetch(url, {
    headers: { 'x-cg-pro-api-key': CG_API_KEY },
  })
  const json = await res.json()

  // 按月份取最后一个数据点
  const monthMap = new Map<string, number>()
  for (const [ts, price] of json.prices as [number, number][]) {
    const month = new Date(ts).toISOString().slice(0, 7) // "2020-01"
    monthMap.set(month, Math.round(price))
  }
  return monthMap
}

async function fetchM2Monthly(): Promise<Map<string, number>> {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=M2SL&api_key=${FRED_API_KEY}&file_type=json&observation_start=2020-01-01&frequency=m`
  const res = await upstreamFetch(url)
  const json = await res.json()

  const monthMap = new Map<string, number>()
  for (const obs of json.observations as { date: string; value: string }[]) {
    if (obs.value !== '.') {
      const month = obs.date.slice(0, 7) // "2020-01"
      monthMap.set(month, parseFloat(obs.value))
    }
  }
  return monthMap
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') ?? '365', 10)

    const [btcMap, m2Map] = await Promise.all([fetchBtcMonthly(), fetchM2Monthly()])

    // 取两者共有的月份，按时间排序
    let months = Array.from(m2Map.keys())
      .filter((m) => btcMap.has(m))
      .sort()

    // 按 days 截取：30D ≈ 1 个月，90D ≈ 3 个月，365D ≈ 12 个月
    const monthCount = Math.ceil(days / 30)
    if (months.length > monthCount) {
      months = months.slice(-monthCount)
    }

    const data: M2BtcData = months.map((month) => ({
      month,
      btc: btcMap.get(month)!,
      m2: m2Map.get(month)!,
    }))

    return NextResponse.json(
      { data, updatedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=300' } }
    )
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message, code: 500 },
      { status: 500 }
    )
  }
}
