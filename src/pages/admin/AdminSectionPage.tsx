import { CalendarPlus, Construction, Megaphone, Settings, Users } from 'lucide-react'

const content = {
  members: { icon: Users, title: 'Member management', copy: 'Search profiles, change roles, suspend access, and edit family information.' },
  events: { icon: CalendarPlus, title: 'Event management', copy: 'Create, approve, edit, and categorize shared calendar events.' },
  announcements: { icon: Megaphone, title: 'Announcement management', copy: 'Create, pin, edit, and send member-only family updates.' },
  settings: { icon: Settings, title: 'Site settings', copy: 'Configure email delivery, storage, privacy defaults, and administrator contacts.' },
}

export function AdminSectionPage({ section }: { section: keyof typeof content }) {
  const { icon: Icon, title, copy } = content[section]
  return <div><header className="page-header"><div><p className="eyebrow eyebrow--admin">Administration</p><h1>{title}</h1><p>{copy}</p></div></header><section className="panel coming-panel"><span className="icon-orb"><Icon /></span><Construction /><h2>Foundation ready for backend wiring</h2><p>The protected route, role check, layout, and data model for this section are in place. Connect the corresponding Supabase queries and Cloudflare function before inviting members.</p><div className="checklist"><span>✓ Admin-only route guard</span><span>✓ Responsive management layout</span><span>✓ Database model documented</span><span>○ Production mutations and audit logging</span></div></section></div>
}
