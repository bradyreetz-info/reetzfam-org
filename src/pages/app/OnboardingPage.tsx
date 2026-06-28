import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, Heart, Link as LinkIcon, Loader2, Plus, Save, ShieldCheck, Trash2, UserRound } from 'lucide-react'
import { isDemoMode, supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import type { ProfileVisibility } from '../../types'

type StepId = 'welcome' | 'contact' | 'family' | 'dates' | 'public-page' | 'documents' | 'review'

interface PhoneRow {
  id?: string
  phone_type: 'mobile' | 'home' | 'work' | 'other'
  number: string
  label: string
  visibility: ProfileVisibility
  is_primary: boolean
}

interface RelationshipRow {
  relationship_type: 'spouse_partner' | 'child' | 'parent' | 'sibling' | 'other'
  name: string
  notes: string
  visibility: ProfileVisibility
}

interface ImportantDateRow {
  id?: string
  date_type: 'anniversary' | 'wedding' | 'graduation' | 'military_service' | 'memorial' | 'birthday' | 'reunion' | 'other'
  title: string
  event_date: string
  notes: string
  visibility: ProfileVisibility
}

interface ProfileLinkRow {
  id?: string
  label: string
  url: string
  visibility: ProfileVisibility
}

interface DocumentRow {
  id?: string
  title: string
  description: string
  document_type: string
  document_date: string
  notes: string
  visibility: ProfileVisibility
}

interface OnboardingForm {
  first_name: string
  middle_name: string
  last_name: string
  display_name: string
  preferred_name: string
  gender: string
  pronouns: string
  birthdate: string
  birthdate_visibility: 'full' | 'month_day' | 'private'
  short_bio: string
  nicknames: string
  former_names: string
  mailing_address: string
  mailing_city: string
  mailing_state: string
  mailing_postal_code: string
  mailing_country: string
  contact_preference: string
  allow_family_announcements: boolean
  emergency_contact_notes: string
  public_profile_enabled: boolean
  slug: string
  public_display_name: string
  public_bio: string
  interests: string
  skills_occupations: string
  family_story: string
}

const steps: Array<{ id: StepId; label: string; help: string }> = [
  { id: 'welcome', label: 'Basics', help: 'Names, birthday visibility, and a short family bio.' },
  { id: 'contact', label: 'Contact', help: 'Phone, address, preferences, and private emergency notes.' },
  { id: 'family', label: 'Family', help: 'Simple relationships and notes, without overbuilding a genealogy graph.' },
  { id: 'dates', label: 'Dates', help: 'Anniversaries, milestones, memorials, and other important dates.' },
  { id: 'public-page', label: 'Profile page', help: 'Optional public page controls. Off by default.' },
  { id: 'documents', label: 'Archive', help: 'Document metadata now; uploads can come later.' },
  { id: 'review', label: 'Review', help: 'Finish or save your progress for later.' },
]

const reservedSlugs = new Set(['admin', 'api', 'app', 'assets', 'calendar', 'directory', 'documents', 'login', 'logout', 'photos', 'privacy', 'request-access', 'settings'])
const blankPhone = (): PhoneRow => ({ phone_type: 'mobile', number: '', label: '', visibility: 'private', is_primary: true })
const blankRelationship = (relationship_type: RelationshipRow['relationship_type']): RelationshipRow => ({ relationship_type, name: '', notes: '', visibility: 'members' })
const blankDate = (): ImportantDateRow => ({ date_type: 'other', title: '', event_date: '', notes: '', visibility: 'private' })
const blankLink = (): ProfileLinkRow => ({ label: '', url: '', visibility: 'private' })
const blankDocument = (): DocumentRow => ({ title: '', description: '', document_type: 'family record', document_date: '', notes: '', visibility: 'private' })
const nowIso = () => new Date().toISOString()
const splitLines = (value: string) => value.split(/\n|,/).map(item => item.trim()).filter(Boolean)
const joinLines = (value?: string[] | null) => (value ?? []).join('\n')

function visibilityLabel(value: ProfileVisibility) {
  return value === 'public_profile' ? 'Public profile' : value === 'members' ? 'Family members' : value === 'admins' ? 'Admins only' : 'Private'
}

function defaultForm(profile: ReturnType<typeof useAuth>['profile']): OnboardingForm {
  return {
    first_name: profile?.first_name ?? '',
    middle_name: profile?.middle_name ?? '',
    last_name: profile?.last_name ?? '',
    display_name: profile?.display_name ?? '',
    preferred_name: profile?.preferred_name ?? profile?.first_name ?? '',
    gender: profile?.gender ?? '',
    pronouns: profile?.pronouns ?? '',
    birthdate: profile?.birthdate ?? '',
    birthdate_visibility: profile?.birthdate_visibility ?? 'month_day',
    short_bio: profile?.short_bio ?? '',
    nicknames: '',
    former_names: '',
    mailing_address: profile?.mailing_address ?? '',
    mailing_city: profile?.mailing_city ?? '',
    mailing_state: profile?.mailing_state ?? '',
    mailing_postal_code: profile?.mailing_postal_code ?? '',
    mailing_country: profile?.mailing_country ?? 'US',
    contact_preference: profile?.contact_preference ?? '',
    allow_family_announcements: profile?.allow_family_announcements ?? true,
    emergency_contact_notes: profile?.emergency_contact_notes ?? '',
    public_profile_enabled: false,
    slug: '',
    public_display_name: profile?.display_name ?? '',
    public_bio: '',
    interests: '',
    skills_occupations: '',
    family_story: '',
  }
}

export function OnboardingPage() {
  const { profile, updateProfileSnapshot, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const initialStep = steps.findIndex(step => step.id === profile?.onboarding_current_step)
  const [active, setActive] = useState(initialStep >= 0 ? initialStep : 0)
  const [form, setForm] = useState<OnboardingForm>(() => defaultForm(profile))
  const [phones, setPhones] = useState<PhoneRow[]>([blankPhone()])
  const [relationships, setRelationships] = useState<RelationshipRow[]>([
    blankRelationship('spouse_partner'),
    blankRelationship('child'),
    blankRelationship('parent'),
    blankRelationship('sibling'),
  ])
  const [importantDates, setImportantDates] = useState<ImportantDateRow[]>([blankDate()])
  const [links, setLinks] = useState<ProfileLinkRow[]>([blankLink()])
  const [documents, setDocuments] = useState<DocumentRow[]>([blankDocument()])
  const [loading, setLoading] = useState(Boolean(supabase))
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const step = steps[active]
  const completedCount = useMemo(() => Math.max(active, 1), [active])

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!profile || !supabase) {
        setLoading(false)
        return
      }
      setLoading(true)
      const [aliases, phoneRows, relationshipRows, dateRows, publicPage, linkRows, documentRows] = await Promise.all([
        supabase.from('profile_aliases').select('alias_type,value').eq('profile_id', profile.id),
        supabase.from('profile_phone_numbers').select('id,phone_type,number,label,visibility,is_primary').eq('profile_id', profile.id).order('is_primary', { ascending: false }),
        supabase.from('profile_relationships').select('relationship_type,name,notes,visibility').eq('profile_id', profile.id),
        supabase.from('profile_important_dates').select('id,date_type,title,event_date,notes,visibility').eq('profile_id', profile.id),
        supabase.from('profile_public_pages').select('slug,public_profile_enabled,public_display_name,public_bio,interests,skills_occupations,family_story').eq('profile_id', profile.id).maybeSingle(),
        supabase.from('profile_links').select('id,label,url,visibility').eq('profile_id', profile.id),
        supabase.from('library_items').select('id,title,description,document_type,document_date,notes,visibility').eq('uploaded_by', profile.id).eq('item_type', 'document').is('storage_path', null),
      ])
      if (!mounted) return
      setForm(current => ({
        ...defaultForm(profile),
        ...current,
        nicknames: aliases.data?.filter(row => row.alias_type === 'nickname').map(row => row.value).join('\n') ?? '',
        former_names: aliases.data?.filter(row => row.alias_type === 'former_name').map(row => row.value).join('\n') ?? '',
        public_profile_enabled: Boolean(publicPage.data?.public_profile_enabled),
        slug: publicPage.data?.slug ?? '',
        public_display_name: publicPage.data?.public_display_name ?? profile.display_name,
        public_bio: publicPage.data?.public_bio ?? '',
        interests: joinLines(publicPage.data?.interests),
        skills_occupations: joinLines(publicPage.data?.skills_occupations),
        family_story: publicPage.data?.family_story ?? '',
      }))
      if (phoneRows.data?.length) setPhones(phoneRows.data as PhoneRow[])
      if (relationshipRows.data?.length) setRelationships(relationshipRows.data as RelationshipRow[])
      if (dateRows.data?.length) setImportantDates(dateRows.data as ImportantDateRow[])
      if (linkRows.data?.length) setLinks(linkRows.data as ProfileLinkRow[])
      if (documentRows.data?.length) setDocuments(documentRows.data as DocumentRow[])
      setLoading(false)
    }
    void load()
    return () => { mounted = false }
  }, [profile])

  const update = <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => {
    setForm(current => ({ ...current, [key]: value }))
  }

  const saveState = async (nextStep: StepId, complete = false, dismiss = false) => {
    if (!profile) return
    const completed = Array.from(new Set([...steps.slice(0, active + 1).map(item => item.id)]))
    const patch = {
      profile_id: profile.id,
      current_step: nextStep,
      completed_steps: completed,
      completed_at: complete ? nowIso() : profile.onboarding_completed_at ?? null,
      dismissed_at: dismiss ? nowIso() : complete ? null : profile.onboarding_dismissed_at ?? null,
      updated_at: nowIso(),
    }
    if (supabase) {
      const { error: stateError } = await supabase.from('profile_onboarding_state').upsert(patch, { onConflict: 'profile_id' })
      if (stateError) throw stateError
    }
    updateProfileSnapshot({
      onboarding_current_step: patch.current_step,
      onboarding_completed_at: patch.completed_at,
      onboarding_dismissed_at: patch.dismissed_at,
    })
  }

  const saveCurrentStep = async (nextStep: StepId, complete = false, dismiss = false) => {
    if (!profile) return
    if (step.id === 'public-page') validatePublicProfile()
    if (supabase) {
      if (step.id === 'welcome') await saveBasics()
      if (step.id === 'contact') await saveContact()
      if (step.id === 'family') await replaceRows('profile_relationships', relationships.filter(item => item.name.trim()).map(item => ({ ...item, profile_id: profile.id, notes: item.notes || null })))
      if (step.id === 'dates') await replaceRows('profile_important_dates', importantDates.filter(item => item.title.trim() && item.event_date).map(item => ({ ...item, profile_id: profile.id, notes: item.notes || null })))
      if (step.id === 'public-page') await savePublicProfile()
      if (step.id === 'documents') await saveDocuments()
      await saveState(nextStep, complete, dismiss)
      await refreshProfile()
    } else {
      updateProfileSnapshot({
        first_name: form.first_name,
        last_name: form.last_name,
        display_name: form.display_name,
        preferred_name: form.preferred_name,
        onboarding_current_step: nextStep,
        onboarding_completed_at: complete ? nowIso() : profile.onboarding_completed_at,
        onboarding_dismissed_at: dismiss ? nowIso() : profile.onboarding_dismissed_at,
      })
    }
  }

  const replaceRows = async (table: string, rows: Array<Record<string, unknown>>) => {
    if (!profile || !supabase) return
    const deleteResult = await supabase.from(table).delete().eq('profile_id', profile.id)
    if (deleteResult.error) throw deleteResult.error
    if (rows.length) {
      const insertResult = await supabase.from(table).insert(rows)
      if (insertResult.error) throw insertResult.error
    }
  }

  const saveBasics = async () => {
    if (!profile || !supabase) return
    const profilePatch = {
      first_name: form.first_name.trim(),
      middle_name: form.middle_name.trim() || null,
      last_name: form.last_name.trim(),
      display_name: form.display_name.trim() || `${form.first_name} ${form.last_name}`.trim(),
      preferred_name: form.preferred_name.trim() || null,
      gender: form.gender.trim() || null,
      pronouns: form.pronouns.trim() || null,
      birthdate: form.birthdate || null,
      birthdate_visibility: form.birthdate_visibility,
      short_bio: form.short_bio.trim() || null,
    }
    const { error: profileError } = await supabase.from('profiles').update(profilePatch).eq('id', profile.id)
    if (profileError) throw profileError
    const aliasRows = [
      ...splitLines(form.nicknames).map(value => ({ profile_id: profile.id, alias_type: 'nickname', value, visibility: 'members' as ProfileVisibility })),
      ...splitLines(form.former_names).map(value => ({ profile_id: profile.id, alias_type: 'former_name', value, visibility: 'members' as ProfileVisibility })),
    ]
    await replaceRows('profile_aliases', aliasRows)
    updateProfileSnapshot(profilePatch)
  }

  const saveContact = async () => {
    if (!profile || !supabase) return
    const { error: profileError } = await supabase.from('profiles').update({
      mailing_address: form.mailing_address.trim() || null,
      mailing_city: form.mailing_city.trim() || null,
      mailing_state: form.mailing_state.trim() || null,
      mailing_postal_code: form.mailing_postal_code.trim() || null,
      mailing_country: form.mailing_country.trim() || 'US',
      contact_preference: form.contact_preference.trim() || null,
      allow_family_announcements: form.allow_family_announcements,
      emergency_contact_notes: form.emergency_contact_notes.trim() || null,
    }).eq('id', profile.id)
    if (profileError) throw profileError
    await replaceRows('profile_phone_numbers', phones.filter(item => item.number.trim()).map((item, index) => ({
      profile_id: profile.id,
      phone_type: item.phone_type,
      number: item.number.trim(),
      label: item.label.trim() || null,
      visibility: item.visibility,
      is_primary: index === 0 || item.is_primary,
    })))
  }

  const validatePublicProfile = () => {
    const slug = form.slug.trim().toLowerCase()
    if (form.public_profile_enabled) {
      if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(slug)) throw new Error('Use a profile slug with lowercase letters, numbers, and hyphens only.')
      if (reservedSlugs.has(slug)) throw new Error('That profile slug is reserved. Choose another.')
    }
  }

  const savePublicProfile = async () => {
    if (!profile || !supabase) return
    const slug = form.slug.trim().toLowerCase() || null
    if (slug) {
      const { data: existing, error: slugError } = await supabase.from('profile_public_pages').select('profile_id').eq('slug', slug).maybeSingle()
      if (slugError) throw slugError
      if (existing && existing.profile_id !== profile.id) throw new Error('That profile slug is already taken.')
    }
    const { error: pageError } = await supabase.from('profile_public_pages').upsert({
      profile_id: profile.id,
      slug,
      public_profile_enabled: form.public_profile_enabled,
      public_display_name: form.public_display_name.trim() || profile.display_name,
      public_bio: form.public_bio.trim() || null,
      interests: splitLines(form.interests),
      skills_occupations: splitLines(form.skills_occupations),
      family_story: form.family_story.trim() || null,
      updated_at: nowIso(),
    }, { onConflict: 'profile_id' })
    if (pageError) throw pageError
    await replaceRows('profile_links', links.filter(item => item.label.trim() && item.url.trim()).map(item => ({ ...item, profile_id: profile.id })))
  }

  const saveDocuments = async () => {
    if (!profile || !supabase) return
    const deleteResult = await supabase.from('library_items').delete().eq('uploaded_by', profile.id).eq('item_type', 'document').is('storage_path', null)
    if (deleteResult.error) throw deleteResult.error
    const rows = documents.filter(item => item.title.trim()).map(item => ({
      title: item.title.trim(),
      description: item.description.trim() || null,
      document_type: item.document_type.trim() || null,
      document_date: item.document_date || null,
      notes: item.notes.trim() || null,
      visibility: item.visibility,
      storage_path: null,
      file_url: null,
      file_type: 'metadata',
      item_type: 'document',
      uploaded_by: profile.id,
    }))
    if (rows.length) {
      const insertResult = await supabase.from('library_items').insert(rows)
      if (insertResult.error) throw insertResult.error
    }
  }

  const continueNext = async (event?: FormEvent) => {
    event?.preventDefault()
    setBusy(true); setError(''); setNotice('')
    try {
      const next = steps[Math.min(active + 1, steps.length - 1)].id
      await saveCurrentStep(next)
      if (active < steps.length - 1) setActive(active + 1)
      setNotice('Progress saved.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save this step.')
    } finally {
      setBusy(false)
    }
  }

  const finish = async () => {
    setBusy(true); setError(''); setNotice('')
    try {
      await saveCurrentStep('review', true)
      navigate('/app')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not finish onboarding.')
    } finally {
      setBusy(false)
    }
  }

  const continueLater = async () => {
    setBusy(true); setError(''); setNotice('')
    try {
      await saveCurrentStep(step.id, false, true)
      navigate('/app')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save progress.')
    } finally {
      setBusy(false)
    }
  }

  if (!profile) return null
  if (loading) return <div className="loading-panel"><Loader2 className="spin" /> Loading profile setup…</div>

  return (
    <div>
      <header className="page-header onboarding-header">
        <div>
          <p className="eyebrow">Finish your family profile</p>
          <h1>Let’s make your profile useful, private, and easy to find.</h1>
          <p>Move one section at a time. Optional sections can be skipped, and sensitive details stay private unless you choose otherwise.</p>
        </div>
        <button className="button button--secondary" type="button" onClick={() => void continueLater()} disabled={busy}><Save /> Save and continue later</button>
      </header>

      <section className="onboarding-layout">
        <aside className="onboarding-progress panel" aria-label="Profile setup progress">
          <strong>{completedCount} of {steps.length}</strong>
          <div className="progress-track"><span style={{ width: `${((active + 1) / steps.length) * 100}%` }} /></div>
          <ol>
            {steps.map((item, index) => <li key={item.id} className={index === active ? 'active' : index < active ? 'done' : ''}><button type="button" onClick={() => setActive(index)}><span>{index < active ? <CheckCircle2 /> : index + 1}</span><strong>{item.label}</strong><small>{item.help}</small></button></li>)}
          </ol>
        </aside>

        <form className="onboarding-card panel" onSubmit={continueNext}>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Step {active + 1}</p>
              <h2>{step.label}</h2>
              <p>{step.help}</p>
            </div>
            {isDemoMode && <span className="status-badge">Preview mode</span>}
          </div>

          {notice && <p className="inline-success" role="status"><CheckCircle2 />{notice}</p>}
          {error && <p className="inline-error" role="alert"><ShieldCheck />{error}</p>}

          {step.id === 'welcome' && <BasicsStep form={form} update={update} />}
          {step.id === 'contact' && <ContactStep form={form} update={update} phones={phones} setPhones={setPhones} />}
          {step.id === 'family' && <RelationshipsStep relationships={relationships} setRelationships={setRelationships} />}
          {step.id === 'dates' && <DatesStep importantDates={importantDates} setImportantDates={setImportantDates} />}
          {step.id === 'public-page' && <PublicPageStep form={form} update={update} links={links} setLinks={setLinks} />}
          {step.id === 'documents' && <DocumentsStep documents={documents} setDocuments={setDocuments} />}
          {step.id === 'review' && <ReviewStep form={form} phones={phones} relationships={relationships} importantDates={importantDates} documents={documents} />}

          <div className="onboarding-actions">
            <button className="button button--secondary" type="button" onClick={() => setActive(Math.max(0, active - 1))} disabled={active === 0 || busy}><ArrowLeft /> Back</button>
            {active === steps.length - 1
              ? <button className="button" type="button" disabled={busy} onClick={() => void finish()}>{busy ? <Loader2 className="spin" /> : <CheckCircle2 />} Finish profile</button>
              : <button className="button" disabled={busy}>{busy ? <Loader2 className="spin" /> : <ArrowRight />} Save and continue</button>}
          </div>
        </form>
      </section>
    </div>
  )
}

