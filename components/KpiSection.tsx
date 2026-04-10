'use client'

import useSWR from 'swr'
import KpiCard from './KpiCard'
import { fetchCryptoPrices, fetchCryptoGlobal, fetchSentiment } from '@/lib/fetchers'
import { formatPrice, formatMarketCap } from '@/lib/formatters'
import type { ApiResponse, CryptoPricesData, CryptoGlobalData, SentimentData } from '@/lib/types'

const FEAR_COLOR: Record<string, 'blue' | 'yellow'> = {
  'Extreme Fear': 'yellow',
  'Fear': 'yellow',
  'Neutral': 'blue',
  'Greed': 'blue',
  'Extreme Greed': 'blue',
}

export default function KpiSection() {
  const prices = useSWR<ApiResponse<CryptoPricesData>>('/api/crypto/prices', fetchCryptoPrices)
  const global = useSWR<ApiResponse<CryptoGlobalData>>('/api/crypto/global', fetchCryptoGlobal)
  const sentiment = useSWR<ApiResponse<SentimentData>>('/api/sentiment', fetchSentiment)

  const btc = prices.data?.data.find((c) => c.symbol === 'BTC')
  const eth = prices.data?.data.find((c) => c.symbol === 'ETH')
  const g = global.data?.data
  const latest = sentiment.data?.data.at(-1)

  return (
    <div className="grid grid-cols-6 gap-4 mb-6">
      {/* BTC Price */}
      <KpiCard
        title="BTC Price"
        value={btc ? formatPrice(btc.price) : '—'}
        change={btc?.change24h}
        changeLabel="24h"
        accent="blue"
        loading={prices.isLoading}
        error={!!prices.error}
      />

      {/* ETH Price */}
      <KpiCard
        title="ETH Price"
        value={eth ? formatPrice(eth.price) : '—'}
        change={eth?.change24h}
        changeLabel="24h"
        accent="blue"
        loading={prices.isLoading}
        error={!!prices.error}
      />

      {/* Total Market Cap */}
      <KpiCard
        title="Total Market Cap"
        value={g ? formatMarketCap(g.totalMarketCap) : '—'}
        change={g?.totalMarketCapChange24h}
        changeLabel="24h"
        accent="blue"
        loading={global.isLoading}
        error={!!global.error}
      />

      {/* BTC Dominance */}
      <KpiCard
        title="BTC Dominance"
        value={g ? `${g.btcDominance.toFixed(1)}%` : '—'}
        accent="purple"
        loading={global.isLoading}
        error={!!global.error}
      />

      {/* Fear & Greed */}
      <KpiCard
        title="Fear & Greed"
        value={latest ? String(latest.value) : '—'}
        subLabel={latest?.classification}
        accent={latest ? (FEAR_COLOR[latest.classification] ?? 'blue') : 'blue'}
        loading={sentiment.isLoading}
        error={!!sentiment.error}
      />

      {/* Stablecoin Market Cap */}
      <KpiCard
        title="Stablecoin Cap"
        value={g ? formatMarketCap(g.stablecoinMarketCap) : '—'}
        accent="purple"
        loading={global.isLoading}
        error={!!global.error}
      />
    </div>
  )
}
