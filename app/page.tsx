'use client'

import { FormEvent, useEffect, useState } from 'react'
import { ArrowDown, ArrowUpRight, CalendarDays, Check, ChevronDown, Clock3, MapPin, Menu, Music2, Sparkles } from 'lucide-react'

const weddingTime = new Date('2027-11-06T18:00:00-05:00').getTime()
const events = [
  { time: '6:00 PM', title: 'Wedding Ceremony', copy: 'An intimate exchange of vows, surrounded by our dearest family and friends.', icon: Sparkles },
  { time: '7:00 PM', title: 'Champagne Reception', copy: 'An elegant cocktail reception with champagne, beautiful music, and delightful conversation.', icon: Music2 },
  { time: '8:00 PM', title: 'Grand Wedding Dinner', copy: 'A sophisticated candlelit dinner, heartfelt speeches, and an evening of unforgettable elegance.', icon: CalendarDays },
  { time: '10:00 PM', title: 'The Grand Celebration', copy: 'Join us on the dance floor for music, laughter, and a night filled with beautiful memories.', icon: Music2 },
]
const chapters = [
  { number: 'I', title: 'When Our Worlds Met', copy: 'Every great story has a beginning. Ours started with an unexpected meeting that felt strangely familiar, as though two lives had been quietly moving toward the same beautiful moment.' },
  { number: 'II', title: 'The Beauty of Us', copy: 'Between late-night conversations, shared dreams, and the countless little moments that became our favorite memories, we discovered a love that felt both exciting and wonderfully peaceful.' },
  { number: 'III', title: 'The Forever Question', copy: 'Under a sky filled with stars, one question transformed our dreams into a promise. In that moment, we knew our greatest adventure would always be the life we built together.' },
  { number: 'IV', title: 'A Lifetime Ahead', copy: 'Now, surrounded by those who have loved and supported us, we are ready to begin the next chapter of our story — one filled with endless possibility and a love that grows stronger with every passing day.' },
]

function Ornament({ children }: { children: React.ReactNode }) {
  return <div className="ornament"><span />{children}<span /></div>
}

function Cover({ onOpen }: { onOpen: () => void }) {
  return <main className="cover" aria-label="Wedding invitation cover">
    <div className="cover-photo" />
    <div className="cover-shade" />
    <div className="cover-content">
      <button className="envelope-wrap envelope-trigger" onClick={onOpen} aria-label="Open the wedding invitation">
        <img className="envelope-art" src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/c93b661f-e323-4b7a-8dba-15f047b9272e-JbP4zgsSsdxpOtrM7ZXY8uh0tDoKLJ.png" alt="" />
      </button>
      <p className="cover-instruction">A celebration is waiting within</p>
    </div>
  </main>
}

function Countdown() {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const distance = Math.max(0, weddingTime - now)
  const values = [
    ['DAYS', Math.floor(distance / 86400000)],
    ['HOURS', Math.floor((distance / 3600000) % 24)],
    ['MINUTES', Math.floor((distance / 60000) % 60)],
    ['SECONDS', Math.floor((distance / 1000) % 60)],
  ]
  return <div className="countdown" aria-label="Countdown to the wedding">
    {values.map(([label, value]) => <div className="count-cell" key={label}><span className="count-number">{String(value).padStart(2, '0')}</span><span className="count-label">{label}</span></div>)}
  </div>
}

