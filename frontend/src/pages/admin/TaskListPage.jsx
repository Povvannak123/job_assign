import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTasks, deleteTask, createTask, updateTask } from '../../api/taskApi'
import { getAllStaff } from '../../api/userApi'
import TaskStatusBadge from '../../components/tasks/TaskStatusBadge'
import TaskPriorityBadge from '../../components/tasks/TaskPriorityBadge'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Spinner from '../../components/ui/Spinner'
import { formatDate, isOverdue } from '../../utils/formatDate'
import { TASK_STATUSES, TASK_PRIORITIES } from '../../utils/constants'
import { TASK_TEMPLATES, TEMPLATE_COLORS } from '../../utils/taskTemplates'
import toast from 'react-hot-toast'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const toYMD = (date) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const formatDay = (ymd) => {
  const d = new Date(ymd + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const shiftDate = (ymd, days) => {
  const d = new Date(ymd + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return toYMD(d)
}

const INITIALS_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500',
  'bg-cyan-500', 'bg-lime-500',
]
const avatarColor = (idx) => INITIALS_COLORS[idx % INITIALS_COLORS.length]
const initials = (name) => (name || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)

const PRIORITY_DOT = {
  low:    'bg-green-400',
  medium: 'bg-yellow-400',
  high:   'bg-red-500',
}
const PRIORITY_LABEL = { low: 'Low', medium: 'Med', high: 'High' }

// ─── Task Edit Modal ──────────────────────────────────────────────────────────
const TaskEditModal = ({ task, staff, onClose, onSaved }) => {
  const [form, setForm] = useState({
    title:       task.title || '',
    description: task.description || '',
    status:      task.status || 'not_started',
    priority:    task.priority || 'medium',
    due_date:    task.due_date ? task.due_date.substring(0, 10) : '',
    assigned_to: task.assigned_to ? String(task.assigned_to) : '',
  })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.title.trim()) { setErr('Title is required.'); return }
    setLoading(true)
    try {
      await updateTask(task.id, { ...form, assigned_to: form.assigned_to || null, due_date: form.due_date || null })
      toast.success('Task updated.')
      onSaved()
      onClose()
    } catch {
      toast.error('Failed to update task.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-800">Edit Task</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Task Title *</label>
            <input
              value={form.title}
              onChange={(e) => { set('title', e.target.value); setErr('') }}
              className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 ${err ? 'border-red-400' : 'border-gray-200'}`}
            />
            {err && <p className="mt-1 text-xs text-red-500">{err}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none"
            />
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
              >
                {TASK_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Priority</label>
              <div className="flex gap-1.5">
                {TASK_PRIORITIES.map((p) => {
                  const cls = { low: 'bg-green-50 text-green-700 border-green-300', medium: 'bg-yellow-50 text-yellow-700 border-yellow-300', high: 'bg-red-50 text-red-700 border-red-300' }
                  const sel = form.priority === p.value
                  return (
                    <button key={p.value} type="button" onClick={() => set('priority', p.value)}
                      className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all ${sel ? cls[p.value] : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Due Date + Assign To */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Due Date</label>
              <input type="date" value={form.due_date} onChange={(e) => set('due_date', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Assigned To</label>
              <select value={form.assigned_to} onChange={(e) => set('assigned_to', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30">
                <option value="">— Unassigned —</option>
                {staff.map((s) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Inline Add Task Row ──────────────────────────────────────────────────────
const InlineAddTask = ({ staffId, dueDate, onAdded }) => {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')
  const [saving, setSaving] = useState(false)
  const [addedCount, setAddedCount] = useState(0)
  const [flash, setFlash] = useState(false)
  const inputRef = useRef(null)

  const openForm = () => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }
  const close = () => { setOpen(false); setTitle(''); setPriority('medium'); setAddedCount(0) }

  const add = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await createTask({ title: title.trim(), priority, assigned_to: staffId || null, due_date: dueDate })
      setAddedCount((n) => n + 1)
      setFlash(true)
      setTimeout(() => setFlash(false), 600)
      setTitle('')
      setPriority('medium')
      onAdded()
      // Stay open — focus input for next task
      setTimeout(() => inputRef.current?.focus(), 50)
    } catch {
      toast.error('Failed to add task.')
    } finally {
      setSaving(false)
    }
  }

  const onKey = (e) => {
    if (e.key === 'Enter') add()
    if (e.key === 'Escape') close()
  }

  if (!open) {
    return (
      <button
        onClick={openForm}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all group border-2 border-dashed border-gray-200 hover:border-red-300"
      >
        <span className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-red-400 flex items-center justify-center flex-shrink-0 transition-colors">
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
        </span>
        <span className="font-medium">Add task</span>
      </button>
    )
  }

  return (
    <div className={`rounded-xl border-2 p-3 space-y-2 transition-colors ${flash ? 'border-green-400 bg-green-50/60' : 'border-red-300 bg-red-50/40'}`}>
      {/* Counter badge */}
      {addedCount > 0 && (
        <div className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg w-fit transition-colors ${flash ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          {addedCount} task{addedCount > 1 ? 's' : ''} added — keep going!
        </div>
      )}

      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={onKey}
        placeholder={addedCount > 0 ? 'Next task title… (Enter to add)' : 'Task title… (Enter to add)'}
        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
      />
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1">
          {TASK_PRIORITIES.map((p) => {
            const cls = { low: 'bg-green-100 text-green-700 border-green-300', medium: 'bg-yellow-100 text-yellow-700 border-yellow-300', high: 'bg-red-100 text-red-700 border-red-300' }
            const sel = priority === p.value
            return (
              <button key={p.value} type="button" onClick={() => setPriority(p.value)}
                className={`px-2 py-0.5 text-xs rounded-md border font-semibold transition-all ${sel ? cls[p.value] : 'border-gray-200 text-gray-400 bg-white'}`}>
                {p.label}
              </button>
            )
          })}
        </div>
        <div className="flex gap-1.5">
          <button onClick={close} className="px-3 py-1.5 text-xs rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
            {addedCount > 0 ? 'Done' : 'Cancel'}
          </button>
          <button onClick={add} disabled={saving || !title.trim()}
            className="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors">
            {saving ? '…' : '+ Add'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Single Task Row ──────────────────────────────────────────────────────────
const TaskRow = ({ task, num, onEdit, onDelete, deleting }) => {
  const [confirmDel, setConfirmDel] = useState(false)
  const overdue = isOverdue(task.due_date, task.status)

  if (confirmDel) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200">
        <span className="w-5 h-5 rounded-md bg-red-100 text-red-500 text-xs font-bold flex items-center justify-center flex-shrink-0">{num}</span>
        <span className="flex-1 text-xs text-red-700 font-medium">Delete this task?</span>
        <button onClick={() => onDelete(task.id)} disabled={deleting}
          className="px-2.5 py-1 text-xs rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50">
          {deleting ? '…' : 'Delete'}
        </button>
        <button onClick={() => setConfirmDel(false)} className="px-2.5 py-1 text-xs rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className={`group flex items-start gap-2.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors ${overdue ? 'bg-red-50/40' : ''}`}>
      {/* Sequence number */}
      <span className={`mt-0.5 w-5 h-5 rounded-md text-xs font-bold flex items-center justify-center flex-shrink-0 ${overdue ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-400'}`}>
        {num}
      </span>

      {/* Priority dot */}
      <span className={`mt-2 w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority] || 'bg-gray-300'}`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug ${overdue ? 'text-red-700' : 'text-gray-800'} truncate`}>
          {task.title}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <TaskStatusBadge status={task.status} />
          {overdue && <span className="text-xs text-red-500 font-medium">Overdue</span>}
        </div>
      </div>

      {/* Actions - visible on hover */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={() => onEdit(task)}
          className="w-7 h-7 rounded-lg hover:bg-blue-100 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <button onClick={() => setConfirmDel(true)}
          className="w-7 h-7 rounded-lg hover:bg-red-100 flex items-center justify-center text-gray-400 hover:text-red-600 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ─── Staff Task Card ──────────────────────────────────────────────────────────
const StaffTaskCard = ({ member, idx, tasks, dueDate, staff, onRefresh }) => {
  const [editingTask, setEditingTask] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const done = tasks.filter((t) => t.status === 'completed').length
  const total = tasks.length

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await deleteTask(id)
      toast.success('Task deleted.')
      onRefresh()
    } catch {
      toast.error('Failed to delete task.')
    } finally {
      setDeletingId(null)
    }
  }

  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        {/* Card Header */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${avatarColor(idx)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
              {initials(member.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">{member.name}</p>
              <p className="text-xs text-gray-400 truncate">{member.position || member.role || 'Staff'}</p>
            </div>
            <div className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${total > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-400'}`}>
              {total}
            </div>
          </div>

          {/* Progress bar */}
          {total > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>{done}/{total} done</span>
                <span className={pct === 100 ? 'text-green-600 font-semibold' : ''}>{pct}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto max-h-80 px-3 py-2 space-y-1">
          {tasks.length === 0 ? (
            <div className="py-6 text-center text-gray-300 text-xs">
              <svg className="w-8 h-8 mx-auto mb-1.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
              </svg>
              No tasks assigned
            </div>
          ) : (
            tasks.map((task, i) => (
              <TaskRow
                key={task.id}
                task={task}
                num={i + 1}
                onEdit={setEditingTask}
                onDelete={handleDelete}
                deleting={deletingId === task.id}
              />
            ))
          )}
        </div>

        {/* Add Task */}
        <div className="px-3 pb-3 pt-2 border-t border-gray-50">
          <InlineAddTask staffId={member.id} dueDate={dueDate} onAdded={onRefresh} />
        </div>
      </div>

      {/* Edit Modal */}
      {editingTask && (
        <TaskEditModal
          task={editingTask}
          staff={staff}
          onClose={() => setEditingTask(null)}
          onSaved={onRefresh}
        />
      )}
    </>
  )
}

// ─── Daily Board View ─────────────────────────────────────────────────────────
const DailyBoardView = ({ staff, allTasks, initialLoading, refreshing, onRefresh, onSilentRefresh }) => {
  const [selectedDate, setSelectedDate] = useState(toYMD(new Date()))

  const today = toYMD(new Date())
  const isToday = selectedDate === today

  const tasksForDate = allTasks.filter((t) => t.due_date && t.due_date.substring(0, 10) === selectedDate)

  const tasksByStaff = {}
  staff.forEach((s) => { tasksByStaff[s.id] = [] })
  tasksForDate.forEach((t) => {
    if (t.assigned_to && tasksByStaff[t.assigned_to] !== undefined) {
      tasksByStaff[t.assigned_to].push(t)
    }
  })
  // Sort each staff's tasks in chronological order (earliest created / lowest id first)
  Object.keys(tasksByStaff).forEach((id) => {
    tasksByStaff[id].sort((a, b) => {
      if (a.created_at && b.created_at) return new Date(a.created_at) - new Date(b.created_at)
      return a.id - b.id
    })
  })

  const totalTasks = tasksForDate.length
  const totalDone = tasksForDate.filter((t) => t.status === 'completed').length
  const totalOverdue = tasksForDate.filter((t) => isOverdue(t.due_date, t.status)).length

  return (
    <div className="space-y-4">
      {/* Date Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setSelectedDate((d) => shiftDate(d, -1))}
            className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm">
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm font-semibold text-gray-800 bg-transparent focus:outline-none cursor-pointer"
            />
          </div>
          <button onClick={() => setSelectedDate((d) => shiftDate(d, 1))}
            className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {!isToday && (
            <button onClick={() => setSelectedDate(today)}
              className="px-3 py-1.5 text-xs rounded-lg bg-red-50 text-red-600 font-semibold border border-red-200 hover:bg-red-100 transition-colors">
              Today
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <span className="font-semibold text-gray-700">{formatDay(selectedDate)}</span>
          {isToday && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">Today</span>}
          {/* Subtle refresh spinner — board cards stay mounted */}
          {refreshing && (
            <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin ml-1" />
          )}
        </div>

        {/* Day summary stats */}
        <div className="sm:ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            {totalTasks} tasks
          </div>
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {totalDone} done
          </div>
          {totalOverdue > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-red-600">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {totalOverdue} overdue
            </div>
          )}
        </div>
      </div>

      {/* Board Grid — only show spinner on initial load, not on silent refresh */}
      {initialLoading ? (
        <Spinner centered />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {staff.map((member, idx) => (
            <StaffTaskCard
              key={member.id}
              member={member}
              idx={idx}
              tasks={tasksByStaff[member.id] || []}
              dueDate={selectedDate}
              staff={staff}
              onRefresh={onSilentRefresh}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Bulk Assign Modal ────────────────────────────────────────────────────────
const BulkAssignModal = ({ isOpen, onClose, staff, onSuccess }) => {
  const [step, setStep] = useState(1)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [selectedStaff, setSelectedStaff] = useState('')
  const [dueDate, setDueDate] = useState(toYMD(new Date()))
  const [priority, setPriority] = useState('medium')
  const [checkedTasks, setCheckedTasks] = useState({})
  const [loading, setLoading] = useState(false)

  const reset = () => {
    setStep(1); setSelectedTemplate(null); setSelectedStaff('')
    setDueDate(toYMD(new Date())); setPriority('medium'); setCheckedTasks({})
  }
  const handleClose = () => { reset(); onClose() }

  const pickTemplate = (t) => {
    setSelectedTemplate(t)
    const all = {}
    ;[...t.daily, ...t.tasks].forEach((_, i) => { all[i] = true })
    setCheckedTasks(all)
    setStep(2)
  }

  const allTasksFlat = selectedTemplate
    ? selectedTemplate.daily.map((title, i) => ({ title, type: 'Daily', idx: i }))
        .concat(selectedTemplate.tasks.map((title, i) => ({ title, type: 'Periodic', idx: selectedTemplate.daily.length + i })))
    : []

  const toggleTask = (idx) => setCheckedTasks((c) => ({ ...c, [idx]: !c[idx] }))
  const selectAll = () => { const all = {}; allTasksFlat.forEach((t) => { all[t.idx] = true }); setCheckedTasks(all) }
  const clearAll = () => setCheckedTasks({})
  const checkedCount = Object.values(checkedTasks).filter(Boolean).length

  const handleCreate = async () => {
    if (!checkedCount) { toast.error('Select at least one task.'); return }
    setLoading(true)
    try {
      const tasks = allTasksFlat.filter((t) => checkedTasks[t.idx])
      await Promise.all(tasks.map((t) =>
        createTask({ title: t.title, description: `[${t.type}] ${selectedTemplate.position} SOP`, assigned_to: selectedStaff || null, due_date: dueDate, priority })
      ))
      toast.success(`${tasks.length} task${tasks.length > 1 ? 's' : ''} created!`)
      onSuccess(); handleClose()
    } catch {
      toast.error('Failed to create tasks.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-red-600 to-red-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h7" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Bulk Assign from SOP Template</h2>
              <p className="text-red-200 text-xs">{step === 1 ? 'Step 1: Select position' : `Step 2: Configure · ${selectedTemplate?.position}`}</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {step === 1 && (
          <div className="p-6 overflow-y-auto">
            <p className="text-sm text-gray-500 mb-4">Choose a position to load its SOP task list:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TASK_TEMPLATES.map((t) => {
                const c = TEMPLATE_COLORS[t.color]
                return (
                  <button key={t.position} onClick={() => pickTemplate(t)}
                    className={`text-left p-4 rounded-xl border-2 hover:shadow-md transition-all ${c.border} ${c.bg}`}>
                    <div className={`w-8 h-8 rounded-lg mb-3 flex items-center justify-center opacity-80`}>
                      <svg className={`w-4 h-4 ${c.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
                      </svg>
                    </div>
                    <p className={`text-sm font-semibold ${c.text}`}>{t.position}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.daily.length} daily · {t.tasks.length} periodic</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step === 2 && selectedTemplate && (
          <>
            <div className="p-5 border-b border-gray-100 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Assign To</label>
                  <select value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30">
                    <option value="">— Unassigned —</option>
                    {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Due Date</label>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30">
                    {TASK_PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500"><span className="font-bold text-gray-800">{checkedCount}</span> task{checkedCount !== 1 ? 's' : ''} selected</span>
                <div className="flex gap-2">
                  <button onClick={selectAll} className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600">Select all</button>
                  <button onClick={clearAll} className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600">Clear all</button>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Daily Tasks</span>
              </div>
              {selectedTemplate.daily.map((title, i) => {
                const idx = i; const checked = !!checkedTasks[idx]
                const c = TEMPLATE_COLORS[selectedTemplate.color]
                return (
                  <label key={idx} className={`flex items-start gap-3 px-5 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${checked ? c.bg : ''}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggleTask(idx)} className="mt-0.5 w-4 h-4 rounded accent-red-600" />
                    <div className="flex-1">
                      <p className={`text-sm ${checked ? 'text-gray-800' : 'text-gray-500'}`}>{title}</p>
                      <span className={`text-xs font-medium ${c.text}`}>Daily</span>
                    </div>
                  </label>
                )
              })}
              <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Periodic Tasks</span>
              </div>
              {selectedTemplate.tasks.map((title, i) => {
                const idx = selectedTemplate.daily.length + i; const checked = !!checkedTasks[idx]
                return (
                  <label key={idx} className={`flex items-start gap-3 px-5 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${checked ? 'bg-purple-50' : ''}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggleTask(idx)} className="mt-0.5 w-4 h-4 rounded accent-red-600" />
                    <div className="flex-1">
                      <p className={`text-sm ${checked ? 'text-gray-800' : 'text-gray-500'}`}>{title}</p>
                      <span className="text-xs font-medium text-purple-600">Periodic</span>
                    </div>
                  </label>
                )
              })}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={handleClose}>Cancel</Button>
                <Button onClick={handleCreate} disabled={loading || !checkedCount}>
                  {loading ? 'Creating...' : `Create ${checkedCount} Task${checkedCount !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── All Tasks List View ──────────────────────────────────────────────────────
const AllTasksView = ({ tasks, staff, loading, meta, filters, setFilters, onDelete, deleteTarget, setDeleteTarget, deleteLoading, navigate }) => (
  <div className="space-y-4">
    {/* Filters */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input type="text" placeholder="Search tasks..." value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30" />
        <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30">
          <option value="">All Statuses</option>
          {TASK_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30">
          <option value="">All Priorities</option>
          {TASK_PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select value={filters.assigned_to} onChange={(e) => setFilters((f) => ({ ...f, assigned_to: e.target.value }))}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30">
          <option value="">All Staff</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
    </div>

    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {loading ? <Spinner centered /> : tasks.length === 0 ? (
        <div className="px-5 py-16 text-center text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          No tasks found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-5 py-3 font-semibold text-gray-500">Task</th>
                <th className="px-5 py-3 font-semibold text-gray-500">Assigned To</th>
                <th className="px-5 py-3 font-semibold text-gray-500">Status</th>
                <th className="px-5 py-3 font-semibold text-gray-500">Priority</th>
                <th className="px-5 py-3 font-semibold text-gray-500">Due Date</th>
                <th className="px-5 py-3 font-semibold text-gray-500">Created By</th>
                <th className="px-5 py-3 font-semibold text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tasks.map((task) => {
                const overdue = isOverdue(task.due_date, task.status)
                return (
                  <tr key={task.id} className={`hover:bg-gray-50 transition-colors ${overdue ? 'bg-red-50/30' : ''}`}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800 max-w-xs truncate">{task.title}</p>
                      {task.description && <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{task.description}</p>}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{task.assigned_user?.name || <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-3"><TaskStatusBadge status={task.status} /></td>
                    <td className="px-5 py-3"><TaskPriorityBadge priority={task.priority} /></td>
                    <td className="px-5 py-3">
                      <span className={overdue ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                        {formatDate(task.due_date)}{overdue && <span className="ml-1 text-xs">(Overdue)</span>}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{task.creator?.name}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/admin/tasks/${task.id}/edit`)}>Edit</Button>
                        <Button variant="danger" size="sm" onClick={() => setDeleteTarget(task)}>Delete</Button>
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

    <ConfirmDialog
      isOpen={!!deleteTarget}
      onClose={() => setDeleteTarget(null)}
      onConfirm={onDelete}
      title="Delete Task"
      message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
      loading={deleteLoading}
    />
  </div>
)

// ─── Main Page ────────────────────────────────────────────────────────────────
const TaskListPage = () => {
  const navigate = useNavigate()
  const [activeView, setActiveView] = useState('board') // 'board' | 'list'
  const [allTasks, setAllTasks] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)       // initial load — shows spinner
  const [boardRefreshing, setBoardRefreshing] = useState(false) // silent — keeps cards mounted
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [filters, setFilters] = useState({ status: '', assigned_to: '', priority: '', search: '' })
  const [meta, setMeta] = useState({})
  const [showBulkModal, setShowBulkModal] = useState(false)

  const fetchTasks = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setBoardRefreshing(true)
    try {
      const params = activeView === 'list'
        ? Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
        : {}
      const res = await getTasks(params)
      setAllTasks(res.data.data || [])
      setMeta(res.data.meta || {})
    } catch {
      toast.error('Failed to load tasks.')
    } finally {
      setLoading(false)
      setBoardRefreshing(false)
    }
  }, [filters, activeView])

  // Silent refresh — used by inline board actions (add/edit/delete).
  // Does NOT set loading=true, so the board cards stay mounted and keep their open state.
  const silentRefresh = useCallback(() => fetchTasks(true), [fetchTasks])

  useEffect(() => { fetchTasks() }, [fetchTasks])
  useEffect(() => { getAllStaff().then((r) => setStaff(r.data.data || [])).catch(() => {}) }, [])

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await deleteTask(deleteTarget.id)
      toast.success('Task deleted.')
      setDeleteTarget(null)
      fetchTasks()
    } catch {
      toast.error('Failed to delete task.')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tasks</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {meta.total !== undefined && activeView === 'list'
              ? `${meta.total} task${meta.total !== 1 ? 's' : ''} total`
              : `${allTasks.length} tasks loaded`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <button onClick={() => setActiveView('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeView === 'board' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Daily Board
            </button>
            <button onClick={() => setActiveView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeView === 'list' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              All Tasks
            </button>
          </div>

          {/* Actions */}
          <button onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-red-200 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h7" />
            </svg>
            From Template
          </button>
          <Button onClick={() => navigate('/admin/tasks/create')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Task
          </Button>
        </div>
      </div>

      {/* Views */}
      {activeView === 'board' ? (
        <DailyBoardView
          staff={staff}
          allTasks={allTasks}
          initialLoading={loading}
          refreshing={boardRefreshing}
          onRefresh={fetchTasks}
          onSilentRefresh={silentRefresh}
        />
      ) : (
        <AllTasksView
          tasks={allTasks}
          staff={staff}
          loading={loading}
          meta={meta}
          filters={filters}
          setFilters={setFilters}
          onDelete={handleDelete}
          deleteTarget={deleteTarget}
          setDeleteTarget={setDeleteTarget}
          deleteLoading={deleteLoading}
          navigate={navigate}
        />
      )}

      {/* Bulk Assign Modal */}
      <BulkAssignModal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} staff={staff} onSuccess={fetchTasks} />
    </div>
  )
}

export default TaskListPage
