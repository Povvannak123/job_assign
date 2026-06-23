import { createContext, useContext, useState, useEffect } from 'react'
import { login as loginApi, logout as logoutApi, getMe } from '../api/authApi'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(false)

  // Refresh user profile on mount so avatar_url and other fields stay current
  useEffect(() => {
    if (token) {
      getMe()
        .then(res => {
          const fresh = res.data.data
          setUser(fresh)
          localStorage.setItem('user', JSON.stringify(fresh))
        })
        .catch(() => {})
    }
  }, [token])

  const login = async (credentials) => {
    setLoading(true)
    try {
      const res = await loginApi(credentials)
      const { token: newToken, user: newUser } = res.data
      setToken(newToken)
      setUser(newUser)
      localStorage.setItem('token', newToken)
      localStorage.setItem('user', JSON.stringify(newUser))
      return newUser
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await logoutApi()
    } catch (_) {}
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const isAdmin = () => user?.role === 'admin'
  const isStaff = () => user?.role === 'staff'

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin, isStaff }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
