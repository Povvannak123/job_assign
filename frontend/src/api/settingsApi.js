import api from './axios'

export const getSettings = () => api.get('/settings')

export const updateSettings = (settings) =>
  api.put('/settings', { settings })

export const updateProfile = (data) => {
  if (data instanceof FormData) {
    return api.post('/settings/profile', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  }
  return api.post('/settings/profile', data)
}

export const updatePassword = (data) => api.put('/settings/password', data)
