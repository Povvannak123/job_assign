import api from './axios'

export const getDashboard = () => api.get('/dashboard')
export const getReport = (params) => api.get('/reports', { params })
export const getPerformance = (params) => api.get('/performance', { params })
