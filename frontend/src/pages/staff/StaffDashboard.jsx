import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyTasks } from '../../api/taskApi'
import { getMe } from '../../api/authApi'
import { useAuth } from '../../context/AuthContext'
import StatsCard from '../../components/dashboard/StatsCard'
import TaskStatusBadge from '../../components/tasks/TaskStatusBadge'
import TaskPriorityBadge from '../../components/tasks/TaskPriorityBadge'
import Spinner from '../../components/ui/Spinner'
import { formatDate, isOverdue } from '../../utils/formatDate'

// ── Helpers ───────────────────────────────────────────────────────────────────

const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()

const isToday = (dateStr) => {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const t = new Date()
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  )
}

const isUpcomingDays = (dateStr, status, days = 7) => {
  if (!dateStr || status === 'completed') return false
  const d = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const ceiling = new Date(today)
  ceiling.setDate(today.getDate() + days)
  return d > today && d <= ceiling
}

const priorityOrder = { high: 0, medium: 1, low: 2 }

// ── Sub-components ────────────────────────────────────────────────────────────

const SectionHeader = ({ title, subtitle, badge, to }) => (
  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
    <div>
      <h3 className="font-semibold text-gray-800">{title}</h3>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
    <div className="flex items-center gap-2">
      {badge != null && (
        <span className="text-xs font-semibold bg-red-100 text-red-600 px-2.5 py-1 rounded-full">
          {badge}
        </span>
      )}
      {to && (
        <Link
          to={to}
          className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          View all →
        </Link>
      )}
    </div>
  </div>
)

const EmptyState = ({ message }) => (
  <div className="px-6 py-10 text-center">
    <svg className="w-9 h-9 mx-auto text-gray-200 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
    <p className="text-gray-400 text-sm">{message}</p>
  </div>
)

const TaskRow = ({ task, accent }) => {
  const overdue = isOverdue(task.due_date, task.status)
  const creatorName = task.creator?.name ?? 'Admin'

  return (
    <div
      className={`px-6 py-3.5 flex items-center gap-3 hover:bg-gray-50/60 transition-colors ${
        accent ? 'border-l-2 border-l-red-400' : overdue ? 'border-l-2 border-l-orange-400' : ''
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 text-sm truncate">{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Assigned by <span className="font-medium text-gray-600">{creatorName}</span>
          </span>
          {task.due_date && (
            <span className={`text-xs flex items-center gap-1 ${overdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Due {formatDate(task.due_date)}{overdue && ' · Overdue'}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <TaskPriorityBadge priority={task.priority} />
        <TaskStatusBadge status={task.status} />
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const StaffDashboard = () => {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getMyTasks().then((res) => res.data.data ?? []),
      getMe().then((res) => res.data.data).catch(() => null),
    ])
      .then(([taskData, profileData]) => {
        setTasks(taskData)
        setProfile(profileData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ── Derived stats ──────────────────────────────────────────────────────────
  const completed  = tasks.filter((t) => t.status === 'completed').length
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length
  const notStarted = tasks.filter((t) => t.status === 'not_started').length
  const overdueCount = tasks.filter((t) => isOverdue(t.due_date, t.status)).length
  const completionRate =
    tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0

  const todayTasks = tasks
    .filter((t) => isToday(t.due_date) && t.status !== 'completed')
    .sort((a, b) => (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1))

  const upcomingTasks = tasks
    .filter((t) => isUpcomingDays(t.due_date, t.status))
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5)

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)

  // ── Greeting ───────────────────────────────────────────────────────────────
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const displayProfile = profile ?? user

  if (loading) return <Spinner centered />

  return (
    <div className="space-y-6">

      {/* ── Greeting Banner ── */}
      <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-2xl px-6 py-5 flex items-center gap-4 text-white shadow-sm">
        <div className="flex-shrink-0 w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold ring-2 ring-white/30">
          {getInitials(user?.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-red-100 text-sm">{greeting}</p>
          <h1 className="text-xl font-bold truncate">{user?.name}</h1>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {displayProfile?.position && (
              <span className="inline-flex items-center gap-1 text-xs bg-white/15 text-white px-2 py-0.5 rounded-full">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {displayProfile.position}
              </span>
            )}
            {displayProfile?.shift && (
              <span className="inline-flex items-center gap-1 text-xs bg-white/15 text-white px-2 py-0.5 rounded-full">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {displayProfile.shift} Shift
              </span>
            )}
            {displayProfile?.store_name && (
              <span className="inline-flex items-center gap-1 text-xs bg-white/15 text-white px-2 py-0.5 rounded-full">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {displayProfile.store_name}
              </span>
            )}
            {displayProfile?.day_off && (
              <span className="inline-flex items-center gap-1 text-xs bg-white/15 text-white px-2 py-0.5 rounded-full">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Off: {displayProfile.day_off}
              </span>
            )}
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-end flex-shrink-0">
          <p className="text-3xl font-bold tabular-nums">{completionRate}%</p>
          <p className="text-red-100 text-xs mt-0.5">Completion rate</p>
          <p className="text-red-200 text-xs mt-1">{tasks.length} task{tasks.length !== 1 ? 's' : ''} total</p>
        </div>
      </div>

      {/* ── Progress Bar ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-700">Your Task Progress</p>
          <span className={`text-sm font-bold ${
            completionRate >= 70 ? 'text-green-600' : completionRate >= 40 ? 'text-amber-600' : 'text-red-600'
          }`}>
            {completed} / {tasks.length} completed
          </span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              completionRate >= 70 ? 'bg-green-500' : completionRate >= 40 ? 'bg-amber-400' : 'bg-red-500'
            }`}
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
            {notStarted} not started
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            {inProgress} in progress
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            {completed} completed
          </span>
          {overdueCount > 0 && (
            <span className="flex items-center gap-1 text-red-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              {overdueCount} overdue
            </span>
          )}
        </div>
        {overdueCount > 0 && (
          <p className="mt-2 text-xs text-red-500 font-medium flex items-center gap-1">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {overdueCount} task{overdueCount !== 1 ? 's are' : ' is'} overdue — please action them soon
          </p>
        )}
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Not Started"
          value={notStarted}
          color="purple"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatsCard
          title="In Progress"
          value={inProgress}
          color="yellow"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Completed"
          value={completed}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Overdue"
          value={overdueCount}
          color="red"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>

      {/* ── Today's Tasks ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <SectionHeader
          title="Today's Tasks"
          subtitle="Tasks due today assigned by admin"
          badge={todayTasks.length > 0 ? `${todayTasks.length} due today` : null}
          to="/staff/tasks"
        />
        {todayTasks.length === 0 ? (
          <EmptyState message="No tasks due today — great job staying on top of things!" />
        ) : (
          <div className="divide-y divide-gray-50">
            {todayTasks.map((task) => (
              <TaskRow key={task.id} task={task} accent />
            ))}
          </div>
        )}
      </div>

      {/* ── Upcoming Tasks ── */}
      {upcomingTasks.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <SectionHeader
            title="Upcoming Tasks"
            subtitle="Due in the next 7 days"
            to="/staff/tasks"
          />
          <div className="divide-y divide-gray-50">
            {upcomingTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* ── Recent Tasks ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <SectionHeader
          title="Recent Tasks"
          subtitle="Your 5 most recently assigned tasks"
          to="/staff/tasks"
        />
        {recentTasks.length === 0 ? (
          <EmptyState message="No tasks assigned yet" />
        ) : (
          <div className="divide-y divide-gray-50">
            {recentTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default StaffDashboard
