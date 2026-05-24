import api from './axios'

export const getTasks = (params) => api.get('/tasks', { params })
export const getTask = (id) => api.get(`/tasks/${id}`)
export const createTask = (data) => api.post('/tasks', data)
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data)
export const deleteTask = (id) => api.delete(`/tasks/${id}`)

export const getMyTasks = (params) => api.get('/my-tasks', { params })
export const updateMyTaskStatus = (id, status) =>
  api.put(`/my-tasks/${id}/status`, { status })
export const addComment = (id, formData) =>
  api.post(`/my-tasks/${id}/comment`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
