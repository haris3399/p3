import { kvDelete, kvGet, kvList, kvSet } from '@/lib/kv'

export type Rsvp = {
  id: string
  name: string
  attendance: 'joyfully' | 'regretfully'
  guests: number
  dietary: string
  events: string
  message: string
  createdAt: string
  updatedAt: string
}

const STORE = 'rsvps'

export async function listRsvps(): Promise<Rsvp[]> {
  const items = await kvList<Rsvp>(STORE)
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
export const getRsvp = (id: string) => kvGet<Rsvp>(STORE, id)
export const saveRsvp = (rsvp: Rsvp) => kvSet(STORE, rsvp.id, rsvp)
export const deleteRsvp = (id: string) => kvDelete(STORE, id)
