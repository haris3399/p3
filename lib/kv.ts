import { promises as fs } from 'node:fs'
import path from 'node:path'

// Tiny key-value storage.
//  - Netlify par: Netlify Blobs (free, permanent, koi database setup nahi)
//  - Local (pnpm dev): .data/<store>.json file
// NOTE: Vercel par filesystem permanent nahi hota — wahan Vercel Blob/KV adapter lagana hoga
// (sirf is file ke 4 functions badalne hain).
export const useBlobs = () =>
  Boolean(process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT || process.env.NETLIFY_LOCAL)

async function blobs(store: string) {
  const { getStore } = await import('@netlify/blobs')
  return getStore({ name: store, consistency: 'strong' })
}

const file = (store: string) => path.join(process.cwd(), '.data', `${store}.json`)

async function readLocal(store: string): Promise<Record<string, unknown>> {
  try {
    return JSON.parse(await fs.readFile(file(store), 'utf8'))
  } catch {
    return {}
  }
}

async function writeLocal(store: string, data: Record<string, unknown>) {
  await fs.mkdir(path.dirname(file(store)), { recursive: true })
  await fs.writeFile(file(store), JSON.stringify(data, null, 2))
}

export async function kvGet<T>(store: string, key: string): Promise<T | null> {
  if (useBlobs()) return ((await (await blobs(store)).get(key, { type: 'json' })) as T | null) ?? null
  return ((await readLocal(store))[key] as T | undefined) ?? null
}

export async function kvSet(store: string, key: string, value: unknown): Promise<void> {
  if (useBlobs()) {
    await (await blobs(store)).setJSON(key, value as Record<string, unknown>)
    return
  }
  const data = await readLocal(store)
  data[key] = value
  await writeLocal(store, data)
}

export async function kvDelete(store: string, key: string): Promise<void> {
  if (useBlobs()) {
    await (await blobs(store)).delete(key)
    return
  }
  const data = await readLocal(store)
  delete data[key]
  await writeLocal(store, data)
}

export async function kvList<T>(store: string): Promise<T[]> {
  if (useBlobs()) {
    const s = await blobs(store)
    const { blobs: entries } = await s.list()
    const all = await Promise.all(entries.map((e) => s.get(e.key, { type: 'json' }) as Promise<T | null>))
    return all.filter((x): x is T => Boolean(x))
  }
  return Object.values(await readLocal(store)) as T[]
}
