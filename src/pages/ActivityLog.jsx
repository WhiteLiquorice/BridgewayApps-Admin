import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const PAGE_SIZE = 25

const ACTION_LABELS = {
  'appointment.created': 'Created appointment',
  'appointment.status_changed': 'Changed appointment status',
  'appointment.cancelled': 'Cancelled appointment',
  'client.created': 'Created client',
  'client.updated': 'Updated client',
  'booking.confirmed': 'Confirmed booking',
  'booking.declined': 'Declined booking',
  'org.updated': 'Updated org settings',
  'user.invited': 'Invited user',
  'service.created': 'Created service',
  'service.updated': 'Updated service',
}

const ACTION_ICONS = {
  appointment: (
    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  client: (
    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  booking: (
    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  org: (
    <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  default: (
    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

export default function ActivityLog() {
  const { profile } = useAuth()
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const fetchGen = useRef(0)

  useEffect(() => {
    if (!profile?.org_id) return
    fetchLogs()
  }, [page, profile?.org_id])

  async function fetchLogs() {
    const gen = ++fetchGen.current
    setLoading(true)
    try {
      const { data, count } = await supabase
        .from('activity_log')
        .select('id, action, meta, created_at, user_id, profiles(full_name, email)', { count: 'exact' })
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      if (gen !== fetchGen.current) return
      setLogs(data || [])
      setTotal(count || 0)
    } catch {
      if (gen !== fetchGen.current) return
      setLogs([])
      setTotal(0)
    } finally {
      if (gen === fetchGen.current) setLoading(false)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function getIcon(action) {
    const category = action?.split('.')[0]
    return ACTION_ICONS[category] || ACTION_ICONS.default
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-white">Activity Log</h1>
        <p className="text-sm text-gray-500 mt-0.5">{total} events recorded</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <svg className="w-10 h-10 text-gray-700 mb-3" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm text-gray-500">No activity logged yet</p>
            <p className="text-xs text-gray-600 mt-1">Actions from the Dashboard will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/60">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                <div className="flex-shrink-0 mt-0.5">{getIcon(log.action)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200">
                    <span className="font-medium">{log.profiles?.full_name || log.profiles?.email || 'System'}</span>
                    {' '}
                    <span className="text-gray-400">{ACTION_LABELS[log.action] || log.action}</span>
                  </p>
                  {log.meta && Object.keys(log.meta).length > 0 && (
                    <p className="text-xs text-gray-600 mt-0.5 truncate">
                      {JSON.stringify(log.meta).slice(0, 120)}
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-600 flex-shrink-0 whitespace-nowrap">{formatTime(log.created_at)}</span>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-800 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
