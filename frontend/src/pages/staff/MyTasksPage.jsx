import { useEffect, useState, useCallback } from 'react'
import { getMyTasks, updateMyTaskStatus } from '../../api/taskApi'
import TaskStatusBadge from '../../components/tasks/TaskStatusBadge'
import TaskPriorityBadge from '../../components/tasks/TaskPriorityBadge'
import TaskCommentBox from '../../components/tasks/TaskCommentBox'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { formatDate, isOverdue } from '../../utils/formatDate'
import toast from 'react-hot-toast'

const TABS = [
  { label: 'All', value: '' },
  { label: 'Not Started', value: 'not_started' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
]

const MyTasksPage = () => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const params = activeTab ? { status: activeTab } : {}
      const res = await getMyTasks(params)
      setTasks(res.data.data)
    } catch {
      toast.error('Failed to load tasks.')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const handleStatusUpdate = async (taskId, status) => {
    setUpdatingId(taskId)
    try {
      await updateMyTaskStatus(taskId, status)
      toast.success(`Task marked as ${status.replace('_', ' ')}.`)
      fetchTasks()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task status.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Tasks</h1>
        <p className="text-gray-500 text-sm mt-0.5">View and manage your assigned tasks</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner centered />
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-16 text-center text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          No tasks found
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tasks.map((task) => {
            const overdue = isOverdue(task.due_date, task.status)
            const isUpdating = updatingId === task.id

            return (
              <div
                key={task.id}
                className={`bg-white rounded-xl shadow-sm border p-5 transition-all ${
                  overdue ? 'border-red-200 bg-red-50/20' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 text-base leading-tight">{task.title}</h3>
                    {task.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                    )}
                  </div>
                  <TaskPriorityBadge priority={task.priority} />
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <TaskStatusBadge status={task.status} />
                  <span className={`text-xs ${overdue ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                    {task.due_date ? (
                      <>
                        Due {formatDate(task.due_date)}
                        {overdue && ' · Overdue!'}
                      </>
                    ) : 'No due date'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {task.status === 'not_started' && (
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={isUpdating}
                      onClick={() => handleStatusUpdate(task.id, 'in_progress')}
                    >
                      {isUpdating ? 'Updating...' : 'Start Task'}
                    </Button>
                  )}
                  {task.status === 'in_progress' && (
                    <Button
                      size="sm"
                      variant="success"
                      disabled={isUpdating}
                      onClick={() => handleStatusUpdate(task.id, 'completed')}
                    >
                      {isUpdating ? 'Updating...' : 'Mark Complete'}
                    </Button>
                  )}
                  {task.status === 'completed' && (
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Completed
                    </span>
                  )}
                  <TaskCommentBox taskId={task.id} onSuccess={fetchTasks} />
                </div>

                {task.comments && task.comments.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-2">{task.comments.length} comment{task.comments.length !== 1 ? 's' : ''}</p>
                    {task.comments.slice(-2).map((c) => (
                      <div key={c.id} className="text-xs text-gray-600 mb-1">
                        <span className="font-medium text-gray-700">{c.user?.name}: </span>
                        {c.comment}
                        {c.photo_proof && (
                          <a href={c.photo_proof} target="_blank" rel="noreferrer" className="ml-1 text-blue-500 underline">
                            [photo]
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MyTasksPage
