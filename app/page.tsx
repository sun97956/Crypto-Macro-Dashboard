'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import KpiSection from '@/components/KpiSection'
import PriceChart from '@/components/PriceChart'
import M2BtcChart from '@/components/M2BtcChart'
import MacroCards from '@/components/MacroCards'
import FearGreedChart from '@/components/FearGreedChart'
import CoinTable from '@/components/CoinTable'

export default function Home() {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // 避免 SSR/client hydration mismatch，只在客户端初始化时间
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

      {/* Row 3: M2 vs BTC + Macro Indicators */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <M2BtcChart />
        <MacroCards />
      </div>

      {/* Row 4: Fear & Greed + Coin Table */}
      <div className="grid grid-cols-2 gap-6">
        <FearGreedChart />
        <CoinTable />
      </div>
    </main>
  )
}
