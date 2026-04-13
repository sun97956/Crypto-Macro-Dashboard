import { NextResponse } from 'next/server'
import { upstreamFetch } from '@/lib/upstream'
import type { LiquidityData } from '@/lib/types'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') ?? '90', 10)

    const [stableRes, tvlRes] = await Promise.all([
      upstreamFetch('https://stablecoins.llama.fi/stablecoincharts/all'),
      upstreamFetch('https://api.llama.fi/charts'),
    ])

    const stableJson: Array<{ date: string; totalCirculatingUSD: { peggedUSD: number } }> =
      await stableRes.json()
    const tvlJson: Array<{ date: number; totalLiquidityUSD: number }> =
      await tvlRes.json()

    // 把 TVL 数据转为 date→value map（十亿美元）
    const tvlMap = new Map<string, number>()
    for (const item of tvlJson) {
      const date = new Date(item.date * 1000).toISOString().slice(0, 10)
      tvlMap.set(date, parseFloat((item.totalLiquidityUSD / 1e9).toFixed(2)))
    }

    // 截取最近 N 天的稳定币数据
    const cutoff = Date.now() - days * 86400 * 1000
    const data: LiquidityData = stableJson
      .filter((item) => parseInt(item.date) * 1000 >= cutoff)
      .map((item) => {
        const date = new Date(parseInt(item.date) * 1000).toISOString().slice(0, 10)
        const stablecoin = parseFloat(
          ((item.totalCirculatingUSD?.peggedUSD ?? 0) / 1e9).toFixed(2)
        )
        const tvl = tvlMap.get(date) ?? null
        return { date, stablecoin, tvl: tvl ?? 0 }
      })
      .filter((d) => d.tvl > 0)

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
