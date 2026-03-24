import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { nav, LogOutIcon } from './navItems'

export default function MinimalSidebar() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()
  const [hoveredItem, setHoveredItem] = useState(null)

  async function handleSignOut() {
    try { await supabase.auth.signOut() } catch {}
    navigate('/login')
  }

  return (
    <aside className="w-[72px] flex-shrink-0 flex flex-col items-center bg-[#080f1d] border-r border-gray-800/30 min-h-screen sticky top-0">
      {/* Logo */}
      <div className="py-5">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
      </div>

      {/* Nav — icons only with tooltips */}
      <nav className="flex-1 flex flex-col items-center gap-1 py-2">
        {nav.map(({ to, label, icon: Icon }) => (
          <div key={to} className="relative">
            <NavLink
              to={to}
              onMouseEnter={() => setHoveredItem(to)}
              onMouseLeave={() => setHoveredItem(null)}
              className={({ isActive }) =>
                `flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                  isActive ? 'bg-amber-500/10 text-amber-400' : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon />
            </NavLink>
            {hoveredItem === to && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap z-50 pointer-events-none">
                {label}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="py-4 flex flex-col items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
          <span className="text-amber-400 text-xs font-semibold">
            {profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOutIcon />
        </button>
      </div>
    </aside>
  )
}
