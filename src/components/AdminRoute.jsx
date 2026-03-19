import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Only admin and manager roles can access admin app pages
export default function AdminRoute() {
  const { session, profile, role, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0c1a2e]">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!session) return <Navigate to="/login" replace />
  // Profile loads async after session — wait for it before role-checking.
  // Without this guard, role=null briefly and every admin/manager gets
  // wrongly redirected to /login on every navigation or tab switch.
  if (profile === null) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0c1a2e]">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (role !== 'admin' && role !== 'manager') return <Navigate to="/login" replace />
  return <Outlet />
}
