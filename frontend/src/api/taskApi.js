import api from './axios'

export const getTasks = (params) => api.get('/tasks', { params })
export const getTask = (id) => api.get(`/tasks/${id}`)
export const createTask = (data) => {
  // Support multipart/form-data when a photo is included
  if (data instanceof FormData) {
    return api.post('/tasks', data, { headers: { 'Content-Type': 'multipart/form-data' } })
  }
  return api.post('/tasks', data)
}
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data)
export const deleteTask = (id) => api.delete(`/tasks/${id}`)

// ── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications  = ()    => api.get('/notifications')
export const markNotifRead     = (id)  => api.put(`/notifications/${id}/read`)
export const markAllNotifsRead = ()    => api.put('/notifications/mark-all-read')

export const getMyTasks = (params) => api.get('/my-tasks', { params })
export const updateMyTaskStatus = (id, status) =>
  api.put(`/my-tasks/${id}/status`, { status })
export const addComment = (id, formData) =>
  api.post(`/my-tasks/${id}/comment`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

// ── Daily Auto-Assign ─────────────────────────────────────────────────────────
export const assignDailyTasks = (date) => api.post('/tasks/assign-daily', { date })

// ── Task Template API ──────────────────────────────────────────────────────────
export const getTemplateStaff   = ()            => api.get('/task-templates')
export const getStaffTemplate   = (staffId)     => api.get(`/task-templates/${staffId}`)
export const addTemplateItem    = (staffId, data)=> api.post(`/task-templates/${staffId}/items`, data)
export const updateTemplateItem = (id, data)     => api.put(`/task-templates/items/${id}`, data)
export const deleteTemplateItem = (id)           => api.delete(`/task-templates/items/${id}`)
export const reorderTemplateItems= (staffId, data)=> api.post(`/task-templates/${staffId}/reorder`, data)
