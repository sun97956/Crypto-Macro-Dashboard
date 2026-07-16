import { NextResponse } from 'next/server'
import { upstreamFetch } from '@/lib/upstream'
import type { DerivativesData } from '@/lib/types'

// OKX 公开接口(免费,全球可访问;Binance/Bybit 对美国节点封锁)
const OKX = 'https://www.okx.com'
const SWAP = 'BTC-USDT-SWAP'

function tsToDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

// 资金费率历史:每次最多 100 条(8h 一条),翻页向前取,聚合成日度均值
async function fetchFundingDaily(minDate: string): Promise<Map<string, number>> {
  const dayAgg = new Map<string, { sum: number; count: number }>()
  let after: string | undefined
  for (let page = 0; page < 6; page++) {
    const url =
      `${OKX}/api/v5/public/funding-rate-history?instId=${SWAP}&limit=100` +
      (after ? `&after=${after}` : '')
    const res = await upstreamFetch(url)
    const json = await res.json()
    const rows: Array<{ fundingRate: string; fundingTime: string }> = json.data ?? []
    if (rows.length === 0) break

    for (const r of rows) {
      const date = tsToDate(parseInt(r.fundingTime, 10))
      const rate = parseFloat(r.fundingRate) * 100 // → 百分比(8h)
      const cur = dayAgg.get(date) ?? { sum: 0, count: 0 }
      cur.sum += rate
      cur.count += 1
      dayAgg.set(date, cur)
    }

    const oldest = rows[rows.length - 1].fundingTime
    if (tsToDate(parseInt(oldest, 10)) < minDate) break
    after = oldest
  }

  const daily = new Map<string, number>()
  Array.from(dayAgg.entries()).forEach(([date, { sum, count }]) => {
    daily.set(date, sum / count)
  })
  return daily
}

// 未平仓量 + 成交量历史(日度,约 180 天):[[ts, oiUsd, volUsd], ...]
async function fetchOiDaily(): Promise<Map<string, number>> {
  const url = `${OKX}/api/v5/rubik/stat/contracts/open-interest-volume?ccy=BTC&period=1D`
  const res = await upstreamFetch(url)
  const json = await res.json()
  const rows: string[][] = json.data ?? []
  const map = new Map<string, number>()
  for (const [ts, oiUsd] of rows) {
    map.set(tsToDate(parseInt(ts, 10)), parseFloat(oiUsd) / 1e9) // → 十亿美元
  }
  return map
}

// 多空持仓人数比(日度):[[ts, ratio], ...]
async function fetchLongShortDaily(): Promise<Map<string, number>> {
  const url = `${OKX}/api/v5/rubik/stat/contracts/long-short-account-ratio?ccy=BTC&period=1D`
  const res = await upstreamFetch(url)
  const json = await res.json()
  const rows: string[][] = json.data ?? []
  const map = new Map<string, number>()
  for (const [ts, ratio] of rows) {
    map.set(tsToDate(parseInt(ts, 10)), parseFloat(ratio))
  }
  return map
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') ?? '90', 10)
    const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)

    const [funding, oi, longShort] = await Promise.all([
      fetchFundingDaily(cutoff),
      fetchOiDaily(),
      fetchLongShortDaily(),
    ])

    // 以 OI 的日期为主轴(覆盖最全,约 180 天)
    const dates = Array.from(oi.keys())
      .filter((d) => d >= cutoff)
      .sort()

    const data: DerivativesData = dates.map((date) => ({
      date,
      fundingRate: funding.get(date) ?? null,
      openInterest: oi.get(date)!,
      longShortRatio: longShort.get(date) ?? null,
    }))

    return NextResponse.json(
      { data, updatedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 's-maxage=1800, must-revalidate' } }
    )
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message, code: 500 },
      { status: 500 }
    )
  }
}