function BasicsStep({ form, update }: { form: OnboardingForm; update: <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => void }) {
  return <div className="onboarding-step"><div className="section-title"><div><h2>Core identity</h2><p>These details help family members recognize you.</p></div><UserRound /></div><div className="field-grid"><label>First name<input required value={form.first_name} onChange={event => update('first_name', event.target.value)} /></label><label>Middle name<input value={form.middle_name} onChange={event => update('middle_name', event.target.value)} /></label><label>Last name<input required value={form.last_name} onChange={event => update('last_name', event.target.value)} /></label><label>Display name<input value={form.display_name} onChange={event => update('display_name', event.target.value)} /></label><label>Preferred name<input value={form.preferred_name} onChange={event => update('preferred_name', event.target.value)} /></label><label>Pronouns <span className="optional">optional</span><input value={form.pronouns} onChange={event => update('pronouns', event.target.value)} /></label><label>Gender <span className="optional">optional</span><input value={form.gender} onChange={event => update('gender', event.target.value)} /></label><label>Birthdate<input type="date" value={form.birthdate} onChange={event => update('birthdate', event.target.value)} /></label><label>Birthday visibility<select value={form.birthdate_visibility} onChange={event => update('birthdate_visibility', event.target.value as OnboardingForm['birthdate_visibility'])}><option value="month_day">Month and day only</option><option value="full">Full date to members</option><option value="private">Keep private</option></select></label></div><label>Nicknames <span className="optional">one per line</span><textarea rows={3} value={form.nicknames} onChange={event => update('nicknames', event.target.value)} /></label><label>Former or maiden names <span className="optional">one per line</span><textarea rows={3} value={form.former_names} onChange={event => update('former_names', event.target.value)} /></label><label>Short bio / about me<textarea rows={4} value={form.short_bio} onChange={event => update('short_bio', event.target.value)} placeholder="A few sentences about your family connection, interests, or life updates." /></label><p className="page-footnote">Profile photo uploads will use the private storage buckets when the upload UI is enabled. For now, the app keeps the avatar placeholder.</p></div>
}

