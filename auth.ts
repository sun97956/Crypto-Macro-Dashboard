import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'
import type { NextAuthConfig } from 'next-auth'

// 只启用已配置 client id 的登录方式(GitHub / Google)
const providers: NextAuthConfig['providers'] = []
if (process.env.AUTH_GITHUB_ID) providers.push(GitHub)
if (process.env.AUTH_GOOGLE_ID) providers.push(Google)

// 邮箱白名单(逗号分隔)。留空 = 允许任何通过认证的账号登录。
const allowed = (process.env.ALLOWED_EMAILS ?? '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  trustHost: true, // Vercel 部署必需
  pages: { signIn: '/login' },
  callbacks: {
    // 白名单校验:只放行名单内的邮箱
    signIn({ profile, user }) {
      if (allowed.length === 0) return true
      const email = (profile?.email ?? user?.email ?? '').toLowerCase()
      return allowed.includes(email)
    },
    // 未登录访问受保护路由 → 跳转登录页
    authorized({ auth }) {
      return !!auth?.user
    },
  },
})
