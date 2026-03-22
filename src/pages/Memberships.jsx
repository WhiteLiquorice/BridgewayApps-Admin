import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

function formatPrice(price) {
  return `$${Number(price ?? 0).toFixed(2)}`
}

const BILLING_LABELS = { weekly: '/week', monthly: '/mo', yearly: '/yr' }

export default function Memberships() {
  const { profile } = useAuth()

  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Add form
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    name: '', type: 'sessions', session_count: 10, price: '',
    billing_interval: 'monthly', expiry_days: 90,
  })
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState(null)

  // Edit
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [editSaving, setEditSaving] = useState(false)

  async function loadTemplates() {
    if (!profile?.org_id) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('package_templates')
        .select('*')
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: false })
      if (err) throw err
      setTemplates(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTemplates() }, [profile?.org_id])

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.name.trim()) { setAddError('Name is required.'); return }
    if (!form.price) { setAddError('Price is required.'); return }
    setAddError(null)
    setAdding(true)
    try {
      const payload = {
        org_id: profile.org_id,
        name: form.name.trim(),
        type: form.type,
        price: parseFloat(form.price),
        is_active: true,
      }
      if (form.type === 'sessions') {
        payload.session_count = parseInt(form.session_count) || 10
        payload.expiry_days = parseInt(form.expiry_days) || null
      } else {
        payload.billing_interval = form.billing_interval
      }
      const { error: err } = await supabase.from('package_templates').insert(payload)
      if (err) throw err
      setForm({ name: '', type: 'sessions', session_count: 10, price: '', billing_interval: 'monthly', expiry_days: 90 })
      setShowAdd(false)
      loadTemplates()
    } catch (err) {
      setAddError(err.message)
    } finally {
      setAdding(false)
    }
  }

  function startEdit(row) {
    setEditId(row.id)
    setEditForm({ ...row })
  }

  async function saveEdit() {
    setEditSaving(true)
    try {
      const { error: err } = await supabase.from('package_templates')
        .update({
          name: editForm.name,
          type: editForm.type,
          session_count: editForm.type === 'sessions' ? editForm.session_count : null,
          price: parseFloat(editForm.price),
          billing_interval: editForm.type === 'membership' ? editForm.billing_interval : null,
          expiry_days: editForm.type === 'sessions' ? editForm.expiry_days : null,
          is_active: editForm.is_active,
        })
        .eq('id', editId)
      if (err) throw err
      setEditId(null)
      loadTemplates()
    } catch { /* ignore */ } finally {
      setEditSaving(false)
    }
  }

  async function toggleActive(row) {
    await supabase.from('package_templates')
      .update({ is_active: !row.is_active })
      .eq('id', row.id)
    loadTemplates()
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const active = templates.filter(t => t.is_active)
  const inactive = templates.filter(t => !t.is_active)

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Memberships & Packages</h1>
          <p className="text-sm text-gray-500 mt-1">Define the packages and memberships your business offers.</p>
        </div>
        <button
          onClick={() => { setShowAdd(v => !v); setAddError(null) }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-[#0c1a2e] text-sm font-semibold rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          Add Template
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {/* Add form */}
      {showAdd && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white mb-4">New Package Template</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            {/* Type selector */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Type</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setForm(f => ({ ...f, type: 'sessions' }))}
                  className={`flex-1 text-sm py-2 rounded-lg border transition-colors ${form.type === 'sessions' ? 'border-amber-500/50 bg-amber-500/10 text-amber-400' : 'border-gray-700 text-gray-400'}`}>
                  Session Package
                </button>
                <button type="button" onClick={() => setForm(f => ({ ...f, type: 'membership' }))}
                  className={`flex-1 text-sm py-2 rounded-lg border transition-colors ${form.type === 'membership' ? 'border-amber-500/50 bg-amber-500/10 text-amber-400' : 'border-gray-700 text-gray-400'}`}>
                  Recurring Membership
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Name <span className="text-red-400">*</span></label>
                <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  placeholder={form.type === 'sessions' ? '10-Class Pack' : 'Monthly Unlimited'} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Price ($) <span className="text-red-400">*</span></label>
                <input type="number" min="0" step="0.01" required value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
              </div>
              {form.type === 'sessions' ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Sessions</label>
                    <input type="number" min="1" value={form.session_count} onChange={e => setForm(f => ({ ...f, session_count: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Expiry (days)</label>
                    <input type="number" min="0" value={form.expiry_days} onChange={e => setForm(f => ({ ...f, expiry_days: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      placeholder="e.g. 90" />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Billing Interval</label>
                  <select value={form.billing_interval} onChange={e => setForm(f => ({ ...f, billing_interval: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50">
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={adding}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-[#0c1a2e] text-sm font-semibold rounded-lg transition-colors">
                {adding ? 'Adding...' : 'Add Template'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
              {addError && <p className="text-red-400 text-xs">{addError}</p>}
            </div>
          </form>
        </div>
      )}

      {/* Active templates */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Type</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Details</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Price</th>
              <th className="text-right px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {active.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-500 text-sm">No active templates. Add one above.</td></tr>
            )}
            {active.map(row => (
              <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                {editId === row.id ? (
                  <>
                    <td className="px-5 py-3">
                      <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
                    </td>
                    <td className="px-5 py-3 text-gray-400">{row.type === 'sessions' ? 'Sessions' : 'Membership'}</td>
                    <td className="px-5 py-3">
                      <input type="number" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))}
                        className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
                    </td>
                    <td className="px-5 py-3" />
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={saveEdit} disabled={editSaving}
                          className="px-3 py-1.5 text-xs rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-[#0c1a2e] font-semibold transition-colors">
                          {editSaving ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={() => setEditId(null)}
                          className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:text-white transition-colors">Cancel</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-5 py-4 text-white font-medium">{row.name}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${
                        row.type === 'sessions'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }`}>
                        {row.type === 'sessions' ? 'Session Pack' : 'Membership'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400">
                      {row.type === 'sessions'
                        ? `${row.session_count} sessions${row.expiry_days ? ` · expires ${row.expiry_days}d` : ''}`
                        : `${row.billing_interval}`
                      }
                    </td>
                    <td className="px-5 py-4 text-gray-300">{formatPrice(row.price)}{row.type === 'membership' && BILLING_LABELS[row.billing_interval]}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => startEdit(row)}
                          className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:text-white transition-colors">Edit</button>
                        <button onClick={() => toggleActive(row)}
                          className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:text-white transition-colors">Deactivate</button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Inactive templates */}
      {inactive.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <h3 className="text-sm font-medium text-gray-400">Inactive Templates ({inactive.length})</h3>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-800/60">
              {inactive.map(row => (
                <tr key={row.id} className="opacity-60 hover:opacity-80 transition-opacity">
                  <td className="px-5 py-4 text-white font-medium">{row.name}</td>
                  <td className="px-5 py-4 text-gray-400">{row.type === 'sessions' ? 'Session Pack' : 'Membership'}</td>
                  <td className="px-5 py-4 text-gray-300">{formatPrice(row.price)}</td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => toggleActive(row)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:text-white transition-colors">Reactivate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