function ContactStep({ form, update, phones, setPhones }: { form: OnboardingForm; update: <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => void; phones: PhoneRow[]; setPhones: (rows: PhoneRow[]) => void }) {
  const patch = (index: number, patch: Partial<PhoneRow>) => setPhones(phones.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))
  return <div className="onboarding-step"><div className="section-title"><div><h2>Contact preferences</h2><p>Phone, address, and emergency notes default to private.</p></div><ShieldCheck /></div><div className="repeat-list">{phones.map((phone, index) => <article className="repeat-card" key={index}><div className="field-grid field-grid--three"><label>Type<select value={phone.phone_type} onChange={event => patch(index, { phone_type: event.target.value as PhoneRow['phone_type'] })}><option value="mobile">Mobile</option><option value="home">Home</option><option value="work">Work</option><option value="other">Other</option></select></label><label>Number<input value={phone.number} onChange={event => patch(index, { number: event.target.value })} /></label><label>Visibility<select value={phone.visibility} onChange={event => patch(index, { visibility: event.target.value as ProfileVisibility })}>{visibilityOptions(['private', 'members', 'admins'])}</select></label></div><label>Label <span className="optional">optional</span><input value={phone.label} onChange={event => patch(index, { label: event.target.value })} placeholder="Best after 5 PM" /></label><button className="link-button repeat-remove" type="button" onClick={() => setPhones(phones.filter((_, itemIndex) => itemIndex !== index))}><Trash2 /> Remove phone</button></article>)}</div><button className="button button--secondary" type="button" onClick={() => setPhones([...phones, blankPhone()])}><Plus /> Add phone</button><div className="field-grid"><label>Mailing address<input value={form.mailing_address} onChange={event => update('mailing_address', event.target.value)} autoComplete="street-address" /></label><label>City<input value={form.mailing_city} onChange={event => update('mailing_city', event.target.value)} autoComplete="address-level2" /></label><label>State<input value={form.mailing_state} onChange={event => update('mailing_state', event.target.value)} autoComplete="address-level1" /></label><label>Postal code<input value={form.mailing_postal_code} onChange={event => update('mailing_postal_code', event.target.value)} autoComplete="postal-code" /></label><label>Contact preference<input value={form.contact_preference} onChange={event => update('contact_preference', event.target.value)} placeholder="Text is best, email for announcements, etc." /></label><label>Family announcement emails<select value={form.allow_family_announcements ? 'yes' : 'no'} onChange={event => update('allow_family_announcements', event.target.value === 'yes')}><option value="yes">Yes, send family announcements</option><option value="no">No announcement emails for now</option></select></label></div><label>Emergency contact notes <span className="optional">private</span><textarea rows={3} value={form.emergency_contact_notes} onChange={event => update('emergency_contact_notes', event.target.value)} /></label></div>
}

