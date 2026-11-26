import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { kvGet, kvSet } from '@/lib/kv'

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>

// ---------------------------------------------------------------------------
// Password kaise kaam karta hai (priority order):
//  1. FORCE_ADMIN_PASSWORD (env)  -> emergency reset: yeh hamesha jeet-ta hai
//  2. Dashboard se badla hua password (hash ke tor par save, plain text nahi)
//  3. ADMIN_PASSWORD (env)        -> optional
//  4. DEFAULT_PASSWORD (neeche)   -> pehli dafa login ke liye
// ---------------------------------------------------------------------------
const DEFAULT_PASSWORD = 'Admin@123321'

export const COOKIE_NAME = 'admin_session'
export const SESSION_SECONDS = 60 * 60 * 12 // 12 ghante
const SETTINGS_STORE = 'admin-settings'
const PASSWORD_KEY = 'password'

const hmac = (secret: string, value: string) => createHmac('sha256', secret).update(value).digest('hex')

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

async function storedHash() {
  const record = await kvGet<{ hash: string }>(SETTINGS_STORE, PASSWORD_KEY)
  return record?.hash || null
}

// "Credential version": password badalte hi yeh badal jata hai, is liye purane sessions khud invalid ho jate hain.
async function credentialVersion() {
  if (process.env.FORCE_ADMIN_PASSWORD) return `f:${process.env.FORCE_ADMIN_PASSWORD}`
  const hash = await storedHash()
  if (hash) return `h:${hash}`
  return `p:${process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD}`
}

async function sessionSecret() {
  return hmac(process.env.SESSION_SECRET || 'wedding-session', await credentialVersion())
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const derived = await scrypt(password, salt, 64)
  return `s1$${salt.toString('hex')}$${derived.toString('hex')}`
}

async function verifyHash(password: string, stored: string) {
  const [, saltHex, hashHex] = stored.split('$')
  if (!saltHex || !hashHex) return false
  const derived = await scrypt(password, Buffer.from(saltHex, 'hex'), 64)
  return safeEqual(derived.toString('hex'), hashHex)
}

export async function checkPassword(input: string) {
  const compare = (expected: string) => safeEqual(hmac('pw', input), hmac('pw', expected))
  if (process.env.FORCE_ADMIN_PASSWORD) return compare(process.env.FORCE_ADMIN_PASSWORD)
  const hash = await storedHash()
  if (hash) return verifyHash(input, hash)
  return compare(process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD)
}

export const passwordIsLocked = () => Boolean(process.env.FORCE_ADMIN_PASSWORD)

export async function setPassword(newPassword: string) {
  await kvSet(SETTINGS_STORE, PASSWORD_KEY, { hash: await hashPassword(newPassword), updatedAt: new Date().toISOString() })
}

export async function createSession() {
  const expires = Date.now() + SESSION_SECONDS * 1000
  return `${expires}.${hmac(await sessionSecret(), `session:${expires}`)}`
}

export async function verifySession(token: string | undefined | null) {
  if (!token) return false
  const [expires, signature] = token.split('.')
  if (!expires || !signature) return false
  if (!safeEqual(signature, hmac(await sessionSecret(), `session:${expires}`))) return false
  return Number(expires) > Date.now()
}

export async function isAdminRequest(request: Request) {
  const cookie = request.headers.get('cookie') || ''
  const match = cookie.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE_NAME}=`))
  return verifySession(match ? decodeURIComponent(match.slice(COOKIE_NAME.length + 1)) : null)
}

export const sessionCookie = (value: string, maxAge = SESSION_SECONDS) => ({
  name: COOKIE_NAME,
  value,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge,
})

// Simple rate limit (spam / password guessing se bachane ke liye)
const hits = new Map<string, { count: number; reset: number }>()
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const entry = hits.get(key)
  if (!entry || entry.reset < now) {
    hits.set(key, { count: 1, reset: now + windowMs })
    return true
  }
  entry.count += 1
  return entry.count <= limit
}

export function clientIp(request: Request) {
  return (request.headers.get('x-nf-client-connection-ip') || request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim()
}
