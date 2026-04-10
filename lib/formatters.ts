/**
 * 价格格式化
 * 1234567.89 → "$1,234,567.89"
 * 71613      → "$71,613"
 */
export function formatPrice(value: number): string {
  if (value >= 1000) {
    return '$' + value.toLocaleString('en-US', { maximumFractionDigits: 0 })
  }
  if (value >= 1) {
    return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  // 小于 1 的稳定币或小币种
  return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 })
}

/**
 * 市值/大数格式化
 * 2510000000000 → "$2.51T"
 * 289000000000  → "$289.0B"
 * 1500000000    → "$1.5B"
 */
export function formatMarketCap(value: number): string {
  if (value >= 1e12) {
    return '$' + (value / 1e12).toFixed(2) + 'T'
  }
  if (value >= 1e9) {
    return '$' + (value / 1e9).toFixed(1) + 'B'
  }
  if (value >= 1e6) {
    return '$' + (value / 1e6).toFixed(1) + 'M'
  }
  return '$' + value.toLocaleString('en-US')
}

/**
 * 百分比格式化（带正负号）
 * 0.51  → "+0.51%"
 * -2.3  → "-2.30%"
 * 0     → "0.00%"
 */
export function formatPct(value: number): string {
  const fixed = Math.abs(value).toFixed(2)
  if (value > 0) return `+${fixed}%`
  if (value < 0) return `-${fixed}%`
  return `${fixed}%`
}

/**
 * M2 供应量格式化（万亿美元）
 * 22667.3 (十亿) → "$22.67T"
 */
export function formatM2(valueB: number): string {
  return '$' + (valueB / 1000).toFixed(2) + 'T'
}

/**
 * 日期格式化
 * "2026-04-10T14:32:05Z" → "2026-04-10 14:32:05"
 */
export function formatUpdatedAt(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-CA') // YYYY-MM-DD
  const time = d.toLocaleTimeString('en-GB', { hour12: false }) // HH:MM:SS
  return `${date} ${time}`
}
