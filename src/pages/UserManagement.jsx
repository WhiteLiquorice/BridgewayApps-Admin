import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

// Role badge colors
function RoleBadge({ role }) {
  const styles = {
    admin:   'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    manager: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    staff:   'bg-gray-500/10 text-gray-400 border border-gray-500/20',
    patient: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium capitalize ${styles[role] || styles.staff}`}>
      {role}
    </span>
  )
}

// Reusable toggle switch
function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-10 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none cursor-pointer
        ${enabled ? 'bg-amber-500' : 'bg-gray-700'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
        ${enabled ? 'translate-x-5' : 'translate-x-1'}`}
      />
    </button>
  )
}

export default function UserManagement() {
  const { profile } = useAuth()

  const [users,       setUsers]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)

  // Invite form state
  const [showInvite,    setShowInvite]    = useState(false)
  const [inviteName,    setInviteName]    = useState('')
  const [inviteEmail,   setInviteEmail]   = useState('')
  const [inviteRole,    setInviteRole]    = useState('staff')
  const [inviting,      setInviting]      = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(null)
  const [inviteError,   setInviteError]   = useState(null)

  // Per-row action feedback
  const [actionFeedback, setActionFeedback] = useState({}) // { [id]: 'deactivated' | 'reactivated' | 'reset' | error string }

  async function loadUsers() {
    if (!profile?.org_id) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .eq('org_id', profile.org_id)
        .order('full_name')
      if (err) { setError(err.message); return }
      setUsers(data || [])
    } catch {
      setError('Failed to load users — check your connection.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [profile?.org_id])

  async function handleToggleActive(row) {
    const newValue = !row.is_active
    const { error: err } = await supabase
      .from('profiles')
      .update({ is_active: newValue })
      .eq('id', row.id)
    if (err) {
      setActionFeedback(prev => ({ ...prev, [row.id]: `Error: ${err.message}` }))
    } else {
      setActionFeedback(prev => ({ ...prev, [row.id]: newValue ? 'Reactivated' : 'Deactivated' }))
      setUsers(prev => prev.map(u => u.id === row.id ? { ...u, is_active: newValue } : u))
      setTimeout(() => setActionFeedback(prev => { const n = { ...prev }; delete n[row.id]; return n }), 2500)
    }
  }

  async function handleResetPassword(row) {
    const { error: err } = await supabase.auth.resetPasswordForEmail(row.email)
    if (err) {
      setActionFeedback(prev => ({ ...prev, [row.id]: `Error: ${err.message}` }))
    } else {
      setActionFeedback(prev => ({ ...prev, [row.id]: 'Reset email sent' }))
      setTimeout(() => setActionFeedback(prev => { const n = { ...prev }; delete n[row.id]; return n }), 2500)
    }
  }

  async function handleInvite(e) {
    e.preventDefault()
    setInviting(true)
    setInviteError(null)
    setInviteSuccess(null)

    // Insert a profile row with no user_id (user_id assigned when they accept the invite)
    // Note: supabase.auth.admin.inviteUserByEmail requires a service role key.
    // We pre-create the profile so the role is assigned when they sign up.
    const { error: err } = await supabase.from('profiles').insert({
      org_id:    profile.org_id,
      full_name: inviteName,
      email:     inviteEmail,
      role:      inviteRole,
      is_active: true,
      user_id:   null, // will be linked when the user accepts their invite
    })

    setInviting(false)
    if (err) {
      setInviteError(err.message)
      // Hint: inviteUserByEmail requires the Supabase service role key, not available client-side.
      setInviteError(
        'Invitation email will be sent via the Supabase dashboard. Save the user record to pre-assign their role. ' +
        `(Detail: ${err.message})`
      )
    } else {
      setInviteSuccess(`${inviteName} added. Send the invitation from the Supabase Auth dashboard.`)
      setInviteName('')
      setInviteEmail('')
      setInviteRole('staff')
      setShowInvite(false)
      loadUsers()
    }
  }

  // Count staff users (admin + manager + staff) for billing note
  const staffCount = users.filter(u => ['admin', 'manager', 'staff'].includes(u.role)).length

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-white">Users</h1>
          <p className="text-sm text-gray-500 mt-1">Manage staff and patient accounts for your org.</p>
        </div>
        <button
          onClick={() => { setShowInvite(v => !v); setInviteError(null); setInviteSuccess(null) }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-[#0c1a2e] text-sm font-semibold rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          Invite User
        </button>
      </div>

      {/* Inline invite form */}
      {showInvite && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white mb-4">Invite New User</h2>
          <form onSubmit={handleInvite} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
              <input
                type="text" required value={inviteName} onChange={e => setInviteName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                placeholder="jane@practice.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Role</label>
              <select
                value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
                <option value="patient">Patient</option>
              </select>
            </div>
            <div className="sm:col-span-3 flex items-center gap-3">
              <button
                type="submit" disabled={inviting}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-[#0c1a2e] text-sm font-semibold rounded-lg transition-colors"
              >
                {inviting ? 'Saving…' : 'Save User'}
              </button>
              <button
                type="button" onClick={() => setShowInvite(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
          {inviteError   && <p className="mt-3 text-red-400 text-xs">{inviteError}</p>}
          {inviteSuccess && <p className="mt-3 text-green-400 text-xs">{inviteSuccess}</p>}
        </div>
      )}

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {/* Users table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Role</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-right px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-500 text-sm">No users found.</td>
              </tr>
            )}
            {users.map(row => (
              <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-4 text-white font-medium">{row.full_name || '—'}</td>
                <td className="px-5 py-4 text-gray-400">{row.email || '—'}</td>
                <td className="px-5 py-4"><RoleBadge role={row.role} /></td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${row.is_active ? 'text-green-400' : 'text-gray-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${row.is_active ? 'bg-green-400' : 'bg-gray-600'}`} />
                    {row.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {actionFeedback[row.id] ? (
                      <span className={`text-xs ${actionFeedback[row.id].startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
                        {actionFeedback[row.id]}
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleToggleActive(row)}
                          className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                        >
                          {row.is_active ? 'Deactivate' : 'Reactivate'}
                        </button>
                        {row.email && (
                          <button
                            onClick={() => handleResetPassword(row)}
                            className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                          >
                            Reset Password
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Billing note */}
      <p className="mt-5 text-xs text-gray-500">
        <span className="text-gray-400 font-medium">{staffCount} of 10</span> staff users included in base plan.
        {staffCount > 10 && (
          <span className="text-amber-400 ml-1">+${(staffCount - 10) * 10}/mo overage.</span>
        )}
        {staffCount <= 10 && ' +$10/mo per additional user.'}
      </p>
    </div>
  )
}