function RelationshipsStep({ relationships, setRelationships }: { relationships: RelationshipRow[]; setRelationships: (rows: RelationshipRow[]) => void }) {
  const patch = (index: number, patch: Partial<RelationshipRow>) => setRelationships(relationships.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))
  return <div className="onboarding-step"><div className="section-title"><div><h2>Family relationships</h2><p>Start with manually entered relatives. A full family tree can come later.</p></div><Heart /></div><div className="repeat-list">{relationships.map((relationship, index) => <article className="repeat-card" key={index}><div className="field-grid field-grid--three"><label>Relationship<select value={relationship.relationship_type} onChange={event => patch(index, { relationship_type: event.target.value as RelationshipRow['relationship_type'] })}><option value="spouse_partner">Spouse/partner</option><option value="child">Child</option><option value="parent">Parent</option><option value="sibling">Sibling</option><option value="other">Other</option></select></label><label>Name<input value={relationship.name} onChange={event => patch(index, { name: event.target.value })} /></label><label>Visibility<select value={relationship.visibility} onChange={event => patch(index, { visibility: event.target.value as ProfileVisibility })}>{visibilityOptions(['private', 'members', 'admins'])}</select></label></div><label>Notes<textarea rows={2} value={relationship.notes} onChange={event => patch(index, { notes: event.target.value })} /></label><button className="link-button repeat-remove" type="button" onClick={() => setRelationships(relationships.filter((_, itemIndex) => itemIndex !== index))}><Trash2 /> Remove relationship</button></article>)}</div><button className="button button--secondary" type="button" onClick={() => setRelationships([...relationships, blankRelationship('other')])}><Plus /> Add relationship</button></div>
}

