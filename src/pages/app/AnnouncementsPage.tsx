import { useState } from 'react'
import { Eye, Megaphone, Pencil, Pin, Plus, Trash2 } from 'lucide-react'
import { announcements } from '../../data/mock'
import { useAuth } from '../../lib/auth'

export function AnnouncementsPage() {
  const [selected, setSelected] = useState(announcements[0])
  const { profile } = useAuth()
  const canEdit = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'editor'
  return <div><header className="page-header"><div><p className="eyebrow">News from the family</p><h1>Announcements</h1><p>Updates, invitations, and small reminders for approved family members.</p></div>{canEdit && <button className="button"><Plus /> New announcement</button>}</header><div className="split-view"><div className="announcement-cards">{announcements.map(item => <button key={item.id} className={`announcement-card ${selected.id === item.id ? 'active' : ''}`} onClick={() => setSelected(item)}>{item.pinned && <span className="pin-label"><Pin /> Pinned</span>}<h2>{item.title}</h2><p>{item.body}</p><small>{item.author} · {new Date(item.created_at).toLocaleDateString()}</small></button>)}</div><article className="panel announcement-detail"><div className="detail-top"><span className="icon-orb"><Megaphone /></span>{canEdit && <div><button className="icon-button" aria-label="Edit announcement"><Pencil /></button><button className="icon-button danger" aria-label="Delete announcement"><Trash2 /></button></div>}</div><p className="eyebrow">{selected.pinned ? 'Pinned announcement' : 'Family update'}</p><h2>{selected.title}</h2><p className="byline">Posted by {selected.author} on {new Date(selected.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p><div className="announcement-body"><p>{selected.body}</p><p>This is a private family update. Additional details, links, and sign-up information can appear here when announcements are connected to Supabase.</p></div><div className="visibility-line"><Eye /> Visible to approved family members</div></article></div></div>
}
