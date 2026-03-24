import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { nav, LogOutIcon } from './navItems'

export default function ClassicTabNav() {
  const { org, profile, user, role } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    try { await supabase.auth.signOut() } catch {}
    navigate('/login')
  }

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col bg-[#0d1520] border-r border-gray-700 min-h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700">
        <div className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-white font-medium text-xs truncate">{org?.name || 'Admin'}</p>
          <p className="text-gray-500 text-[10px] capitalize">{role || 'Admin'}</p>
        </div>
      </div>

      {/* Nav — compact tabs */}
      <nav className="flex-1 px-2 py-2 space-y-px">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-2.5 py-2 rounded text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-gray-800 text-amber-400 border-l-2 border-amber-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50 border-l-2 border-transparent'
              }`
            }
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-2 py-3 border-t border-gray-700">
        <div className="flex items-center gap-2 px-2.5 py-1.5 mb-1">
          <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-amber-400 text-[10px] font-semibold">
              {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[11px] font-medium truncate">{profile?.full_name || user?.email || ''}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded text-xs text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
        >
          <LogOutIcon />
          Sign out
        </button>
      </div>
    </aside>
  )
}
