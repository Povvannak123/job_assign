import { useState, useEffect } from 'react'
import FeaturePage from '../../components/layout/FeaturePage'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import { getUsers } from '../../api/userApi'

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Maps the string stored in DB ("Monday", "Tuesday" …) → 0-based index (0=Mon)
const DAY_NAME_TO_IDX = {
  Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3,
  Friday: 4, Saturday: 5, Sunday: 6,
}

// Maps staff.shift value → display time
const SHIFT_TIMES = {
  Morning: '06:00–14:00',
  Evening: '14:00–22:00',
  Day:     '09:00–17:00',
}

// Cycling palette for staff rows
const STAFF_COLORS = [
  { cell: 'bg-yellow-50 text-yellow-700 border border-yellow-200', dot: 'bg-yellow-400' },
  { cell: 'bg-blue-50   text-blue-700   border border-blue-200',   dot: 'bg-blue-400'   },
  { cell: 'bg-green-50  text-green-700  border border-green-200',  dot: 'bg-green-400'  },
  { cell: 'bg-orange-50 text-orange-700 border border-orange-200', dot: 'bg-orange-400' },
  { cell: 'bg-purple-50 text-purple-700 border border-purple-200', dot: 'bg-purple-400' },
  { cell: 'bg-pink-50   text-pink-700   border border-pink-200',   dot: 'bg-pink-400'   },
  { cell: 'bg-teal-50   text-teal-700   border border-teal-200',   dot: 'bg-teal-400'   },
  { cell: 'bg-indigo-50 text-indigo-700 border border-indigo-200', dot: 'bg-indigo-400' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Monday of the week containing `date` */
const getMonday = (date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return d
}

/** "12–18 May 2026" style label */
const buildWeekLabel = (monday) => {
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const sm = MONTH_NAMES[monday.getMonth()]
  const em = MONTH_NAMES[sunday.getMonth()]
  const sy = monday.getFullYear()
  const ey = sunday.getFullYear()
  if (sm === em && sy === ey) return `${monday.getDate()}–${sunday.getDate()} ${sm} ${sy}`
  if (sy === ey) return `${monday.getDate()} ${sm} – ${sunday.getDate()} ${em} ${sy}`
  return `${monday.getDate()} ${sm} ${sy} – ${sunday.getDate()} ${em} ${ey}`
}

/**
 * Build a working-day pattern from real staff data.
 *   pattern[dayIdx] = "HH:MM–HH:MM"  → show shift badge
 *   pattern[dayIdx] = ""              → working but no time configured
 *   missing key                       → staff's designated day off
 *
 * Supermarket model: staff work all 7 days, with exactly one day off per week.
 */
const buildPattern = (staff) => {
  const shiftTime = SHIFT_TIMES[staff.shift] ?? ''
  const dayOffIdx = staff.day_off != null ? DAY_NAME_TO_IDX[staff.day_off] : null

  const pattern = {}
  for (let i = 0; i <= 6; i++) {
    if (i === dayOffIdx) continue   // skip only the designated day off
    pattern[i] = shiftTime
  }
  return pattern
}

// JS getDay() (0=Sun…6=Sat) → our index (0=Mon…6=Sun)
const jsToDayIdx = (jsDay) => (jsDay === 0 ? 6 : jsDay - 1)

// ─── Day-Off / Weekend badge ───────────────────────────────────────────────────

const OffBadge = () => (
  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border border-dashed bg-slate-50 text-slate-400 border-slate-200">
    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
    Day Off
  </span>
)

// ─── Shift Calendar ────────────────────────────────────────────────────────────

const ShiftCalendarContent = () => {
  const todayMidnight = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })()
  const [weekStart, setWeekStart] = useState(getMonday(todayMidnight))
  const [staffList, setStaffList] = useState([])
  const [loading, setLoading]    = useState(true)

  useEffect(() => {
    getUsers()
      .then((res) => setStaffList(res.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  const isToday       = (d) => d.getTime() === todayMidnight.getTime()
  const isCurrentWeek = weekStart.getTime() === getMonday(todayMidnight).getTime()

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d) }
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d) }
  const goToday  = () => setWeekStart(getMonday(todayMidnight))

  // Build schedule rows from real staff data
  const schedules = staffList.map((s, i) => {
    const palette = STAFF_COLORS[i % STAFF_COLORS.length]
    return {
      staff:     s.name,
      position:  s.position || '—',
      shiftName: s.shift    || null,
      dayOffIdx: s.day_off  != null ? DAY_NAME_TO_IDX[s.day_off] : null,
      dayOffLabel: s.day_off || null,
      pattern:   buildPattern(s),
      cellColor: palette.cell,
      dot:       palette.dot,
    }
  })

  if (loading) return (
    <div className="flex items-center justify-center py-16"><Spinner /></div>
  )

  if (schedules.length === 0) return (
    <div className="p-10 text-center text-gray-400 text-sm">No staff data available</div>
  )

  return (
    <div className="p-5">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h4 className="font-bold text-gray-800 text-base">Week of {buildWeekLabel(weekStart)}</h4>
          <p className="text-xs text-gray-400 mt-0.5">
            {weekDays[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            {' – '}
            {weekDays[6].toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevWeek} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Prev
          </button>
          <button onClick={goToday} className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${isCurrentWeek ? 'text-red-600 border-red-300 bg-red-50' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
            Today
          </button>
          <button onClick={nextWeek} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Next
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-100 min-w-[180px]">
                Staff
              </th>
              {weekDays.map((d, i) => {
                const today = isToday(d)
                return (
                  <th key={i} className={`py-3 px-2 text-center border-b min-w-[110px] ${today ? 'bg-red-500 border-red-500' : 'bg-gray-50 border-gray-100'}`}>
                    <div className={`text-xs font-semibold uppercase tracking-wider ${today ? 'text-red-100' : 'text-gray-400'}`}>{DAY_NAMES[i]}</div>
                    <div className={`text-xl font-bold mt-0.5 leading-tight ${today ? 'text-white' : 'text-gray-700'}`}>{d.getDate()}</div>
                    <div className={`text-xs mt-0.5 ${today ? 'text-red-200' : 'text-gray-400'}`}>{MONTH_NAMES[d.getMonth()]}</div>
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {schedules.map((row, i) => (
              <tr key={i} className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${i % 2 === 1 ? 'bg-gray-50/30' : 'bg-white'}`}>
                {/* Staff name cell */}
                <td className="py-4 px-4 border-r border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs flex-shrink-0">
                      {row.staff.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 text-xs leading-tight truncate">{row.staff}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <p className="text-gray-400 text-xs truncate">{row.position}</p>
                        {row.dayOffLabel && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400 font-medium whitespace-nowrap">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                            Off: {row.dayOffLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Day cells */}
                {weekDays.map((d, j) => {
                  const dayIdx    = jsToDayIdx(d.getDay())
                  const today     = isToday(d)
                  const inPattern = Object.prototype.hasOwnProperty.call(row.pattern, dayIdx)
                  const shiftTime = row.pattern[dayIdx]

                  return (
                    <td key={j} className={`py-3 px-2 text-center align-middle ${today ? 'bg-red-50/40' : ''}`}>
                      {inPattern ? (
                        shiftTime ? (
                          /* Working day with shift time */
                          <span className={`inline-block text-xs px-2 py-1 rounded-lg font-semibold whitespace-nowrap ${row.cellColor}`}>
                            {shiftTime}
                          </span>
                        ) : (
                          /* Working day but no shift time configured */
                          <span className="inline-block text-xs px-2 py-1 rounded-lg font-medium bg-gray-100 text-gray-500 border border-gray-200 whitespace-nowrap">
                            Working
                          </span>
                        )
                      ) : (
                        /* Designated day off */
                        <OffBadge />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>

          {/* Footer: shift count per day */}
          <tfoot>
            <tr className="border-t border-gray-100 bg-gray-50">
              <td className="py-2 px-4 text-xs text-gray-400 font-medium">Shifts/day</td>
              {weekDays.map((d, j) => {
                const dayIdx = jsToDayIdx(d.getDay())
                const count  = schedules.filter((r) => Object.prototype.hasOwnProperty.call(r.pattern, dayIdx)).length
                return (
                  <td key={j} className={`py-2 px-2 text-center ${isToday(d) ? 'bg-red-50/40' : ''}`}>
                    <span className={`text-xs font-bold ${count === 0 ? 'text-gray-300' : count >= 4 ? 'text-green-600' : 'text-amber-600'}`}>{count}</span>
                  </td>
                )
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4">
        {schedules.map((row) => (
          <div key={row.staff} className="flex items-center gap-1.5">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${row.dot}`} />
            <span className="text-xs text-gray-500">{row.staff.split(' ')[0]}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-gray-200">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-xs text-gray-500">Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-dashed border-slate-200 bg-slate-50 text-slate-400 text-xs">
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            Day Off
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Leave Requests ────────────────────────────────────────────────────────────

const LEAVE = [
  { staff: 'David Brown',   type: 'Annual Leave', from: '15 May 2026', to: '17 May 2026', days: 3, status: 'Pending',  note: 'Family trip' },
  { staff: 'Eva Martinez',  type: 'Sick Leave',   from: '13 May 2026', to: '13 May 2026', days: 1, status: 'Approved', note: 'Medical certificate attached' },
  { staff: 'Carol White',   type: 'Annual Leave', from: '20 May 2026', to: '22 May 2026', days: 3, status: 'Approved', note: '' },
  { staff: 'Bob Smith',     type: 'Emergency',    from: '10 May 2026', to: '10 May 2026', days: 1, status: 'Approved', note: 'Family emergency' },
  { staff: 'Alice Johnson', type: 'Annual Leave', from: '25 May 2026', to: '28 May 2026', days: 4, status: 'Pending',  note: '' },
]

const statusBadge = (s) => {
  if (s === 'Approved') return <Badge variant="green">Approved</Badge>
  if (s === 'Rejected') return <Badge variant="red">Rejected</Badge>
  return <Badge variant="yellow">Pending</Badge>
}

const LeaveRequestsContent = () => (
  <div className="p-5">
    <div className="flex items-center justify-between mb-4">
      <h4 className="font-semibold text-gray-700">Leave Requests</h4>
      <button className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">+ New Request</button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {['Staff', 'Type', 'From', 'To', 'Days', 'Note', 'Status', 'Action'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {LEAVE.map((r, i) => (
            <tr key={i} className="hover:bg-gray-50/50">
              <td className="px-4 py-3 font-medium text-gray-800">{r.staff}</td>
              <td className="px-4 py-3 text-gray-600 text-xs">{r.type}</td>
              <td className="px-4 py-3 text-gray-500 text-xs">{r.from}</td>
              <td className="px-4 py-3 text-gray-500 text-xs">{r.to}</td>
              <td className="px-4 py-3 text-center font-semibold text-gray-700">{r.days}</td>
              <td className="px-4 py-3 text-gray-400 text-xs italic">{r.note || '—'}</td>
              <td className="px-4 py-3">{statusBadge(r.status)}</td>
              <td className="px-4 py-3">
                {r.status === 'Pending' ? (
                  <div className="flex items-center gap-1">
                    <button className="text-xs px-2 py-1 bg-green-50 text-green-600 hover:bg-green-100 rounded-md font-medium">Approve</button>
                    <button className="text-xs px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-md font-medium">Reject</button>
                  </div>
                ) : (
                  <span className="text-gray-300 text-xs">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

// ─── Roster View ───────────────────────────────────────────────────────────────

const RosterViewContent = () => {
  const [staffList, setStaffList] = useState([])
  const [loading, setLoading]    = useState(true)

  useEffect(() => {
    getUsers()
      .then((res) => setStaffList(res.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center py-16"><Spinner /></div>

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-700">Staff Roster</h4>
        <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">{staffList.length} staff</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Staff Member', 'Position', 'Store', 'Shift', 'Day Off', 'Status'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {staffList.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{s.position || <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{s.store_name || <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-3">
                  {s.shift ? (
                    <Badge variant={s.shift === 'Morning' ? 'yellow' : 'blue'}>{s.shift}</Badge>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {s.day_off ? (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                      <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      {s.day_off}
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={s.is_active ? 'green' : 'red'}>{s.is_active ? 'Active' : 'Absent'}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

const SchedulesPage = () => (
  <FeaturePage
    title="Schedules"
    section="Operations"
    description="Weekly shift planner for each department. Staff can view their upcoming shifts."
    badge="New"
    icon={
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    }
    tabs={[
      { label: 'Shift Calendar', content: <ShiftCalendarContent /> },
      { label: 'Leave Requests', content: <LeaveRequestsContent /> },
      { label: 'Roster View',    content: <RosterViewContent /> },
    ]}
  />
)

export default SchedulesPage
