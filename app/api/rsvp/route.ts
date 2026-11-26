import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { clientIp, rateLimit } from '@/lib/auth'
import { adminConfig } from '@/lib/admin-config'
import { getRsvp, saveRsvp, type Rsvp } from '@/lib/store'

export const dynamic = 'force-dynamic'

// Hard upper limit (lib/admin-config.ts). The page can lower it per invitation with ?guests=N,
// but the server never accepts more than this.
const MAX_GUESTS = adminConfig.maxGuests
const EVENTS = Object.keys(adminConfig.events)

const clean = (value: unknown, max: number) =>
  String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max)

const bad = (error: string) => NextResponse.json({ error }, { status: 400 })

export async function POST(request: Request) {
  if (!rateLimit(`rsvp:${clientIp(request)}`, 15, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Please try again in a few minutes.' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return bad('Invalid request.')
  }

  // honeypot: bots yeh hidden field bhar dete hain
  if (body.website) return NextResponse.json({ ok: true, id: randomUUID() })

  const name = clean(body.name, 100)
  const attendance = body.attendance === 'joyfully' || body.attendance === 'regretfully' ? body.attendance : null
  const message = clean(body.message, 500)

  if (name.length < 2) return bad('Please enter your full name.')
  if (!attendance) return bad('Please let us know whether you will attend.')

  let guests = 0
  let dietary = ''
  let events = ''

  // Declined guests only keep name and message; the other answers are discarded.
  if (attendance === 'joyfully') {
    guests = Math.min(Math.max(Math.round(Number(body.guests)) || 1, 1), MAX_GUESTS)
    events = clean(body.events, 30)
    dietary = clean(body.dietary, 300)
    if (!EVENTS.includes(events)) return bad('Please tell us which part of the celebration you will attend.')
  }

  try {
    const now = new Date().toISOString()
    const existingId = typeof body.id === 'string' ? body.id : ''
    const existing = existingId ? await getRsvp(existingId) : null
    // A repeat submission from the same browser (same id) updates the earlier reply.

    const rsvp: Rsvp = {
      id: existing?.id ?? randomUUID(),
      name,
      attendance,
      guests,
      dietary,
      events,
      message,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    await saveRsvp(rsvp)
    return NextResponse.json({ ok: true, id: rsvp.id })
  } catch (error) {
    console.error('RSVP save failed', error)
    return NextResponse.json({ error: 'Sorry, something went wrong. Please try again.' }, { status: 500 })
  }
}