function Invitation() {
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [formError, setFormError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleRsvp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending) return
    const data = new FormData(event.currentTarget)
    setSending(true)
    setFormError('')
    try {
      let previousId = ''
      try { previousId = window.localStorage.getItem('rsvp-id') || '' } catch {}
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: previousId,
          name: data.get('name'),
          attendance: data.get('response'),
          guests: data.get('guests'),
          events: data.get('attendance'),
          dietary: data.get('dietary'),
          message: data.get('note'),
          website: data.get('website'),
        }),
      })
      const result = await res.json().catch(() => ({}))
      if (!res.ok) {
        setFormError(result.error || 'Sorry, something went wrong. Please try again.')
        return
      }
      try { if (result.id) window.localStorage.setItem('rsvp-id', result.id) } catch {}
      setSubmitted(true)
    } catch {
      setFormError('Network error. Please check your connection and try again.')
    } finally {
      setSending(false)
    }
  }
  return <main className="invitation">
    <nav className="nav-bar" aria-label="Main navigation">
      <a href="#intro" className="nav-mark">C <span>&</span> W</a>
      <button className="menu-toggle" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Menu size={20}/></button>
      <div className={`nav-links ${menuOpen ? 'nav-open' : ''}`}>
        {[['THE EVENING', '#events'], ['THE STORY', '#story'], ['RSVP', '#rsvp']].map(([label, href]) => <a key={label} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
      </div>
      <a className="nav-date" href="#date">06 — XI — 27</a>
    </nav>

    <section className="intro-section" id="intro">
      <div className="intro-image" />
      <div className="intro-overlay" />
      <div className="intro-content reveal">
        <p className="eyebrow">AN EVENING OF TIMELESS LOVE</p>
        <Ornament>TOGETHER WITH THEIR FAMILIES</Ornament>
        <h1>Charlotte <em>&</em><br/>William</h1>
        <p className="intro-copy">Some evenings become memories. Some moments become forever.<br className="desktop-break"/> With hearts full of love and gratitude, we invite you to join us for an<br className="desktop-break"/> extraordinary celebration of our wedding.</p>
        <a className="gold-button" href="#date">DISCOVER THE EVENING <ArrowDown size={14}/></a>
        <p className="intro-tagline">A night to remember. A love to last forever.</p>
      </div>
      <span className="vertical-caption">NEW YORK · NOVEMBER 2027</span>
    </section>

    <section className="date-section" id="date">
      <div className="section-topline"><span>Save the Date</span><span>06 NOVEMBER 2027</span></div>
      <div className="date-inner">
        <p className="eyebrow">SATURDAY, THE SIXTH OF NOVEMBER</p>
        <h2>The Night <em>Awaits</em></h2>
        <Ornament>UNTIL WE SAY “I DO”</Ornament>
        <Countdown />
        <div className="date-details"><span><CalendarDays size={15}/> SATURDAY, NOVEMBER 6, 2027</span><i/><span><Clock3 size={15}/> SIX O’CLOCK IN THE EVENING</span></div>
      </div>
    </section>

    <section className="venue-section" id="venue">
      <div className="venue-photo" />
      <div className="venue-copy">
        <p className="eyebrow">The Venue</p>
        <h2>An Iconic<br/><em>Evening</em></h2>
        <Ornament>THE PLAZA HOTEL</Ornament>
        <p className="venue-address"><MapPin size={15}/> FIFTH AVENUE, NEW YORK CITY</p>
        <p className="body-copy">In the heart of Manhattan, surrounded by timeless elegance and the unmistakable magic of New York City, we envision an evening that celebrates everything beautiful about love.</p>
        <p className="body-copy">Beneath glittering chandeliers and surrounded by candlelight, our closest family and friends will gather for a celebration filled with romance, laughter, and unforgettable memories.</p>
        <p className="venue-last">An extraordinary setting for the beginning of our forever.</p>
        <a className="text-link" href="https://maps.google.com/?q=The+Plaza+Hotel+New+York" target="_blank" rel="noreferrer">EXPLORE THE LOCATION <ArrowUpRight size={14}/></a>
      </div>
    </section>

    <section className="events-section" id="events">
      <div className="section-topline"><span>THE ORDER OF THE EVENING</span><span>NEW YORK CITY</span></div>
      <div className="events-heading"><p className="eyebrow">A NIGHT IN FOUR ACTS</p><h2>The Evening’s <em>Affair</em></h2><Ornament>EVERY MOMENT, A MEMORY</Ornament></div>
      <div className="event-list">{events.map(({time, title, copy, icon: Icon}, i) => <article className="event-row" key={title}><span className="event-number">0{i + 1}</span><span className="event-time">{time}</span><div className="event-info"><h3>{title}</h3><p>{copy}</p></div><Icon className="event-icon" size={19} strokeWidth={1}/></article>)}</div>
      <p className="events-foot">BLACK TIE ATTIRE · AN EVENING OF ELEGANCE</p>
    </section>

    <section className="rsvp-section" id="rsvp">
      <div className="rsvp-image" />
      <div className="rsvp-card">
        <p className="eyebrow">KINDLY REPLY BY OCTOBER 1, 2027</p>
        <Ornament>THE HONOUR OF YOUR PRESENCE</Ornament>
        <h2>Kindly <em>Respond</em></h2>
        <p className="rsvp-subtitle">Kindly respond to our invitation.</p>
        {submitted ? <div className="success-message" role="status"><Check size={24}/><p>Thank you for your gracious reply. We look forward to sharing an unforgettable evening with you.</p></div> : <form className="rsvp-form" onSubmit={handleRsvp}>
          <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}/>
          <label>YOUR NAME<input name="name" autoComplete="name" placeholder="As it appears on your invitation" required/></label>
          <label>YOUR RESPONSE<select name="response" required defaultValue=""><option value="" disabled>Select your response</option><option value="joyfully">Accepts with pleasure</option><option value="regretfully">Declines with regret</option></select></label>
          <div className="form-row"><label>NUMBER OF GUESTS<select name="guests" defaultValue="1"><option>1</option><option>2</option><option>3</option><option>4</option></select></label><label>ATTENDING<select name="attendance" defaultValue="both"><option value="both">Both</option><option value="ceremony">Ceremony only</option><option value="reception">Reception only</option></select></label></div>
          <label>DIETARY RESTRICTIONS OR ALLERGIES<input name="dietary" placeholder="Please let us know"/></label>
          <label>A NOTE FOR THE COUPLE<textarea name="note" rows={3} maxLength={500} placeholder="Share a thought or a wish…"/></label>
          {formError && <p role="alert" style={{ margin: 0, color: '#e0968a', fontSize: 12, fontFamily: 'Georgia, serif', textAlign: 'center' }}>{formError}</p>}
          <button type="submit" className="gold-button submit-button" disabled={sending}>{sending ? 'SENDING…' : 'SEND YOUR REPLY'} <ArrowUpRight size={14}/></button>
        </form>}
        <p className="rsvp-small">WITH GRATITUDE & ANTICIPATION</p>
      </div>
    </section>

    <section className="story-section" id="story">
      <div className="story-header"><p className="eyebrow">A LOVE, BEAUTIFULLY BECOMING</p><h2>Written in <em>the Stars</em></h2><Ornament>OUR STORY, IN FOUR CHAPTERS</Ornament></div>
      <div className="story-grid">{chapters.map((chapter) => <article className="story-chapter" key={chapter.number}><span className="chapter-number">{chapter.number}</span><div className="chapter-rule"/><h3>{chapter.title}</h3><p>{chapter.copy}</p></article>)}</div>
    </section>

    <footer className="closing-section">
      <div className="closing-photo"/><div className="closing-shade"/>
      <div className="closing-content"><p className="eyebrow">UNTIL THEN, AND ALWAYS</p><Ornament>TO THE NIGHTS WE WILL REMEMBER</Ornament><h2>Our forever<br/><em>starts here.</em></h2><p className="closing-copy">To the nights we will remember, the dreams we will chase,<br/> and the love that will carry us through it all.</p><span className="closing-signoff">With Endless Love,</span><p className="closing-names">Charlotte <i>&</i> William</p><p className="closing-date">NOVEMBER 6, 2027 · NEW YORK CITY</p></div>
      <a className="back-top" href="#intro">BACK TO BEGINNING <ChevronDown size={13}/></a>
      <span className="footer-mark">C <i>&</i> W</span>
    </footer>
  </main>
}

export default function Page() {
  const [opened, setOpened] = useState(false)
  return <>{opened ? <Invitation/> : <Cover onOpen={() => setOpened(true)}/>}</>
}
