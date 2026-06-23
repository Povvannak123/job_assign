import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTask } from '../../api/taskApi'
import { getAllStaff } from '../../api/userApi'
import Button from '../../components/ui/Button'
import toast from 'react-hot-toast'

const toYMD = (d) => {
  const date = new Date(d)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const CATEGORIES = [
  { key: 'Daily',     dot: 'bg-blue-500',   ring: 'ring-blue-400',   bg: 'bg-blue-600',   light: 'bg-blue-50 border-blue-300 text-blue-700'   },
  { key: 'Weekly',    dot: 'bg-green-500',  ring: 'ring-green-400',  bg: 'bg-green-600',  light: 'bg-green-50 border-green-300 text-green-700'  },
  { key: 'Monthly',   dot: 'bg-amber-500',  ring: 'ring-amber-400',  bg: 'bg-amber-600',  light: 'bg-amber-50 border-amber-300 text-amber-700'  },
  { key: 'Quarterly', dot: 'bg-purple-500', ring: 'ring-purple-400', bg: 'bg-purple-600', light: 'bg-purple-50 border-purple-300 text-purple-700' },
]

const TaskCreatePage = () => {
  const navigate = useNavigate()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const [category, setCategory] = useState('Daily')
  const [rawTitle, setRawTitle] = useState('')
  const [assignedTo, setAssignedTo] = useState('')   // staff id (string)
  const [assignSearch, setAssignSearch] = useState('')
  const [assignOpen, setAssignOpen] = useState(false)
  const [description, setDescription] = useState('')
  const assignRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => { if (assignRef.current && !assignRef.current.contains(e.target)) setAssignOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    getAllStaff().then((res) => setStaff(res.data.data)).catch(() => {})
  }, [])

  const selectedStaff = staff.find(s => String(s.id) === assignedTo) || null
  const filteredStaff = staff.filter(s =>
    s.name.toLowerCase().includes(assignSearch.toLowerCase()) ||
    (s.position || '').toLowerCase().includes(assignSearch.toLowerCase())
  )

  // Full title matches the auto-assign format: "[Category] N. title"
  // We leave off the number since this is a one-off task — the board sorts by number anyway
  const fullTitle = rawTitle.trim() ? `[${category}] ${rawTitle.trim()}` : ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!rawTitle.trim()) { setErrors({ title: 'Task title is required.' }); return }
    setErrors({})
    setLoading(true)
    try {
      await createTask({
        title:       fullTitle,
        description: description.trim() || `[${category}] ${assignedTo ? staff.find(s => String(s.id) === assignedTo)?.name + ' SOP' : 'Ad-hoc task'}`,
        assigned_to: assignedTo || null,
        due_date:    toYMD(new Date()),   // always today
        priority:    'medium',            // matches auto-assign default
      })
      toast.success('Task created!')
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

  const selectedCat = CATEGORIES.find(c => c.key === category)

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Create Task</h1>
          <p className="text-gray-500 text-sm mt-0.5">Add a task following the SOP format — assigned to today</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">

        {/* Step 1 — Category */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">
            <span className="inline-flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-gray-800 text-white text-[10px] font-bold flex items-center justify-center">1</span>
              Category
            </span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => {
              const active = category === cat.key
              return (
                <button key={cat.key} type="button" onClick={() => setCategory(cat.key)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 font-semibold text-xs transition-all ${
                    active
                      ? `border-transparent ${cat.bg} text-white shadow-md ring-2 ring-offset-1 ${cat.ring}`
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                  }`}>
                  <span className={`w-3 h-3 rounded-full ${active ? 'bg-white/60' : cat.dot}`} />
                  {cat.key}
                </button>
              )
            })}
          </div>
        </div>

        {/* Step 2 — Assign to (searchable) */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <span className="inline-flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-gray-800 text-white text-[10px] font-bold flex items-center justify-center">2</span>
              Assign To
            </span>
          </label>

          <div className="relative" ref={assignRef}>
            {/* Trigger button */}
            <button type="button" onClick={() => { setAssignOpen(o => !o); setAssignSearch('') }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-colors">
              {selectedStaff ? (
                <span className="flex items-center gap-2 text-gray-800">
                  <span className="w-6 h-6 rounded-lg bg-red-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                    {selectedStaff.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
                  </span>
                  <span className="font-medium">{selectedStaff.name}</span>
                  <span className="text-gray-400 text-xs">— {selectedStaff.position || selectedStaff.role}</span>
                </span>
              ) : (
                <span className="text-gray-400">— Unassigned —</span>
              )}
              <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${assignOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown */}
            {assignOpen && (
              <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {/* Search input */}
                <div className="px-3 pt-3 pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-500/20">
                    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      autoFocus
                      type="text"
                      value={assignSearch}
                      onChange={e => setAssignSearch(e.target.value)}
                      placeholder="Search staff name or position…"
                      className="flex-1 text-sm bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                    />
                    {assignSearch && (
                      <button type="button" onClick={() => setAssignSearch('')} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Options list */}
                <div className="max-h-52 overflow-y-auto py-1">
                  {/* Unassigned option */}
                  <button type="button"
                    onClick={() => { setAssignedTo(''); setAssignOpen(false) }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${!assignedTo ? 'bg-red-50 text-red-700' : 'text-gray-500'}`}>
                    <span className="w-6 h-6 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
                    <span className="font-medium">— Unassigned —</span>
                  </button>

                  {filteredStaff.length === 0 ? (
                    <div className="px-4 py-4 text-center text-sm text-gray-400">No staff match "{assignSearch}"</div>
                  ) : (
                    filteredStaff.map((s, idx) => {
                      const isSelected = String(s.id) === assignedTo
                      const initials = s.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
                      const COLORS = ['bg-blue-500','bg-purple-500','bg-emerald-500','bg-orange-500','bg-pink-500','bg-teal-500','bg-indigo-500','bg-rose-500']
                      const color = COLORS[idx % COLORS.length]
                      return (
                        <button key={s.id} type="button"
                          onClick={() => { setAssignedTo(String(s.id)); setAssignOpen(false); setAssignSearch('') }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${isSelected ? 'bg-red-50' : ''}`}>
                          <span className={`w-6 h-6 rounded-lg ${color} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                            {initials}
                          </span>
                          <span className="flex-1 text-left">
                            <span className={`font-medium ${isSelected ? 'text-red-700' : 'text-gray-800'}`}>{s.name}</span>
                            <span className="text-gray-400 text-xs ml-1.5">— {s.position || s.role}</span>
                          </span>
                          {isSelected && (
                            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 3 — Task title */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <span className="inline-flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-gray-800 text-white text-[10px] font-bold flex items-center justify-center">3</span>
              Task Title <span className="text-red-500 font-normal ml-0.5">*</span>
            </span>
          </label>

          {/* Preview badge */}
          {rawTitle.trim() && (
            <div className={`mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${selectedCat.light}`}>
              <span className={`w-2 h-2 rounded-full ${selectedCat.dot}`} />
              {fullTitle}
            </div>
          )}

          <div className="flex gap-2">
            {/* Category prefix pill (read-only) */}
            <span className={`flex items-center px-3 py-2.5 rounded-xl border-2 text-xs font-bold flex-shrink-0 ${selectedCat.light}`}>
              [{category}]
            </span>
            <input
              type="text"
              value={rawTitle}
              onChange={e => { setRawTitle(e.target.value); setErrors({}) }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(e) } }}
              placeholder="e.g. Morning talk with store head"
              className={`flex-1 px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-colors ${errors.title ? 'border-red-400 bg-red-50/30' : 'border-gray-200'}`}
            />
          </div>
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
        </div>

        {/* Optional description */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">
            Notes <span className="text-gray-400 font-normal text-xs">(optional)</span>
          </label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
            placeholder="Additional details or instructions..."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 resize-none" />
        </div>

        {/* Info strip */}
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Due date is set to <strong>today</strong> automatically. Priority is <strong>Medium</strong> (matches SOP standard).</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !rawTitle.trim()}>
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating…</>
              : <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Task
                </>
            }
          </Button>
        </div>
      </div>
    </div>
  )
}

export default TaskCreatePage
