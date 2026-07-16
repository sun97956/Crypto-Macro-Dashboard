# Dashboard 更新计划

## 目标概述

在现有 Dashboard 基础上进行以下改动：
1. M2 vs BTC 图表加时间 tab
2. Fear & Greed KPI 卡片去重，图表加时间 tab
3. MacroCards 替换两个指标，新增标普/纳斯达克图表
4. 新增 BTC + ETH Dominance 历史图
5. 新增 Stablecoin 市值 + DeFi TVL 历史图

---

## 一、数据来源变更

### 新增数据源：DeFiLlama（免费，无需 API Key）

| 接口 | 用途 |
|------|------|
| `https://stablecoins.llama.fi/stablecoincharts/all` | Stablecoin 总市值历史，每日，2017 至今 |
| `https://api.llama.fi/charts` | DeFi 总锁仓量 TVL 历史，每日，2019 至今 |

### 新增 FRED 数据系列

| Series ID | 指标 | 替换说明 |
|-----------|------|----------|
| `SP500` | 标普 500 指数历史 | 新增 |
| `NASDAQ100` | 纳斯达克 100 历史 | 新增 |
| ~~`DEXUSEU`~~ | ~~EUR/USD~~ | **删除** |
| ~~`CPIAUCSL`~~ | ~~CPI Index~~ | **删除** |

保留：`FEDFUNDS`（联邦基金利率）、`DGS10`（10Y 国债）

### 现有 CoinGecko 接口扩展

| 接口 | 变更 |
|------|------|
| `/api/crypto/m2btc` | 新增 `days` 参数，支持 30 / 90 / 365 |
| `/api/sentiment` | 已有 `limit` 参数，前端 tab 对应传 30 / 90 / 365 |
| 新增 `/api/crypto/dominance` | BTC + ETH 历史市值 ÷ 全球总市值，支持 `?days=30/90/365` |

---

## 二、前端布局变更

### 当前布局（5 行）

```
Row 1: KPI Cards × 6
Row 2: BTC Price Chart（全宽）
Row 3: M2 vs BTC | Macro Cards
Row 4: Fear & Greed | Coin Table
```

### 更新后布局（6 行）

```
Row 1: KPI Cards × 6（Fear & Greed 卡片保留，内容不变）
Row 2: BTC Price Chart（全宽）
Row 3: M2 vs BTC | Fear & Greed Chart
Row 4: Dominance Chart（BTC+ETH）| Stablecoin + TVL Chart
Row 5: Macro Cards（标普/纳指图） | Coin Table
```

> Macro Cards 原来是 2×2 四个小卡片，改为左侧放标普/纳指折线图，右侧保留 Fed Rate + 10Y Treasury 两个卡片。

---

## 三、各组件具体改动

### 1. `KpiSection.tsx`
- **删除**：Fear & Greed KPI 卡片（与图表重复）
- **新增**：ETH Dominance 卡片（从 `/api/crypto/global` 取 `ethDominance` 字段）
- 6 个卡片变为：BTC Price / ETH Price / Total Market Cap / BTC Dominance / ETH Dominance / Stablecoin Cap

### 2. `M2BtcChart.tsx`
- 新增 **30D / 90D / 365D** tab（对标 PriceChart 的做法）
- tab 切换时向 `/api/crypto/m2btc?days=30/90/365` 发请求
- 默认显示 365D

### 3. `FearGreedChart.tsx`
- 新增 **30D / 90D / 365D** tab
- tab 切换时向 `/api/sentiment?limit=30/90/365` 发请求
- 默认显示 30D
- 从 Row 4 左侧移到 Row 3 右侧（与 M2BtcChart 并排）

### 4. `MacroCards.tsx`（重构）
- **删除**：EUR/USD、CPI Index 两个卡片
- **保留**：Fed Funds Rate、10Y Treasury 两个卡片（移到右侧小区域）
- **新增**：标普 500 / 纳斯达克 100 折线图，放在左侧（占约 2/3 宽度）
- 整体拆分为两个子组件：`StockChart.tsx`（左）+ `MacroCards.tsx`（右，只剩2格）

### 5. 新增 `DominanceChart.tsx`
- 显示 BTC + ETH Dominance 历史折线图（双线）
- 数据来自 `/api/crypto/dominance?days=90`
- 支持 **30D / 90D / 365D** tab
- BTC 线用蓝色（`#58A6FF`），ETH 线用紫色（`#D2A8FF`）
- Y 轴显示百分比（0–100%）

### 6. 新增 `LiquidityChart.tsx`
- 显示 Stablecoin 总市值 + DeFi TVL 双线历史图
- 数据来自 `/api/liquidity`（新 API route，合并两个 DeFiLlama 接口）
- 支持 **90D / 180D / 365D** tab（DeFiLlama 数据量大，默认 90D）
- Stablecoin 线用绿色（`#3FB950`），TVL 线用橙色（`#E3B341`）
- 双 Y 轴（Stablecoin 量级更大）

