import { NextResponse } from 'next/server'
import { upstreamFetch } from '@/lib/upstream'
import type { MacroFredData, FredSeries, FredHistoryPoint } from '@/lib/types'

const FRED_API_KEY = process.env.FRED_API_KEY!
const BASE = 'https://api.stlouisfed.org/fred/series/observations'

async function fetchSeries(id: string): Promise<FredSeries> {
  const url = `${BASE}?series_id=${id}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=5`
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

export async function GET() {
  try {
    const [FEDFUNDS, DGS10, SP500, NASDAQ100] = await Promise.all([
      fetchSeries('FEDFUNDS'),
      fetchSeries('DGS10'),
      fetchHistory('SP500', 365),
      fetchHistory('NASDAQ100', 365),
    ])

    const data: MacroFredData = { FEDFUNDS, DGS10, SP500, NASDAQ100 }

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