function DatesStep({ importantDates, setImportantDates }: { importantDates: ImportantDateRow[]; setImportantDates: (rows: ImportantDateRow[]) => void }) {
  const patch = (index: number, patch: Partial<ImportantDateRow>) => setImportantDates(importantDates.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))
  return <div className="onboarding-step"><div className="section-title"><div><h2>Important dates</h2><p>Add anniversaries, milestones, memorial dates, or other meaningful moments.</p></div><CheckCircle2 /></div><div className="repeat-list">{importantDates.map((date, index) => <article className="repeat-card" key={index}><div className="field-grid field-grid--three"><label>Type<select value={date.date_type} onChange={event => patch(index, { date_type: event.target.value as ImportantDateRow['date_type'] })}><option value="anniversary">Anniversary</option><option value="wedding">Wedding</option><option value="graduation">Graduation</option><option value="military_service">Military service</option><option value="memorial">Memorial</option><option value="birthday">Birthday</option><option value="reunion">Reunion</option><option value="other">Other</option></select></label><label>Title<input value={date.title} onChange={event => patch(index, { title: event.target.value })} /></label><label>Date<input type="date" value={date.event_date} onChange={event => patch(index, { event_date: event.target.value })} /></label></div><div className="field-grid"><label>Visibility<select value={date.visibility} onChange={event => patch(index, { visibility: event.target.value as ProfileVisibility })}>{visibilityOptions(['private', 'members', 'admins'])}</select></label><label>Notes<input value={date.notes} onChange={event => patch(index, { notes: event.target.value })} /></label></div><button className="link-button repeat-remove" type="button" onClick={() => setImportantDates(importantDates.filter((_, itemIndex) => itemIndex !== index))}><Trash2 /> Remove date</button></article>)}</div><button className="button button--secondary" type="button" onClick={() => setImportantDates([...importantDates, blankDate()])}><Plus /> Add date</button></div>
}

