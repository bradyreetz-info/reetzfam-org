export type UserRole = 'pending' | 'member' | 'editor' | 'admin' | 'super_admin'
export type UserStatus = 'pending' | 'approved' | 'denied' | 'suspended'

export interface UserProfile {
  id: string
  auth_user_id?: string
  email: string
  first_name: string
  last_name: string
  display_name: string
  phone?: string
  role: UserRole
  status: UserStatus
  created_at: string
  approved_at?: string
  approved_by?: string
}

export interface FamilyMember {
  id: string
  first_name: string
  middle_name?: string
  last_name: string
  preferred_name?: string
  birthdate?: string
  birthday_visibility: 'full' | 'month_day' | 'private'
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  household_id?: string
  household_name?: string
  family_branch?: string
  spouse_partner?: string
  children_notes?: string
  relationship_notes?: string
  emergency_contact?: string
  profile_photo_url?: string
  privacy_level: 'members' | 'household' | 'private'
  updated_at: string
}

export interface AccessRequest {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  relationship: string
  verifier: string
  message?: string
  status: 'pending' | 'approved' | 'denied' | 'more_info'
  admin_notes?: string | null
  created_at: string
  reviewed_at?: string | null
  reviewed_by?: string | null
}

export interface Announcement {
  id: string
  title: string
  body: string
  author: string
  created_at: string
  pinned: boolean
  visibility: 'members' | 'editors' | 'admins'
}
