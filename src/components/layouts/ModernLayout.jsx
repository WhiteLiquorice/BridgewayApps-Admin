import { Outlet } from 'react-router-dom'
import ModernSidebar from '../nav/ModernSidebar'
import PastDueBanner from '../PastDueBanner'

export default function ModernLayout() {
  return (
    <div className="flex min-h-screen bg-[#0c1a2e]" data-layout-theme="modern">
      <ModernSidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        <PastDueBanner />
        <Outlet />
      </main>
    </div>
  )
}
