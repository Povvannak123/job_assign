import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { getSettings, updateSettings, updateProfile, updatePassword } from '../../api/settingsApi'

// ── Icons ─────────────────────────────────────────────────────────────────────

const Icon = ({ path, className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
  </svg>
)

const ICONS = {
  user:   'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  store:  'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  clock:  'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  shield: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  task:   'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  box:    'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  cog:    'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
  bell:   'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  lock:   'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  info:   'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  export: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
  log:    'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  check:  'M5 13l4 4L19 7',
  camera: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z',
  eye:    'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  eyeOff: 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21',
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

const FormField = ({ label, required, hint, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
)

const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 transition-colors bg-white placeholder-gray-400'
const selectCls = `${inputCls} appearance-none cursor-pointer`

const SectionCard = ({ title, subtitle, icon, children, action }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600 flex-shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
    <div className="p-6">{children}</div>
  </div>
)

const Toggle = ({ checked, onChange, label, description }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
    <div>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 ${checked ? 'bg-red-500' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
)

const SaveButton = ({ loading, onClick, label = 'Save Changes' }) => (
  <button
    type="button"
    disabled={loading}
    onClick={onClick}
    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
  >
    {loading ? (
      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    ) : (
      <Icon path={ICONS.check} className="w-4 h-4" />
    )}
    {loading ? 'Saving…' : label}
  </button>
)

// ── Tab definitions ───────────────────────────────────────────────────────────

const TABS = [
  { id: 'account',  label: 'Account & Profile',    icon: ICONS.user },
  { id: 'store',    label: 'Store Configuration',  icon: ICONS.store },
  { id: 'roles',    label: 'Roles & Permissions',  icon: ICONS.shield },
  { id: 'tasks',    label: 'Task & SOP Settings',  icon: ICONS.task },
  { id: 'inventory',label: 'Inventory Settings',   icon: ICONS.box },
  { id: 'system',   label: 'System',               icon: ICONS.cog },
]

// ── Role definitions (static reference) ──────────────────────────────────────

const ROLES_DEF = [
  {
    name: 'Admin (Store Head)',
    color: 'bg-red-100 text-red-700',
    badge: 'bg-red-500',
    permissions: ['Assign & manage all tasks', 'Create/edit/deactivate staff', 'View all reports & audit logs', 'Configure system settings', 'Manage SOP templates'],
  },
  {
    name: 'Supervisor',
    color: 'bg-orange-100 text-orange-700',
    badge: 'bg-orange-500',
    permissions: ['Assign tasks within department', 'View department reports', 'Approve task completion', 'Manage department schedules'],
  },
  {
    name: 'Stock Officer',
    color: 'bg-blue-100 text-blue-700',
    badge: 'bg-blue-500',
    permissions: ['View & complete assigned tasks', 'Update task status & add comments', 'Log inventory checks', 'Upload proof photos'],
  },
  {
    name: 'Receiver',
    color: 'bg-green-100 text-green-700',
    badge: 'bg-green-500',
    permissions: ['Receive goods & update records', 'View assigned receiving tasks', 'Report discrepancies'],
  },
  {
    name: 'Cashier',
    color: 'bg-purple-100 text-purple-700',
    badge: 'bg-purple-500',
    permissions: ['View assigned cashier tasks', 'Update task status', 'Report incidents'],
  },
  {
    name: 'Trainee',
    color: 'bg-gray-100 text-gray-700',
    badge: 'bg-gray-400',
    permissions: ['View assigned tasks only', 'Update task status'],
  },
]

// ── Password strength helper ──────────────────────────────────────────────────

const pwStrength = (pw) => {
  if (!pw) return null
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  if (s <= 1) return { label: 'Weak',   bar: 'bg-red-500',   text: 'text-red-500',   w: 'w-1/4' }
  if (s <= 2) return { label: 'Medium', bar: 'bg-yellow-400', text: 'text-yellow-500', w: 'w-2/4' }
  return             { label: 'Strong', bar: 'bg-green-500',  text: 'text-green-600',  w: 'w-full' }
}

// ── Main component ────────────────────────────────────────────────────────────

const SettingsPage = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('account')
  const [settings, setSettings] = useState({})
  const [loadingSettings, setLoadingSettings] = useState(true)

  // Account tab state
  const [profile, setProfile] = useState({ name: '', email: '', phone_number: '', position: '' })
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const avatarRef = useRef()

  const [password, setPassword] = useState({ current_password: '', new_password: '', new_password_confirmation: '' })
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false })
  const [savingPw, setSavingPw] = useState(false)

  // Store tab state
  const [store, setStore] = useState({
    'store.name': '', 'store.branch': '', 'store.address': '',
    'store.operating_hours_open': '07:00', 'store.operating_hours_close': '22:00',
  })
  const [shifts, setShifts] = useState({
    'shift.morning_start': '06:00', 'shift.morning_end': '14:00',
    'shift.afternoon_start': '14:00', 'shift.afternoon_end': '22:00',
    'shift.night_start': '22:00', 'shift.night_end': '06:00',
  })
  const [savingStore, setSavingStore] = useState(false)

  // Notifications tab state (inside Account tab)
  const [notif, setNotif] = useState({
    'notifications.task_assigned': true,
    'notifications.task_overdue': true,
    'notifications.daily_summary': false,
  })
  const [savingNotif, setSavingNotif] = useState(false)

  // Tasks tab state
  const [taskConf, setTaskConf] = useState({
    'tasks.auto_assign_enabled': true,
    'tasks.default_priority': 'medium',
    'tasks.sod_time': '08:00',
    'tasks.eod_time': '20:00',
  })
  const [savingTasks, setSavingTasks] = useState(false)

  // Inventory tab state
  const [inv, setInv] = useState({
    'inventory.expiry_alert_days': '3',
    'inventory.stocktake_frequency': 'weekly',
    'inventory.fefo_enabled': true,
    'inventory.min_stock_alert': true,
  })
  const [savingInv, setSavingInv] = useState(false)

  // System tab state
  const [sysConf, setSysConf] = useState({ 'system.support_email': '', 'system.app_version': '1.0.0' })

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        position: user.position || '',
      })
      setAvatarPreview(user.avatar_url || null)
    }
  }, [user])

  useEffect(() => {
    setLoadingSettings(true)
    getSettings()
      .then(res => {
        const data = res.data.data || {}
        setSettings(data)

        const s = data.store || {}
        setStore({
          'store.name':                  s['store.name']                 ?? 'Lucky Superstore',
          'store.branch':                s['store.branch']               ?? '',
          'store.address':               s['store.address']              ?? '',
          'store.operating_hours_open':  s['store.operating_hours_open'] ?? '07:00',
          'store.operating_hours_close': s['store.operating_hours_close']?? '22:00',
        })

        const sh = data.shift || {}
        setShifts({
          'shift.morning_start':   sh['shift.morning_start']   ?? '06:00',
          'shift.morning_end':     sh['shift.morning_end']     ?? '14:00',
          'shift.afternoon_start': sh['shift.afternoon_start'] ?? '14:00',
          'shift.afternoon_end':   sh['shift.afternoon_end']   ?? '22:00',
          'shift.night_start':     sh['shift.night_start']     ?? '22:00',
          'shift.night_end':       sh['shift.night_end']       ?? '06:00',
        })

        const n = data.notifications || {}
        setNotif({
          'notifications.task_assigned':  n['notifications.task_assigned']  !== '0',
          'notifications.task_overdue':   n['notifications.task_overdue']   !== '0',
          'notifications.daily_summary':  n['notifications.daily_summary']  === '1',
        })

        const t = data.tasks || {}
        setTaskConf({
          'tasks.auto_assign_enabled': t['tasks.auto_assign_enabled'] !== '0',
          'tasks.default_priority':    t['tasks.default_priority']    ?? 'medium',
          'tasks.sod_time':            t['tasks.sod_time']            ?? '08:00',
          'tasks.eod_time':            t['tasks.eod_time']            ?? '20:00',
        })

        const i = data.inventory || {}
        setInv({
          'inventory.expiry_alert_days':   i['inventory.expiry_alert_days']   ?? '3',
          'inventory.stocktake_frequency': i['inventory.stocktake_frequency'] ?? 'weekly',
          'inventory.fefo_enabled':        i['inventory.fefo_enabled']        !== '0',
          'inventory.min_stock_alert':     i['inventory.min_stock_alert']     !== '0',
        })

        const sys = data.system || {}
        setSysConf({
          'system.app_version':   sys['system.app_version']   ?? '1.0.0',
          'system.support_email': sys['system.support_email'] ?? '',
        })
      })
      .catch(() => toast.error('Could not load settings.'))
      .finally(() => setLoadingSettings(false))
  }, [])

  // ── Helpers ───────────────────────────────────────────────────────────────

  const bulkSave = async (entries, group, setSaving) => {
    setSaving(true)
    try {
      const payload = Object.entries(entries).map(([key, value]) => ({
        key,
        value: typeof value === 'boolean' ? (value ? '1' : '0') : String(value ?? ''),
        group,
      }))
      await updateSettings(payload)
      toast.success('Settings saved.')
    } catch {
      toast.error('Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setRemoveAvatar(false)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    setRemoveAvatar(true)
    if (avatarRef.current) avatarRef.current.value = ''
  }

  const handleSaveProfile = async () => {
    if (!profile.name.trim()) return toast.error('Name is required.')
    setSavingProfile(true)
    try {
      const fd = new FormData()
      fd.append('name', profile.name)
      fd.append('email', profile.email)
      fd.append('phone_number', profile.phone_number)
      fd.append('position', profile.position)
      if (avatarFile) fd.append('avatar', avatarFile)
      if (removeAvatar) fd.append('remove_avatar', '1')
      const res = await updateProfile(fd)
      const updated = res.data.data
      // Update auth context
      const stored = JSON.parse(localStorage.getItem('user') || '{}')
      const merged = { ...stored, ...updated, avatar_url: updated.avatar_url }
      localStorage.setItem('user', JSON.stringify(merged))
      setAvatarPreview(updated.avatar_url || null)
      setAvatarFile(null)
      toast.success('Profile updated.')
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile.'
      toast.error(msg)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSavePassword = async () => {
    if (!password.current_password || !password.new_password) return toast.error('All password fields are required.')
    if (password.new_password !== password.new_password_confirmation) return toast.error('Passwords do not match.')
    setSavingPw(true)
    try {
      await updatePassword(password)
      setPassword({ current_password: '', new_password: '', new_password_confirmation: '' })
      toast.success('Password changed successfully.')
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password.'
      toast.error(msg)
    } finally {
      setSavingPw(false)
    }
  }

  const strength = pwStrength(password.new_password)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage system preferences, store configuration, and account settings.</p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 flex-wrap mb-6 bg-gray-100 rounded-xl p-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
            }`}
          >
            <Icon path={tab.icon} className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {loadingSettings && activeTab !== 'account' && (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <svg className="w-6 h-6 animate-spin mr-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading settings…
        </div>
      )}

      {/* ── Tab: Account & Profile ─────────────────────────────────────────── */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          {/* Profile */}
          <SectionCard
            title="Admin Profile"
            subtitle="Update your display name, contact info, and photo."
            icon={<Icon path={ICONS.user} className="w-4 h-4" />}
          >
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3 sm:w-32 flex-shrink-0">
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 border-2 border-gray-200">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Icon path={ICONS.user} className="w-10 h-10" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => avatarRef.current?.click()}
                    className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                  >
                    <Icon path={ICONS.camera} className="w-6 h-6" />
                  </button>
                </div>
                <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                <button
                  type="button"
                  onClick={() => avatarRef.current?.click()}
                  className="text-xs text-red-600 hover:underline font-medium"
                >
                  Change photo
                </button>
                {avatarPreview && (
                  <button type="button" onClick={handleRemoveAvatar} className="text-xs text-gray-400 hover:text-gray-600 hover:underline">
                    Remove
                  </button>
                )}
              </div>

              {/* Fields */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Full Name" required>
                  <input className={inputCls} value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Ahmad Farid" />
                </FormField>
                <FormField label="Email Address" required>
                  <input className={inputCls} type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} placeholder="admin@store.com" />
                </FormField>
                <FormField label="Phone Number">
                  <input className={inputCls} value={profile.phone_number} onChange={e => setProfile(p => ({ ...p, phone_number: e.target.value }))} placeholder="+60 12 345 6789" />
                </FormField>
                <FormField label="Position / Title">
                  <input className={inputCls} value={profile.position} onChange={e => setProfile(p => ({ ...p, position: e.target.value }))} placeholder="e.g. Store Manager" />
                </FormField>
              </div>
            </div>
            <div className="flex justify-end mt-5 pt-4 border-t border-gray-100">
              <SaveButton loading={savingProfile} onClick={handleSaveProfile} />
            </div>
          </SectionCard>

          {/* Change Password */}
          <SectionCard
            title="Change Password"
            subtitle="Choose a strong password with at least 6 characters."
            icon={<Icon path={ICONS.lock} className="w-4 h-4" />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Current Password" required>
                <div className="relative">
                  <input
                    className={inputCls + ' pr-10'}
                    type={showPw.current ? 'text' : 'password'}
                    value={password.current_password}
                    onChange={e => setPassword(p => ({ ...p, current_password: e.target.value }))}
                    placeholder="Enter current password"
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPw(p => ({ ...p, current: !p.current }))}>
                    <Icon path={showPw.current ? ICONS.eyeOff : ICONS.eye} className="w-4 h-4" />
                  </button>
                </div>
              </FormField>
              <div />
              <FormField label="New Password" required hint="Min. 6 characters. Mix letters, numbers & symbols.">
                <div className="relative">
                  <input
                    className={inputCls + ' pr-10'}
                    type={showPw.new ? 'text' : 'password'}
                    value={password.new_password}
                    onChange={e => setPassword(p => ({ ...p, new_password: e.target.value }))}
                    placeholder="New password"
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPw(p => ({ ...p, new: !p.new }))}>
                    <Icon path={showPw.new ? ICONS.eyeOff : ICONS.eye} className="w-4 h-4" />
                  </button>
                </div>
                {strength && (
                  <div className="mt-2">
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${strength.bar} ${strength.w}`} />
                    </div>
                    <p className={`text-xs mt-1 font-medium ${strength.text}`}>{strength.label}</p>
                  </div>
                )}
              </FormField>
              <FormField label="Confirm New Password" required>
                <div className="relative">
                  <input
                    className={inputCls + ' pr-10'}
                    type={showPw.confirm ? 'text' : 'password'}
                    value={password.new_password_confirmation}
                    onChange={e => setPassword(p => ({ ...p, new_password_confirmation: e.target.value }))}
                    placeholder="Confirm new password"
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))}>
                    <Icon path={showPw.confirm ? ICONS.eyeOff : ICONS.eye} className="w-4 h-4" />
                  </button>
                </div>
              </FormField>
            </div>
            <div className="flex justify-end mt-5 pt-4 border-t border-gray-100">
              <SaveButton loading={savingPw} onClick={handleSavePassword} label="Change Password" />
            </div>
          </SectionCard>

          {/* Notification Preferences */}
          <SectionCard
            title="Notification Preferences"
            subtitle="Control which alerts you receive in the app."
            icon={<Icon path={ICONS.bell} className="w-4 h-4" />}
          >
            <Toggle
              checked={notif['notifications.task_assigned']}
              onChange={v => setNotif(n => ({ ...n, 'notifications.task_assigned': v }))}
              label="Task Assigned"
              description="Notify when a new task is assigned to staff."
            />
            <Toggle
              checked={notif['notifications.task_overdue']}
              onChange={v => setNotif(n => ({ ...n, 'notifications.task_overdue': v }))}
              label="Overdue Task Alerts"
              description="Alert when a task passes its due date without completion."
            />
            <Toggle
              checked={notif['notifications.daily_summary']}
              onChange={v => setNotif(n => ({ ...n, 'notifications.daily_summary': v }))}
              label="Daily Summary"
              description="Receive a daily summary of task completions and pending items."
            />
            <div className="flex justify-end mt-5 pt-4 border-t border-gray-100">
              <SaveButton loading={savingNotif} onClick={() => bulkSave(notif, 'notifications', setSavingNotif)} />
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── Tab: Store Configuration ──────────────────────────────────────── */}
      {activeTab === 'store' && !loadingSettings && (
        <div className="space-y-6">
          <SectionCard
            title="Store Information"
            subtitle="Basic details about your store branch."
            icon={<Icon path={ICONS.store} className="w-4 h-4" />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Store Name" required>
                <input className={inputCls} value={store['store.name']} onChange={e => setStore(s => ({ ...s, 'store.name': e.target.value }))} placeholder="e.g. Lucky Superstore" />
              </FormField>
              <FormField label="Branch Name">
                <input className={inputCls} value={store['store.branch']} onChange={e => setStore(s => ({ ...s, 'store.branch': e.target.value }))} placeholder="e.g. Main Branch, Branch 2" />
              </FormField>
              <div className="sm:col-span-2">
                <FormField label="Address">
                  <textarea className={inputCls + ' resize-none'} rows={2} value={store['store.address']} onChange={e => setStore(s => ({ ...s, 'store.address': e.target.value }))} placeholder="Full store address" />
                </FormField>
              </div>
              <FormField label="Operating Hours — Open" hint="24-hour format (HH:MM)">
                <input className={inputCls} type="time" value={store['store.operating_hours_open']} onChange={e => setStore(s => ({ ...s, 'store.operating_hours_open': e.target.value }))} />
              </FormField>
              <FormField label="Operating Hours — Close" hint="24-hour format (HH:MM)">
                <input className={inputCls} type="time" value={store['store.operating_hours_close']} onChange={e => setStore(s => ({ ...s, 'store.operating_hours_close': e.target.value }))} />
              </FormField>
            </div>
            <div className="flex justify-end mt-5 pt-4 border-t border-gray-100">
              <SaveButton loading={savingStore} onClick={() => bulkSave({ ...store, ...shifts }, 'store', setSavingStore)} />
            </div>
          </SectionCard>

          <SectionCard
            title="Shift Schedules"
            subtitle="Define SOD/EOD times for each shift pattern."
            icon={<Icon path={ICONS.clock} className="w-4 h-4" />}
          >
            <div className="space-y-4">
              {[
                { label: 'Morning / Afternoon Shift', startKey: 'shift.morning_start', endKey: 'shift.morning_end', color: 'bg-yellow-400' },
                { label: 'Afternoon / Night Shift',   startKey: 'shift.afternoon_start', endKey: 'shift.afternoon_end', color: 'bg-orange-400' },
                { label: 'Night / Closing Shift',     startKey: 'shift.night_start', endKey: 'shift.night_end', color: 'bg-indigo-500' },
              ].map(sh => (
                <div key={sh.label} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className={`w-2.5 h-10 rounded-full ${sh.color} flex-shrink-0`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 mb-2">{sh.label}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Start (SOD)</label>
                        <input className={inputCls} type="time" value={shifts[sh.startKey]} onChange={e => setShifts(s => ({ ...s, [sh.startKey]: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">End (EOD)</label>
                        <input className={inputCls} type="time" value={shifts[sh.endKey]} onChange={e => setShifts(s => ({ ...s, [sh.endKey]: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-5 pt-4 border-t border-gray-100">
              <SaveButton loading={savingStore} onClick={() => bulkSave(shifts, 'shift', setSavingStore)} />
            </div>
          </SectionCard>

          <SectionCard
            title="Departments / Sections"
            subtitle="Manage store sections and their assigned positions."
            icon={<Icon path={ICONS.store} className="w-4 h-4" />}
            action={
              <Link to="/admin/departments" className="text-xs text-red-600 hover:underline font-medium flex items-center gap-1">
                Manage Departments
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            }
          >
            <div className="flex flex-wrap gap-2">
              {['Dry Goods', 'Fresh', 'Produce', 'Bakery', 'Cashier', 'Warehouse', 'Security', 'Cleaning', 'Customer Service', 'Pharmacy', 'Electronics', 'Administration'].map(dept => (
                <span key={dept} className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">
                  {dept}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-400">Configure department details from the Departments module.</p>
          </SectionCard>
        </div>
      )}

      {/* ── Tab: Roles & Permissions ──────────────────────────────────────── */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
            <Icon path={ICONS.info} className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Role-based access control</p>
              <p className="text-xs text-blue-600 mt-0.5">Roles are assigned when creating staff accounts. Each role defines what actions a user can perform in the system.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ROLES_DEF.map(role => (
              <div key={role.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-3 h-3 rounded-full ${role.badge}`} />
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${role.color}`}>
                    {role.name}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {role.permissions.map(p => (
                    <li key={p} className="flex items-start gap-2 text-xs text-gray-600">
                      <Icon path={ICONS.check} className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 text-center">
            <Icon path={ICONS.shield} className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-500">Advanced permissions editor</p>
            <p className="text-xs text-gray-400 mt-1">Granular per-role permission configuration is coming in a future release.</p>
          </div>
        </div>
      )}

      {/* ── Tab: Task & SOP Settings ──────────────────────────────────────── */}
      {activeTab === 'tasks' && !loadingSettings && (
        <div className="space-y-6">
          <SectionCard
            title="Auto-Assignment & Defaults"
            subtitle="Configure how tasks are automatically assigned and prioritized."
            icon={<Icon path={ICONS.task} className="w-4 h-4" />}
          >
            <div className="space-y-0 mb-4">
              <Toggle
                checked={taskConf['tasks.auto_assign_enabled']}
                onChange={v => setTaskConf(t => ({ ...t, 'tasks.auto_assign_enabled': v }))}
                label="Auto-assign daily tasks"
                description="Automatically assign SOD/EOD tasks to staff based on their template at shift start."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <FormField label="Default Priority" hint="Applied to new tasks when no priority is selected.">
                <select className={selectCls} value={taskConf['tasks.default_priority']} onChange={e => setTaskConf(t => ({ ...t, 'tasks.default_priority': e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </FormField>
              <div />
              <FormField label="SOD (Start of Day) Time" hint="When daily opening tasks are triggered.">
                <input className={inputCls} type="time" value={taskConf['tasks.sod_time']} onChange={e => setTaskConf(t => ({ ...t, 'tasks.sod_time': e.target.value }))} />
              </FormField>
              <FormField label="EOD (End of Day) Time" hint="When daily closing tasks are triggered.">
                <input className={inputCls} type="time" value={taskConf['tasks.eod_time']} onChange={e => setTaskConf(t => ({ ...t, 'tasks.eod_time': e.target.value }))} />
              </FormField>
            </div>
            <div className="flex justify-end mt-5 pt-4 border-t border-gray-100">
              <SaveButton loading={savingTasks} onClick={() => bulkSave(taskConf, 'tasks', setSavingTasks)} />
            </div>
          </SectionCard>

          <SectionCard
            title="Task Categories"
            subtitle="Categories used to classify tasks across all modules."
            icon={<Icon path={ICONS.task} className="w-4 h-4" />}
          >
            <div className="flex flex-wrap gap-2">
              {['SOD / Opening', 'EOD / Closing', 'Restocking', 'Cleaning', 'Receiving', 'FEFO Rotation', 'Stocktake', 'Maintenance', 'Customer Service', 'Cashier', 'Security', 'Admin'].map(cat => (
                <span key={cat} className="px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium border border-red-100">
                  {cat}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-400">Task category management will be configurable in a future update.</p>
          </SectionCard>

          <SectionCard
            title="SOP Templates"
            subtitle="Manage recurring daily/weekly/monthly task templates per staff member."
            icon={<Icon path={ICONS.task} className="w-4 h-4" />}
            action={
              <Link to="/admin/staff" className="text-xs text-red-600 hover:underline font-medium flex items-center gap-1">
                Manage via Staff
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            }
          >
            <p className="text-sm text-gray-500">SOP templates are configured per-staff member. Open a staff record and click <strong>Task Templates</strong> to edit their recurring tasks.</p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {['Daily', 'Weekly', 'Monthly'].map(freq => (
                <div key={freq} className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
                  <p className="text-xs font-semibold text-gray-600">{freq}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Recurring</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── Tab: Inventory Settings ───────────────────────────────────────── */}
      {activeTab === 'inventory' && !loadingSettings && (
        <div className="space-y-6">
          <SectionCard
            title="Expiry & FEFO Settings"
            subtitle="Configure thresholds for expiry alerts and stock rotation rules."
            icon={<Icon path={ICONS.box} className="w-4 h-4" />}
          >
            <div className="space-y-0 mb-4">
              <Toggle
                checked={inv['inventory.fefo_enabled']}
                onChange={v => setInv(i => ({ ...i, 'inventory.fefo_enabled': v }))}
                label="FEFO (First Expired, First Out) enforcement"
                description="Enable FEFO stock rotation tasks and alerts across all departments."
              />
              <Toggle
                checked={inv['inventory.min_stock_alert']}
                onChange={v => setInv(i => ({ ...i, 'inventory.min_stock_alert': v }))}
                label="Minimum stock alerts"
                description="Trigger a task/alert when stock falls below defined minimum thresholds."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <FormField label="Expiry Alert Threshold (days)" hint="Flag items expiring within this many days.">
                <input
                  className={inputCls}
                  type="number"
                  min="1"
                  max="90"
                  value={inv['inventory.expiry_alert_days']}
                  onChange={e => setInv(i => ({ ...i, 'inventory.expiry_alert_days': e.target.value }))}
                />
              </FormField>
              <FormField label="Stocktake Frequency" hint="How often full stock counts should be performed.">
                <select className={selectCls} value={inv['inventory.stocktake_frequency']} onChange={e => setInv(i => ({ ...i, 'inventory.stocktake_frequency': e.target.value }))}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </FormField>
            </div>
            <div className="flex justify-end mt-5 pt-4 border-t border-gray-100">
              <SaveButton loading={savingInv} onClick={() => bulkSave(inv, 'inventory', setSavingInv)} />
            </div>
          </SectionCard>

          <SectionCard
            title="Inventory Module"
            subtitle="Full inventory management with FEFO tracking and stock levels."
            icon={<Icon path={ICONS.box} className="w-4 h-4" />}
            action={
              <Link to="/admin/inventory" className="text-xs text-red-600 hover:underline font-medium flex items-center gap-1">
                Open Inventory
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            }
          >
            <p className="text-sm text-gray-500">Product-level MinMax thresholds and FEFO tracking are configured within the Inventory module.</p>
          </SectionCard>
        </div>
      )}

      {/* ── Tab: System ───────────────────────────────────────────────────── */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          {/* App info */}
          <SectionCard
            title="Application Info"
            subtitle="Version details and support contact."
            icon={<Icon path={ICONS.info} className="w-4 h-4" />}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-600">Application</span>
                <span className="text-sm font-semibold text-gray-800">Job Assignment Management System</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-600">Version</span>
                <span className="text-sm font-mono font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                  v{sysConf['system.app_version']}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-600">Backend</span>
                <span className="text-sm text-gray-500">Laravel 11 + Sanctum</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-600">Frontend</span>
                <span className="text-sm text-gray-500">React 18 + Tailwind CSS</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Support Email</span>
                <span className="text-sm text-gray-800">{sysConf['system.support_email'] || '—'}</span>
              </div>
            </div>
          </SectionCard>

          {/* Quick links */}
          <SectionCard
            title="System Tools"
            subtitle="Audit trails, data export, and diagnostics."
            icon={<Icon path={ICONS.cog} className="w-4 h-4" />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                to="/admin/audit-log"
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-red-200 hover:bg-red-50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-red-100 flex items-center justify-center text-gray-500 group-hover:text-red-600 transition-colors flex-shrink-0">
                  <Icon path={ICONS.log} className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-red-700">Audit Log</p>
                  <p className="text-xs text-gray-400 mt-0.5">Full timeline of task & system changes</p>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => toast('Data export coming soon.', { icon: '📦' })}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-red-200 hover:bg-red-50 transition-colors group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-red-100 flex items-center justify-center text-gray-500 group-hover:text-red-600 transition-colors flex-shrink-0">
                  <Icon path={ICONS.export} className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-red-700">Export Data</p>
                  <p className="text-xs text-gray-400 mt-0.5">Download task & staff records as CSV</p>
                </div>
              </button>

              <Link
                to="/admin/reports"
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-red-200 hover:bg-red-50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-red-100 flex items-center justify-center text-gray-500 group-hover:text-red-600 transition-colors flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-red-700">Reports</p>
                  <p className="text-xs text-gray-400 mt-0.5">Performance, completion & activity reports</p>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => toast('Diagnostics coming soon.', { icon: '🔧' })}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-red-200 hover:bg-red-50 transition-colors group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-red-100 flex items-center justify-center text-gray-500 group-hover:text-red-600 transition-colors flex-shrink-0">
                  <Icon path={ICONS.cog} className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-red-700">System Diagnostics</p>
                  <p className="text-xs text-gray-400 mt-0.5">Database health, queue status &amp; logs</p>
                </div>
              </button>
            </div>
          </SectionCard>

          <div className="text-center py-4">
            <p className="text-xs text-gray-400">Job Assignment Management System &mdash; &copy; {new Date().getFullYear()} Lucky Superstore. All rights reserved.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsPage
