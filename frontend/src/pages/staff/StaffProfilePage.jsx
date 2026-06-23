import { useEffect, useState } from 'react'
import { getMe } from '../../api/authApi'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/ui/Spinner'

const BACKEND_URL = (import.meta.env.VITE_API_URL || '').replace(/\/api\/v1\/?$/, '')

const resolveAvatarUrl = (url) => {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${BACKEND_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

const InfoRow = ({ icon, label, value }) => {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-red-500">{icon}</span>
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  )
}

const StaffProfilePage = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMe()
      .then(res => setProfile(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner centered />

  const data = profile ?? user
  const avatarUrl = resolveAvatarUrl(data?.avatar_url)
  const initials  = (data?.name || '')
    .split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* ── Profile card ── */}
      <div className="bg-gradient-to-br from-red-600 to-red-500 rounded-2xl p-6 text-white shadow-sm">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-2xl ring-4 ring-white/30 overflow-hidden bg-white/20 flex items-center justify-center flex-shrink-0 shadow-lg">
            {avatarUrl
              ? <img src={avatarUrl} alt={data?.name} className="w-full h-full object-cover" />
              : <span className="text-3xl font-bold text-white">{initials}</span>
            }
          </div>

          {/* Name & role */}
          <div className="flex-1 min-w-0">
            <p className="text-red-200 text-sm mb-0.5">Staff Profile</p>
            <h1 className="text-2xl font-bold truncate">{data?.name}</h1>
            {data?.position && (
              <span className="inline-flex items-center gap-1.5 mt-2 text-xs bg-white/20 text-white px-3 py-1 rounded-full font-medium">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {data.position}
              </span>
            )}
          </div>
        </div>

        {/* Quick info chips */}
        <div className="flex flex-wrap gap-2 mt-5">
          {data?.shift && (
            <div className="flex items-center gap-1.5 bg-white/15 rounded-xl px-3 py-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-semibold">{data.shift} Shift</span>
            </div>
          )}
          {data?.store_name && (
            <div className="flex items-center gap-1.5 bg-white/15 rounded-xl px-3 py-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xs font-semibold">{data.store_name}</span>
            </div>
          )}
          {data?.day_off && (
            <div className="flex items-center gap-1.5 bg-white/15 rounded-xl px-3 py-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-semibold">Day Off: {data.day_off}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Details card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-sm font-bold text-gray-700 mb-1">Personal Information</h2>
        <p className="text-xs text-gray-400 mb-4">Your profile details as set by admin</p>

        <div className="divide-y divide-gray-100">
          <InfoRow
            label="Full Name"
            value={data?.name}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            }
          />
          <InfoRow
            label="Staff ID"
            value={data?.staff_id}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2"/>
              </svg>
            }
          />
          <InfoRow
            label="Position"
            value={data?.position}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            }
          />
          <InfoRow
            label="Email"
            value={data?.email}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            }
          />
          <InfoRow
            label="Phone Number"
            value={data?.phone_number}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
            }
          />
          <InfoRow
            label="Store / Branch"
            value={data?.store_name}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
            }
          />
          <InfoRow
            label="Shift"
            value={data?.shift ? `${data.shift} Shift` : null}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            }
          />
          <InfoRow
            label="Day Off"
            value={data?.day_off}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            }
          />
          <InfoRow
            label="Location / Row"
            value={data?.location_row}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            }
          />
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 pb-2">
        To update your profile information, please contact your admin.
      </p>
    </div>
  )
}

export default StaffProfilePage
