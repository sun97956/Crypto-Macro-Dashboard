'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import KpiSection from '@/components/KpiSection'
import CycleStageBanner from '@/components/CycleStageBanner'
import PriceChart from '@/components/PriceChart'
import M2BtcChart from '@/components/M2BtcChart'
import MacroCards from '@/components/MacroCards'
import FearGreedChart from '@/components/FearGreedChart'
import StockChart from '@/components/StockChart'
import DominanceChart from '@/components/DominanceChart'
import LiquidityChart from '@/components/LiquidityChart'
import EtfFlowChart from '@/components/EtfFlowChart'
import DerivativesChart from '@/components/DerivativesChart'
import LongShortGauge from '@/components/LongShortGauge'
import CoinTable from '@/components/CoinTable'

function SectionLabel({ index, title, note }: { index: string; title: string; note: string }) {
  return (
    <div className="flex items-center gap-3 mb-3 mt-2">
      <span className="text-blue font-mono text-sm font-semibold">{index}</span>
      <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      <span className="text-xs text-text-muted">{note}</span>
      <div className="flex-1 h-px bg-border-card" />
    </div>
  )
}

export default function Home() {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    setLastUpdated(new Date())
  }, [])

  return (
    <main className="min-w-[1280px] min-h-screen bg-bg-page text-text-primary px-8 py-6">
      <Header
        lastUpdated={lastUpdated}
        onRefreshComplete={(date) => setLastUpdated(date)}
      />

      {/* 顶部:综合周期判断 */}
      <CycleStageBanner />

      {/* KPI 快照 */}
      <KpiSection />

      {/* BTC 价格 */}
      <div className="mb-8">
        <PriceChart />
      </div>

      {/* Macro backdrop: rates / inflation / dollar / equities — top of the chain */}
      <SectionLabel index="①" title="Macro Backdrop" note="Rates · Inflation · Dollar · Equities" />
      <div className="grid grid-cols-2 gap-6 mb-8">
        <MacroCards />
        <StockChart />
      </div>

      {/* Institutional demand: BTC / ETH spot ETF flows — the main channel into crypto */}
      <SectionLabel index="②" title="Institutional Demand" note="BTC · ETH spot ETF flows" />
      <div className="grid grid-cols-2 gap-6 mb-8">
        <EtfFlowChart asset="btc" />
        <EtfFlowChart asset="eth" />
      </div>

      {/* Liquidity: global M2 / on-chain stablecoins + DeFi TVL */}
      <SectionLabel index="③" title="Liquidity" note="Global M2 · Stablecoins · DeFi TVL" />
      <div className="grid grid-cols-2 gap-6 mb-8">
        <M2BtcChart />
        <LiquidityChart />
      </div>

      {/* Market structure: funding + open interest / positioning — leverage state */}
      <SectionLabel index="④" title="Market Structure" note="Funding · Open Interest · Positioning" />
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="col-span-2">
          <DerivativesChart />
        </div>
        <LongShortGauge />
      </div>

      {/* Rotation & sentiment: BTC/ETH dominance / Fear & Greed — end of the chain */}
      <SectionLabel index="⑤" title="Rotation & Sentiment" note="Dominance · Fear & Greed" />
      <div className="grid grid-cols-2 gap-6 mb-8">
        <DominanceChart />
        <FearGreedChart />
      </div>

      {/* 市场总览 */}
      <CoinTable />
    </main>
  )
}
