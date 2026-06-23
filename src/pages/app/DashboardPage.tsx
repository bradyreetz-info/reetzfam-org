import { ArrowRight, CakeSlice, CalendarPlus, FileUp, Megaphone, Pencil, Sparkles, UserPlus, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { announcements, familyMembers } from '../../data/mock'
import { useAuth } from '../../lib/auth'

export function DashboardPage() {
  const { profile } = useAuth()
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  return <div className="dashboard-page">
    <header className="page-header welcome-header"><div><p className="eyebrow">{today}</p><h1>Welcome back, {profile?.first_name}.</h1><p>Here’s what’s happening around the family.</p></div><Link className="button" to="/app/announcements"><Megaphone size={18} /> Share an update</Link></header>
    <section className="stats-grid" aria-label="Family highlights">
      <Link to="/app/calendar" className="stat-card"><span className="stat-icon stat-icon--gold"><CakeSlice /></span><div><small>Next birthday</small><strong>Anna · July 14</strong><span>22 days away</span></div><ArrowRight /></Link>
      <Link to="/app/calendar" className="stat-card"><span className="stat-icon"><CalendarPlus /></span><div><small>Next event</small><strong>Summer picnic</strong><span>Saturday, July 18</span></div><ArrowRight /></Link>
      <Link to="/app/directory" className="stat-card"><span className="stat-icon stat-icon--blue"><Users /></span><div><small>Family directory</small><strong>{familyMembers.length} sample profiles</strong><span>2 updated this month</span></div><ArrowRight /></Link>
    </section>
    <div className="dashboard-grid">
      <section className="panel panel--span"><div className="panel-heading"><div><p className="eyebrow">Latest from the family</p><h2>Announcements</h2></div><Link to="/app/announcements" className="text-link">View all <ArrowRight /></Link></div><div className="announcement-list">{announcements.slice(0, 3).map(item => <Link to="/app/announcements" key={item.id} className="announcement-row">{item.pinned && <span className="pin-label">Pinned</span>}<div><h3>{item.title}</h3><p>{item.body}</p><small>{item.author} · {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</small></div><ArrowRight /></Link>)}</div></section>
      <section className="panel"><div className="panel-heading"><div><p className="eyebrow">Coming up</p><h2>Dates to remember</h2></div></div><div className="date-list"><div><time><strong>14</strong><span>JUL</span></time><p><strong>Anna’s birthday</strong><span>Birthday</span></p></div><div><time><strong>18</strong><span>JUL</span></time><p><strong>Summer family picnic</strong><span>Lakeview park · 12:00 PM</span></p></div><div><time><strong>25</strong><span>JUL</span></time><p><strong>Archive scanning</strong><span>Volunteer afternoon</span></p></div></div><Link to="/app/calendar" className="button button--secondary button--full">Open family calendar</Link></section>
      <section className="panel"><div className="panel-heading"><div><p className="eyebrow">Shortcuts</p><h2>Quick actions</h2></div></div><div className="quick-grid"><Link to="/app/profile"><Pencil /><span>Edit my profile</span></Link><Link to="/app/directory"><UserPlus /><span>Find a relative</span></Link><Link to="/app/photos"><FileUp /><span>Add a photo</span></Link><Link to="/app/family-tree-placeholder"><Sparkles /><span>Share a story</span></Link></div></section>
      <section className="panel panel--span"><div className="panel-heading"><div><p className="eyebrow">Fresh details</p><h2>Recently updated profiles</h2></div><Link to="/app/directory" className="text-link">Browse directory <ArrowRight /></Link></div><div className="profile-strip">{familyMembers.slice(0, 3).map(member => <div key={member.id}><span className="avatar">{member.first_name[0]}{member.last_name[0]}</span><p><strong>{member.preferred_name || member.first_name} {member.last_name}</strong><span>{member.city}, {member.state}</span></p></div>)}</div></section>
    </div>
  </div>
}
