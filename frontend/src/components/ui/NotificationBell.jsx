import { useState, useEffect, useRef, useCallback } from 'react'
import { getNotifications, markNotifRead, markAllNotifsRead } from '../../api/taskApi'

// Derive backend storage base URL from VITE_API_URL (e.g. http://localhost:8000/api/v1 → http://localhost:8000)
const BACKEND_URL = (import.meta.env.VITE_API_URL || '').replace(/\/api\/v1\/?$/, '')

const resolvePhotoUrl = (url) => {
  if (!url) return null
  const full = url.startsWith('http://') || url.startsWith('https://')
    ? url
    : `${BACKEND_URL}${url.startsWith('/') ? '' : '/'}${url}`
  // Encode each path segment to handle spaces, parentheses, etc.
  try {
    const parsed = new URL(full)
    parsed.pathname = parsed.pathname
      .split('/')
      .map(seg => encodeURIComponent(decodeURIComponent(seg)))
      .join('/')
    return parsed.toString()
  } catch {
    return full
  }
}

const NotificationBell = () => {
  const [open, setOpen]           = useState(false)
  const [notifications, setNotifs] = useState([])
  const [unread, setUnread]        = useState(0)
  const [loading, setLoading]      = useState(false)
  const panelRef                   = useRef(null)

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await getNotifications()
      setNotifs(res.data.data || [])
      setUnread(res.data.unread || 0)
    } catch {
      // silently ignore
    }
  }, [])

  // Poll every 30 seconds
  useEffect(() => {
    fetchNotifs()
    const id = setInterval(fetchNotifs, 30_000)
    return () => clearInterval(id)
  }, [fetchNotifs])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => {
    setOpen(o => !o)
    if (!open) fetchNotifs()
  }

  const handleMarkRead = async (id) => {
    try {
      await markNotifRead(id)
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      setUnread(u => Math.max(0, u - 1))
    } catch {}
  }

  const handleMarkAll = async () => {
    setLoading(true)
    try {
      await markAllNotifsRead()
      setNotifs(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })))
      setUnread(0)
    } catch {} finally {
      setLoading(false)
    }
  }

  const formatTime = (dt) => {
    if (!dt) return ''
    const d = new Date(dt)
    const diff = Date.now() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1)  return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24)  return `${hrs}h ago`
    return d.toLocaleDateString()
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-600 to-indigo-700">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="text-sm font-bold text-white">Notifications</span>
              {unread > 0 && (
                <span className="px-1.5 py-0.5 bg-white/20 text-white text-[10px] font-bold rounded-full">{unread} new</span>
              )}
            </div>
            {unread > 0 && (
              <button onClick={handleMarkAll} disabled={loading}
                className="text-[11px] text-indigo-200 hover:text-white font-medium transition-colors disabled:opacity-50">
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <svg className="w-10 h-10 text-gray-200 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-xs text-gray-400 font-medium">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => {
                const isUnread = !n.read_at
                const d = n.data || {}
                return (
                  <div key={n.id}
                    onClick={() => isUnread && handleMarkRead(n.id)}
                    className={`px-4 py-3 cursor-pointer transition-colors ${isUnread ? 'bg-indigo-50 hover:bg-indigo-100' : 'hover:bg-gray-50'}`}>
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${isUnread ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                        <svg className={`w-4 h-4 ${isUnread ? 'text-indigo-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${isUnread ? 'text-indigo-900' : 'text-gray-700'} leading-snug`}>
                          {d.message || 'New task assigned'}
                        </p>
                        {d.comment && (
                          <p className="text-[11px] text-gray-500 mt-0.5 italic line-clamp-2">"{d.comment}"</p>
                        )}
                        {d.photo_url && (
                          <img src={resolvePhotoUrl(d.photo_url)} alt="attachment" className="mt-1.5 h-14 w-full object-cover rounded-lg border border-gray-200" />
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-gray-400">{formatTime(n.created_at)}</span>
                          {d.assigned_by && (
                            <span className="text-[10px] text-gray-400">· by {d.assigned_by}</span>
                          )}
                          {d.due_date && (
                            <span className="text-[10px] text-gray-400">· due {d.due_date}</span>
                          )}
                        </div>
                      </div>

                      {isUnread && (
                        <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
