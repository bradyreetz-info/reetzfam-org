import type { AccessRequest, Announcement, FamilyMember } from '../../types'

// Fictional data used only for interface previews. Never replace with real family data in source control.
export const familyMembers: FamilyMember[] = [
  {
    id: 'sample-1', first_name: 'Anna', last_name: 'Reetz', preferred_name: 'Anna',
    birthdate: '1985-07-14', birthday_visibility: 'month_day', email: 'anna@example.com',
    phone: '(555) 010-2048', city: 'Madison', state: 'WI', household_id: 'north-household',
    household_name: 'Northside household', family_branch: 'Wisconsin branch', spouse_partner: 'Samuel',
    relationship_notes: 'Cousin', privacy_level: 'members', updated_at: '2026-06-18T10:00:00Z',
  },
  {
    id: 'sample-2', first_name: 'Daniel', middle_name: 'James', last_name: 'Reetz', preferred_name: 'Dan',
    birthdate: '1972-09-03', birthday_visibility: 'month_day', email: 'daniel@example.com',
    city: 'Minneapolis', state: 'MN', household_id: 'lakes-household', household_name: 'Lakes household',
    family_branch: 'Minnesota branch', relationship_notes: 'Uncle', privacy_level: 'members',
    updated_at: '2026-06-15T14:30:00Z',
  },
  {
    id: 'sample-3', first_name: 'Elise', last_name: 'Reetz', birthday_visibility: 'private',
    email: 'elise@example.com', city: 'Chicago', state: 'IL', household_name: 'City household',
    household_id: 'city-household', family_branch: 'Illinois branch', relationship_notes: 'Cousin',
    privacy_level: 'members', updated_at: '2026-06-09T08:15:00Z',
  },
  {
    id: 'sample-4', first_name: 'Margaret', last_name: 'Reetz', preferred_name: 'Maggie',
    birthdate: '1948-11-21', birthday_visibility: 'month_day', phone: '(555) 010-8842',
    city: 'Green Bay', state: 'WI', household_name: 'Bay household', household_id: 'bay-household',
    family_branch: 'Wisconsin branch', relationship_notes: 'Great-aunt', privacy_level: 'members',
    updated_at: '2026-05-28T19:20:00Z',
  },
]

export const announcements: Announcement[] = [
  {
    id: 'announcement-1', title: 'Save the date: summer family picnic',
    body: 'We’re planning an easygoing afternoon together at the lake. More details and a sign-up list are coming soon.',
    author: 'Family events team', created_at: '2026-06-19T15:00:00Z', pinned: true, visibility: 'members',
  },
  {
    id: 'announcement-2', title: 'Help us label the archive photos',
    body: 'A new batch of scanned photos is ready for review. If you recognize a face or place, add a note.',
    author: 'Archive volunteers', created_at: '2026-06-11T09:00:00Z', pinned: false, visibility: 'members',
  },
  {
    id: 'announcement-3', title: 'Directory check-in',
    body: 'Please take a minute to confirm your preferred contact details and birthday visibility.',
    author: 'Site admin', created_at: '2026-06-02T12:00:00Z', pinned: false, visibility: 'members',
  },
]

export const accessRequests: AccessRequest[] = [
  {
    id: 'request-1', first_name: 'Jamie', last_name: 'Sample', email: 'jamie@example.com',
    phone: '(555) 010-7714', relationship: 'Grandchild of a Reetz family member',
    verifier: 'Anna Sample', message: 'I would like to help organize photos from our branch.',
    status: 'pending', created_at: '2026-06-21T16:40:00Z',
  },
  {
    id: 'request-2', first_name: 'Taylor', last_name: 'Sample', email: 'taylor@example.com',
    relationship: 'Spouse of a family member', verifier: 'Daniel Sample',
    message: 'Daniel shared the portal with me.', status: 'pending', created_at: '2026-06-20T10:15:00Z',
  },
]

export const calendarEvents = [
  { id: 'event-1', title: 'Summer family picnic', start: '2026-07-18', allDay: true, extendedProps: { category: 'Gathering' } },
  { id: 'event-2', title: 'Anna’s birthday', start: '2026-07-14', allDay: true, extendedProps: { category: 'Birthday' } },
  { id: 'event-3', title: 'Archive scanning afternoon', start: '2026-07-25T13:00:00', end: '2026-07-25T16:00:00', extendedProps: { category: 'Volunteer' } },
  { id: 'event-4', title: 'Family history call', start: '2026-08-02T18:30:00', extendedProps: { category: 'History' } },
]
