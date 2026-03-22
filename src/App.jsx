import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AdminRoute from './components/AdminRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Home from './pages/Home'
import OrgSetup from './pages/OrgSetup'
import UserManagement from './pages/UserManagement'
import Billing from './pages/Billing'
import ServiceCatalog from './pages/ServiceCatalog'
import NotificationSettings from './pages/NotificationSettings'
import ActivityLog from './pages/ActivityLog'
import Memberships from './pages/Memberships'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<AdminRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/home" replace />} />
              <Route path="/home"          element={<Home />} />
              <Route path="/org-setup"     element={<OrgSetup />} />
              <Route path="/users"         element={<UserManagement />} />
              <Route path="/billing"       element={<Billing />} />
              <Route path="/services"      element={<ServiceCatalog />} />
              <Route path="/memberships"   element={<Memberships />} />
              <Route path="/notifications" element={<NotificationSettings />} />
              <Route path="/activity"      element={<ActivityLog />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
