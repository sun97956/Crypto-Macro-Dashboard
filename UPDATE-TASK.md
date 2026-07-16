# Update Task List

## Phase 1 — 基础层（类型 / Fetcher / Formatter）

### T1.1 `lib/types.ts`
- [ ] 新增 `DominanceItem`、`DominanceData` 类型
- [ ] 新增 `LiquidityItem`、`LiquidityData` 类型
- [ ] 新增 `StockItem`、`StockData` 类型
- [ ] 修改 `MacroFredData`：删除 `DEXUSEU`、`CPIAUCSL`，新增 `SP500`、`NASDAQ100`（历史数组）

### T1.2 `lib/fetchers.ts`
- [ ] 新增 `fetchDominance`
- [ ] 新增 `fetchLiquidity`
- [ ] 新增 `fetchStock`

### T1.3 `lib/formatters.ts`
- [ ] 新增 `formatDominance(v: number): string` → `"57.3%"`
- [ ] 新增 `formatTVL(v: number): string` → `"$172.8B"`

---

## Phase 2 — API Routes

### T2.1 修改 `/api/crypto/m2btc/route.ts`
- [ ] 读取 `?days=30|90|365` 参数（默认 365）
- [ ] 按 days 截取返回数据（现在固定全量）
- [ ] 缓存头保持 `s-maxage=3600`

### T2.2 修改 `/api/macro/fred/route.ts`
- [ ] 删除 `DEXUSEU`、`CPIAUCSL` 两个 series
- [ ] 新增 `SP500` 历史序列（FRED，返回最近 365 个交易日数组）
- [ ] 新增 `NASDAQ100` 历史序列（FRED，返回最近 365 个交易日数组）
- [ ] `FEDFUNDS`、`DGS10` 保持单值返回
- [ ] 缓存头改为 `s-maxage=86400`

### T2.3 新增 `/api/crypto/dominance/route.ts`
- [ ] 读取 `?days=30|90|365` 参数（默认 90）
- [ ] 并发请求：
  - CoinGecko BTC market_chart（market_caps）
  - CoinGecko ETH market_chart（market_caps）
  - CoinGecko global/market_cap_chart
- [ ] 按日期合并，计算 `btcDominance = btcCap / totalCap * 100`、`ethDominance = ethCap / totalCap * 100`
- [ ] 返回 `[{ date, btcDominance, ethDominance }]`
- [ ] 缓存头 `s-maxage=3600`

### T2.4 新增 `/api/liquidity/route.ts`
- [ ] 读取 `?days=90|180|365` 参数（默认 90）
- [ ] 并发请求：
  - DeFiLlama `stablecoins.llama.fi/stablecoincharts/all`
  - DeFiLlama `api.llama.fi/charts`
- [ ] 按日期合并，截取最近 N 天
- [ ] 返回 `[{ date, stablecoin, tvl }]`（单位：十亿美元）
- [ ] 缓存头 `s-maxage=86400`

---

## Phase 3 — 修改现有组件

### T3.1 `components/KpiSection.tsx`
- [ ] 删除 Fear & Greed KPI 卡片
- [ ] 新增 ETH Dominance 卡片（从 `/api/crypto/global` 取 `ethDominance` 字段）
- [ ] 确认 6 个卡片顺序：BTC Price / ETH Price / Total Market Cap / BTC Dominance / ETH Dominance / Stablecoin Cap

### T3.2 `app/api/crypto/global/route.ts`
- [ ] 返回数据中新增 `ethDominance` 字段（CMC 接口已有 `eth_dominance`）

### T3.3 `components/M2BtcChart.tsx`
- [ ] 新增 30D / 90D / 365D tab（参考 PriceChart 写法）
- [ ] tab 切换时请求 `/api/crypto/m2btc?days=30|90|365`
- [ ] 默认显示 365D

### T3.4 `components/FearGreedChart.tsx`
- [ ] 新增 30D / 90D / 365D tab
- [ ] tab 切换时请求 `/api/sentiment?limit=30|90|365`
- [ ] 默认显示 30D

### T3.5 `components/MacroCards.tsx`
- [ ] 删除 EUR/USD、CPI Index 两个卡片
- [ ] 保留 Fed Funds Rate、10Y Treasury
- [ ] 布局从 2×2 改为 1×2（垂直排列两个卡片）

