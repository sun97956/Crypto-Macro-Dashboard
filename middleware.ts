export { auth as middleware } from '@/auth'

// 保护除登录页、认证接口、静态资源以外的所有路由(含数据接口)
export const config = {
  matcher: ['/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)'],
}
