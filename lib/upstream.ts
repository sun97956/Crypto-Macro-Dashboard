/**
 * 上游 API 请求封装
 * - 统一 15s 超时控制
 * - 非 2xx 状态码抛出错误
 * - Vercel 服务端直连，无需代理处理
 */
export async function upstreamFetch(
  url: string,
  options?: RequestInit,
  timeoutMs = 15000
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    if (!res.ok) {
      throw new Error(`Upstream ${res.status}: ${url}`)
    }
    return res
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new Error(`Upstream timeout (${timeoutMs}ms): ${url}`)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}
