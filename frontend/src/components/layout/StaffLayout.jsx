import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import NotificationBell from '../ui/NotificationBell'
import { useAuth } from '../../context/AuthContext'

const StaffLayout = () => {
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="staff" />
      <div className="flex-1 ml-56 min-h-screen flex flex-col">
        {/* Top bar with notification bell */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-6 py-2.5 flex items-center justify-between shadow-sm">
          <p className="text-sm font-semibold text-gray-700">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, <span className="text-red-600">{user?.name?.split(' ')[0]}</span> 👋
          </p>
          <NotificationBell />
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default StaffLayout
