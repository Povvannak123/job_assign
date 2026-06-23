import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getTasks, deleteTask, createTask, updateTask,
  assignDailyTasks,
  getTemplateStaff, getStaffTemplate, addTemplateItem,
  updateTemplateItem, deleteTemplateItem, reorderTemplateItems,
} from '../../api/taskApi'
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

// ─── Category tag helpers ─────────────────────────────────────────────────────
const CATEGORY_STYLES = {
  Daily:     { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500',   header: 'bg-blue-50 border-blue-200 text-blue-800'   },
  Weekly:    { bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-200',  dot: 'bg-green-500',  header: 'bg-green-50 border-green-200 text-green-800'  },
  Monthly:   { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500', header: 'bg-orange-50 border-orange-200 text-orange-800' },
  Quarterly: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500', header: 'bg-purple-50 border-purple-200 text-purple-800' },
}
const CATEGORY_ORDER = ['Daily', 'Weekly', 'Monthly', 'Quarterly']

// Parse category + display title from a task.
// Priority: [Category] in the title, then [Category] in the description.
const parseTaskTitle = (title, description) => {
  const titleMatch = (title || '').match(/^\[(Daily|Weekly|Monthly|Quarterly)\]\s*(.+)/)
  if (titleMatch) return { category: titleMatch[1], cleanTitle: titleMatch[2] }
  const descMatch  = (description || '').match(/^\[(Daily|Weekly|Monthly|Quarterly)\]/)
  if (descMatch)  return { category: descMatch[1],  cleanTitle: title }
  return { category: null, cleanTitle: title }
}

// Extract numeric sort position from "[Category] N. title" → N, fallback 9999
const extractSortNum = (title) => {
  const m = (title || '').match(/^\[(?:Daily|Weekly|Monthly|Quarterly)\]\s*(\d+)\./)
  return m ? parseInt(m[1], 10) : 9999
}

// Sort a task array by their embedded numeric order, then by id as tie-breaker
const sortByOrder = (arr) =>
  [...arr].sort((a, b) => {
    const diff = extractSortNum(a.title) - extractSortNum(b.title)
    return diff !== 0 ? diff : a.id - b.id
  })

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
  const [open, setOpen]             = useState(false)
  const [title, setTitle]           = useState('')
  const [comment, setComment]       = useState('')
  const [photo, setPhoto]           = useState(null)
  const [photoPreview, setPhotoPrev]= useState(null)
  const [priority, setPriority]     = useState('medium')
  const [saving, setSaving]         = useState(false)
  const [addedCount, setAddedCount] = useState(0)
  const [flash, setFlash]           = useState(false)
  const inputRef  = useRef(null)
  const photoRef  = useRef(null)

  const openForm = () => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }
  const close = () => {
    setOpen(false)
    setTitle(''); setComment(''); setPhoto(null); setPhotoPrev(null)
    setPriority('medium'); setAddedCount(0)
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    setPhotoPrev(URL.createObjectURL(file))
  }

  const add = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('title',       title.trim())
      fd.append('priority',    priority)
      fd.append('due_date',    dueDate)
      if (staffId) fd.append('assigned_to', staffId)
      if (comment.trim()) fd.append('comment', comment.trim())
      if (photo)          fd.append('photo_proof', photo)

      await createTask(fd)

      setAddedCount((n) => n + 1)
      setFlash(true)
      setTimeout(() => setFlash(false), 600)
      // Reset fields but keep form open for next task
      setTitle(''); setComment(''); setPhoto(null); setPhotoPrev(null)
      setPriority('medium')
      onAdded()
      setTimeout(() => inputRef.current?.focus(), 50)
    } catch {
      toast.error('Failed to add task.')
    } finally {
      setSaving(false)
    }
  }

  const onKey = (e) => {
    if (e.key === 'Escape') close()
  }

  const PRIORITY_CONFIG = {
    low:    { label: 'Low',    dot: 'bg-green-500',  active: 'bg-green-50 text-green-700 border-green-300 ring-1 ring-green-200' },
    medium: { label: 'Medium', dot: 'bg-yellow-400', active: 'bg-yellow-50 text-yellow-700 border-yellow-300 ring-1 ring-yellow-200' },
    high:   { label: 'High',   dot: 'bg-red-500',    active: 'bg-red-50 text-red-700 border-red-300 ring-1 ring-red-200' },
  }

  if (!open) {
    return (
      <button
        onClick={openForm}
        className="w-full flex items-center justify-center gap-2 py-2 text-xs text-gray-400 hover:text-gray-600 rounded-xl transition-all group border border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      >
        <svg className="w-3.5 h-3.5 group-hover:text-gray-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        <span className="font-medium">Add task</span>
      </button>
    )
  }

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${flash ? 'border-green-300 shadow-sm shadow-green-100' : 'border-indigo-200 shadow-sm'}`}>

      {/* Success bar */}
      {addedCount > 0 && (
        <div className={`flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold transition-colors ${flash ? 'bg-green-500 text-white' : 'bg-green-50 text-green-700 border-b border-green-100'}`}>
          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          {addedCount} task{addedCount > 1 ? 's' : ''} added · staff notified
        </div>
      )}

      {/* Title */}
      <div className="bg-white px-3 pt-2.5 pb-2 border-b border-gray-100">
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={onKey}
          placeholder="Task title…"
          className="w-full text-sm text-gray-800 placeholder-gray-300 focus:outline-none bg-transparent"
        />
      </div>

      {/* Comment */}
      <div className="bg-white px-3 py-2 border-b border-gray-100">
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Comment or instruction (optional)…"
          rows={2}
          className="w-full text-xs text-gray-700 placeholder-gray-300 focus:outline-none bg-transparent resize-none"
        />
      </div>

      {/* Photo upload / preview */}
      <div className="bg-white px-3 py-2 border-b border-gray-100">
        <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
        {photoPreview ? (
          <div className="relative">
            <img src={photoPreview} alt="preview" className="w-full max-h-48 object-contain rounded-lg border border-gray-200 bg-gray-50" />
            <button
              onClick={() => { setPhoto(null); setPhotoPrev(null) }}
              className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center hover:bg-red-600"
            >✕</button>
          </div>
        ) : (
          <button
            onClick={() => photoRef.current?.click()}
            className="w-full flex items-center gap-1.5 py-1.5 text-[11px] text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors justify-center border border-dashed border-gray-200 hover:border-indigo-300"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Attach photo / Take picture
          </button>
        )}
      </div>

      {/* Footer toolbar */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border-t border-gray-100">
        {/* Priority pills */}
        <div className="flex gap-1 flex-1">
          {Object.entries(PRIORITY_CONFIG).map(([val, cfg]) => (
            <button key={val} type="button" onClick={() => setPriority(val)}
              className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md border transition-all
                ${priority === val ? cfg.active : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <button onClick={close}
          className="px-2.5 py-1 text-[10px] font-semibold rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          {addedCount > 0 ? 'Done' : 'Cancel'}
        </button>
        <button onClick={add} disabled={saving || !title.trim()}
          className="flex items-center gap-1 px-3 py-1 text-[10px] font-bold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          {saving
            ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          }
          Add & Notify
        </button>
      </div>
    </div>
  )
}

// ─── Single Task Row ──────────────────────────────────────────────────────────
const TaskRow = ({ task, num, onEdit, onDelete, deleting }) => {
  const [confirmDel, setConfirmDel] = useState(false)
  const overdue = isOverdue(task.due_date, task.status)
  const { cleanTitle } = parseTaskTitle(task.title, task.description)
  const done = task.status === 'completed'

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
    <div className={`group flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors
      ${done ? 'opacity-50' : ''}
      ${overdue ? 'bg-red-50/60' : 'hover:bg-gray-50'}`}>

      {/* Number badge */}
      <span className={`mt-0.5 w-5 h-5 rounded-md text-[11px] font-bold flex items-center justify-center flex-shrink-0
        ${overdue ? 'bg-red-100 text-red-400' : 'bg-gray-100 text-gray-400'}`}>
        {num}
      </span>

      {/* Priority dot */}
      <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority] || 'bg-gray-300'}`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${done ? 'line-through text-gray-400' : overdue ? 'text-red-700 font-medium' : 'text-gray-700'}`}>
          {cleanTitle}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <TaskStatusBadge status={task.status} />
          {overdue && <span className="text-xs text-red-500 font-semibold">Overdue</span>}
        </div>
      </div>

      {/* Hover actions */}
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
        <button onClick={() => onEdit(task)}
          className="w-7 h-7 rounded-lg hover:bg-blue-100 flex items-center justify-center text-gray-300 hover:text-blue-500 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <button onClick={() => setConfirmDel(true)}
          className="w-7 h-7 rounded-lg hover:bg-red-100 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ─── Category Section inside card ─────────────────────────────────────────────
const CategorySection = ({ category, tasks, onEdit, onDelete, deletingId, collapsed, onToggle, sectionRef }) => {
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.Daily
  const done = tasks.filter((t) => t.status === 'completed').length

  return (
    <div className="mb-1" ref={sectionRef}>
      {/* Section header */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg border ${style.header} transition-colors`}
      >
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} />
        <span className="text-[11px] font-bold uppercase tracking-wide flex-1 text-left">{category}</span>
        <span className="text-[10px] font-semibold opacity-70">{done}/{tasks.length}</span>
        <svg className={`w-3 h-3 opacity-60 transition-transform ${collapsed ? '-rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Tasks */}
      {!collapsed && (
        <div className="mt-0.5 space-y-0.5 pl-1">
          {tasks.map((task, i) => (
            <TaskRow
              key={task.id}
              task={task}
              num={i + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              deleting={deletingId === task.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Staff Task Card ──────────────────────────────────────────────────────────
const StaffTaskCard = ({ member, idx, tasks, dueDate, staff, onRefresh }) => {
  const [editingTask, setEditingTask] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const done = tasks.filter((t) => t.status === 'completed').length
  const total = tasks.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

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

  // Group tasks by category, then sort each group by embedded numeric order
  const grouped = {}
  tasks.forEach((task) => {
    const { category } = parseTaskTitle(task.title, task.description)
    const key = category || 'Other'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(task)
  })
  Object.keys(grouped).forEach((key) => { grouped[key] = sortByOrder(grouped[key]) })
  // Always show all 4 standard tabs + any "Other" bucket if present
  const presentCategories = [...CATEGORY_ORDER, ...(grouped['Other']?.length ? ['Other'] : [])]
  const [activeTab, setActiveTab] = useState('Daily')
  const currentTab = activeTab
  const tabTasks = grouped[currentTab] || []
  const tabStyle = CATEGORY_STYLES[currentTab] || CATEGORY_STYLES.Daily
  const tabDone = tabTasks.filter((t) => t.status === 'completed').length

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        {/* Card Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${avatarColor(idx)} flex items-center justify-center text-white text-base font-bold flex-shrink-0 shadow-sm`}>
              {initials(member.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-gray-800 truncate">{member.name}</p>
              <p className="text-xs text-gray-400 truncate mt-0.5">{member.position || member.role || 'Staff'}</p>
            </div>
            <div className={`flex-shrink-0 min-w-[34px] h-7 px-2 rounded-full text-sm font-bold flex items-center justify-center
              ${pct === 100 ? 'bg-green-100 text-green-700' : total > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-400'}`}>
              {total}
            </div>
          </div>

          {/* Progress bar */}
          {total > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>{done}/{total} done</span>
                <span className={pct === 100 ? 'text-green-600 font-bold' : 'font-semibold text-gray-500'}>{pct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Category Tab Bar */}
        {presentCategories.length > 0 && (
          <div className="grid border-b border-gray-100 bg-gray-50" style={{ gridTemplateColumns: `repeat(${presentCategories.length}, 1fr)` }}>
            {presentCategories.map((cat) => {
              const s = CATEGORY_STYLES[cat] || CATEGORY_STYLES.Daily
              const catCount = grouped[cat]?.length || 0
              const catDone = (grouped[cat] || []).filter((t) => t.status === 'completed').length
              const isActive = cat === currentTab
              return (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`relative flex flex-col items-center justify-center gap-1 py-3.5 px-2 transition-all
                    ${isActive ? 'bg-white shadow-sm' : 'hover:bg-gray-100/80'}`}
                >
                  {/* Active indicator */}
                  {isActive && <span className={`absolute top-0 left-2 right-2 h-0.5 rounded-b-full ${s.dot}`} />}
                  <span className={`w-2.5 h-2.5 rounded-full transition-all ${isActive ? s.dot : 'bg-gray-300'}`} />
                  <span className={`text-[11px] font-bold uppercase tracking-wide transition-colors
                    ${isActive ? s.text : 'text-gray-400'}`}>
                    {cat}
                  </span>
                  <span className={`text-[10px] font-semibold transition-colors ${isActive ? s.text + ' opacity-75' : 'text-gray-300'}`}>
                    {catDone}/{catCount}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Active tab task list */}
        <div className="flex-1 overflow-y-auto max-h-[420px] px-4 py-3">
          {tasks.length === 0 ? (
            <div className="py-10 text-center text-gray-300 text-sm">
              <svg className="w-10 h-10 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
              </svg>
              No tasks assigned
            </div>
          ) : tabTasks.length === 0 ? (
            <div className="py-10 text-center">
              <span className={`inline-block w-8 h-8 rounded-full mb-2 ${tabStyle.dot} opacity-20`} />
              <p className="text-sm text-gray-400 font-medium">No {currentTab} tasks today</p>
              <p className="text-xs text-gray-300 mt-1">
                {currentTab === 'Weekly' ? 'Auto-assigned every Monday' :
                 currentTab === 'Monthly' ? 'Auto-assigned on the 1st' :
                 currentTab === 'Quarterly' ? 'Auto-assigned Jan/Apr/Jul/Oct' : ''}
              </p>
            </div>
          ) : (
            <div>
              {/* Section label */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-3 border ${tabStyle.bg} ${tabStyle.border}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${tabStyle.dot}`} />
                <span className={`text-xs font-bold uppercase tracking-wider flex-1 ${tabStyle.text}`}>{currentTab} Tasks</span>
                <span className={`text-[11px] font-semibold ${tabStyle.text} opacity-60`}>{tabDone}/{tabTasks.length} done</span>
              </div>
              <div className="space-y-1">
                {tabTasks.map((task, i) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    num={i + 1}
                    onEdit={setEditingTask}
                    onDelete={handleDelete}
                    deleting={deletingId === task.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add Task */}
        <div className="px-3 pb-3 pt-2 border-t border-gray-50">
          <InlineAddTask staffId={member.id} dueDate={dueDate} onAdded={onRefresh} />
        </div>
      </div>

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

// ─── Template Editor Modal (standalone) ──────────────────────────────────────
const TemplateEditorModal = ({ staffId, staffName, onClose }) => {
  // Reuse a dummy Set so TemplateEditor renders without assignment mode
  const dummy = new Set()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-600 to-indigo-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Edit SOP Template</h2>
              <p className="text-indigo-200 text-xs">{staffName} · changes apply to future auto-assignments</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Editor body */}
        <TemplateEditor
          staffId={staffId}
          staffName={staffName}
          checkedIds={dummy}
          onToggle={() => {}}
          onSelectAll={() => {}}
          onClearAll={() => {}}
          hideSelectionBar
        />

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex justify-end flex-shrink-0">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Staff Sidebar Panel ──────────────────────────────────────────────────────
const StaffSidebarPanel = ({ staff, allTasks, selectedStaffId, onSelect, boardDate, onAutoAssign, autoAssigning, onTaskAdded }) => {
  const [editingStaff, setEditingStaff] = useState(null) // { id, name }
  const [staffSearch, setStaffSearch] = useState('')
  const [quickOpen, setQuickOpen] = useState(false)
  const [quickTitle, setQuickTitle] = useState('')
  const [quickComment, setQuickComment] = useState('')
  const [quickPhoto, setQuickPhoto] = useState(null)   // File object
  const [quickPhotoPreview, setQuickPhotoPreview] = useState(null)
  const [quickStaff, setQuickStaff] = useState('')
  const [quickPriority, setQuickPriority] = useState('medium')
  const [quickBusy, setQuickBusy] = useState(false)
  const quickInputRef = useRef(null)
  const quickPhotoRef = useRef(null)

  useEffect(() => { if (quickOpen) quickInputRef.current?.focus() }, [quickOpen])

  const handleQuickPhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setQuickPhoto(file)
    setQuickPhotoPreview(URL.createObjectURL(file))
  }

  const handleQuickAdd = async () => {
    const t = quickTitle.trim()
    if (!t) return
    setQuickBusy(true)
    try {
      const fd = new FormData()
      fd.append('title', t)
      fd.append('description', `[Ad-hoc] Added for ${boardDate}`)
      fd.append('due_date', boardDate)
      fd.append('priority', quickPriority)
      if (quickStaff) fd.append('assigned_to', quickStaff)
      if (quickComment.trim()) fd.append('comment', quickComment.trim())
      if (quickPhoto) fd.append('photo_proof', quickPhoto)

      await createTask(fd)
      toast.success(quickStaff
        ? '✅ Task added & notification sent to staff!'
        : '✅ Task added for today!')
      setQuickTitle('')
      setQuickComment('')
      setQuickPhoto(null)
      setQuickPhotoPreview(null)
      setQuickOpen(false)
      onTaskAdded()
    } catch {
      toast.error('Failed to add task.')
    } finally {
      setQuickBusy(false)
    }
  }

  // Build per-staff stats from currently loaded tasks (already filtered by boardDate)
  const statsByStaff = {}
  allTasks.forEach((t) => {
    if (!t.assigned_to) return
    if (!statsByStaff[t.assigned_to]) statsByStaff[t.assigned_to] = { total: 0, done: 0 }
    statsByStaff[t.assigned_to].total++
    if (t.status === 'completed') statsByStaff[t.assigned_to].done++
  })

  const totalAll = allTasks.length
  const doneAll  = allTasks.filter(t => t.status === 'completed').length
  const today    = toYMD(new Date())
  const isToday  = boardDate === today

  const filteredStaff = staffSearch.trim()
    ? staff.filter(s => s.name.toLowerCase().includes(staffSearch.toLowerCase()))
    : staff

  return (
    <aside className="w-60 flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden self-start sticky top-0">

      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Team Members</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{staff.length} staff · {boardDate}</p>
      </div>

      {/* Search staff */}
      <div className="px-3 py-2 border-b border-gray-100">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
          </svg>
          <input
            type="text"
            value={staffSearch}
            onChange={e => setStaffSearch(e.target.value)}
            placeholder="Search staff…"
            className="w-full pl-7 pr-7 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300/40 focus:border-indigo-300 placeholder-gray-300 text-gray-700"
          />
          {staffSearch && (
            <button
              onClick={() => setStaffSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Auto Assign button */}
      <div className="px-3 py-2.5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
        <button
          onClick={onAutoAssign}
          disabled={autoAssigning}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold transition-colors shadow-sm"
        >
          {autoAssigning ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Assigning…
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {isToday ? 'Auto Assign Today' : `Assign ${boardDate}`}
            </>
          )}
        </button>
        {isToday && (
          <p className="text-[10px] text-emerald-600 text-center mt-1.5 font-medium">
            Runs automatically at midnight
          </p>
        )}
      </div>

      {/* Quick Add Task for Today */}
      <div className="border-b border-gray-100">
        <button
          onClick={() => setQuickOpen(o => !o)}
          className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-gray-600 hover:bg-orange-50 hover:text-orange-700 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Task for {isToday ? 'Today' : boardDate}
          </span>
          <svg className={`w-3.5 h-3.5 transition-transform ${quickOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {quickOpen && (
          <div className="px-3 pb-3 pt-2 bg-orange-50 space-y-2">

            {/* Title */}
            <input
              ref={quickInputRef}
              value={quickTitle}
              onChange={e => setQuickTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') setQuickOpen(false) }}
              placeholder="Task title…"
              className="w-full text-xs px-2.5 py-2 border border-orange-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/30 placeholder-gray-300"
            />

            {/* Assign to */}
            <select
              value={quickStaff}
              onChange={e => setQuickStaff(e.target.value)}
              className="w-full text-xs px-2.5 py-2 border border-orange-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/30 text-gray-600"
            >
              <option value="">— Unassigned —</option>
              {staff.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
            </select>

            {/* Comment */}
            <textarea
              value={quickComment}
              onChange={e => setQuickComment(e.target.value)}
              placeholder="Add a comment or instruction (optional)…"
              rows={2}
              className="w-full text-xs px-2.5 py-2 border border-orange-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/30 placeholder-gray-300 resize-none"
            />

            {/* Photo upload */}
            <div>
              <input
                ref={quickPhotoRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleQuickPhotoChange}
              />
              {quickPhotoPreview ? (
                <div className="relative">
                  <img src={quickPhotoPreview} alt="preview" className="w-full max-h-48 object-contain rounded-lg border border-orange-200 bg-gray-50" />
                  <button
                    onClick={() => { setQuickPhoto(null); setQuickPhotoPreview(null) }}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold hover:bg-red-600"
                  >✕</button>
                </div>
              ) : (
                <button
                  onClick={() => quickPhotoRef.current?.click()}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 border border-dashed border-orange-300 rounded-lg bg-white text-orange-400 hover:bg-orange-50 text-xs font-medium transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Attach Photo / Take Picture
                </button>
              )}
            </div>

            {/* Priority */}
            <div className="flex gap-1.5">
              {['low','medium','high'].map(p => (
                <button key={p} onClick={() => setQuickPriority(p)}
                  className={`flex-1 text-[10px] font-bold py-1 rounded-lg capitalize transition-colors ${
                    quickPriority === p
                      ? p === 'high' ? 'bg-red-500 text-white' : p === 'medium' ? 'bg-amber-500 text-white' : 'bg-blue-400 text-white'
                      : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >{p}</button>
              ))}
            </div>

            {/* Notification hint */}
            {quickStaff && (
              <p className="text-[10px] text-indigo-500 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Staff will be notified after task is created
              </p>
            )}

            {/* Submit */}
            <button
              onClick={handleQuickAdd}
              disabled={quickBusy || !quickTitle.trim()}
              className="w-full py-1.5 text-xs font-bold bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              {quickBusy
                ? <><span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />Adding…</>
                : <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>Add Task & Notify</>
              }
            </button>
          </div>
        )}
      </div>

      <div className="overflow-y-auto flex-1">
        {/* All Staff option */}
        <button
          onClick={() => onSelect(null)}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors border-b border-gray-50 ${
            selectedStaffId === null
              ? 'bg-red-50 border-l-4 border-l-red-500'
              : 'hover:bg-gray-50 border-l-4 border-l-transparent'
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold truncate ${selectedStaffId === null ? 'text-red-700' : 'text-gray-700'}`}>All Staff</p>
            {totalAll > 0 ? (
              <div className="mt-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-gray-400">{doneAll}/{totalAll} done</span>
                  <span className="text-[10px] font-bold text-gray-500">{Math.round(doneAll / totalAll * 100)}%</span>
                </div>
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${Math.round(doneAll / totalAll * 100)}%` }} />
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-gray-400">No tasks today</p>
            )}
          </div>
        </button>

        {/* Individual staff */}
        {filteredStaff.length === 0 && (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-gray-400">No staff match <span className="font-semibold">"{staffSearch}"</span></p>
            <button onClick={() => setStaffSearch('')} className="mt-1.5 text-[11px] text-indigo-500 hover:underline">Clear search</button>
          </div>
        )}
        {filteredStaff.map((member, idx) => {
          const isSelected = selectedStaffId === member.id
          const stats = statsByStaff[member.id] || { total: 0, done: 0 }
          const pct = stats.total > 0 ? Math.round(stats.done / stats.total * 100) : 0
          const allDone = stats.total > 0 && stats.done === stats.total

          return (
            <div key={member.id}
              className={`group flex items-start gap-2.5 px-3 py-2.5 border-b border-gray-50 transition-colors ${
                isSelected ? 'bg-red-50 border-l-4 border-l-red-500' : 'hover:bg-gray-50 border-l-4 border-l-transparent'
              }`}>

              {/* Avatar — click to select staff */}
              <button onClick={() => onSelect(member.id)} className="flex items-start gap-2.5 flex-1 min-w-0 text-left">
                <div className="relative flex-shrink-0 mt-0.5">
                  <div className={`w-8 h-8 rounded-lg ${avatarColor(idx)} flex items-center justify-center text-white text-[10px] font-bold`}>
                    {initials(member.name)}
                  </div>
                  {allDone && (
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center border border-white">
                      <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-xs font-semibold truncate ${isSelected ? 'text-red-700' : 'text-gray-700'}`}>{member.name}</p>
                    {stats.total > 0 && (
                      <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        allDone ? 'bg-emerald-100 text-emerald-700' :
                        pct >= 50 ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {stats.done}/{stats.total}
                      </span>
                    )}
                  </div>
                  {stats.total > 0 ? (
                    <div className="mt-1">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${allDone ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-400' : 'bg-orange-400'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-300 mt-0.5">No tasks</p>
                  )}
                </div>
              </button>

              {/* Edit button — visible on hover */}
              <button
                onClick={() => setEditingStaff({ id: member.id, name: member.name })}
                title="Edit SOP template"
                className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-md flex items-center justify-center text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 opacity-0 group-hover:opacity-100 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>

      {/* Template editor modal */}
      {editingStaff && (
        <TemplateEditorModal
          staffId={editingStaff.id}
          staffName={editingStaff.name}
          onClose={() => setEditingStaff(null)}
        />
      )}

      {/* Footer summary */}
      {totalAll > 0 && (
        <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-500 font-medium">{doneAll} of {totalAll} done</span>
            <span className={`font-bold ${doneAll === totalAll ? 'text-emerald-600' : 'text-gray-600'}`}>
              {Math.round(doneAll / totalAll * 100)}%
            </span>
          </div>
          <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${doneAll === totalAll ? 'bg-emerald-500' : 'bg-red-400'}`}
              style={{ width: `${Math.round(doneAll / totalAll * 100)}%` }}
            />
          </div>
        </div>
      )}
    </aside>
  )
}

// ─── Daily Board View ─────────────────────────────────────────────────────────
const DailyBoardView = ({ staff, filteredStaff, allTasks, initialLoading, refreshing, onRefresh, onSilentRefresh, selectedStaffMember, boardDate, setBoardDate }) => {
  const displayStaff = filteredStaff || staff

  const today = toYMD(new Date())
  const selectedDate = boardDate
  const isToday = selectedDate === today

  // When date changes, re-fetch tasks for that date from the server
  const handleDateChange = (newDate) => {
    setBoardDate(newDate)
    // fetchTasks will be triggered by the boardDate dependency in useCallback
  }

  const tasksForDate = allTasks.filter((t) => t.due_date && t.due_date.substring(0, 10) === selectedDate)

  const tasksByStaff = {}
  displayStaff.forEach((s) => { tasksByStaff[s.id] = [] })
  tasksForDate.forEach((t) => {
    if (t.assigned_to && tasksByStaff[t.assigned_to] !== undefined) {
      tasksByStaff[t.assigned_to].push(t)
    }
  })
  // Sort each staff's tasks by their embedded numeric order in the title, then by id
  Object.keys(tasksByStaff).forEach((id) => {
    tasksByStaff[id] = sortByOrder(tasksByStaff[id])
  })

  const displayTasks = selectedStaffMember
    ? tasksForDate.filter((t) => t.assigned_to === selectedStaffMember.id)
    : tasksForDate
  const totalTasks = displayTasks.length
  const totalDone = displayTasks.filter((t) => t.status === 'completed').length
  const totalOverdue = displayTasks.filter((t) => isOverdue(t.due_date, t.status)).length

  return (
    <div className="space-y-4">
      {/* Selected Staff Banner */}
      {selectedStaffMember && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
          <div className={`w-10 h-10 rounded-xl ${avatarColor(displayStaff.findIndex(s => s.id === selectedStaffMember.id))} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
            {initials(selectedStaffMember.name)}
          </div>
          <div>
            <p className="text-sm font-bold text-red-800">{selectedStaffMember.name}</p>
            <p className="text-xs text-red-500">{selectedStaffMember.position || selectedStaffMember.role || 'Staff'} · Store 221</p>
          </div>
          <span className="ml-auto px-2.5 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
            Viewing individual tasks
          </span>
        </div>
      )}

      {/* Date Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => handleDateChange(shiftDate(selectedDate, -1))}
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
              onChange={(e) => handleDateChange(e.target.value)}
              className="text-sm font-semibold text-gray-800 bg-transparent focus:outline-none cursor-pointer"
            />
          </div>
          <button onClick={() => handleDateChange(shiftDate(selectedDate, 1))}
            className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {!isToday && (
            <button onClick={() => handleDateChange(today)}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {displayStaff.map((member, idx) => (
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

// Section config for staff templates
// Build flat task list from a position template (daily + tasks/periodic)
const buildPositionFlat = (t) => {
  const flat = []
  let idx = 0
  ;(t.daily || []).forEach((title, num) => {
    flat.push({ title, type: 'Daily', sectionKey: 'daily', num: num + 1, idx: idx++ })
  })
  ;(t.tasks || []).forEach((title, num) => {
    flat.push({ title, type: 'Periodic', sectionKey: 'tasks', num: num + 1, idx: idx++ })
  })
  return flat
}

// ─── Category meta ────────────────────────────────────────────────────────────
const CAT_META = {
  daily:     { label: 'Daily',     dot: 'bg-blue-500',   text: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700'   },
  weekly:    { label: 'Weekly',    dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700'  },
  monthly:   { label: 'Monthly',   dot: 'bg-amber-500',  text: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700'  },
  quarterly: { label: 'Quarterly', dot: 'bg-purple-500', text: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' },
}
const CAT_ORDER = ['daily', 'weekly', 'monthly', 'quarterly']

// ─── Template Editor Sub-component ───────────────────────────────────────────
const TemplateEditor = ({ staffId, staffName, checkedIds, onToggle, onSelectAll, onClearAll, hideSelectionBar = false }) => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('daily')
  const [addingCat, setAddingCat] = useState(null)
  const [addTitle, setAddTitle] = useState('')
  const [addBusy, setAddBusy] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [movingId, setMovingId] = useState(null)
  const addInputRef = useRef(null)
  const editInputRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getStaffTemplate(staffId)
      setItems(res.data.data || [])
    } catch { toast.error('Failed to load template') }
    finally { setLoading(false) }
  }, [staffId])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (addingCat) addInputRef.current?.focus() }, [addingCat])
  useEffect(() => { if (editingId) editInputRef.current?.focus() }, [editingId])

  const catItems = (cat) => items.filter(i => i.category === cat).sort((a, b) => a.sort_order - b.sort_order)

  const handleAdd = async (cat) => {
    const t = addTitle.trim()
    if (!t) return
    setAddBusy(true)
    try {
      const res = await addTemplateItem(staffId, { title: t, category: cat })
      setItems(prev => [...prev, res.data.data])
      setAddTitle('')
      setAddingCat(null)
      toast.success('Task added to template')
    } catch { toast.error('Failed to add task') }
    finally { setAddBusy(false) }
  }

  const handleEditSave = async (item) => {
    const t = editTitle.trim()
    if (!t || t === item.title) { setEditingId(null); return }
    setSavingId(item.id)
    try {
      await updateTemplateItem(item.id, { title: t })
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, title: t } : i))
      setEditingId(null)
    } catch { toast.error('Failed to save') }
    finally { setSavingId(null) }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await deleteTemplateItem(id)
      setItems(prev => prev.filter(i => i.id !== id))
      toast.success('Task removed from template')
    } catch { toast.error('Failed to delete') }
    finally { setDeletingId(null) }
  }

  const handleMove = async (cat, item, dir) => {
    const list = catItems(cat)
    const idx = list.findIndex(i => i.id === item.id)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === list.length - 1) return
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    const newList = [...list]
    ;[newList[idx], newList[swapIdx]] = [newList[swapIdx], newList[idx]]
    const ids = newList.map(i => i.id)
    setMovingId(item.id)
    try {
      await reorderTemplateItems(staffId, { category: cat, ids })
      setItems(prev => {
        const others = prev.filter(i => i.category !== cat)
        const updated = newList.map((i, o) => ({ ...i, sort_order: o }))
        return [...others, ...updated]
      })
    } catch { toast.error('Failed to reorder') }
    finally { setMovingId(null) }
  }

  const handleCategoryChange = async (item, newCat) => {
    setSavingId(item.id)
    const newOrder = catItems(newCat).length
    try {
      await updateTemplateItem(item.id, { category: newCat, sort_order: newOrder })
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, category: newCat, sort_order: newOrder } : i))
    } catch { toast.error('Failed to move category') }
    finally { setSavingId(null) }
  }

  const presentCats = CAT_ORDER.filter(c => catItems(c).length > 0 || c === activeTab)
  const tabItems = catItems(activeTab)
  const tabMeta = CAT_META[activeTab]

  if (loading) return <div className="flex-1 flex items-center justify-center py-16"><Spinner /></div>

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Category tabs */}
      <div className="flex border-b border-gray-100 bg-gray-50">
        {CAT_ORDER.map(cat => {
          const m = CAT_META[cat]
          const count = catItems(cat).length
          const active = activeTab === cat
          return (
            <button key={cat} onClick={() => setActiveTab(cat)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 px-1 text-xs font-semibold transition-all border-b-2 ${
                active ? `border-current ${m.text} bg-white` : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              <span className={`w-2 h-2 rounded-full ${active ? m.dot : 'bg-gray-300'}`} />
              {m.label}
              {count > 0 && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? m.badge : 'bg-gray-200 text-gray-500'}`}>{count}</span>}
            </button>
          )
        })}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto">
        {tabItems.length === 0 && addingCat !== activeTab && (
          <div className="text-center py-8 text-gray-400 text-sm">
            No {tabMeta.label.toLowerCase()} tasks yet
          </div>
        )}

        <div className="divide-y divide-gray-50">
          {tabItems.map((item, i) => {
            const isEditing = editingId === item.id
            const isSaving = savingId === item.id
            const isDeleting = deletingId === item.id
            const isMoving = movingId === item.id
            const checked = checkedIds.has(item.id)
            return (
              <div key={item.id}
                className={`group flex items-start gap-2.5 px-4 py-2.5 hover:bg-gray-50 transition-colors ${checked ? tabMeta.bg : ''}`}>
                {/* Checkbox */}
                <input type="checkbox" checked={checked} onChange={() => onToggle(item.id)}
                  className="mt-1 w-4 h-4 rounded accent-red-600 flex-shrink-0 cursor-pointer" />

                {/* Number */}
                <span className="mt-1 w-5 flex-shrink-0 text-xs font-bold text-gray-400 text-right">{i + 1}.</span>

                {/* Title or inline edit */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex gap-1.5">
                      <input ref={editInputRef} value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleEditSave(item); if (e.key === 'Escape') setEditingId(null) }}
                        className="flex-1 text-sm px-2 py-1 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30" />
                      <button onClick={() => handleEditSave(item)} disabled={isSaving}
                        className="text-xs px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        {isSaving ? '…' : 'Save'}
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">✕</button>
                    </div>
                  ) : (
                    <p className={`text-sm leading-snug ${checked ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>{item.title}</p>
                  )}

                  {/* Category selector (shown when not editing) */}
                  {!isEditing && (
                    <select value={item.category} onChange={e => handleCategoryChange(item, e.target.value)}
                      className="mt-0.5 text-[11px] text-gray-400 bg-transparent border-none focus:outline-none cursor-pointer hover:text-gray-600 pr-1">
                      {CAT_ORDER.map(c => <option key={c} value={c}>{CAT_META[c].label}</option>)}
                    </select>
                  )}
                </div>

                {/* Actions (visible on hover) */}
                {!isEditing && (
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => handleMove(activeTab, item, 'up')} disabled={isMoving || i === 0}
                      title="Move up" className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-30">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <button onClick={() => handleMove(activeTab, item, 'down')} disabled={isMoving || i === tabItems.length - 1}
                      title="Move down" className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-30">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <button onClick={() => { setEditingId(item.id); setEditTitle(item.title) }}
                      title="Edit" className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => handleDelete(item.id)} disabled={isDeleting}
                      title="Delete" className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50">
                      {isDeleting
                        ? <span className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin" />
                        : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Add task form */}
        {addingCat === activeTab ? (
          <div className="px-4 py-3 bg-green-50 border-t border-green-100">
            <div className="flex gap-2">
              <input ref={addInputRef} value={addTitle} onChange={e => setAddTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(activeTab); if (e.key === 'Escape') { setAddingCat(null); setAddTitle('') } }}
                placeholder={`New ${tabMeta.label.toLowerCase()} task title…`}
                className="flex-1 text-sm px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400/40 bg-white" />
              <button onClick={() => handleAdd(activeTab)} disabled={addBusy || !addTitle.trim()}
                className="px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                {addBusy ? '…' : 'Add'}
              </button>
              <button onClick={() => { setAddingCat(null); setAddTitle('') }}
                className="px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200">✕</button>
            </div>
          </div>
        ) : (
          <div className="px-4 py-2.5 border-t border-gray-50">
            <button onClick={() => { setAddingCat(activeTab); setAddTitle('') }}
              className={`flex items-center gap-1.5 text-xs font-semibold ${tabMeta.text} hover:opacity-80 transition-opacity`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add {tabMeta.label} Task
            </button>
          </div>
        )}
      </div>

      {/* Select all / clear toolbar — hidden in standalone edit mode */}
      {!hideSelectionBar && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500">{checkedIds.size} selected for assignment</span>
          <div className="flex gap-2">
            <button onClick={onSelectAll} className="text-xs px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 font-medium">Select all</button>
            <button onClick={onClearAll} className="text-xs px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 font-medium">Clear</button>
          </div>
        </div>
      )}
    </div>
  )
}

const BulkAssignModal = ({ isOpen, onClose, staff, onSuccess }) => {
  const [step, setStep] = useState(1)
  const [templateMode, setTemplateMode] = useState('staff')
  const [selectedPositionTemplate, setSelectedPositionTemplate] = useState(null)
  const [selectedStaffId, setSelectedStaffId] = useState(null)
  const [selectedStaffName, setSelectedStaffName] = useState('')
  const [dueDate, setDueDate] = useState(toYMD(new Date()))
  const [priority, setPriority] = useState('medium')
  const [assignTo, setAssignTo] = useState('')
  const [checkedIds, setCheckedIds] = useState(new Set())
  const [loading, setLoading] = useState(false)
  // For position template (keep original behaviour)
  const [checkedTasks, setCheckedTasks] = useState({})

  // DB staff list for "By Staff" cards
  const [dbStaff, setDbStaff] = useState([])
  const [dbStaffLoading, setDbStaffLoading] = useState(false)
  // items for the current staff template (used to compute "select all")
  const [templateItems, setTemplateItems] = useState([])

  useEffect(() => {
    if (isOpen && templateMode === 'staff') {
      setDbStaffLoading(true)
      getTemplateStaff().then(r => setDbStaff(r.data.data || [])).catch(() => {}).finally(() => setDbStaffLoading(false))
    }
  }, [isOpen, templateMode])

  // Whenever items for selected staff change, build a local copy for "select all"
  const loadTemplateItems = useCallback(async (sid) => {
    try {
      const res = await getStaffTemplate(sid)
      setTemplateItems(res.data.data || [])
    } catch { setTemplateItems([]) }
  }, [])

  useEffect(() => {
    if (selectedStaffId) loadTemplateItems(selectedStaffId)
  }, [selectedStaffId, loadTemplateItems])

  const reset = () => {
    setStep(1); setSelectedPositionTemplate(null); setSelectedStaffId(null); setSelectedStaffName('')
    setDueDate(toYMD(new Date())); setPriority('medium'); setAssignTo('')
    setCheckedIds(new Set()); setCheckedTasks({}); setTemplateItems([])
  }
  const handleClose = () => { reset(); onClose() }

  const pickStaff = (s) => {
    setSelectedStaffId(s.id)
    setSelectedStaffName(s.name)
    const matched = staff.find(m => m.name.trim().toLowerCase() === s.name.trim().toLowerCase())
    setAssignTo(matched ? String(matched.id) : String(s.id))
    setCheckedIds(new Set())
    setStep(2)
  }

  // Position template logic (unchanged)
  const pickPositionTemplate = (t) => {
    setSelectedPositionTemplate(t)
    const flat = buildPositionFlat(t)
    const all = {}
    flat.forEach(({ idx }) => { all[idx] = true })
    setCheckedTasks(all)
    setStep(2)
  }
  const allTasksFlat = selectedPositionTemplate ? buildPositionFlat(selectedPositionTemplate) : []
  const togglePosTask = (idx) => setCheckedTasks(c => ({ ...c, [idx]: !c[idx] }))
  const posCheckedCount = Object.values(checkedTasks).filter(Boolean).length

  // Staff template selection handlers
  const toggleItem = (id) => setCheckedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const selectAllItems = () => setCheckedIds(new Set(templateItems.map(i => i.id)))
  const clearAllItems = () => setCheckedIds(new Set())

  const handleCreate = async () => {
    if (templateMode === 'staff') {
      if (!checkedIds.size) { toast.error('Select at least one task.'); return }
      setLoading(true)
      try {
        const selected = templateItems.filter(i => checkedIds.has(i.id))
        await Promise.all(selected.map((item, idx) =>
          createTask({
            title: `${item.sort_order + 1}. ${item.title}`,
            description: `[${item.category.charAt(0).toUpperCase() + item.category.slice(1)}] ${selectedStaffName} SOP`,
            assigned_to: assignTo || null,
            due_date: dueDate,
            priority,
          })
        ))
        toast.success(`${selected.length} task${selected.length > 1 ? 's' : ''} created!`)
        onSuccess(); handleClose()
      } catch { toast.error('Failed to create tasks.') }
      finally { setLoading(false) }
    } else {
      if (!posCheckedCount) { toast.error('Select at least one task.'); return }
      setLoading(true)
      try {
        const tasks = allTasksFlat.filter(({ idx }) => checkedTasks[idx])
        await Promise.all(tasks.map(({ title, type }) =>
          createTask({
            title: `[${type}] ${title}`,
            description: `[${type}] ${selectedPositionTemplate?.position} SOP`,
            assigned_to: assignTo || null,
            due_date: dueDate,
            priority,
          })
        ))
        toast.success(`${tasks.length} task${tasks.length > 1 ? 's' : ''} created!`)
        onSuccess(); handleClose()
      } catch { toast.error('Failed to create tasks.') }
      finally { setLoading(false) }
    }
  }

  if (!isOpen) return null

  const stepLabel = step === 1
    ? `Step 1: Select ${templateMode === 'staff' ? 'staff member' : 'position'}`
    : templateMode === 'staff' ? `Editing template · ${selectedStaffName}` : `Step 2: Configure · ${selectedPositionTemplate?.position}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-red-600 to-red-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h7" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">SOP Template Manager</h2>
              <p className="text-red-200 text-xs">{stepLabel}</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="flex flex-col overflow-hidden flex-1">
            <div className="px-6 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
              <div className="inline-flex items-center bg-gray-100 rounded-xl p-1">
                <button onClick={() => setTemplateMode('staff')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${templateMode === 'staff' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  By Staff
                </button>
                <button onClick={() => setTemplateMode('position')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${templateMode === 'position' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  By Position
                </button>
              </div>
            </div>

            {/* By Staff grid from DB */}
            {templateMode === 'staff' && (
              <div className="p-6 overflow-y-auto flex-1">
                <p className="text-sm text-gray-500 mb-4">Choose a staff member to edit their SOP template and assign tasks:</p>
                {dbStaffLoading ? <Spinner centered /> : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {dbStaff.map((s, idx) => (
                      <button key={s.id} onClick={() => pickStaff(s)}
                        className="text-left p-4 rounded-xl border-2 border-gray-200 hover:border-red-300 hover:shadow-md hover:bg-red-50/30 transition-all group">
                        <div className={`w-9 h-9 rounded-xl mb-3 flex items-center justify-center text-white text-xs font-bold ${avatarColor(idx)}`}>
                          {initials(s.name)}
                        </div>
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-red-700">{s.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{s.position || 'Staff'}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          <span className="font-semibold text-gray-600">{s.task_template_items_count}</span> template tasks
                        </p>
                      </button>
                    ))}
                    {dbStaff.length === 0 && <p className="col-span-3 text-center text-gray-400 py-8">No staff templates found</p>}
                  </div>
                )}
              </div>
            )}

            {/* By Position grid */}
            {templateMode === 'position' && (
              <div className="p-6 overflow-y-auto flex-1">
                <p className="text-sm text-gray-500 mb-4">Choose a position to load its SOP task list:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {TASK_TEMPLATES.map((t) => {
                    const c = TEMPLATE_COLORS[t.color] || TEMPLATE_COLORS.gray
                    return (
                      <button key={t.position} onClick={() => pickPositionTemplate(t)}
                        className={`text-left p-4 rounded-xl border-2 hover:shadow-md transition-all ${c.border} ${c.bg}`}>
                        <div className="w-8 h-8 rounded-lg mb-3 flex items-center justify-center opacity-80">
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
          </div>
        )}

        {/* Step 2 – Staff template editor */}
        {step === 2 && templateMode === 'staff' && selectedStaffId && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Assignment config bar */}
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Assign To</label>
                  <select value={assignTo} onChange={e => setAssignTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 bg-white">
                    <option value="">— Unassigned —</option>
                    {staff.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Due Date</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Priority</label>
                  <select value={priority} onChange={e => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 bg-white">
                    {TASK_PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <TemplateEditor
              staffId={selectedStaffId}
              staffName={selectedStaffName}
              checkedIds={checkedIds}
              onToggle={toggleItem}
              onSelectAll={() => {
                getStaffTemplate(selectedStaffId).then(r => {
                  const all = r.data.data || []
                  setTemplateItems(all)
                  setCheckedIds(new Set(all.map(i => i.id)))
                })
              }}
              onClearAll={clearAllItems}
            />

            <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
              <button onClick={() => { setStep(1); setSelectedStaffId(null) }}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <div className="flex gap-3 items-center">
                <span className="text-xs text-gray-500 font-medium">{checkedIds.size} task{checkedIds.size !== 1 ? 's' : ''} selected</span>
                <Button variant="secondary" onClick={handleClose}>Cancel</Button>
                <Button onClick={handleCreate} disabled={loading || !checkedIds.size}>
                  {loading ? 'Creating…' : `Assign ${checkedIds.size} Task${checkedIds.size !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 – Position template (original behaviour) */}
        {step === 2 && templateMode === 'position' && selectedPositionTemplate && (
          <>
            <div className="p-5 border-b border-gray-100 space-y-3 flex-shrink-0">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Assign To</label>
                  <select value={assignTo} onChange={e => setAssignTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30">
                    <option value="">— Unassigned —</option>
                    {staff.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Due Date</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Priority</label>
                  <select value={priority} onChange={e => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30">
                    {TASK_PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500"><span className="font-bold text-gray-800">{posCheckedCount}</span> selected</span>
                <div className="flex gap-2">
                  <button onClick={() => { const all = {}; allTasksFlat.forEach(({ idx }) => { all[idx] = true }); setCheckedTasks(all) }}
                    className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600">Select all</button>
                  <button onClick={() => setCheckedTasks({})}
                    className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600">Clear</button>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Daily Tasks</span>
                <span className="text-xs font-semibold bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{selectedPositionTemplate.daily?.length || 0}</span>
              </div>
              {(selectedPositionTemplate.daily || []).map((title, i) => {
                const checked = !!checkedTasks[i]
                const c = TEMPLATE_COLORS[selectedPositionTemplate.color] || TEMPLATE_COLORS.gray
                return (
                  <label key={i} className={`flex items-start gap-3 px-5 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${checked ? c.bg : ''}`}>
                    <input type="checkbox" checked={checked} onChange={() => togglePosTask(i)} className="mt-0.5 w-4 h-4 rounded accent-red-600 flex-shrink-0" />
                    <span className="flex-shrink-0 w-5 text-xs font-bold text-gray-400 mt-0.5 text-right">{i + 1}.</span>
                    <p className={`text-sm leading-snug flex-1 ${checked ? 'text-gray-800' : 'text-gray-500'}`}>{title}</p>
                  </label>
                )
              })}
              <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Periodic Tasks</span>
                <span className="text-xs font-semibold bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{selectedPositionTemplate.tasks?.length || 0}</span>
              </div>
              {(selectedPositionTemplate.tasks || []).map((title, i) => {
                const idx = (selectedPositionTemplate.daily?.length || 0) + i
                const checked = !!checkedTasks[idx]
                return (
                  <label key={idx} className={`flex items-start gap-3 px-5 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${checked ? 'bg-purple-50' : ''}`}>
                    <input type="checkbox" checked={checked} onChange={() => togglePosTask(idx)} className="mt-0.5 w-4 h-4 rounded accent-red-600 flex-shrink-0" />
                    <span className="flex-shrink-0 w-5 text-xs font-bold text-gray-400 mt-0.5 text-right">{i + 1}.</span>
                    <p className={`text-sm leading-snug flex-1 ${checked ? 'text-gray-800' : 'text-gray-500'}`}>{title}</p>
                  </label>
                )
              })}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
              <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back
              </button>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={handleClose}>Cancel</Button>
                <Button onClick={handleCreate} disabled={loading || !posCheckedCount}>
                  {loading ? 'Creating…' : `Create ${posCheckedCount} Task${posCheckedCount !== 1 ? 's' : ''}`}
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
const AllTasksView = ({ tasks, staff, loading, meta, filters, setFilters, onDelete, deleteTarget, setDeleteTarget, deleteLoading, navigate, selectedStaffMember }) => (
  <div className="space-y-4">
    {/* Selected Staff Banner */}
    {selectedStaffMember && (
      <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
        <div className={`w-10 h-10 rounded-xl ${avatarColor(staff.findIndex(s => s.id === selectedStaffMember.id))} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
          {initials(selectedStaffMember.name)}
        </div>
        <div>
          <p className="text-sm font-bold text-red-800">{selectedStaffMember.name}</p>
          <p className="text-xs text-red-500">{selectedStaffMember.position || selectedStaffMember.role || 'Staff'} · Store 221</p>
        </div>
        <span className="ml-auto px-2.5 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
          Viewing individual tasks
        </span>
      </div>
    )}

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
  const [selectedStaffId, setSelectedStaffId] = useState(null)
  const [autoAssigning, setAutoAssigning] = useState(false)
  // Board date lives here so fetchTasks can filter by it
  const [boardDate, setBoardDate] = useState(toYMD(new Date()))
  // Track which dates we've already auto-seeded this session (avoid duplicate triggers)
  const autoSeededDates = useRef(new Set())

  const fetchTasks = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setBoardRefreshing(true)
    try {
      const params = activeView === 'list'
        ? Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
        : { per_page: 1000, due_date_from: boardDate, due_date_to: boardDate }
      const res = await getTasks(params)
      setAllTasks(res.data.data || [])
      setMeta(res.data.meta || {})
    } catch {
      toast.error('Failed to load tasks.')
    } finally {
      setLoading(false)
      setBoardRefreshing(false)
    }
  }, [filters, activeView, boardDate])

  // Silent refresh — used by inline board actions (add/edit/delete).
  // Does NOT set loading=true, so the board cards stay mounted and keep their open state.
  const silentRefresh = useCallback(() => fetchTasks(true), [fetchTasks])

  // Auto-assign tasks for the board date if none exist yet (runs once per date per session)
  useEffect(() => {
    if (activeView !== 'board') return
    if (autoSeededDates.current.has(boardDate)) return
    // Only auto-seed after the initial task fetch settles
    const check = setTimeout(async () => {
      if (autoSeededDates.current.has(boardDate)) return
      autoSeededDates.current.add(boardDate)
      try {
        const res = await assignDailyTasks(boardDate)
        if (res.data.created > 0) {
          // New tasks were created — silently refresh to show them
          fetchTasks(true)
          toast.success(`${res.data.created} tasks auto-assigned for ${boardDate}`, { duration: 4000 })
        }
      } catch {
        // Silently ignore — user can manually trigger via the button
      }
    }, 1200)
    return () => clearTimeout(check)
  }, [boardDate, activeView, fetchTasks])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  // Manual auto-assign handler (sidebar button)
  const handleAutoAssign = useCallback(async () => {
    setAutoAssigning(true)
    try {
      const res = await assignDailyTasks(boardDate)
      const n = res.data.created
      if (n > 0) {
        toast.success(`${n} task${n > 1 ? 's' : ''} assigned for ${boardDate}!`)
        fetchTasks(true)
      } else {
        toast.success(`Tasks already up to date for ${boardDate}`)
      }
    } catch {
      toast.error('Failed to auto-assign tasks.')
    } finally {
      setAutoAssigning(false)
    }
  }, [boardDate, fetchTasks])
  const fetchStaff = useCallback(() => {
    getAllStaff().then((r) => setStaff(r.data.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    fetchStaff()
    const onVisible = () => { if (document.visibilityState === 'visible') fetchStaff() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', fetchStaff)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', fetchStaff)
    }
  }, [fetchStaff])

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

  const selectedStaffMember = selectedStaffId ? staff.find((s) => s.id === selectedStaffId) || null : null
  const filteredStaff = selectedStaffId ? staff.filter((s) => s.id === selectedStaffId) : staff
  const filteredTasks = selectedStaffId
    ? allTasks.filter((t) => t.assigned_to === selectedStaffId)
    : allTasks

  const handleStaffSelect = (staffId) => {
    setSelectedStaffId(staffId)
    if (staffId !== null) {
      setFilters((f) => ({ ...f, assigned_to: String(staffId) }))
    } else {
      setFilters((f) => ({ ...f, assigned_to: '' }))
    }
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tasks</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {selectedStaffMember
              ? `Showing tasks for ${selectedStaffMember.name}`
              : meta.total !== undefined && activeView === 'list'
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

      {/* Main Layout: Staff Sidebar + Content */}
      <div className="flex gap-4 items-start">
        {/* Staff Sidebar */}
        <StaffSidebarPanel
          staff={staff}
          allTasks={allTasks}
          selectedStaffId={selectedStaffId}
          onSelect={handleStaffSelect}
          boardDate={boardDate}
          onAutoAssign={handleAutoAssign}
          autoAssigning={autoAssigning}
          onTaskAdded={silentRefresh}
        />

        {/* Views */}
        <div className="flex-1 min-w-0">
          {activeView === 'board' ? (
            <DailyBoardView
              staff={staff}
              filteredStaff={filteredStaff}
              allTasks={allTasks}
              initialLoading={loading}
              refreshing={boardRefreshing}
              onRefresh={fetchTasks}
              onSilentRefresh={silentRefresh}
              selectedStaffMember={selectedStaffMember}
              boardDate={boardDate}
              setBoardDate={setBoardDate}
            />
          ) : (
            <AllTasksView
              tasks={filteredTasks}
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
              selectedStaffMember={selectedStaffMember}
            />
          )}
        </div>
      </div>

      {/* Bulk Assign Modal */}
      <BulkAssignModal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} staff={staff} onSuccess={fetchTasks} />
    </div>
  )
}

export default TaskListPage
