import { Outlet } from 'react-router-dom'
import MinimalSidebar from '../nav/MinimalSidebar'
import PastDueBanner from '../PastDueBanner'

export default function MinimalLayout() {
  return (
    <div className="flex min-h-screen bg-[#0e1825]" data-layout-theme="minimal">
      <MinimalSidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        <PastDueBanner />
        <div className="px-10 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
