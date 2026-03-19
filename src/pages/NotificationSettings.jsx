import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

// Reusable toggle switch
function Toggle({ enabled, onChange, disabled = false }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-10 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none
        ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}
        ${enabled ? 'bg-amber-500' : 'bg-gray-700'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
        ${enabled ? 'translate-x-5' : 'translate-x-1'}`}
      />
    </button>
  )
}

// Message preview card
function PreviewCard({ title, message }) {
  return (
    <div className="bg-gray-800/50 border border-gray-700/60 rounded-xl p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{title}</p>
      <p className="text-sm text-gray-300 leading-relaxed font-mono whitespace-pre-wrap">{message}</p>
    </div>
  )
}

// Default settings when no row exists yet
const DEFAULTS = {
  sms_enabled:   false,
  email_enabled: false,
  remind_24h:    true,
  remind_2h:     false,
}

export default function NotificationSettings() {
  const { profile } = useAuth()

  const [settings,  setSettings]  = useState(DEFAULTS)
  const [rowExists, setRowExists] = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState(null)
  const [success,   setSuccess]   = useState(false)

  useEffect(() => {
    async function loadSettings() {
      if (!profile?.org_id) return
      setLoading(true)
      try {
        const { data, error: err } = await supabase
          .from('notification_settings')
          .select('*')
          .eq('org_id', profile.org_id)
          .maybeSingle()
        if (err) { setError(err.message); return }
        if (data) {
          setSettings({
            sms_enabled:   data.sms_enabled   ?? false,
            email_enabled: data.email_enabled ?? false,
            remind_24h:    data.remind_24h    ?? true,
            remind_2h:     data.remind_2h     ?? false,
          })
          setRowExists(true)
        } else {
          // Use defaults — row will be created on first save
          setSettings(DEFAULTS)
          setRowExists(false)
        }
      } catch {
        setError('Failed to load notification settings — check your connection.')
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [profile?.org_id])

  function toggle(key) {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!profile?.org_id) return
    setSaving(true)
    setError(null)
    setSuccess(false)

    const payload = { org_id: profile.org_id, ...settings }

    // Upsert — inserts if no row exists, updates if it does
    const { error: err } = await supabase
      .from('notification_settings')
      .upsert(payload, { onConflict: 'org_id' })

    setSaving(false)
    if (err) { setError(err.message); return }
    setRowExists(true)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  // 24h and 2h toggles are only meaningful when at least one channel is enabled
  const anyChannelOn = settings.sms_enabled || settings.email_enabled

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-8 max-w-2xl">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Notification Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure automated appointment reminders for your clients.</p>
      </div>

      {!rowExists && (
        <div className="mb-5 flex items-center gap-2 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-xs">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          No settings saved yet. Configure below and click Save to create your notification preferences.
        </div>
      )}

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Channels card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Channels</h2>
          <div className="space-y-4">
            {/* SMS toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Enable SMS reminders</p>
                <p className="text-xs text-gray-500 mt-0.5">Send text message reminders via Twilio</p>
              </div>
              <Toggle enabled={settings.sms_enabled} onChange={() => toggle('sms_enabled')} />
            </div>
            {/* Email toggle */}
            <div className="border-t border-gray-800/60 pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Enable email reminders</p>
                <p className="text-xs text-gray-500 mt-0.5">Send email reminders via SendGrid</p>
              </div>
              <Toggle enabled={settings.email_enabled} onChange={() => toggle('email_enabled')} />
            </div>
          </div>
        </div>

        {/* Timing card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-1">Reminder Timing</h2>
          <p className="text-xs text-gray-500 mb-4">When to send reminders relative to the appointment.</p>
          <div className="space-y-4">
            {/* 24h toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${anyChannelOn ? 'text-white' : 'text-gray-500'}`}>
                  24-hour reminder
                </p>
                <p className="text-xs text-gray-500 mt-0.5">SMS + email · Sent the day before the appointment</p>
              </div>
              <Toggle
                enabled={settings.remind_24h}
                onChange={() => toggle('remind_24h')}
                disabled={!anyChannelOn}
              />
            </div>
            {/* 2h toggle */}
            <div className="border-t border-gray-800/60 pt-4 flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${settings.sms_enabled ? 'text-white' : 'text-gray-500'}`}>
                  2-hour reminder <span className="text-xs text-gray-500">(SMS only)</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Sent 2 hours before the appointment via SMS</p>
              </div>
              <Toggle
                enabled={settings.remind_2h}
                onChange={() => toggle('remind_2h')}
                // 2h reminder is only meaningful when SMS is enabled
                disabled={!settings.sms_enabled}
              />
            </div>
          </div>

          {/* Read-only timing labels */}
          <div className="mt-5 space-y-2 border-t border-gray-800/60 pt-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono bg-gray-800 text-gray-400 border border-gray-700">24h before</span>
              <span className="text-xs text-gray-500">Fixed reminder window</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono bg-gray-800 text-gray-400 border border-gray-700">2h before</span>
              <span className="text-xs text-gray-500">SMS only · Fixed reminder window</span>
            </div>
          </div>
        </div>

        {/* Message previews */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Message Previews</h2>
          <div className="space-y-4">
            <PreviewCard
              title="Appointment Confirmation"
              message={`Hi [Client Name], your appointment for [Service] is confirmed for [Date] at [Time].\nReply STOP to opt out.`}
            />
            <PreviewCard
              title="24-Hour Reminder"
              message={`Reminder: You have an appointment for [Service] tomorrow at [Time].\nReply STOP to opt out.`}
            />
          </div>
        </div>

        {/* Save feedback */}
        {success && <p className="text-green-400 text-sm">Settings saved.</p>}

        {/* Save button */}
        <button
          type="submit"
          disabled={saving}
          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-[#0c1a2e] font-semibold rounded-lg px-6 py-2.5 text-sm transition-colors"
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>

      {/* Integration note */}
      <p className="mt-8 text-xs text-gray-600 text-center">
        SMS powered by Twilio · Email powered by SendGrid · Integration active in Phase 4.
      </p>
    </div>
  )
}
