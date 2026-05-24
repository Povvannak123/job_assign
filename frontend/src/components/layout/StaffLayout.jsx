import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

const StaffLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="staff" />
      <main className="flex-1 ml-56 p-6 min-h-screen relative">
        <Outlet />
      </main>
    </div>
  )
}

export default StaffLayout
