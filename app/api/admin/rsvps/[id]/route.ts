import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { deleteRsvp } from '@/lib/store'

export const dynamic = 'force-dynamic'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await deleteRsvp(id)
  return NextResponse.json({ ok: true })
}
