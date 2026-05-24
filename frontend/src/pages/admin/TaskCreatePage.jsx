import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTask } from '../../api/taskApi'
import { getAllStaff } from '../../api/userApi'
import Button from '../../components/ui/Button'
import { TASK_PRIORITIES } from '../../utils/constants'
import { TASK_TEMPLATES, TEMPLATE_COLORS } from '../../utils/taskTemplates'
import toast from 'react-hot-toast'

const TaskCreatePage = () => {
  const navigate = useNavigate()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    title: '', description: '', assigned_to: '', due_date: '', priority: 'medium',
  })

  // Template state
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [templateTab, setTemplateTab] = useState('daily') // 'daily' | 'tasks'
  const [showTemplates, setShowTemplates] = useState(true)

  useEffect(() => {
    getAllStaff().then((res) => setStaff(res.data.data)).catch(() => {})
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }))
  }

  const pickTask = (title) => {
    setForm((f) => ({ ...f, title }))
    if (errors.title) setErrors((e) => ({ ...e, title: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required.'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      await createTask({ ...form, assigned_to: form.assigned_to || null, due_date: form.due_date || null })
      toast.success('Task created successfully!')
      navigate('/admin/tasks')
    } catch (err) {
      const apiErrors = err.response?.data?.errors || {}
      if (Object.keys(apiErrors).length) {
        setErrors(Object.fromEntries(Object.entries(apiErrors).map(([k, v]) => [k, v[0]])))
      } else {
        toast.error(err.response?.data?.message || 'Failed to create task.')
      }
    } finally {
      setLoading(false)
    }
  }

  const templateTasks = selectedTemplate
    ? (templateTab === 'daily' ? selectedTemplate.daily : selectedTemplate.tasks)
    : []

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Create Task</h1>
          <p className="text-gray-500 text-sm">Fill in the details or pick from an SOP template</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* ── Left: Task Form ─────────────────────────────────────────── */}
        <div className="xl:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g., Open Store  — or pick from template →"
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-colors ${errors.title ? 'border-red-400 bg-red-50/30' : 'border-gray-200'}`}
                />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
                {form.title && (
                  <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Task title set
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe what needs to be done..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 resize-none"
                />
              </div>

              {/* Assign + Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Assign To</label>
                  <select
                    name="assigned_to"
                    value={form.assigned_to}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
                  >
                    <option value="">— Unassigned —</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Due Date</label>
                  <input
                    type="date"
                    name="due_date"
                    value={form.due_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
                  />
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                <div className="flex gap-3">
                  {TASK_PRIORITIES.map((p) => {
                    const colors = {
                      low:    'border-green-400 bg-green-50 text-green-700',
                      medium: 'border-yellow-400 bg-yellow-50 text-yellow-700',
                      high:   'border-red-400 bg-red-50 text-red-700',
                    }
                    const selected = form.priority === p.value
                    return (
                      <label key={p.value} className="flex-1 cursor-pointer">
                        <input type="radio" name="priority" value={p.value} checked={selected} onChange={handleChange} className="sr-only" />
                        <div className={`px-4 py-2.5 border-2 rounded-xl text-sm font-semibold text-center transition-all ${selected ? colors[p.value] : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                          {p.label}
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Task'}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Right: Template Picker ───────────────────────────────────── */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/60">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h7" />
                </svg>
                <span className="text-sm font-semibold text-gray-700">SOP Templates</span>
              </div>
              <button onClick={() => setShowTemplates((v) => !v)} className="text-xs text-gray-400 hover:text-gray-600">
                {showTemplates ? 'Hide' : 'Show'}
              </button>
            </div>

            {showTemplates && (
              <>
                {/* Position list */}
                <div className="p-3 border-b border-gray-100">
                  <p className="text-xs text-gray-400 mb-2 font-medium">Select a position:</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {TASK_TEMPLATES.map((t) => {
                      const c = TEMPLATE_COLORS[t.color]
                      const isSelected = selectedTemplate?.position === t.position
                      return (
                        <button
                          key={t.position}
                          onClick={() => { setSelectedTemplate(t); setTemplateTab('daily') }}
                          className={`text-left px-3 py-2 rounded-lg border text-xs font-medium transition-all ${isSelected ? `${c.bg} ${c.text} ${c.border}` : 'border-gray-100 text-gray-600 hover:bg-gray-50'}`}
                        >
                          <div className={`flex items-center gap-1.5`}>
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isSelected ? c.dot : 'bg-gray-300'}`} />
                            {t.position}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Task list */}
                {selectedTemplate ? (
                  <div>
                    {/* Tabs */}
                    <div className="flex border-b border-gray-100">
                      <button
                        onClick={() => setTemplateTab('daily')}
                        className={`flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2 ${templateTab === 'daily' ? 'text-red-600 border-red-500' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
                      >
                        Daily Tasks ({selectedTemplate.daily.length})
                      </button>
                      <button
                        onClick={() => setTemplateTab('tasks')}
                        className={`flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2 ${templateTab === 'tasks' ? 'text-red-600 border-red-500' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
                      >
                        Periodic Tasks ({selectedTemplate.tasks.length})
                      </button>
                    </div>

                    <p className="px-3 pt-2.5 pb-1 text-xs text-gray-400">Click a task to use as title:</p>

                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                      {templateTasks.map((title, i) => {
                        const c = TEMPLATE_COLORS[selectedTemplate.color]
                        const isActive = form.title === title
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => pickTask(title)}
                            className={`w-full text-left px-3 py-2.5 text-xs hover:bg-gray-50 transition-colors flex items-start gap-2 ${isActive ? `${c.bg}` : ''}`}
                          >
                            <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center ${isActive ? `${c.border} ${c.bg}` : 'border-gray-200'}`}>
                              {isActive && (
                                <svg className={`w-2.5 h-2.5 ${c.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </span>
                            <span className={`leading-snug ${isActive ? `${c.text} font-medium` : 'text-gray-600'}`}>{title}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-gray-400 text-xs">
                    <svg className="w-8 h-8 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h7" />
                    </svg>
                    Select a position above to see its SOP task list
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskCreatePage
