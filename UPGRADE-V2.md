# Macro Dashboard V2 改造计划

> 目标:从"数据展示工具"升级为"有观点的加密宏观分析框架",对标 Binance Research / Coinglass 的方法论。

---

## 一、核心叙事框架

整个 dashboard 回答一个问题:

> **加密市场当前处于宏观周期的哪个阶段?(Risk-On / Neutral / Risk-Off)**

传导链条(从上游到下游):

```
流动性(钱多不多) → 机构需求(ETF在买吗) → 资金流入(链上有钱吗)
  → 风险偏好(敢不敢冒险) → 市场结构(杠杆多重) → 情绪(到极值了吗)
```

设计原则(借鉴 Coinglass):
1. **看比率不看绝对值** —— OI/市值、稳定币增速、指标历史百分位
2. **指标组合出信号** —— 不只画线,给判断(如 OI↑+资金费率高 = 杠杆过热)
3. **ETF 流做成核心醒目模块** —— 本轮周期机构需求的第一信号

---

## 二、数据层设计

### 已验证可用的新数据源

| 数据 | 来源 | 端点 | 深度 | Key |
|------|------|------|------|-----|
| BTC/ETH ETF 净流入 | SoSoValue | `api.sosovalue.xyz/openapi/v2/etf/historicalInflowChart` | 300天 | 免费 |
| 资金费率 | OKX | `/api/v5/public/funding-rate-history` | ~33天/100条 | 免费 |
| 未平仓量 OI+成交量 | OKX | `/api/v5/rubik/stat/contracts/open-interest-volume` | 180天 | 免费 |
| 多空持仓比 | OKX | `/api/v5/rubik/stat/contracts/long-short-account-ratio` | 充足 | 免费 |
| DXY 美元指数 | FRED | series `DTWEXBGS` | 398条 | 已有key |

> 说明:Binance/Bybit 对美国节点(Vercel)地理封锁,故衍生品数据选 OKX(全球可访问、top3 交易所、有代表性)。ETF 用 SoSoValue(Coinglass 需 key,SoSoValue 免费)。

### 新增 API Routes

| 路由 | 说明 | 缓存 |
|------|------|------|
| `app/api/etf/route.ts` | BTC+ETH ETF 净流入历史,`?days=30\|90\|180` | s-maxage=3600 |
| `app/api/derivatives/route.ts` | OKX 资金费率 + OI + 多空比合并,`?days=30\|90\|180` | s-maxage=1800 |
| `app/api/macro/fred/route.ts`(改) | 增加 DXY(DTWEXBGS)历史 | 不变 |
| `app/api/signal/route.ts` | 综合信号计算(见第四节) | s-maxage=1800 |

### types.ts 新增类型

```ts
// ETF 净流入
export interface EtfFlowPoint {
  date: string
  btcFlow: number      // 当日净流入,百万美元
  ethFlow: number
  btcCumulative: number // 累计净流入,十亿美元
}
export type EtfFlowData = EtfFlowPoint[]

// 衍生品市场结构
export interface DerivativesPoint {
  date: string
  fundingRate: number   // 百分比,如 0.01 = 0.01%
  openInterest: number  // OI 名义美元,十亿
  longShortRatio: number
}
export type DerivativesData = DerivativesPoint[]

// FRED 增加 DXY
export interface MacroFredData {
  FEDFUNDS: FredSeries
  DGS10: FredSeries
  DXY: FredHistoryPoint[]      // 新增
  SP500: FredHistoryPoint[]
  NASDAQ100: FredHistoryPoint[]
}

// 综合信号
export type CycleStage = 'Risk-On' | 'Neutral' | 'Risk-Off'
export interface SignalLayer {
  name: string           // "流动性" / "机构需求" ...
  score: number          // -1 ~ +1
  signal: 'bullish' | 'neutral' | 'bearish'
  detail: string         // 一句话解读
}
export interface CycleSignal {
  stage: CycleStage
  score: number          // -100 ~ +100 综合分
  layers: SignalLayer[]
}
export type SignalData = CycleSignal
```

---

## 三、组件设计

### 新增组件

| 组件 | 内容 | 图表类型 |
|------|------|---------|
| `CycleStageBanner.tsx` | 顶部核心判断:大字 Risk-On/Off + 综合分 + 各层信号灯 | 自定义卡片 |
| `EtfFlowChart.tsx` | BTC ETF 每日净流入柱状(绿/红)+ 累计净流入曲线 | ComposedChart(Bar+Line) |
| `DerivativesChart.tsx` | 资金费率 + OI 双轴,下方标注组合信号解读 | ComposedChart |
| `LongShortGauge.tsx` | 多空持仓比 + 资金费率当前值,小卡片 | KPI 卡 |

### 改造组件

