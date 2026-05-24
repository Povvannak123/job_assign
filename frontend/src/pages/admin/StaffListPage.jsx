import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUsers } from '../../api/userApi'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import toast from 'react-hot-toast'

const StaffListPage = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getUsers()
      setUsers(res.data.data)
    } catch {
      toast.error('Failed to load staff.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">{users.length} staff members</p>
        </div>
        <Button onClick={() => navigate('/admin/staff/create')}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Staff
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <Spinner centered />
        ) : users.length === 0 ? (
          <div className="px-5 py-16 text-center text-gray-400">No staff accounts found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left border-b border-gray-100">
                  <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Staff ID</th>
                  <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Name</th>
                  <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Phone</th>
                  <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Position</th>
                  <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Location / Row</th>
                  <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Day Off</th>
                  <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Store</th>
                  <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Shift</th>
                  <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap text-center">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                      {String(user.id).padStart(5, '0')}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                      {user.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {user.phone_number || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {user.position || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {user.location_row || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {user.day_off || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {user.store_name || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {user.shift ? (
                        <Badge variant={user.shift === 'Morning' ? 'yellow' : 'blue'}>
                          {user.shift}
                        </Badge>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant={user.is_active ? 'green' : 'red'}>
                        {user.is_active ? 'Active' : 'Absent'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <button
                        onClick={() => navigate(`/admin/staff/${user.id}/edit`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default StaffListPage