function PublicPageStep({ form, update, links, setLinks }: { form: OnboardingForm; update: <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => void; links: ProfileLinkRow[]; setLinks: (rows: ProfileLinkRow[]) => void }) {
  const patch = (index: number, patch: Partial<ProfileLinkRow>) => setLinks(links.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))
  return <div className="onboarding-step"><div className="library-notice"><ShieldCheck /><div><strong>Public profile is off until you enable it.</strong><p>Only the fields in this section can appear publicly, and only after you turn the page on. Full birthday, address, phone, emergency notes, and documents stay private.</p></div></div><label className="toggle-line"><input type="checkbox" checked={form.public_profile_enabled} onChange={event => update('public_profile_enabled', event.target.checked)} /> Enable my public profile page</label><div className="field-grid"><label>Profile URL slug<input value={form.slug} onChange={event => update('slug', event.target.value.toLowerCase())} placeholder="brady" /></label><label>Public display name<input value={form.public_display_name} onChange={event => update('public_display_name', event.target.value)} /></label></div><label>Short public bio<textarea rows={3} value={form.public_bio} onChange={event => update('public_bio', event.target.value)} /></label><label>Interests and hobbies <span className="optional">one per line</span><textarea rows={3} value={form.interests} onChange={event => update('interests', event.target.value)} /></label><label>Skills and occupations <span className="optional">one per line</span><textarea rows={3} value={form.skills_occupations} onChange={event => update('skills_occupations', event.target.value)} /></label><label>Family story section<textarea rows={4} value={form.family_story} onChange={event => update('family_story', event.target.value)} /></label><div className="repeat-list">{links.map((link, index) => <article className="repeat-card" key={index}><div className="field-grid field-grid--three"><label>Label<input value={link.label} onChange={event => patch(index, { label: event.target.value })} /></label><label>URL<input value={link.url} onChange={event => patch(index, { url: event.target.value })} placeholder="https://example.com" /></label><label>Visibility<select value={link.visibility} onChange={event => patch(index, { visibility: event.target.value as ProfileVisibility })}>{visibilityOptions(['private', 'members', 'public_profile'])}</select></label></div><button className="link-button repeat-remove" type="button" onClick={() => setLinks(links.filter((_, itemIndex) => itemIndex !== index))}><Trash2 /> Remove link</button></article>)}</div><button className="button button--secondary" type="button" onClick={() => setLinks([...links, blankLink()])}><LinkIcon /> Add link</button></div>
}

