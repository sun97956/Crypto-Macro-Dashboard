'use client'

import useSWR from 'swr'
import { fetchCryptoPrices } from '@/lib/fetchers'
import { formatPrice, formatMarketCap, formatPct } from '@/lib/formatters'
import { TableSkeleton } from './Skeleton'
import clsx from 'clsx'
import type { ApiResponse, CryptoPricesData } from '@/lib/types'

function PctCell({ value }: { value: number }) {
  return (
    <span
      className={clsx('font-mono text-xs', {
        'text-up': value > 0,
        'text-down': value < 0,
        'text-text-muted': value === 0,
      })}
    >
      {formatPct(value)}
    </span>
  )
}

export default function CoinTable() {
  const { data, error, isLoading } = useSWR<ApiResponse<CryptoPricesData>>(
    '/api/crypto/prices',
    fetchCryptoPrices
  )

  if (isLoading) return <TableSkeleton rows={6} />

  if (error || !data) {
    return (
      <div className="rounded-lg border border-border-card bg-bg-card p-4">
        <p className="text-sm text-down">Failed to load coin prices</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border-card bg-bg-card overflow-hidden h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border-card">
        <h2 className="text-sm font-semibold text-text-primary">Market Overview</h2>
      </div>

      <table className="w-full text-xs flex-1">
        <thead>
          <tr className="border-b border-border-card text-text-muted">
            <th className="text-left px-4 py-2 font-normal">Asset</th>
            <th className="text-right px-4 py-2 font-normal">Price</th>
            <th className="text-right px-4 py-2 font-normal">24h</th>
            <th className="text-right px-4 py-2 font-normal">7d</th>
            <th className="text-right px-4 py-2 font-normal">Mkt Cap</th>
          </tr>
        </thead>
        <tbody>
          {data.data.map((coin, i) => (
            <tr
              key={coin.symbol}
              className={clsx(
                'border-b border-border-card last:border-0',
                i % 2 === 0 ? 'bg-bg-card' : 'bg-bg-row'
              )}
            >
              <td className="px-4 py-3">
                <span className="font-mono font-semibold text-text-primary">{coin.symbol}</span>
                <span className="text-text-muted ml-2">{coin.name}</span>
              </td>
              <td className="text-right px-4 py-3 font-mono text-text-primary">
                {formatPrice(coin.price)}
              </td>
              <td className="text-right px-4 py-3">
                <PctCell value={coin.change24h} />
              </td>
              <td className="text-right px-4 py-3">
                <PctCell value={coin.change7d} />
              </td>
              <td className="text-right px-4 py-3 font-mono text-text-secondary">
                {formatMarketCap(coin.marketCap)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
