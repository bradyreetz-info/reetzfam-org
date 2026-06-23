import { ArrowRight, BookOpen, CalendarDays, FileStack, LockKeyhole, Megaphone, ShieldCheck, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'

const features = [
  { icon: UsersRound, title: 'Family directory', copy: 'Find the right person and keep your own details current.' },
  { icon: CalendarDays, title: 'Shared calendar', copy: 'Birthdays, reunions, holidays, and everyday family plans.' },
  { icon: Megaphone, title: 'Announcements', copy: 'Important updates in one calm, dependable place.' },
  { icon: FileStack, title: 'Photos & documents', copy: 'A private home for the things we want to keep.' },
  { icon: BookOpen, title: 'Family history', copy: 'Preserve stories, relationships, and memories over time.' },
]

export function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-texture" aria-hidden="true" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="privacy-pill"><ShieldCheck size={17} /> Private by design</div>
            <h1>A private home for family updates, memories, and connection.</h1>
            <p className="hero-lede">ReetzFam.org is a secure family portal for sharing contact details, birthdays, events, announcements, photos, and family history with approved members only.</p>
            <div className="button-row hero-actions">
              <Link className="button" to="/request-access">Request access <ArrowRight size={18} /></Link>
              <Link className="button button--secondary" to="/login">Member login</Link>
            </div>
            <p className="privacy-note"><LockKeyhole size={17} /> Most information on this site is private and only available to approved family members.</p>
          </div>
          <div className="hero-keepsake" aria-label="A representation of the private family portal">
            <div className="keepsake-card keepsake-card--back"><span>Since generations ago</span></div>
            <div className="keepsake-card">
              <div className="keepsake-monogram">R</div>
              <p className="eyebrow">Our family space</p>
              <h2>Keep close.<br />Stay connected.</h2>
              <div className="keepsake-rule" />
              <p>Stories, milestones, and the practical details that bring a family together.</p>
              <span className="keepsake-seal"><LockKeyhole size={15} /> Members only</span>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <div className="section-heading">
            <div><p className="eyebrow">Everything in one place</p><h2>Made for family, not the whole internet.</h2></div>
            <p>A straightforward place to share what matters—without sharing it publicly.</p>
          </div>
          <div className="feature-grid">
            {features.map(({ icon: Icon, title, copy }) => (
              <article className="feature-card" key={title}><span className="feature-icon"><Icon /></span><h3>{title}</h3><p>{copy}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="trust-section">
        <div className="container trust-card">
          <span className="icon-orb"><ShieldCheck /></span>
          <div><p className="eyebrow">A thoughtful front door</p><h2>Family information stays with family.</h2><p>Every request is reviewed by a family administrator. New accounts are never approved automatically.</p></div>
          <Link to="/privacy" className="text-link">How privacy works <ArrowRight size={17} /></Link>
        </div>
      </section>
    </>
  )
}
