import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

// Format price as dollar string
function formatPrice(price) {
  return `$${Number(price ?? 0).toFixed(2)}`
}

export default function ServiceCatalog() {
  const { profile } = useAuth()

  const [activeTab, setActiveTab] = useState('services') // 'services' | 'packages'

  const [services,  setServices]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  // Add form state
  const [showAdd,    setShowAdd]    = useState(false)
  const [addName,    setAddName]    = useState('')
  const [addMinutes, setAddMinutes] = useState(60)
  const [addPrice,   setAddPrice]   = useState(0)
  const [addError,   setAddError]   = useState(null)
  const [adding,     setAdding]     = useState(false)

  // Inline edit state — tracks which row is being edited and its draft values
  const [editId,      setEditId]      = useState(null)
  const [editName,    setEditName]    = useState('')
  const [editMinutes, setEditMinutes] = useState(60)
  const [editPrice,   setEditPrice]   = useState(0)
  const [editSaving,  setEditSaving]  = useState(false)
  const [editError,   setEditError]   = useState(null)

  // Archived section expanded state
  const [showArchived, setShowArchived] = useState(false)

  // Package template state
  const [packages,     setPackages]     = useState([])
  const [loadingPkgs,  setLoadingPkgs]  = useState(false)
  const [showAddPkg,   setShowAddPkg]   = useState(false)
  const [pkgForm,      setPkgForm]      = useState({ name: '', sessions: 10, price: '', expiry_days: '' })
  const [addingPkg,    setAddingPkg]    = useState(false)
  const [pkgError,     setPkgError]     = useState(null)

  async function loadServices() {
    if (!profile?.org_id) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('services')
        .select('*')
        .eq('org_id', profile.org_id)
        .order('name')
      if (err) { setError(err.message); return }
      setServices(data || [])
    } catch {
      setError('Failed to load services — check your connection.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadServices(); loadPackages() }, [profile?.org_id])

  async function loadPackages() {
    if (!profile?.org_id) return
    setLoadingPkgs(true)
    try {
      const { data, error: err } = await supabase
        .from('client_packages')
        .select('*, client:clients!client_id(name)')
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: false })
        .limit(100)
      if (!err) setPackages(data || [])
    } catch { /* ignore */ } finally {
      setLoadingPkgs(false)
    }
  }

  async function handleAddPackage(e) {
    e.preventDefault()
    if (!pkgForm.name.trim()) { setPkgError('Name is required.'); return }
    setPkgError(null)
    setAddingPkg(true)
    // This creates a "template" as a package with no client — we'll just store it as reference
    // Actually, packages belong to clients. Let's just show existing packages for management.
    // For now, store package templates in a simpler way — just show the existing packages list.
    setAddingPkg(false)
    setPkgError('Package templates coming soon. Packages are currently added from the Client Detail page in the Dashboard.')
  }

  const active   = services.filter(s => !s.is_archived)
  const archived = services.filter(s =>  s.is_archived)

  // -- Add service --
  async function handleAdd(e) {
    e.preventDefault()
    if (!addName.trim()) { setAddError('Name is required.'); return }
    setAddError(null)
    setAdding(true)
    const { error: err } = await supabase.from('services').insert({
      org_id:      profile.org_id,
      name:        addName.trim(),
      duration_minutes: Number(addMinutes),
      price:       Number(addPrice),
      is_archived: false,
    })
    setAdding(false)
    if (err) { setAddError(err.message); return }
    setAddName('')
    setAddMinutes(60)
    setAddPrice(0)
    setShowAdd(false)
    loadServices()
  }

  // -- Inline edit --
  function startEdit(row) {
    setEditId(row.id)
    setEditName(row.name)
    setEditMinutes(row.duration_minutes ?? 60)
    setEditPrice(row.price ?? 0)
    setEditError(null)
  }

  function cancelEdit() {
    setEditId(null)
    setEditError(null)
  }

  async function saveEdit(row) {
    if (!editName.trim()) { setEditError('Name is required.'); return }
    setEditSaving(true)
    setEditError(null)
    const { error: err } = await supabase
      .from('services')
      .update({ name: editName.trim(), duration_minutes: Number(editMinutes), price: Number(editPrice) })
      .eq('id', row.id)
    setEditSaving(false)
    if (err) { setEditError(err.message); return }
    setEditId(null)
    loadServices()
  }

  // -- Archive / Restore --
  async function toggleArchive(row) {
    const { error: err } = await supabase
      .from('services')
      .update({ is_archived: !row.is_archived })
      .eq('id', row.id)
    if (!err) loadServices()
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Service Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">Manage services and client packages.</p>
        </div>
        {activeTab === 'services' && (
          <button
            onClick={() => { setShowAdd(v => !v); setAddError(null) }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-[#0c1a2e] text-sm font-semibold rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            Add Service
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-800 rounded-lg p-0.5 mb-6 max-w-xs">
        <button onClick={() => setActiveTab('services')}
          className={`flex-1 text-sm py-2 rounded-md transition-colors font-medium ${
            activeTab === 'services' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-400'
          }`}>Services</button>
        <button onClick={() => setActiveTab('packages')}
          className={`flex-1 text-sm py-2 rounded-md transition-colors font-medium ${
            activeTab === 'packages' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-400'
          }`}>Packages</button>
      </div>

      {activeTab === 'services' && (<>
      {/* Inline add form */}
      {showAdd && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white mb-4">New Service</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Service Name <span className="text-red-400">*</span></label>
              <input
                type="text" required value={addName} onChange={e => setAddName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                placeholder="Initial Consultation"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Duration (minutes)</label>
              <input
                type="number" min={1} value={addMinutes} onChange={e => setAddMinutes(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Price ($)</label>
              <input
                type="number" min={0} step="0.01" value={addPrice} onChange={e => setAddPrice(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
            <div className="sm:col-span-3 flex items-center gap-3">
              <button
                type="submit" disabled={adding}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-[#0c1a2e] text-sm font-semibold rounded-lg transition-colors"
              >
                {adding ? 'Adding…' : 'Add Service'}
              </button>
              <button
                type="button" onClick={() => setShowAdd(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              {addError && <p className="text-red-400 text-xs">{addError}</p>}
            </div>
          </form>
        </div>
      )}

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {/* Active services table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Duration</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Price</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-right px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {active.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-500 text-sm">No active services. Add one above.</td>
              </tr>
            )}
            {active.map(row => (
              <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                {editId === row.id ? (
                  // Inline edit row
                  <>
                    <td className="px-5 py-3">
                      <input
                        type="text" value={editName} onChange={e => setEditName(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="number" min={1} value={editMinutes} onChange={e => setEditMinutes(e.target.value)}
                        className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="number" min={0} step="0.01" value={editPrice} onChange={e => setEditPrice(e.target.value)}
                        className="w-28 bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                    </td>
                    <td className="px-5 py-3">
                      {editError && <p className="text-red-400 text-xs">{editError}</p>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => saveEdit(row)} disabled={editSaving}
                          className="px-3 py-1.5 text-xs rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-[#0c1a2e] font-semibold transition-colors"
                        >
                          {editSaving ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  // Read row
                  <>
                    <td className="px-5 py-4 text-white font-medium">{row.name}</td>
                    <td className="px-5 py-4 text-gray-400">{row.duration_minutes ?? '—'} min</td>
                    <td className="px-5 py-4 text-gray-300">{formatPrice(row.price)}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                        Active
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEdit(row)}
                          className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:text-white transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleArchive(row)}
                          className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:text-white transition-colors"
                        >
                          Archive
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Archived services section (collapsible) */}
      {archived.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowArchived(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <span className="font-medium">Archived Services ({archived.length})</span>
            <svg
              className={`w-4 h-4 transition-transform ${showArchived ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showArchived && (
            <table className="w-full text-sm border-t border-gray-800">
              <tbody className="divide-y divide-gray-800/60">
                {archived.map(row => (
                  <tr key={row.id} className="opacity-60 hover:opacity-80 transition-opacity">
                    <td className="px-5 py-4 text-white font-medium w-1/3">{row.name}</td>
                    <td className="px-5 py-4 text-gray-400">{row.duration_minutes ?? '—'} min</td>
                    <td className="px-5 py-4 text-gray-300">{formatPrice(row.price)}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-700/50 text-gray-500 border border-gray-700">
                        Archived
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => toggleArchive(row)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:text-white transition-colors"
                      >
                        Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      </>)}

      {/* Packages tab */}
      {activeTab === 'packages' && (
        <div>
          <div className="mb-4">
            <p className="text-sm text-gray-500">
              Client packages are managed from the Client Detail page in the Dashboard.
              Below is an overview of all active and past packages.
            </p>
          </div>

          {loadingPkgs ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : packages.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <p className="text-gray-500 text-sm">No packages have been created yet.</p>
              <p className="text-gray-600 text-xs mt-1">Add packages from the Client Detail page in the Dashboard.</p>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Client</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Package</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Sessions</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Price</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Expires</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {packages.map(pkg => {
                    const remaining = pkg.total_sessions - pkg.used_sessions
                    return (
                      <tr key={pkg.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-4 text-white font-medium">{pkg.client?.name || '—'}</td>
                        <td className="px-5 py-4 text-gray-300">{pkg.name}</td>
                        <td className="px-5 py-4 text-gray-400">
                          {pkg.used_sessions}/{pkg.total_sessions}
                          <span className="text-gray-600 ml-1">({remaining} left)</span>
                        </td>
                        <td className="px-5 py-4 text-gray-300">{formatPrice(pkg.price)}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${
                            pkg.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            pkg.status === 'exhausted' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            pkg.status === 'expired' ? 'bg-gray-700/50 text-gray-500 border-gray-700' :
                            'bg-gray-700/50 text-gray-500 border-gray-700'
                          }`}>{pkg.status}</span>
                        </td>
                        <td className="px-5 py-4 text-gray-500">
                          {pkg.expires_at
                            ? new Date(pkg.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : '—'
                          }
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
