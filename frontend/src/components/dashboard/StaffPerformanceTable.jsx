import Avatar from '../ui/Avatar'

const getRateColor = (rate) => {
  if (rate >= 70) return { bar: 'bg-green-500', text: 'text-green-600', badge: 'bg-green-50 text-green-700' }
  if (rate >= 40) return { bar: 'bg-amber-400', text: 'text-amber-600', badge: 'bg-amber-50 text-amber-700' }
  return { bar: 'bg-red-500', text: 'text-red-600', badge: 'bg-red-50 text-red-700' }
}

const getRateLabel = (rate) => {
  if (rate >= 70) return 'Good'
  if (rate >= 40) return 'Fair'
  return 'Low'
}

const StaffPerformanceTable = ({ data = [] }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-800">Staff Performance</h3>
          <p className="text-xs text-gray-400 mt-0.5">Task completion overview per staff member</p>
        </div>
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
          {data.length} staff
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/70 border-b border-gray-100 text-left">
              <th className="px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Staff</th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider text-center">Total</th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider text-center">Done</th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider text-center">Active</th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider text-center">Overdue</th>
              <th className="px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider text-center">Performance</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm">No staff data available</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((staff, idx) => {
                const rateStyle = getRateColor(staff.performance_rate)
                return (
                  <tr
                    key={staff.id}
                    className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${
                      staff.overdue > 0 ? 'bg-red-50/20' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                    }`}
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={staff.name} size="sm" />
                        <div>
                          <p className="font-medium text-gray-800 leading-tight">{staff.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{staff.total} task{staff.total !== 1 ? 's' : ''} assigned</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-semibold text-gray-700">{staff.total}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 font-semibold text-xs">
                        {staff.completed}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs">
                        {staff.in_progress}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {staff.overdue > 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 font-semibold text-xs">
                          {staff.overdue}
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-400 font-semibold text-xs">
                          0
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-center gap-2.5">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${rateStyle.bar}`}
                            style={{ width: `${staff.performance_rate}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-1.5 min-w-[70px]">
                          <span className={`text-xs font-bold ${rateStyle.text}`}>
                            {staff.performance_rate}%
                          </span>
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${rateStyle.badge}`}>
                            {getRateLabel(staff.performance_rate)}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default StaffPerformanceTable