### 7. `app/page.tsx`
- 按新布局调整 Row 3 / 4 / 5
- 引入新组件 `DominanceChart`、`LiquidityChart`、`StockChart`

---

## 四、新增 API Routes

### `/api/crypto/dominance`
- 方法：GET，参数 `?days=30|90|365`
- 并发请求：
  - CoinGecko `/coins/bitcoin/market_chart?days={days}&interval=daily`
  - CoinGecko `/coins/ethereum/market_chart?days={days}&interval=daily`
  - CoinGecko `/global/market_cap_chart?days={days}`
- 返回：按日期合并的 `[{ date, btcDominance, ethDominance }]` 数组
- 缓存：`s-maxage=3600`

### `/api/liquidity`
- 方法：GET，参数 `?days=90|180|365`
- 并发请求：
  - DeFiLlama `stablecoins.llama.fi/stablecoincharts/all`（全量，前端按 days 过滤）
  - DeFiLlama `api.llama.fi/charts`（全量，前端按 days 过滤）
- 返回：按日期合并的 `[{ date, stablecoin, tvl }]` 数组，截取最近 N 天
- 缓存：`s-maxage=86400`

### `/api/macro/fred` 修改
- 删除 `DEXUSEU`、`CPIAUCSL`
- 新增 `SP500`、`NASDAQ100`（历史序列，返回最近 N 个数据点）
- 返回结构调整：`FEDFUNDS` / `DGS10` 返回单值；`SP500` / `NASDAQ100` 返回历史数组用于画图

### `/api/crypto/m2btc` 修改
- 新增 `?days=30|90|365` 参数
- 按 days 截取返回数据量（现在固定返回全量）

---

## 五、新增 TypeScript 类型（`lib/types.ts`）

```ts
// Dominance
export type DominanceItem = { date: string; btcDominance: number; ethDominance: number }
export type DominanceData = DominanceItem[]

// Liquidity
export type LiquidityItem = { date: string; stablecoin: number; tvl: number }
export type LiquidityData = LiquidityItem[]

// Stock Chart
export type StockItem = { date: string; sp500: number | null; nasdaq: number | null }
export type StockData = StockItem[]
```

---

## 六、`lib/fetchers.ts` 新增

```ts
export const fetchDominance = (url: string) => fetcher<DominanceData>(url)
export const fetchLiquidity = (url: string) => fetcher<LiquidityData>(url)
export const fetchStock = (url: string) => fetcher<StockData>(url)
```

---

## 七、`lib/formatters.ts` 新增

- `formatDominance(v: number): string` → `"57.3%"`
- `formatTVL(v: number): string` → `"$172.8B"`（与 formatM2 类似）

---

## 八、改动文件清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `app/page.tsx` | 修改 | 新布局 |
| `app/api/crypto/m2btc/route.ts` | 修改 | 新增 days 参数 |
| `app/api/crypto/dominance/route.ts` | 新增 | BTC+ETH dominance 历史 |
| `app/api/liquidity/route.ts` | 新增 | Stablecoin + TVL |
| `app/api/macro/fred/route.ts` | 修改 | 替换指标，新增 SP500/NASDAQ |
| `components/KpiSection.tsx` | 修改 | 去掉 F&G，加 ETH dominance |
| `components/M2BtcChart.tsx` | 修改 | 加时间 tab |
| `components/FearGreedChart.tsx` | 修改 | 加时间 tab，移动位置 |
| `components/MacroCards.tsx` | 修改 | 删两个指标 |
| `components/StockChart.tsx` | 新增 | 标普/纳指折线图 |
| `components/DominanceChart.tsx` | 新增 | BTC+ETH dominance |
| `components/LiquidityChart.tsx` | 新增 | Stablecoin+TVL |
| `lib/types.ts` | 修改 | 新增 3 个类型 |
| `lib/fetchers.ts` | 修改 | 新增 3 个 fetcher |
| `lib/formatters.ts` | 修改 | 新增 2 个格式化函数 |

---

## 九、开发顺序建议

1. 修改 `lib/types.ts` / `lib/fetchers.ts` / `lib/formatters.ts`
2. 修改 `/api/crypto/m2btc` + `/api/macro/fred`
3. 新增 `/api/crypto/dominance` + `/api/liquidity`
4. 修改 `KpiSection.tsx`、`M2BtcChart.tsx`、`FearGreedChart.tsx`、`MacroCards.tsx`
5. 新增 `StockChart.tsx`、`DominanceChart.tsx`、`LiquidityChart.tsx`
6. 更新 `app/page.tsx` 布局
7. 全流程测试 + 推送部署
