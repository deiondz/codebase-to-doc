// lib/routeMatcher.ts
import type { NextRequest } from 'next/server'

export function createRouteMatcher(patterns: string[]) {
  return (req: NextRequest) =>
    patterns.some((pattern) => {
      if (pattern.endsWith('/:path*')) {
        const base = pattern.replace('/:path*', '')
        return req.nextUrl.pathname.startsWith(base)
      }
      return req.nextUrl.pathname === pattern
    })
}
