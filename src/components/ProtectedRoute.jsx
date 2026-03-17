import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { session, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0c1a2e]">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  return session ? <Outlet /> : <Navigate to="/login" replace />
}