function DocumentsStep({ documents, setDocuments }: { documents: DocumentRow[]; setDocuments: (rows: DocumentRow[]) => void }) {
  const patch = (index: number, patch: Partial<DocumentRow>) => setDocuments(documents.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))
  return <div className="onboarding-step"><div className="library-notice"><FileText /><div><strong>Uploads coming soon.</strong><p>For now, add metadata so the family archive has a place ready for private documents. File upload support will use private storage and signed URLs after authorization checks.</p></div></div><div className="repeat-list">{documents.map((document, index) => <article className="repeat-card" key={index}><div className="field-grid field-grid--three"><label>Title<input value={document.title} onChange={event => patch(index, { title: event.target.value })} placeholder="Marriage certificate" /></label><label>Document type<input value={document.document_type} onChange={event => patch(index, { document_type: event.target.value })} /></label><label>Date<input type="date" value={document.document_date} onChange={event => patch(index, { document_date: event.target.value })} /></label></div><label>Description<textarea rows={2} value={document.description} onChange={event => patch(index, { description: event.target.value })} /></label><div className="field-grid"><label>Visibility<select value={document.visibility} onChange={event => patch(index, { visibility: event.target.value as ProfileVisibility })}>{visibilityOptions(['private', 'members', 'admins'])}</select></label><label>Notes<input value={document.notes} onChange={event => patch(index, { notes: event.target.value })} /></label></div><button className="link-button repeat-remove" type="button" onClick={() => setDocuments(documents.filter((_, itemIndex) => itemIndex !== index))}><Trash2 /> Remove document</button></article>)}</div><button className="button button--secondary" type="button" onClick={() => setDocuments([...documents, blankDocument()])}><Plus /> Add document metadata</button></div>
}

