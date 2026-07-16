import { NextResponse } from 'next/server'
import { upstreamFetch } from '@/lib/upstream'
import type { EtfFlowData } from '@/lib/types'

// SoSoValue 开放接口:美国现货 ETF 每日净流入(免费,无需 key)
const SOSO_URL = 'https://api.sosovalue.xyz/openapi/v2/etf/historicalInflowChart'

interface SosoPoint {
  date: string
  totalNetInflow: number   // 当日净流入,美元
  cumNetInflow: number     // 累计净流入,美元
}

async function fetchEtfFlow(type: 'us-btc-spot' | 'us-eth-spot'): Promise<SosoPoint[]> {
  const res = await upstreamFetch(SOSO_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0',
    },
    body: JSON.stringify({ type }),
  })
  const json = await res.json()
  return (json.data ?? []) as SosoPoint[]
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') ?? '90', 10)

    const [btcRaw, ethRaw] = await Promise.all([
      fetchEtfFlow('us-btc-spot'),
      fetchEtfFlow('us-eth-spot'),
    ])

    // 按日期建 ETH 映射,便于与 BTC 对齐
    const ethMap = new Map<string, number>()
    for (const p of ethRaw) ethMap.set(p.date, p.totalNetInflow)

    // BTC 数据升序排列(接口返回是降序)
    const btcAsc = [...btcRaw].sort((a, b) => a.date.localeCompare(b.date))

    const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)

    const data: EtfFlowData = btcAsc
      .filter((p) => p.date >= cutoff)
      .map((p) => ({
        date: p.date,
        btcFlow: p.totalNetInflow / 1e6,          // → 百万美元
        ethFlow: (ethMap.get(p.date) ?? 0) / 1e6, // → 百万美元
        btcCumulative: p.cumNetInflow / 1e9,      // → 十亿美元
      }))

    return NextResponse.json(
      { data, updatedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 's-maxage=3600, must-revalidate' } }
    )
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message, code: 500 },
      { status: 500 }
    )
  }
}
