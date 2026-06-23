import { useEffect, useState, useCallback } from 'react'
import { getMyTasks, updateMyTaskStatus } from '../../api/taskApi'
import TaskCommentBox from '../../components/tasks/TaskCommentBox'
import Spinner from '../../components/ui/Spinner'
import { formatDate, isOverdue } from '../../utils/formatDate'
import toast from 'react-hot-toast'

const BACKEND_URL = (import.meta.env.VITE_API_URL || '').replace(/\/api\/v1\/?$/, '')
const resolvePhotoUrl = (url) => {
  if (!url) return null
  const full = url.startsWith('http://') || url.startsWith('https://')
    ? url
    : `${BACKEND_URL}${url.startsWith('/') ? '' : '/'}${url}`
  try {
    const parsed = new URL(full)
    parsed.pathname = parsed.pathname.split('/').map(s => encodeURIComponent(decodeURIComponent(s))).join('/')
    return parsed.toString()
  } catch { return full }
}

const SOP_REGEX   = /^\[(Daily|Weekly|Monthly|Quarterly)\]/i
const CLEAN_TITLE = (t) => t.replace(/^\[[\w]+\]\s*\d+\.\s*/, '')

const STATUS_TABS = [
  { label: 'All',         value: '' },
  { label: 'Not Started', value: 'not_started' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed',   value: 'completed' },
]

const SOP_TABS = [
  { key: 'daily',     label: 'Daily',     regex: /^\[Daily\]/i,     color: 'blue',    active: 'bg-blue-600',   dot: 'bg-blue-500',   border: 'border-l-blue-500'    },
  { key: 'weekly',    label: 'Weekly',    regex: /^\[Weekly\]/i,    color: 'violet',  active: 'bg-violet-600', dot: 'bg-violet-500', border: 'border-l-violet-500'  },
  { key: 'monthly',   label: 'Monthly',   regex: /^\[Monthly\]/i,   color: 'amber',   active: 'bg-amber-500',  dot: 'bg-amber-400',  border: 'border-l-amber-500'   },
  { key: 'quarterly', label: 'Quarterly', regex: /^\[Quarterly\]/i, color: 'emerald', active: 'bg-emerald-600',dot: 'bg-emerald-500',border: 'border-l-emerald-500' },
]

const STATUS_STYLE  = { not_started: 'bg-gray-100 text-gray-600', in_progress: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700' }
const STATUS_LABEL  = { not_started: 'Not Started', in_progress: 'In Progress', completed: 'Completed' }
const PRIORITY_STYLE = { low: 'bg-gray-100 text-gray-500', medium: 'bg-yellow-100 text-yellow-700', high: 'bg-red-100 text-red-600' }

// ── Task Card ────────────────────────────────────────────────────────────────
const TaskCard = ({ task, onStatusUpdate, updatingId, onSuccess, borderCls }) => {
  const overdue    = isOverdue(task.due_date, task.status)
  const isUpdating = updatingId === task.id
  const status     = task.status?.value  ?? task.status  ?? 'not_started'
  const priority   = task.priority?.value ?? task.priority ?? 'medium'

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 border-l-4 ${borderCls} shadow-sm hover:shadow-md transition-shadow`}>
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-semibold text-gray-800 text-sm leading-snug flex-1">{CLEAN_TITLE(task.title)}</h3>
          <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${PRIORITY_STYLE[priority] ?? PRIORITY_STYLE.medium}`}>
            {priority}
          </span>
        </div>
        {task.description && <p className="text-xs text-gray-400 line-clamp-1 mb-2">{task.description}</p>}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[status]}`}>
            {STATUS_LABEL[status] ?? status}
          </span>
          {task.due_date && (
            <span className={`flex items-center gap-1 text-[11px] ${overdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(task.due_date)}{overdue && ' · Overdue'}
            </span>
          )}
        </div>
      </div>

      {task.comments?.length > 0 && (
        <div className="mx-4 mb-3 rounded-xl bg-gray-50 px-3 py-2 border border-gray-100">
          {task.comments.slice(-1).map(c => (
            <div key={c.id} className="text-[11px] text-gray-500 flex gap-1 items-start">
              <span className="font-semibold text-gray-600 shrink-0">{c.user?.name}:</span>
              <span className="line-clamp-1">{c.comment}</span>
              {c.photo_proof && (
                <a href={resolvePhotoUrl(c.photo_proof)} target="_blank" rel="noreferrer" className="ml-1 text-blue-500 underline shrink-0">[photo]</a>
              )}
            </div>
          ))}
          {task.comments.length > 1 && <p className="text-[10px] text-gray-400 mt-0.5">+{task.comments.length - 1} more</p>}
        </div>
      )}

      <div className="px-4 pb-4 flex items-center gap-2">
        {status === 'not_started' && (
          <button disabled={isUpdating} onClick={() => onStatusUpdate(task.id, 'in_progress')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors disabled:opacity-60">
            {isUpdating
              ? <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
              : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
            Start Task
          </button>
        )}
        {status === 'in_progress' && (
          <button disabled={isUpdating} onClick={() => onStatusUpdate(task.id, 'completed')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-colors disabled:opacity-60">
            {isUpdating
              ? <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
              : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>}
            Mark Complete
          </button>
        )}
        {status === 'completed' && (
          <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Completed
          </span>
        )}
        <TaskCommentBox taskId={task.id} onSuccess={onSuccess} />
      </div>
    </div>
  )
}

// ── Progress bar helper ──────────────────────────────────────────────────────
const ProgressBar = ({ tasks, colorClass }) => {
  const done = tasks.filter(t => (t.status?.value ?? t.status) === 'completed').length
  const pct  = tasks.length ? Math.round((done / tasks.length) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/30">
        <div className={`h-1.5 rounded-full ${colorClass} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-white/90 w-8 text-right">{pct}%</span>
    </div>
  )
}

// ── Empty state ──────────────────────────────────────────────────────────────
const Empty = ({ msg = 'No tasks here' }) => (
  <div className="py-10 text-center">
    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
      <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
      </svg>
    </div>
    <p className="text-sm text-gray-400 font-medium">{msg}</p>
  </div>
)

// ── Page ─────────────────────────────────────────────────────────────────────
const MyTasksPage = () => {
  const [tasks,      setTasks]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [statusTab,  setStatusTab]  = useState('')
  const [sopTab,     setSopTab]     = useState('daily')
  const [updatingId, setUpdatingId] = useState(null)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getMyTasks(statusTab ? { status: statusTab } : {})
      setTasks(res.data.data)
    } catch { toast.error('Failed to load tasks.') }
    finally  { setLoading(false) }
  }, [statusTab])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const handleStatusUpdate = async (taskId, status) => {
    setUpdatingId(taskId)
    try {
      await updateMyTaskStatus(taskId, status)
      toast.success(`Task marked as ${status.replace('_', ' ')}.`)
      fetchTasks()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update.')
    } finally { setUpdatingId(null) }
  }

  const sharedProps   = { onStatusUpdate: handleStatusUpdate, updatingId, onSuccess: fetchTasks }
  const assignedTasks = tasks.filter(t => !SOP_REGEX.test(t.title))
  const sopTasks      = tasks.filter(t =>  SOP_REGEX.test(t.title))
  const activeSop     = SOP_TABS.find(s => s.key === sopTab) ?? SOP_TABS[0]
  const sopFiltered   = sopTasks.filter(t => activeSop.regex.test(t.title))

  const totalDone = tasks.filter(t => (t.status?.value ?? t.status) === 'completed').length

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">View and manage your assigned tasks</p>
        </div>
        {!loading && tasks.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {[
              { label: `${tasks.length} total`,            dot: 'bg-gray-400' },
              { label: `${totalDone} done`,                dot: 'bg-green-500' },
              { label: `${tasks.length - totalDone} left`, dot: 'bg-orange-400' },
            ].map(({ label, dot }) => (
              <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl border border-gray-200 shadow-sm text-xs font-semibold text-gray-600">
                <span className={`w-2 h-2 rounded-full ${dot}`} /> {label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Status filter ── */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {STATUS_TABS.map(tab => (
          <button key={tab.value} onClick={() => setStatusTab(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusTab === tab.value ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? <Spinner centered /> : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-5 items-start">

          {/* ══════════════════════════════════════════════════
              LEFT PANEL — Directly assigned by admin
          ══════════════════════════════════════════════════ */}
          <div className="rounded-2xl overflow-hidden shadow-sm border border-rose-100">
            {/* Panel header */}
            <div className="bg-gradient-to-r from-rose-600 to-rose-500 px-5 py-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Assigned to Me</p>
                  <p className="text-white/70 text-[11px]">Directly assigned by admin</p>
                </div>
              </div>
              <ProgressBar tasks={assignedTasks} colorClass="bg-white" />
            </div>

            {/* Task list */}
            <div className="bg-rose-50/40 p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              {assignedTasks.length === 0
                ? <Empty msg="No assigned tasks" />
                : assignedTasks.map(t => (
                    <TaskCard key={t.id} task={t} borderCls="border-l-rose-500" {...sharedProps} />
                  ))
              }
            </div>
          </div>

          {/* ══════════════════════════════════════════════════
              RIGHT PANEL — Auto-assigned SOP tasks
          ══════════════════════════════════════════════════ */}
          <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            {/* Panel header */}
            <div className={`bg-gradient-to-r ${
                sopTab === 'daily'     ? 'from-blue-700 to-blue-500'     :
                sopTab === 'weekly'    ? 'from-violet-700 to-violet-500'  :
                sopTab === 'monthly'   ? 'from-amber-600 to-amber-400'    :
                                        'from-emerald-700 to-emerald-500'
              } px-5 pt-4 pb-0`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-sm">SOP Tasks</p>
                  <p className="text-white/70 text-[11px]">Auto-assigned recurring tasks</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-sm">{sopFiltered.length}</p>
                  <p className="text-white/70 text-[11px]">tasks</p>
                </div>
              </div>
              <ProgressBar tasks={sopFiltered} colorClass="bg-white" />

              {/* SOP sub-tabs */}
              <div className="flex gap-1 mt-3">
                {SOP_TABS.map(tab => {
                  const count   = sopTasks.filter(t => tab.regex.test(t.title)).length
                  const isActive = sopTab === tab.key
                  return (
                    <button key={tab.key} onClick={() => setSopTab(tab.key)}
                      className={`flex-1 flex flex-col items-center py-2 px-1 rounded-t-xl text-xs font-bold transition-all ${
                        isActive ? 'bg-white text-gray-800' : 'text-white/80 hover:bg-white/10'}`}>
                      <span>{tab.label}</span>
                      <span className={`text-[10px] font-semibold mt-0.5 ${isActive ? 'text-gray-500' : 'text-white/60'}`}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Task grid */}
            <div className="bg-gray-50 p-4 max-h-[70vh] overflow-y-auto">
              {sopFiltered.length === 0
                ? <Empty msg={`No ${activeSop.label.toLowerCase()} tasks`} />
                : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {sopFiltered.map(t => (
                      <TaskCard key={t.id} task={t} borderCls={activeSop.border} {...sharedProps} />
                    ))}
                  </div>
                )
              }
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

export default MyTasksPage