function ReviewStep({ form, phones, relationships, importantDates, documents }: { form: OnboardingForm; phones: PhoneRow[]; relationships: RelationshipRow[]; importantDates: ImportantDateRow[]; documents: DocumentRow[] }) {
  return <div className="onboarding-step review-grid"><article><strong>Basics</strong><span>{form.display_name || `${form.first_name} ${form.last_name}`}</span><small>{form.birthdate ? `Birthday visibility: ${form.birthdate_visibility}` : 'Birthday can be added later'}</small></article><article><strong>Contact</strong><span>{phones.filter(item => item.number).length} phone number(s)</span><small>{form.allow_family_announcements ? 'Announcement emails enabled' : 'Announcement emails disabled'}</small></article><article><strong>Family</strong><span>{relationships.filter(item => item.name).length} relationship(s)</span><small>Relationships default to private or family-only.</small></article><article><strong>Dates</strong><span>{importantDates.filter(item => item.title && item.event_date).length} important date(s)</span><small>Full dates use your selected visibility.</small></article><article><strong>Public page</strong><span>{form.public_profile_enabled ? `/${form.slug || 'your-slug'}` : 'Disabled'}</span><small>Only this public page section can appear outside login.</small></article><article><strong>Archive</strong><span>{documents.filter(item => item.title).length} document metadata item(s)</span><small>Uploads remain disabled until storage UI is enabled.</small></article></div>
}

function visibilityOptions(values: ProfileVisibility[]) {
  return values.map(value => <option value={value} key={value}>{visibilityLabel(value)}</option>)
}
