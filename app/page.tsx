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

function SectionLabel({ index, zh, en }: { index: string; zh: string; en: string }) {
  return (
    <div className="flex items-center gap-3 mb-3 mt-2">
      <span className="text-blue font-mono text-sm font-semibold">{index}</span>
      <h2 className="text-sm font-semibold text-text-primary">{zh}</h2>
      <span className="text-xs text-text-muted uppercase tracking-widest">{en}</span>
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

      {/* ① 宏观环境:利率 / 通胀 / 美元 / 美股 —— 传导链最上游 */}
      <SectionLabel index="①" zh="宏观环境" en="Macro Backdrop" />
      <div className="grid grid-cols-2 gap-6 mb-8">
        <MacroCards />
        <StockChart />
      </div>

      {/* ② 机构需求:BTC / ETH 现货 ETF 净流入 —— 资金进出加密的主通道 */}
      <SectionLabel index="②" zh="机构需求" en="Institutional Demand" />
      <div className="grid grid-cols-2 gap-6 mb-8">
        <EtfFlowChart asset="btc" />
        <EtfFlowChart asset="eth" />
      </div>

      {/* ③ 流动性:全球 M2 / 链上稳定币 + DeFi TVL */}
      <SectionLabel index="③" zh="流动性" en="Liquidity" />
      <div className="grid grid-cols-2 gap-6 mb-8">
        <M2BtcChart />
        <LiquidityChart />
      </div>

      {/* ④ 市场结构:资金费率 + 未平仓量 / 多空持仓 —— 杠杆状态 */}
      <SectionLabel index="④" zh="市场结构" en="Market Structure" />
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="col-span-2">
          <DerivativesChart />
        </div>
        <LongShortGauge />
      </div>

      {/* ⑤ 轮动与情绪:BTC/ETH 占比 / 恐贪指数 —— 传导链末端 */}
      <SectionLabel index="⑤" zh="轮动与情绪" en="Rotation & Sentiment" />
      <div className="grid grid-cols-2 gap-6 mb-8">
        <DominanceChart />
        <FearGreedChart />
      </div>

      {/* 市场总览 */}
      <CoinTable />
    </main>
  )
}
