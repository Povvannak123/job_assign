import { useState, useEffect } from 'react'
import { getReport } from '../../api/dashboardApi'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

const ReportPage = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = {}
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      const res = await getReport(params)
      setData(res.data.data)
    } catch {
      toast.error('Failed to load report.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReport() }, [])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Performance Report</h1>
        <p className="text-gray-500 text-sm mt-0.5">Staff task completion overview</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button onClick={fetchReport} disabled={loading}>
            {loading ? 'Loading...' : 'Apply Filter'}
          </Button>
          {(dateFrom || dateTo) && (
            <Button
              variant="secondary"
              onClick={() => { setDateFrom(''); setDateTo(''); }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <Spinner centered />
        ) : data.length === 0 ? (
          <div className="px-5 py-16 text-center text-gray-400">No data available</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-5 py-3 font-medium text-gray-500">Staff Member</th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-center">Assigned</th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-center">Completed</th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-center">On Time</th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-center">Late</th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-center">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.map((row) => {
                  const isGood = row.rate >= 70
                  const isMid = row.rate >= 40 && row.rate < 70

                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors ${isGood ? 'bg-green-50/30 hover:bg-green-50/50' : isMid ? 'bg-yellow-50/30 hover:bg-yellow-50/50' : 'bg-red-50/30 hover:bg-red-50/50'}`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={row.name} size="sm" />
                          <span className="font-medium text-gray-800">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center text-gray-600">{row.assigned}</td>
                      <td className="px-5 py-3 text-center text-green-600 font-medium">{row.completed}</td>
                      <td className="px-5 py-3 text-center text-blue-600">{row.on_time}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={row.late > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}>
                          {row.late}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isGood ? 'bg-green-500' : isMid ? 'bg-yellow-400' : 'bg-red-500'}`}
                              style={{ width: `${row.rate}%` }}
                            />
                          </div>
                          <span className={`text-xs font-bold ${isGood ? 'text-green-600' : isMid ? 'text-yellow-600' : 'text-red-600'}`}>
                            {row.rate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        * Performance rate = (Completed ÷ Assigned) × 100 — Green ≥ 70%, Yellow ≥ 40%, Red &lt; 40%
      </p>
    </div>
  )
}

export default ReportPage
