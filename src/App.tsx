import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { PublicLayout } from './layouts/PublicLayout'
import { AppLayout } from './layouts/AppLayout'
import { HomePage } from './pages/public/HomePage'
import { LoginPage } from './pages/public/LoginPage'
import { RequestAccessPage } from './pages/public/RequestAccessPage'
import { PrivacyPage } from './pages/public/PrivacyPage'
import { PendingAccess } from './components/PendingAccess'
import { Spinner } from './components/Spinner'

const DashboardPage = lazy(() => import('./pages/app/DashboardPage').then(module => ({ default: module.DashboardPage })))
const DirectoryPage = lazy(() => import('./pages/app/DirectoryPage').then(module => ({ default: module.DirectoryPage })))
const CalendarPage = lazy(() => import('./pages/app/CalendarPage').then(module => ({ default: module.CalendarPage })))
const AnnouncementsPage = lazy(() => import('./pages/app/AnnouncementsPage').then(module => ({ default: module.AnnouncementsPage })))
const ProfilePage = lazy(() => import('./pages/app/ProfilePage').then(module => ({ default: module.ProfilePage })))
const LibraryPage = lazy(() => import('./pages/app/LibraryPage').then(module => ({ default: module.LibraryPage })))
const FamilyTreePage = lazy(() => import('./pages/app/FamilyTreePage').then(module => ({ default: module.FamilyTreePage })))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then(module => ({ default: module.AdminDashboardPage })))
const ApprovalsPage = lazy(() => import('./pages/admin/ApprovalsPage').then(module => ({ default: module.ApprovalsPage })))
const AdminSectionPage = lazy(() => import('./pages/admin/AdminSectionPage').then(module => ({ default: module.AdminSectionPage })))

function ProtectedRoute({ adminOnly = false }: { adminOnly?: boolean }) {
  const { profile, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="screen-center"><Spinner label="Checking your access" /></div>
  if (!profile) return <Navigate to="/login" state={{ from: location }} replace />
  if (profile.status === 'pending' || profile.role === 'pending') return <PendingAccess />
  if (profile.status !== 'approved') return <Navigate to="/login" replace />
  const isAdmin = profile.role === 'admin' || profile.role === 'super_admin'
  if (adminOnly && !isAdmin) return <Navigate to="/app" replace />
  return <AppLayout />
}

export default function App() {
  return (
    <Suspense fallback={<div className="screen-center"><Spinner label="Opening your family space" /></div>}>
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/request-access" element={<RequestAccessPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<DashboardPage />} />
        <Route path="/app/directory" element={<DirectoryPage />} />
        <Route path="/app/calendar" element={<CalendarPage />} />
        <Route path="/app/announcements" element={<AnnouncementsPage />} />
        <Route path="/app/profile" element={<ProfilePage />} />
        <Route path="/app/photos" element={<LibraryPage type="photos" />} />
        <Route path="/app/documents" element={<LibraryPage type="documents" />} />
        <Route path="/app/family-tree-placeholder" element={<FamilyTreePage />} />
      </Route>

      <Route element={<ProtectedRoute adminOnly />}>
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/approvals" element={<ApprovalsPage />} />
        <Route path="/admin/members" element={<AdminSectionPage section="members" />} />
        <Route path="/admin/events" element={<AdminSectionPage section="events" />} />
        <Route path="/admin/announcements" element={<AdminSectionPage section="announcements" />} />
        <Route path="/admin/settings" element={<AdminSectionPage section="settings" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  )
}
