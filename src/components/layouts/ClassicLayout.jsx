import { Outlet } from 'react-router-dom'
import ClassicTabNav from '../nav/ClassicTabNav'
import PastDueBanner from '../PastDueBanner'

export default function ClassicLayout() {
  return (
    <div className="flex min-h-screen bg-[#111827]" data-layout-theme="classic">
      <ClassicTabNav />
      <main className="flex-1 min-w-0 overflow-auto">
        <PastDueBanner />
        <Outlet />
      </main>
    </div>
  )
}
