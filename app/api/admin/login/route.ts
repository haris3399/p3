import { NextResponse } from 'next/server'
import { checkPassword, clientIp, createSession, rateLimit, sessionCookie } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!rateLimit(`login:${clientIp(request)}`, 8, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 })
  }
  let password = ''
  try {
    password = String((await request.json()).password ?? '')
  } catch {}

  await new Promise((resolve) => setTimeout(resolve, 500))

  if (!(await checkPassword(password))) {
    return NextResponse.json({ error: 'Wrong password.' }, { status: 401 })
  }
  const response = NextResponse.json({ ok: true })
  response.cookies.set(sessionCookie(await createSession()))
  return response
}
