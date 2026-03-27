import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function PastDueBanner() {
  const { orgSettings } = useAuth()
  const [loading, setLoading] = useState(false)

  if (!orgSettings?.payment_past_due) return null

  async function openPortal() {
    if (!orgSettings?.stripe_customer_id) return
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: { stripe_customer_id: orgSettings.stripe_customer_id },
      })
      if (error) throw error
      if (data?.url) window.location.href = data.url
    } catch (err) {
      console.error('Failed to open billing portal:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-red-600 px-4 py-3 flex items-center justify-between gap-4">
      <p className="text-sm text-white font-medium">
        Your payment failed. Please update your billing information to keep your account active.
      </p>
      <button
        onClick={openPortal}
        disabled={loading || !orgSettings?.stripe_customer_id}
        className="px-4 py-1.5 bg-white hover:bg-gray-100 disabled:opacity-50 text-red-600 text-xs font-semibold rounded-lg transition-colors flex-shrink-0"
      >
        {loading ? 'Opening...' : 'Update Billing'}
      </button>
    </div>
  )
}
