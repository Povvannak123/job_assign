import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getTask, updateTask } from '../../api/taskApi'
import { getAllStaff } from '../../api/userApi'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { TASK_PRIORITIES, TASK_STATUSES } from '../../utils/constants'
import toast from 'react-hot-toast'

const TaskEditPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    title: '',
    description: '',
    assigned_to: '',
    due_date: '',
    priority: 'medium',
    status: 'not_started',
  })

  useEffect(() => {
    Promise.all([
      getTask(id),
      getAllStaff(),
    ]).then(([taskRes, staffRes]) => {
      const t = taskRes.data.data
      setForm({
        title: t.title || '',
        description: t.description || '',
        assigned_to: t.assigned_to ? String(t.assigned_to) : '',
        due_date: t.due_date ? t.due_date.substring(0, 10) : '',
        priority: t.priority || 'medium',
        status: t.status || 'not_started',
      })
      setStaff(staffRes.data.data)
    }).catch(() => {
      toast.error('Failed to load task.')
    }).finally(() => setFetchLoading(false))
  }, [id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setErrors({ title: 'Title is required.' }); return }
    setLoading(true)
    try {
      await updateTask(id, {
        ...form,
        assigned_to: form.assigned_to || null,
        due_date: form.due_date || null,
      })
      toast.success('Task updated successfully!')
      navigate('/admin/tasks')
    } catch (err) {
      const apiErrors = err.response?.data?.errors || {}
      if (Object.keys(apiErrors).length) {
        setErrors(Object.fromEntries(Object.entries(apiErrors).map(([k, v]) => [k, v[0]])))
      } else {
        toast.error(err.response?.data?.message || 'Failed to update task.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) return <Spinner centered />

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Edit Task</h1>
          <p className="text-gray-500 text-sm">Update task details</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign To</label>
              <select
                name="assigned_to"
                value={form.assigned_to}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Unassigned —</option>
                {staff.map((s) => (
                  <option key={s.id} value={String(s.id)}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
              <input
                type="date"
                name="due_date"
                value={form.due_date}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TASK_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <div className="flex gap-3">
              {TASK_PRIORITIES.map((p) => {
                const colors = {
                  low: 'border-green-400 bg-green-50 text-green-700',
                  medium: 'border-yellow-400 bg-yellow-50 text-yellow-700',
                  high: 'border-red-400 bg-red-50 text-red-700',
                }
                const selected = form.priority === p.value
                return (
                  <label key={p.value} className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      value={p.value}
                      checked={selected}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div
                      className={`px-4 py-2.5 border-2 rounded-lg text-sm font-medium text-center transition-all ${selected ? colors[p.value] : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                    >
                      {p.label}
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskEditPage
