import { NextResponse } from 'next/server'
import { checkPassword, clientIp, createSession, isAdminRequest, passwordIsLocked, rateLimit, sessionCookie, setPassword } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!rateLimit(`pw:${clientIp(request)}`, 6, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 })
  }
  if (passwordIsLocked()) {
    return NextResponse.json({ error: 'Password is locked by the FORCE_ADMIN_PASSWORD setting on the server. Remove it first.' }, { status: 409 })
  }

  let current = ''
  let next = ''
  try {
    const body = await request.json()
    current = String(body.currentPassword ?? '')
    next = String(body.newPassword ?? '')
  } catch {}

  await new Promise((resolve) => setTimeout(resolve, 500))

  if (!(await checkPassword(current))) return NextResponse.json({ error: 'Current password is wrong.' }, { status: 401 })
  if (next.length < 8) return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 })
  if (next.length > 100) return NextResponse.json({ error: 'New password is too long (max 100).' }, { status: 400 })
  if (!/[A-Za-z]/.test(next) || !/\d/.test(next)) return NextResponse.json({ error: 'Use at least one letter and one number.' }, { status: 400 })
  if (next === current) return NextResponse.json({ error: 'New password must be different from the current one.' }, { status: 400 })

  await setPassword(next)
  // Purane sessions invalid ho gaye; is browser ko naya session de do taake logout na ho.
  const response = NextResponse.json({ ok: true })
  response.cookies.set(sessionCookie(await createSession()))
  return response
}
