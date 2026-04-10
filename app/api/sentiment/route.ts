import { NextResponse } from 'next/server'
import { upstreamFetch } from '@/lib/upstream'
import type { SentimentData, FearGreedClassification } from '@/lib/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = searchParams.get('limit') ?? '30'

  try {
    const res = await upstreamFetch(
      `https://api.alternative.me/fng/?limit=${limit}`
    )
    const json = await res.json()

    const data: SentimentData = json.data.map(
      (item: { value: string; value_classification: string; timestamp: string }) => ({
        date: new Date(parseInt(item.timestamp) * 1000).toISOString().split('T')[0],
        value: parseInt(item.value),
        classification: item.value_classification as FearGreedClassification,
      })
    ).reverse() // 由旧到新排列，方便图表展示

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
