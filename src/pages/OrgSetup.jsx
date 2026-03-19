import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function OrgSetup() {
  const { org, profile } = useAuth()

  // Form fields — initialized from org in AuthContext
  const [name,         setName]         = useState('')
  const [address,      setAddress]      = useState('')
  const [phone,        setPhone]        = useState('')
  const [website,      setWebsite]      = useState('')
  const [primaryColor, setPrimaryColor] = useState('#f59e0b')
  const [logoUrl,      setLogoUrl]      = useState('')

  const [saving,        setSaving]        = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [success,       setSuccess]       = useState(false)
  const [error,         setError]         = useState(null)
  const [logoError,     setLogoError]     = useState(null)

  const fileInputRef = useRef(null)

  // Populate form from org object once available
  useEffect(() => {
    if (org) {
      setName(org.name || '')
      setAddress(org.address || '')
      setPhone(org.phone || '')
      setWebsite(org.website || '')
      setPrimaryColor(org.primary_color || '#f59e0b')
      setLogoUrl(org.logo_url || '')
    }
  }, [org])

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file || !org?.id) return
    setLogoError(null)
    setUploadingLogo(true)
    try {
      const path = `${org.id}/logo`
      const { error: uploadErr } = await supabase.storage
        .from('org-assets')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadErr) { setLogoError(uploadErr.message); return }

      // Get public URL and persist to orgs table
      const { data: { publicUrl } } = supabase.storage.from('org-assets').getPublicUrl(path)
      const { error: updateErr } = await supabase
        .from('orgs').update({ logo_url: publicUrl }).eq('id', org.id)
      if (updateErr) { setLogoError(updateErr.message) } else { setLogoUrl(publicUrl) }
    } catch {
      setLogoError('Upload failed — check your connection and try again.')
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!org?.id) return
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const { error: err } = await supabase
        .from('orgs')
        .update({ name, address, phone, website, primary_color: primaryColor })
        .eq('id', org.id)
      if (err) {
        setError(err.message)
      } else {
        setSuccess(true)
        // Reload to refresh org data in AuthContext
        setTimeout(() => window.location.reload(), 800)
      }
    } catch {
      setError('Failed to save — check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!profile || !org) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Org Setup</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your practice name, contact info, and branding.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Practice Info card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Practice Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Practice Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                placeholder="Bridgeway Therapy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Address</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                placeholder="123 Main St, Suite 100, City, ST 00000"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                  placeholder="(555) 000-0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Website</label>
                <input
                  type="url"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Branding card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Branding</h2>
          <div className="space-y-6">
            {/* Logo upload */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Logo</label>
              <p className="text-xs text-gray-500 mb-3">
                Logo appears in the Dashboard and Client Portal sidebars. Recommended: square PNG, at least 64×64px.
              </p>
              {logoUrl && (
                <div className="mb-3">
                  <img
                    src={logoUrl}
                    alt="Current org logo"
                    className="w-16 h-16 rounded-lg object-contain bg-gray-800 border border-gray-700 p-1"
                  />
                </div>
              )}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700 text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  {uploadingLogo ? 'Uploading…' : logoUrl ? 'Replace Logo' : 'Upload Logo'}
                </button>
                {logoUrl && (
                  <span className="text-xs text-gray-500">Logo uploaded</span>
                )}
              </div>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleLogoUpload}
                className="hidden"
              />
              {logoError && <p className="mt-2 text-red-400 text-xs">{logoError}</p>}
            </div>

            {/* Primary color */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-gray-700 bg-gray-800 cursor-pointer p-0.5"
                />
                <span className="text-sm text-gray-400 font-mono">{primaryColor}</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                This color applies to accent elements in the Dashboard and Client Portal.
              </p>
            </div>
          </div>
        </div>

        {/* Feedback */}
        {error   && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-green-400 text-sm">Saved! Refreshing…</p>}

        <button
          type="submit"
          disabled={saving}
          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-[#0c1a2e] font-semibold rounded-lg px-6 py-2.5 text-sm transition-colors"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
