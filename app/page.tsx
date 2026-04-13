'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import KpiSection from '@/components/KpiSection'
import PriceChart from '@/components/PriceChart'
import M2BtcChart from '@/components/M2BtcChart'
import MacroCards from '@/components/MacroCards'
import FearGreedChart from '@/components/FearGreedChart'
import StockChart from '@/components/StockChart'
import DominanceChart from '@/components/DominanceChart'
import LiquidityChart from '@/components/LiquidityChart'
import CoinTable from '@/components/CoinTable'

export default function Home() {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    setLastUpdated(new Date())
  }, [])

  return (
    <main className="min-w-[1280px] min-h-screen bg-bg-page text-text-primary px-8 py-6">
      {/* Header */}
      <Header
        lastUpdated={lastUpdated}
        onRefreshComplete={(date) => setLastUpdated(date)}
      />

      {/* Row 1: KPI Cards */}
      <KpiSection />

      {/* Row 2: BTC Price Chart */}
      <div className="mb-6">
        <PriceChart />
      </div>

      {/* Row 3: Fear & Greed + S&P 500 / NASDAQ */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <FearGreedChart />
        <StockChart />
      </div>

      {/* Row 4: M2 vs BTC + Macro Indicators */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <M2BtcChart />
        <MacroCards />
      </div>

      {/* Row 5: BTC/ETH Dominance + Stablecoin/TVL Liquidity */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <DominanceChart />
        <LiquidityChart />
      </div>

      {/* Row 6: Coin Table */}
      <CoinTable />
    </main>
  )
}
