import { useEffect, useMemo, useState } from 'react'
import { CakeSlice, ChevronRight, Mail, MapPin, Pencil, Phone, Search, SlidersHorizontal, UserRound, X } from 'lucide-react'
import { familyMembers } from '../../data/mock'
import type { FamilyMember } from '../../types'
import { useAuth } from '../../lib/auth'

export function DirectoryPage() {
  const [query, setQuery] = useState('')
  const [branch, setBranch] = useState('all')
  const [selected, setSelected] = useState<FamilyMember | null>(null)
  const { profile } = useAuth()
  const filtered = useMemo(() => familyMembers.filter(member => {
    const text = `${member.first_name} ${member.last_name} ${member.preferred_name ?? ''} ${member.city ?? ''}`.toLowerCase()
    return text.includes(query.toLowerCase()) && (branch === 'all' || member.family_branch === branch)
  }), [query, branch])
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
  useEffect(() => {
    if (!selected) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelected(null) }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [selected])
  return <div>
    <header className="page-header"><div><p className="eyebrow">Private member directory</p><h1>Family directory</h1><p>Find family members and keep the details you choose to share up to date.</p></div><button className="button button--secondary"><Pencil size={18} /> Edit my profile</button></header>
    <div className="toolbar"><label className="search-field"><Search /><span className="sr-only">Search directory</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name or location" /></label><label className="filter-field"><SlidersHorizontal /><span className="sr-only">Filter by family branch</span><select value={branch} onChange={e => setBranch(e.target.value)}><option value="all">All family branches</option><option>Wisconsin branch</option><option>Minnesota branch</option><option>Illinois branch</option></select></label></div>
    <p className="result-count">Showing {filtered.length} {filtered.length === 1 ? 'person' : 'people'} <span>· Fictional preview data</span></p>
    <div className="directory-grid">{filtered.map(member => <button className="member-card" key={member.id} onClick={() => setSelected(member)}><div className="member-card-top"><span className="avatar avatar--large">{member.first_name[0]}{member.last_name[0]}</span><span className="privacy-chip">Members</span></div><h2>{member.preferred_name || member.first_name} {member.last_name}</h2><p className="relationship">{member.relationship_notes}</p><div className="member-meta">{member.city && <span><MapPin />{member.city}, {member.state}</span>}{member.household_name && <span><UserRound />{member.household_name}</span>}{member.birthdate && member.birthday_visibility !== 'private' && <span><CakeSlice />{new Date(`${member.birthdate}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>}</div><span className="card-link">View profile <ChevronRight /></span></button>)}</div>
    {filtered.length === 0 && <div className="empty-state"><Search /><h2>No family members found</h2><p>Try a different name, location, or family branch.</p><button className="button button--secondary" onClick={() => { setQuery(''); setBranch('all') }}>Clear filters</button></div>}
    {selected && <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelected(null)}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="profile-title" onMouseDown={e => e.stopPropagation()}><button autoFocus className="modal-close" aria-label="Close profile" onClick={() => setSelected(null)}><X /></button><div className="modal-profile"><span className="avatar avatar--xl">{selected.first_name[0]}{selected.last_name[0]}</span><div><p className="eyebrow">Family profile</p><h2 id="profile-title">{selected.first_name} {selected.middle_name} {selected.last_name}</h2><p>{selected.relationship_notes} · {selected.family_branch}</p></div></div><div className="detail-grid"><div><small>Preferred name</small><strong>{selected.preferred_name || selected.first_name}</strong></div><div><small>Household</small><strong>{selected.household_name || 'Not listed'}</strong></div><div><small>Location</small><strong>{selected.city ? `${selected.city}, ${selected.state}` : 'Private'}</strong></div><div><small>Birthday</small><strong>{selected.birthday_visibility === 'private' ? 'Private' : new Date(`${selected.birthdate}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</strong></div></div><div className="contact-actions">{selected.email && <a className="button button--secondary" href={`mailto:${selected.email}`}><Mail /> Email</a>}{selected.phone && <a className="button button--secondary" href={`tel:${selected.phone}`}><Phone /> Call</a>}{isAdmin && <button className="button"><Pencil /> Admin edit</button>}</div><p className="modal-privacy"><UserRound /> Profile details are visible to approved members only.</p></div></div>}
  </div>
}
