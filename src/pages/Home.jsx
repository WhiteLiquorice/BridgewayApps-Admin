import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

function StatCard({ label, value, icon, accent = 'amber' }) {
  const colors = {
    amber:  'bg-amber-500/10 text-amber-400',
    blue:   'bg-blue-500/10 text-blue-400',
    green:  'bg-green-500/10 text-green-400',
    purple: 'bg-purple-500/10 text-purple-400',
  }
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-white mt-2 tabular-nums">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[accent]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ users: 0, clients: 0, appointments: 0, services: 0 })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.org_id) return
    fetchStats()
  }, [profile?.org_id])

  async function fetchStats() {
    setLoading(true)
    try {
      const [users, clients, appointments, services, activity] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('org_id', profile.org_id),
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('org_id', profile.org_id),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('org_id', profile.org_id),
        supabase.from('services').select('id', { count: 'exact', head: true }).eq('org_id', profile.org_id),
        supabase.from('activity_log').select('id, action, created_at, profiles(full_name)')
          .eq('org_id', profile.org_id).order('created_at', { ascending: false }).limit(5),
      ])
      setStats({
        users: users.count ?? 0,
        clients: clients.count ?? 0,
        appointments: appointments.count ?? 0,
        services: services.count ?? 0,
      })
      setRecentActivity(activity.data || [])
    } catch {
      // Keep defaults
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Admin Home</h1>
        <p className="text-sm text-gray-500 mt-0.5">Organization overview</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Users"
              value={stats.users}
              accent="blue"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
            <StatCard
              label="Clients"
              value={stats.clients}
              accent="green"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />
            <StatCard
              label="Appointments"
              value={stats.appointments}
              accent="amber"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
            <StatCard
              label="Services"
              value={stats.services}
              accent="purple"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                </svg>
              }
            />
          </div>

          {/* Recent activity */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl">
            <div className="px-5 py-4 border-b border-gray-800">
              <h2 className="text-sm font-medium text-white">Recent Activity</h2>
            </div>
            {recentActivity.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-gray-600">No recent activity</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800/60">
                {recentActivity.map(a => (
                  <div key={a.id} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-500/60" />
                      <p className="text-sm text-gray-300">
                        <span className="font-medium">{a.profiles?.full_name || 'System'}</span>
                        {' '}
                        <span className="text-gray-500">{a.action.replace(/\./g, ' ')}</span>
                      </p>
                    </div>
                    <span className="text-xs text-gray-600 whitespace-nowrap">
                      {new Date(a.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
