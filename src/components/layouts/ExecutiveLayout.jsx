import { Outlet } from 'react-router-dom'
import ExecutiveTopNav from '../nav/ExecutiveTopNav'
import PastDueBanner from '../PastDueBanner'

export default function ExecutiveLayout() {
  return (
    <div className="min-h-screen bg-[#0f1724]" data-layout-theme="executive">
      <ExecutiveTopNav />
      <PastDueBanner />
      <main className="max-w-7xl mx-auto px-6 py-4 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