| 组件 | 改动 |
|------|------|
| `MacroCards.tsx` | 增加 DXY 卡片(当前值 + 趋势) |
| `KpiSection.tsx` | 顶部 KPI 增加"BTC ETF 昨日净流入"卡 |
| `page.tsx` | 按新框架重排布局(见第五节) |

### 新增工具函数

- `lib/formatters.ts`:`formatFlow`(±181.1M)、`formatOI`($1.99B)、`formatFunding`(0.010%)
- `lib/signals.ts`(新):各层打分逻辑 + 历史百分位计算

---

## 四、综合信号逻辑(核心加分项)

`lib/signals.ts` 对每一层打分(-1 ~ +1),加权汇总成 Cycle Stage:

| 层级 | 打分依据 | 权重 |
|------|---------|------|
| 流动性 | M2 增速为正 +,利率下行 +,DXY 走弱 + | 20% |
| 机构需求 | ETF 近7日累计净流入为正 + | 25% |
| 资金流入 | 稳定币供应增长 +,TVL 增长 + | 15% |
| 风险偏好 | BTC.D 下降(资金进 alt)+,BTC-股市相关性低 + | 15% |
| 市场结构 | 资金费率适中偏正 +,过高则 -(过热) | 15% |
| 情绪 | Fear&Greed 极度恐慌 +(反指),极度贪婪 - | 10% |

汇总分:
- `> +30` → **Risk-On**(绿)
- `-30 ~ +30` → **Neutral**(黄)
- `< -30` → **Risk-Off**(红)

每层显示:信号灯颜色 + 一句话解读(如"ETF 近7日净流入 +8.2亿,机构持续买入")。

> 说明:这是一个**透明的规则打分**,不是黑箱模型。面试时可以清楚讲出每个信号的逻辑依据,这正是研究员该有的能力。

---

## 五、页面布局(page.tsx)

```
┌──────────────────────────────────────────────────┐
│ Header (标题 + 刷新)                               │
├──────────────────────────────────────────────────┤
│ 【Row 0】CycleStageBanner  ← 顶部核心判断,全宽      │
│   Risk-On/Off 大字 + 综合分 + 6个层信号灯           │
├──────────────────────────────────────────────────┤
│ 【Row 1】KPI 卡 x6                                  │
│   BTC价 · ETH价 · 总市值 · BTC.D · ETF净流入 · F&G  │
├──────────────────────────────────────────────────┤
│ 【Row 2】BTC 价格走势(全宽)                         │
├──────────────────────────────────────────────────┤
│ 【Row 3】机构需求层                                 │
│   EtfFlowChart(BTC ETF流) │ EtfFlowChart(ETH ETF) │
├──────────────────────────────────────────────────┤
│ 【Row 4】市场结构层                                 │
│   DerivativesChart(费率+OI) │ LongShortGauge+F&G   │
├──────────────────────────────────────────────────┤
│ 【Row 5】流动性层                                   │
│   M2BtcChart │ MacroCards(利率+美债+DXY)           │
├──────────────────────────────────────────────────┤
│ 【Row 6】资金流入 + 风险偏好                        │
│   LiquidityChart(稳定币+TVL) │ DominanceChart      │
├──────────────────────────────────────────────────┤
│ 【Row 7】股市联动 + 市场总览                        │
│   StockChart │ CoinTable                           │
└──────────────────────────────────────────────────┘
```

布局逻辑:**从上到下 = 从宏观判断到细分证据**,顶部给结论,下面逐层展开支撑数据。

---

## 六、分阶段实施

| Phase | 内容 | 交付 |
|-------|------|------|
| **P1 数据层** | 新增 etf/derivatives/signal 三个 route + 改 fred 加 DXY + types + fetchers + formatters | API 全部可 curl 验证 |
| **P2 ETF 模块** | EtfFlowChart(BTC+ETH)+ KPI 加 ETF 卡 | ETF 图渲染正确 |
| **P3 市场结构模块** | DerivativesChart + LongShortGauge + 组合信号解读 | 费率/OI/多空比展示 |
| **P4 信号引擎** | lib/signals.ts 打分逻辑 + CycleStageBanner + signal route | 顶部判断卡工作 |
| **P5 布局整合** | MacroCards 加 DXY + page.tsx 按新框架重排 | 全页面按新布局 |
| **P6 测试部署** | tsc 检查 + 预览验证 + git push | 上线 |

每个 Phase 完成后确认无 bug 再进入下一阶段。

---

## 七、面试叙事(为什么这样设计)

- **框架化思维**:不是罗列指标,而是用传导链条组织,回答"周期在哪个阶段"
- **理解市场结构**:资金费率+OI 组合信号,是衍生品分析的核心,对口 Binance Research
- **机构视角**:ETF 流是本轮周期主线,放在核心位置
- **工程严谨**:处理了地理封锁(OKX 替代 Binance)、缓存陷阱、数据源选型
- **透明可解释**:综合信号是规则打分不是黑箱,每个判断都能讲出依据
