import api from './axios'

export const getUsers = (params) => api.get('/users', { params })
export const getUser = (id) => api.get(`/users/${id}`)
export const getAllStaff = () => api.get('/users/all-staff')

export const createUser = (data) => {
  if (data instanceof FormData) {
    return api.post('/users', data, { headers: { 'Content-Type': 'multipart/form-data' } })
  }
  return api.post('/users', data)
}

export const updateUser = (id, data) => {
  if (data instanceof FormData) {
    return api.post(`/users/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-HTTP-METHOD-OVERRIDE': 'PUT',
      },
    })
  }
  return api.put(`/users/${id}`, data)
}

export const deleteUser = (id) => api.delete(`/users/${id}`)
