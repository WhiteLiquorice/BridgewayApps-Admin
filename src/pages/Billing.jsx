import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function Billing() {
  const { profile, org } = useAuth()

  const [staffCount, setStaffCount] = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  // Stripe billing info (fetched from edge function)
  const [billingInfo, setBillingInfo] = useState(null)
  const [billingLoading, setBillingLoading] = useState(false)
  const [stripeCustomerId, setStripeCustomerId] = useState(null)
  const [paymentPastDue, setPaymentPastDue] = useState(false)

  // Stripe keys for client payment collection (org's own Stripe)
  const [stripePk,    setStripePk]    = useState('')
  const [stripeSk,    setStripeSk]    = useState('')
  const [paymentReq,  setPaymentReq]  = useState(false)
  const [stripeSaving, setStripeSaving] = useState(false)
  const [stripeSuccess, setStripeSuccess] = useState(false)

  // Portal redirect state
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    async function loadData() {
      if (!profile?.org_id) return
      setLoading(true)
      try {
        const [staffRes, orgRes, settingsRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true })
            .eq('org_id', profile.org_id).in('role', ['admin', 'manager', 'staff']),
          supabase.from('orgs').select('stripe_publishable_key').eq('id', profile.org_id).single(),
          supabase.from('org_settings').select('stripe_secret_key, payment_required, stripe_customer_id, stripe_subscription_id, payment_past_due')
            .eq('org_id', profile.org_id).maybeSingle(),
        ])
        if (staffRes.error) { setError(staffRes.error.message); return }
        setStaffCount(staffRes.count ?? 0)
        if (orgRes.data?.stripe_publishable_key) setStripePk(orgRes.data.stripe_publishable_key)
        if (settingsRes.data) {
          if (settingsRes.data.stripe_secret_key) setStripeSk(settingsRes.data.stripe_secret_key)
          setPaymentReq(settingsRes.data.payment_required ?? false)
          setStripeCustomerId(settingsRes.data.stripe_customer_id ?? null)
          setPaymentPastDue(settingsRes.data.payment_past_due ?? false)
        }
      } catch {
        setError('Failed to load billing data — check your connection.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [profile?.org_id])

  // Fetch billing info from Stripe via edge function when we have a customer ID
  useEffect(() => {
    async function fetchBillingInfo() {
      if (!stripeCustomerId) return
      setBillingLoading(true)
      try {
        const { data, error: fnError } = await supabase.functions.invoke('get-billing-info', {
          body: { stripe_customer_id: stripeCustomerId },
        })
        if (fnError) throw fnError
        setBillingInfo(data)
      } catch (err) {
        console.error('Failed to fetch billing info:', err)
      } finally {
        setBillingLoading(false)
      }
    }
    fetchBillingInfo()
  }, [stripeCustomerId])

  async function openCustomerPortal() {
    if (!stripeCustomerId) return
    setPortalLoading(true)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-portal-session', {
        body: { stripe_customer_id: stripeCustomerId },
      })
      if (fnError) throw fnError
      if (data?.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Failed to open billing portal:', err)
    } finally {
      setPortalLoading(false)
    }
  }

  async function saveStripeKeys(e) {
    e.preventDefault()
    setStripeSaving(true)
    setStripeSuccess(false)
    try {
      await supabase.from('orgs').update({ stripe_publishable_key: stripePk.trim() || null })
        .eq('id', profile.org_id)
      await supabase.from('org_settings').upsert({
        org_id: profile.org_id,
        stripe_secret_key: stripeSk.trim() || null,
        payment_required: paymentReq,
      }, { onConflict: 'org_id' })
      setStripeSuccess(true)
      setTimeout(() => setStripeSuccess(false), 3000)
    } catch { /* ignore */ }
    finally { setStripeSaving(false) }
  }

  const overage     = Math.max(0, staffCount - 10)
  const overageCost = overage * 10

  // Format billing date
  const nextBillingDate = billingInfo?.currentPeriodEnd
    ? new Date(billingInfo.currentPeriodEnd * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'

  const paymentMethodLabel = billingInfo?.paymentMethod
    ? `${billingInfo.paymentMethod.brand?.charAt(0).toUpperCase()}${billingInfo.paymentMethod.brand?.slice(1)} ····${billingInfo.paymentMethod.last4}`
    : '—'

  const planStatus = paymentPastDue ? 'past_due' : (billingInfo?.status || 'active')

  return (
    <div className="p-8 max-w-2xl">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Billing</h1>
        <p className="text-sm text-gray-500 mt-1">View your plan and manage your subscription.</p>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {/* Payment past due banner */}
      {paymentPastDue && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-300">Your payment failed. Please update your billing information to keep your account active.</p>
          </div>
          <button
            onClick={openCustomerPortal}
            disabled={portalLoading}
            className="px-4 py-1.5 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0 ml-4"
          >
            Update Payment
          </button>
        </div>
      )}

      {/* Current Plan card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              {billingLoading ? 'Loading...' : (billingInfo?.planName || 'Bridgeway Apps')}
            </h2>
            <p className="text-2xl font-bold text-white mt-1">$400<span className="text-gray-500 text-base font-normal">/mo</span></p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
            planStatus === 'past_due'
              ? 'bg-red-500/10 text-red-400 border-red-500/20'
              : planStatus === 'active'
                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
          }`}>
            {planStatus === 'past_due' ? 'Past Due' : planStatus === 'active' ? 'Active' : planStatus?.replace('_', ' ') || 'Active'}
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
            <p className="text-gray-300">{billingLoading ? '...' : nextBillingDate}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-0.5">Payment method</p>
            <p className="text-gray-300">{billingLoading ? '...' : paymentMethodLabel}</p>
          </div>
        </div>

        {stripeCustomerId ? (
          <button
            onClick={openCustomerPortal}
            disabled={portalLoading}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-[#0c1a2e] text-sm font-semibold rounded-lg transition-colors"
          >
            {portalLoading ? 'Opening...' : 'Manage Billing'}
          </button>
        ) : (
          <div className="relative group inline-block">
            <button
              disabled
              className="px-5 py-2.5 bg-gray-800 border border-gray-700 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed"
            >
              Manage Billing
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 border border-gray-700 text-xs text-gray-300 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              No Stripe subscription linked to this org
            </div>
          </div>
        )}
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

      {/* Stripe Connect card (org's own Stripe for collecting client payments) */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-white mb-1">Connect Stripe</h2>
        <p className="text-xs text-gray-500 mb-4">Collect payments from clients at booking time.</p>
        <form onSubmit={saveStripeKeys} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Publishable Key</label>
            <input type="text" value={stripePk} onChange={e => setStripePk(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              placeholder="pk_live_..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Secret Key</label>
            <input type="password" value={stripeSk} onChange={e => setStripeSk(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              placeholder="sk_live_..." />
            <p className="text-xs text-gray-600 mt-1">Stored securely in org_settings. Never exposed to the frontend.</p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-800/60">
            <div>
              <p className="text-sm font-medium text-white">Require payment at booking</p>
              <p className="text-xs text-gray-500 mt-0.5">If enabled, clients must pay when booking. If disabled, payment is collected at visit.</p>
            </div>
            <Toggle enabled={paymentReq} onChange={setPaymentReq} />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={stripeSaving}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-[#0c1a2e] text-sm font-semibold rounded-lg transition-colors">
              {stripeSaving ? 'Saving...' : 'Save Stripe Settings'}
            </button>
            {stripeSuccess && <span className="text-green-400 text-sm">Saved.</span>}
          </div>
        </form>
      </div>

      {/* Footer note */}
      <p className="text-xs text-gray-600 text-center">
        Subscription billing is managed via Stripe. Use "Manage Billing" to update your card or cancel.
      </p>
    </div>
  )
}