---

## Phase 4 — 新增组件

### T4.1 新增 `components/StockChart.tsx`
- [ ] 数据：从 `/api/macro/fred` 取 SP500 / NASDAQ100 历史数组
- [ ] 双线折线图（ComposedChart 或 LineChart）
- [ ] SP500 用蓝色（`#58A6FF`），NASDAQ 用紫色（`#D2A8FF`）
- [ ] 支持 **3M / 6M / 1Y** tab（前端过滤，数据统一拉 1Y）
- [ ] 默认显示 1Y
- [ ] 自定义 Tooltip（显示日期 + 两个指数值）
- [ ] 骨架屏 + 错误状态

### T4.2 新增 `components/DominanceChart.tsx`
- [ ] 数据：`/api/crypto/dominance?days=90`
- [ ] 双线折线图
- [ ] BTC 线用蓝色（`#58A6FF`），ETH 线用紫色（`#D2A8FF`）
- [ ] 支持 **30D / 90D / 365D** tab
- [ ] Y 轴范围 0–100，`tickFormatter` 显示 `%`
- [ ] 自定义 Tooltip（显示日期 + BTC% + ETH%）
- [ ] 骨架屏 + 错误状态

### T4.3 新增 `components/LiquidityChart.tsx`
- [ ] 数据：`/api/liquidity?days=90`
- [ ] 双线双 Y 轴图（Stablecoin 左轴，TVL 右轴）
- [ ] Stablecoin 线用绿色（`#3FB950`），TVL 线用黄色（`#E3B341`）
- [ ] 支持 **90D / 180D / 365D** tab
- [ ] 自定义 Tooltip（显示日期 + Stablecoin + TVL，单位 B）
- [ ] 骨架屏 + 错误状态

---

## Phase 5 — 页面布局更新

### T5.1 `app/page.tsx`
- [ ] Row 3：`M2BtcChart` | `FearGreedChart`（原 Row 4 左移）
- [ ] Row 4：`DominanceChart` | `LiquidityChart`（新增）
- [ ] Row 5：`StockChart`（左，约 60% 宽）| `MacroCards`（右，约 40% 宽）+ `CoinTable`
  - 具体：Row 5 用 `grid-cols-5`，StockChart 占 3 列，MacroCards 占 2 列
  - Row 6：`CoinTable`（全宽 or 右侧）
- [ ] 删除原 Row 4 右侧 `CoinTable` 单独行处理
- [ ] 最终行确认不超过 6 行，整体高度合理

> **注意**：Row 5 / Row 6 布局需在浏览器预览后微调，CoinTable 高度和 StockChart + MacroCards 对齐。

---

## Phase 6 — 测试与部署

### T6.1 本地测试
- [ ] 逐个 API route curl 测试返回格式正确
- [ ] 浏览器检查所有模块正常加载
- [ ] 检查控制台无报错
- [ ] 测试所有时间 tab 切换正常
- [ ] 测试 Refresh 按钮全量刷新

### T6.2 部署
- [ ] `git add` + `git commit`
- [ ] `git push origin master:main`
- [ ] Vercel 自动触发部署
- [ ] 验证线上 `crypto-macro-dashboard.vercel.app` 正常

---

## 改动文件总览

| 文件 | 类型 |
|------|------|
| `lib/types.ts` | 修改 |
| `lib/fetchers.ts` | 修改 |
| `lib/formatters.ts` | 修改 |
| `app/api/crypto/m2btc/route.ts` | 修改 |
| `app/api/crypto/global/route.ts` | 修改 |
| `app/api/crypto/dominance/route.ts` | 新增 |
| `app/api/liquidity/route.ts` | 新增 |
| `app/api/macro/fred/route.ts` | 修改 |
| `components/KpiSection.tsx` | 修改 |
| `components/M2BtcChart.tsx` | 修改 |
| `components/FearGreedChart.tsx` | 修改 |
| `components/MacroCards.tsx` | 修改 |
| `components/StockChart.tsx` | 新增 |
| `components/DominanceChart.tsx` | 新增 |
| `components/LiquidityChart.tsx` | 新增 |
| `app/page.tsx` | 修改 |
