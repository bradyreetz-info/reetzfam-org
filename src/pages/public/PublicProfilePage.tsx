import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, BookHeart, Link as LinkIcon, ShieldCheck, UserRound } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface PublicProfile {
  profile_id: string
  slug: string
  public_display_name: string | null
  public_bio: string | null
  interests: string[] | null
  skills_occupations: string[] | null
  family_story: string | null
}

interface PublicLink {
  id: string
  label: string
  url: string
}

export function PublicProfilePage() {
  const { profileSlug } = useParams()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [links, setLinks] = useState<PublicLink[]>([])
  const [loading, setLoading] = useState(Boolean(supabase))

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!supabase || !profileSlug) {
        setLoading(false)
        return
      }
      const normalized = profileSlug.toLowerCase()
      const { data } = await supabase
        .from('profile_public_pages')
        .select('profile_id,slug,public_display_name,public_bio,interests,skills_occupations,family_story')
        .eq('slug', normalized)
        .eq('public_profile_enabled', true)
        .maybeSingle()
      if (!mounted) return
      if (data) {
        setProfile(data as PublicProfile)
        const { data: linkRows } = await supabase
          .from('profile_links')
          .select('id,label,url')
          .eq('profile_id', data.profile_id)
          .eq('visibility', 'public_profile')
        if (mounted) setLinks((linkRows ?? []) as PublicLink[])
      }
      setLoading(false)
    }
    void load()
    return () => { mounted = false }
  }, [profileSlug])

  if (loading) return <section className="narrow-section"><div className="status-card"><p className="eyebrow">Loading</p><h1>Opening profile…</h1></div></section>

  if (!profile) {
    return <section className="narrow-section"><div className="status-card"><span className="icon-orb"><ShieldCheck /></span><p className="eyebrow">Private by default</p><h1>This profile is not public.</h1><p>Family profiles only appear here when a member explicitly enables a public profile page.</p><Link className="button" to="/">Return home</Link></div></section>
  }

  return (
    <section className="content-page public-profile-page">
      <div className="container content-narrow">
        <span className="icon-orb icon-orb--gold"><UserRound /></span>
        <p className="eyebrow">ReetzFam.org profile</p>
        <h1>{profile.public_display_name || profile.slug}</h1>
        {profile.public_bio && <p className="page-lede">{profile.public_bio}</p>}
        <div className="principle-grid">
          {Boolean(profile.interests?.length) && <article><BookHeart /><h2>Interests & hobbies</h2><p>{profile.interests?.join(', ')}</p></article>}
          {Boolean(profile.skills_occupations?.length) && <article><UserRound /><h2>Skills & occupations</h2><p>{profile.skills_occupations?.join(', ')}</p></article>}
          {profile.family_story && <article><BookHeart /><h2>Family story</h2><p>{profile.family_story}</p></article>}
          {links.length > 0 && <article><LinkIcon /><h2>Links</h2><div className="public-link-list">{links.map(link => <a key={link.id} href={link.url} rel="noreferrer" target="_blank">{link.label}<ArrowRight /></a>)}</div></article>}
        </div>
        <div className="prose-card">
          <h2>Privacy note</h2>
          <p>This page only shows fields this member chose to make public. Contact details, full birthdays, address, documents, emergency notes, and family-only details remain behind member login.</p>
        </div>
      </div>
    </section>
  )
}
