import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import AdminRoute from './AdminRoute'
import StaffRoute from './StaffRoute'
import AdminLayout from '../components/layout/AdminLayout'
import StaffLayout from '../components/layout/StaffLayout'
import LoginPage from '../pages/auth/LoginPage'
import AdminDashboard from '../pages/admin/AdminDashboard'
import TaskListPage from '../pages/admin/TaskListPage'
import TaskCreatePage from '../pages/admin/TaskCreatePage'
import TaskEditPage from '../pages/admin/TaskEditPage'
import StaffListPage from '../pages/admin/StaffListPage'
import StaffCreatePage from '../pages/admin/StaffCreatePage'
import StaffEditPage from '../pages/admin/StaffEditPage'
import ReportPage from '../pages/admin/ReportPage'
import SchedulesPage from '../pages/admin/SchedulesPage'
import IncidentsPage from '../pages/admin/IncidentsPage'
import DepartmentsPage from '../pages/admin/DepartmentsPage'
import InventoryPage from '../pages/admin/InventoryPage'
import AttendancePage from '../pages/admin/AttendancePage'
import AnnouncementsPage from '../pages/admin/AnnouncementsPage'
import PerformancePage from '../pages/admin/PerformancePage'
import AuditLogPage from '../pages/admin/AuditLogPage'
import ComingSoonPage from '../pages/admin/ComingSoonPage'
import StaffDashboard from '../pages/staff/StaffDashboard'
import MyTasksPage from '../pages/staff/MyTasksPage'

const RootRedirect = () => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  return <Navigate to="/staff/dashboard" replace />
}

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { fontSize: '14px' },
        }}
      />
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="tasks" element={<TaskListPage />} />
          <Route path="tasks/create" element={<TaskCreatePage />} />
          <Route path="tasks/:id/edit" element={<TaskEditPage />} />
          <Route path="staff" element={<StaffListPage />} />
          <Route path="staff/create" element={<StaffCreatePage />} />
          <Route path="staff/:id/edit" element={<StaffEditPage />} />
          <Route path="reports" element={<ReportPage />} />
          <Route path="schedules"     element={<SchedulesPage />} />
          <Route path="incidents"     element={<IncidentsPage />} />
          <Route path="departments"   element={<DepartmentsPage />} />
          <Route path="inventory"     element={<InventoryPage />} />
          <Route path="attendance"    element={<AttendancePage />} />
          <Route path="performance"   element={<PerformancePage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="audit-log"     element={<AuditLogPage />} />
          <Route path="settings"      element={<ComingSoonPage title="Settings" />} />
        </Route>

        <Route
          path="/staff"
          element={
            <StaffRoute>
              <StaffLayout />
            </StaffRoute>
          }
        >
          <Route index element={<Navigate to="/staff/dashboard" replace />} />
          <Route path="dashboard" element={<StaffDashboard />} />
          <Route path="tasks" element={<MyTasksPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
