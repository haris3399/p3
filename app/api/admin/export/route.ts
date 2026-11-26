import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { adminConfig } from '@/lib/admin-config'
import { listRsvps } from '@/lib/store'

export const dynamic = 'force-dynamic'

function cell(value: string | number) {
  let text = String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}` // Excel formula injection se bachao
  return `"${text.replace(/"/g, '""')}"`
}

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await listRsvps()
  const header = ['Name', 'Response', 'Guests', 'Dietary / allergies', 'Attending', 'Message', 'Submitted at']
  const lines = rows.map((r) =>
    [
      r.name,
      r.attendance === 'joyfully' ? 'Attending' : 'Declined',
      r.guests,
      r.dietary || '',
      (adminConfig.events as Record<string, string>)[r.events] || r.events || '',
      r.message,
      r.createdAt,
    ].map(cell).join(','),
  )
  const csv = '\uFEFF' + [header.map(cell).join(','), ...lines].join('\r\n')
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="rsvp-responses.csv"',
      'Cache-Control': 'no-store',
    },
  })
}
