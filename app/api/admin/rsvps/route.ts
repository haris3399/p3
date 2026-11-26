import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { listRsvps } from '@/lib/store'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    return NextResponse.json({ rsvps: await listRsvps() }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('RSVP list failed', error)
    return NextResponse.json({ error: 'Could not load responses.' }, { status: 500 })
  }
}
