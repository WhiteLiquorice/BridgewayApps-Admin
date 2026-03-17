import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

// Simple toggle switch component
function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative w-10 h-6 rounded-full transition-colors focus:outline-none ${enabled ? 'bg-amber-500' : 'bg-gray-700'}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-1'}`}
      />
    </button>
  )
}

export default function Billing() {
  const { profile } = useAuth()

  // Add-on UI toggles — not persisted yet (Stripe integration is Phase 5)
  const [portalAddon,  setPortalAddon]  = useState(false)
  const [bookingAddon, setBookingAddon] = useState(false)

  const [staffCount, setStaffCount] = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  useEffect(() => {
    async function loadStaffCount() {
      if (!profile?.org_id) return
      setLoading(true)
      const { count, error: err } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', profile.org_id)
        .in('role', ['admin', 'manager', 'staff'])
      setLoading(false)
      if (err) { setError(err.message); return }
      setStaffCount(count ?? 0)
    }
    loadStaffCount()
  }, [profile?.org_id])

  const overage     = Math.max(0, staffCount - 10)
  const overageCost = overage * 10

  return (
    <div className="p-8 max-w-2xl">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Billing</h1>
        <p className="text-sm text-gray-500 mt-1">View your plan, add-ons, and staff user counts.</p>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {/* Current Plan card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Bridgeway Base</h2>
            <p className="text-2xl font-bold text-white mt-1">$200<span className="text-gray-500 text-base font-normal">/mo</span></p>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
            Active
          </span>
        </div>

        <ul className="space-y-1.5 mb-5">
          {[
            'Dashboard + Admin App',
            'Up to 10 staff users',
            'Automated appointment notifications',
          ].map(item => (
            <li key={item} className="flex items-center gap-2 text-sm text-gray-400">
              <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {item}
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800 text-sm mb-5">
          <div>
            <p className="text-gray-500 text-xs mb-0.5">Next billing date</p>
            <p className="text-gray-300">—</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-0.5">Payment method</p>
            <p className="text-gray-300">—</p>
          </div>
        </div>

        {/* Manage Billing button — disabled until Stripe is integrated */}
        <div className="relative group inline-block">
          <button
            disabled
            className="px-5 py-2.5 bg-gray-800 border border-gray-700 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed"
          >
            Manage Billing
          </button>
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 border border-gray-700 text-xs text-gray-300 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Stripe integration coming soon
          </div>
        </div>
      </div>

      {/* Add-ons card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-5">
        <h2 className="text-sm font-semibold text-white mb-4">Add-ons</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white font-medium">Client Portal</p>
              <p className="text-xs text-gray-500 mt-0.5">+$125/mo · Self-serve booking and intake forms</p>
            </div>
            <Toggle enabled={portalAddon} onChange={setPortalAddon} />
          </div>
          <div className="border-t border-gray-800/60 pt-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-white font-medium">Booking App + Embeddable Widget</p>
              <p className="text-xs text-gray-500 mt-0.5">+$125/mo · Online scheduling widget for your website</p>
            </div>
            <Toggle enabled={bookingAddon} onChange={setBookingAddon} />
          </div>
        </div>
        {/* Note: toggles are UI-only until Stripe integration in Phase 5 */}
        <p className="mt-4 text-xs text-gray-600">Changes take effect at the start of the next billing cycle.</p>
      </div>

      {/* Staff users card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-white mb-3">Staff Users</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            Loading…
          </div>
        ) : (
          <div className="flex items-end gap-3">
            <div>
              <p className="text-3xl font-bold text-white">{staffCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">staff users</p>
            </div>
            <div className="pb-1">
              <p className="text-sm text-gray-400">Base plan includes <span className="text-white">10</span></p>
              {overage > 0 ? (
                <p className="text-sm text-amber-400">${overageCost}/mo overage ({overage} extra user{overage !== 1 ? 's' : ''})</p>
              ) : (
                <p className="text-sm text-green-400">$0 overage</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer note */}
      <p className="text-xs text-gray-600 text-center">
        Billing is managed via Stripe. Full integration coming in Phase 5.
      </p>
    </div>
  )
}
