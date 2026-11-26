'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Eye, EyeOff, KeyRound, Lock, LogOut, RefreshCw, Search, Trash2 } from 'lucide-react'
import { adminConfig } from '@/lib/admin-config'

type Rsvp = {
  id: string
  name: string
  attendance: 'joyfully' | 'regretfully'
  guests: number
  dietary?: string
  events?: string
  message: string
  createdAt: string
  updatedAt: string
}

type Filter = 'all' | 'joyfully' | 'regretfully'

const labels: Record<string, string> = { ...adminConfig.events }

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export function AdminDashboard() {
  const [state, setState] = useState<'checking' | 'login' | 'ready'>('checking')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [rsvps, setRsvps] = useState<Rsvp[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [pwOpen, setPwOpen] = useState(false)
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwShow, setPwShow] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwDone, setPwDone] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/rsvps', { cache: 'no-store' })
      if (res.status === 401) {
        setState('login')
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not load responses.')
      setRsvps(data.rsvps)
      setState('ready')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load responses.')
      setState((s) => (s === 'checking' ? 'ready' : s))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleLogin(event: FormEvent) {
    event.preventDefault()
    setLoggingIn(true)
    setLoginError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setLoginError(data.error || 'Login failed.')
        return
      }
      setPassword('')
      await load()
    } catch {
      setLoginError('Network error. Please try again.')
    } finally {
      setLoggingIn(false)
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    setRsvps([])
    setState('login')
  }

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault()
    setPwError('')
    setPwDone(false)
    if (pwNew.length < 8) return setPwError('New password must be at least 8 characters.')
    if (!/[A-Za-z]/.test(pwNew) || !/\d/.test(pwNew)) return setPwError('Use at least one letter and one number.')
    if (pwNew !== pwConfirm) return setPwError('New password and confirmation do not match.')
    setPwSaving(true)
    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setPwError(data.error || 'Could not change the password.')
        return
      }
      setPwCurrent('')
      setPwNew('')
      setPwConfirm('')
      setPwDone(true)
    } catch {
      setPwError('Network error. Please try again.')
    } finally {
      setPwSaving(false)
    }
  }

  async function handleDelete(rsvp: Rsvp) {
    if (!window.confirm(`Delete the response from ${rsvp.name}?`)) return
    const res = await fetch(`/api/admin/rsvps/${rsvp.id}`, { method: 'DELETE' })
    if (res.ok) setRsvps((items) => items.filter((r) => r.id !== rsvp.id))
    else setError('Could not delete this response.')
  }

  const stats = useMemo(() => {
    const attending = rsvps.filter((r) => r.attendance === 'joyfully')
    return {
      total: rsvps.length,
      attending: attending.length,
      declined: rsvps.length - attending.length,
      guests: attending.reduce((sum, r) => sum + r.guests, 0),
    }
  }, [rsvps])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rsvps.filter(
      (r) => (filter === 'all' || r.attendance === filter) && (!q || r.name.toLowerCase().includes(q) || r.message.toLowerCase().includes(q)),
    )
  }, [rsvps, query, filter])

  if (state === 'checking') {
    return <main className="admin-page admin-center"><p className="admin-muted">Loading…</p></main>
  }

  if (state === 'login') {
    return (
      <main className="admin-page admin-center">
        <form className="admin-login" onSubmit={handleLogin}>
          <span className="admin-lock"><Lock size={20} /></span>
          <p className="admin-eyebrow">Private area</p>
          <h1>{adminConfig.loginTitle}</h1>
          <label className="admin-label" htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            autoFocus
            required
          />
          {loginError && <p className="admin-error" role="alert">{loginError}</p>}
          <button className="admin-btn admin-btn-primary" type="submit" disabled={loggingIn}>
            {loggingIn ? 'Checking…' : 'Sign in'}
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className="admin-page">
      <div className="admin-wrap">
        <header className="admin-top">
          <div>
            <p className="admin-eyebrow">{adminConfig.coupleNames}</p>
            <h1>{adminConfig.adminTitle}</h1>
          </div>
          <div className="admin-actions">
            <button className="admin-btn" onClick={load} disabled={loading}><RefreshCw size={14} className={loading ? 'admin-spin' : ''} /> Refresh</button>
            <a className="admin-btn" href="/api/admin/export"><Download size={14} /> Export CSV</a>
            <button className="admin-btn" onClick={() => { setPwOpen((o) => !o); setPwError(''); setPwDone(false) }} aria-expanded={pwOpen}><KeyRound size={14} /> Change password</button>
            <button className="admin-btn" onClick={handleLogout}><LogOut size={14} /> Sign out</button>
          </div>
        </header>

        {pwOpen && (
          <form className="admin-pw-panel" onSubmit={handleChangePassword}>
            <h2>Change password</h2>
            <div className="admin-pw-grid">
              <label>Current password
                <input type={pwShow ? 'text' : 'password'} value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} autoComplete="current-password" required />
              </label>
              <label>New password
                <input type={pwShow ? 'text' : 'password'} value={pwNew} onChange={(e) => setPwNew(e.target.value)} autoComplete="new-password" minLength={8} maxLength={100} required />
              </label>
              <label>Confirm new password
                <input type={pwShow ? 'text' : 'password'} value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} autoComplete="new-password" minLength={8} maxLength={100} required />
              </label>
            </div>
            <p className="admin-hint">At least 8 characters, with a letter and a number.</p>
            {pwError && <p className="admin-error" role="alert">{pwError}</p>}
            {pwDone && <p className="admin-success" role="status">Password changed. Other devices will need to sign in again.</p>}
            <div className="admin-pw-actions">
              <button type="submit" className="admin-btn admin-btn-solid" disabled={pwSaving}>{pwSaving ? 'Saving…' : 'Save new password'}</button>
              <button type="button" className="admin-btn" onClick={() => setPwShow((v) => !v)}>{pwShow ? <EyeOff size={14} /> : <Eye size={14} />} {pwShow ? 'Hide' : 'Show'}</button>
              <button type="button" className="admin-btn" onClick={() => setPwOpen(false)}>Close</button>
            </div>
          </form>
        )}

        <section className="admin-stats" aria-label="Summary">
          <div><span>{stats.total}</span><small>Replies</small></div>
          <div><span>{stats.attending}</span><small>Attending</small></div>
          <div><span>{stats.declined}</span><small>Declined</small></div>
          <div className="admin-stat-key"><span>{stats.guests}</span><small>Total guests coming</small></div>
        </section>

        {error && <p className="admin-error" role="alert">{error}</p>}

        <div className="admin-toolbar">
          <label className="admin-search">
            <Search size={15} />
            <input type="search" placeholder="Search by name or message" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <div className="admin-filters" role="group" aria-label="Filter">
            {([['all', 'All'], ['joyfully', 'Attending'], ['regretfully', 'Declined']] as const).map(([value, label]) => (
              <button key={value} className={filter === value ? 'is-active' : ''} onClick={() => setFilter(value)}>{label}</button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="admin-empty">{rsvps.length === 0 ? 'No responses yet. They will appear here as guests reply.' : 'No responses match your search.'}</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Guest</th><th>Response</th><th>Guests</th><th>Attending</th><th>Notes</th><th>Received</th><th /></tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Guest" className="admin-name">{r.name}</td>
                    <td data-label="Response"><span className={`admin-badge admin-badge--${r.attendance}`}>{r.attendance === 'joyfully' ? 'Attending' : 'Declined'}</span></td>
                    <td data-label="Guests">{r.attendance === 'joyfully' ? r.guests : '—'}</td>
                    <td data-label="Attending">{r.events ? labels[r.events] || r.events : '—'}</td>
                    <td data-label="Notes" className="admin-message">
                      {r.dietary && <span className="admin-note-line"><b>Dietary:</b> {r.dietary}</span>}
                      {r.message || (!r.dietary && '—')}
                    </td>
                    <td data-label="Received" className="admin-date">{formatDate(r.createdAt)}{r.updatedAt !== r.createdAt ? ' (edited)' : ''}</td>
                    <td className="admin-row-actions"><button aria-label={`Delete ${r.name}`} onClick={() => handleDelete(r)}><Trash2 size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
