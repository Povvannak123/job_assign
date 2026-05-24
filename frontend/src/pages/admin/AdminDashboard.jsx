import { useEffect, useState } from 'react'
import { getDashboard } from '../../api/dashboardApi'
import StatsCard from '../../components/dashboard/StatsCard'
import StaffPerformanceTable from '../../components/dashboard/StaffPerformanceTable'
import TaskSummaryChart from '../../components/dashboard/TaskSummaryChart'
import TaskStatusBadge from '../../components/tasks/TaskStatusBadge'
import TaskPriorityBadge from '../../components/tasks/TaskPriorityBadge'
import Spinner from '../../components/ui/Spinner'
import { formatDate } from '../../utils/formatDate'

const AdminDashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getDashboard()
        setData(res.data.data)
      } catch {
        setError('Failed to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (loading) return <Spinner centered />
  if (error) return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="bg-red-50 border border-red-100 rounded-2xl px-6 py-5 text-center max-w-sm">
        <svg className="w-8 h-8 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-red-600 font-medium text-sm">{error}</p>
      </div>
    </div>
  )

  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const todayCount = data?.today_tasks?.length ?? 0

  const completionRate = data?.total_tasks > 0
    ? Math.round((data.completed / data.total_tasks) * 100)
    : 0

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-2xl px-6 py-5 flex items-center justify-between text-white shadow-sm">
        <div>
          <p className="text-red-200 text-xs font-semibold uppercase tracking-wider mb-1">Admin Dashboard</p>
          <h1 className="text-2xl font-bold">Task Overview</h1>
          <p className="text-red-100 text-sm mt-1">Monitor all tasks and staff performance in real-time</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-2xl font-bold tabular-nums">{timeStr}</p>
          <p className="text-red-100 text-sm mt-0.5">{dateStr}</p>
        </div>
      </div>

      {/* Overall completion bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-700">Overall Completion Rate</p>
          <span className={`text-sm font-bold ${completionRate >= 70 ? 'text-green-600' : completionRate >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
            {completionRate}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${completionRate >= 70 ? 'bg-green-500' : completionRate >= 40 ? 'bg-amber-400' : 'bg-red-500'}`}
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <div className="flex gap-4 mt-3 text-xs text-gray-500">
          <span>{data?.completed ?? 0} completed</span>
          <span>·</span>
          <span>{data?.in_progress ?? 0} in progress</span>
          <span>·</span>
          <span>{data?.overdue ?? 0} overdue</span>
          <span>·</span>
          <span>{data?.not_started ?? 0} not started</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Total Tasks"
          value={data?.total_tasks}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatsCard
          title="Completed"
          value={data?.completed}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="In Progress"
          value={data?.in_progress}
          color="yellow"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Overdue"
          value={data?.overdue}
          color="red"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>

      {/* Performance & Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <StaffPerformanceTable data={data?.staff_summary} />
        </div>
        <div>
          <TaskSummaryChart data={data} />
        </div>
      </div>

      {/* Today's Tasks */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">Today's Tasks</h3>
            <p className="text-xs text-gray-400 mt-0.5">Tasks with due date of today</p>
          </div>
          {todayCount > 0 && (
            <span className="text-xs font-semibold bg-red-100 text-red-600 px-2.5 py-1 rounded-full">
              {todayCount} task{todayCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {todayCount === 0 ? (
          <div className="px-6 py-12 text-center">
            <svg className="w-10 h-10 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-400 text-sm">No tasks due today</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data?.today_tasks?.map((task) => (
              <div key={task.id} className="px-6 py-3.5 flex items-center justify-between gap-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{task.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Assigned to: <span className="font-medium text-gray-600">{task.assigned_user?.name || 'Unassigned'}</span>
                    {' '}· Due {formatDate(task.due_date)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <TaskPriorityBadge priority={task.priority} />
                  <TaskStatusBadge status={task.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
