import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import { getPerformance } from '../../api/dashboardApi'

// ── Helpers ────────────────────────────────────────────────────────────────────

const getRateColor  = (r) => r >= 80 ? 'bg-green-500'  : r >= 60 ? 'bg-amber-400'  : 'bg-red-500'
const getRateText   = (r) => r >= 80 ? 'text-green-600' : r >= 60 ? 'text-amber-600' : 'text-red-600'
const getRateLabel  = (r) => r >= 80 ? 'Good'  : r >= 60 ? 'Fair' : 'Low'
const getRateVariant= (r) => r >= 80 ? 'green' : r >= 60 ? 'yellow' : 'red'

const toStars = (rate) => {
  if (rate >= 90) return 5
  if (rate >= 75) return 4
  if (rate >= 60) return 3
  if (rate >= 40) return 2
  return 1
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MEDALS = ['🥇','🥈','🥉']

// ── Shared sub-components ──────────────────────────────────────────────────────

const Stars = ({ count }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map((s) => (
      <svg key={s} className={`w-3.5 h-3.5 ${s <= count ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
)

const Trend = ({ value }) => {
  if (value === null || value === undefined) return <span className="text-xs text-gray-400">—</span>
  const up = value >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${up ? 'text-green-600' : 'text-red-500'}`}>
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d={up ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
      </svg>
      {up ? '+' : ''}{value}%
    </span>
  )
}

const Spinner = () => (
  <div className="flex items-center justify-center py-20 text-gray-400">
    <svg className="w-7 h-7 animate-spin mr-3" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    Loading performance data…
  </div>
)

const EmptyState = ({ period }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    </div>
    <p className="text-sm font-semibold text-gray-500">No task data for {period}</p>
    <p className="text-xs text-gray-400 mt-1">Assign tasks to staff to see performance metrics here.</p>
  </div>
)

// ── Month selector ─────────────────────────────────────────────────────────────

const MonthPicker = ({ year, month, onChange }) => {
  const now = new Date()
  const years = []
  for (let y = now.getFullYear(); y >= now.getFullYear() - 2; y--) years.push(y)

  return (
    <div className="flex items-center gap-2">
      <select
        value={month}
        onChange={e => onChange(year, Number(e.target.value))}
        className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
      >
        {MONTHS.map((m, i) => (
          <option key={i} value={i + 1}>{m}</option>
        ))}
      </select>
      <select
        value={year}
        onChange={e => onChange(Number(e.target.value), month)}
        className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
      >
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  )
}

// ── Tab: Scorecards ────────────────────────────────────────────────────────────

const ScorecardsTab = ({ data, period, loading }) => {
  if (loading) return <Spinner />
  const hasData = data.some(s => s.total > 0)
  if (!hasData) return <EmptyState period={period} />

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h4 className="font-semibold text-gray-700">Staff Scorecards — {period}</h4>
        <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
          {data.filter(s => s.total > 0).length} active staff
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Staff', 'Position', 'Tasks', 'Completed', 'Late', 'Overdue', 'Completion Rate', 'Rating', 'Trend'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((r) => {
              const stars = toStars(r.rate)
              return (
                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={r.name} src={r.avatar_url} size="sm" />
                      <span className="font-medium text-gray-800 whitespace-nowrap">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{r.position || '—'}</td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-700">{r.total}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-xs font-bold ${r.completed > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {r.completed}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-xs font-bold ${r.late > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-400'}`}>
                      {r.late}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-xs font-bold ${r.overdue > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-400'}`}>
                      {r.overdue}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.total > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${getRateColor(r.rate)}`} style={{ width: `${r.rate}%` }} />
                        </div>
                        <span className={`text-xs font-bold ${getRateText(r.rate)}`}>{r.rate}%</span>
                        <Badge variant={getRateVariant(r.rate)}>{getRateLabel(r.rate)}</Badge>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No tasks</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.total > 0 ? <Stars count={stars} /> : <span className="text-xs text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Trend value={r.trend} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Tab: Monthly Trends ────────────────────────────────────────────────────────

const MonthlyTrendsTab = ({ trends, staffList, loading }) => {
  if (loading) return <Spinner />
  if (!trends.length || !staffList.length) return (
    <div className="p-5">
      <EmptyState period="the last 6 months" />
    </div>
  )

  // Only show staff who have at least one month with data
  const activeStaff = staffList.filter(s =>
    trends.some(m => m.staff[s.id]?.total > 0)
  )

  if (!activeStaff.length) return (
    <div className="p-5">
      <EmptyState period="the last 6 months" />
    </div>
  )

  return (
    <div className="p-5">
      <h4 className="font-semibold text-gray-700 mb-4">Monthly Completion Rate Trends (%)</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Month</th>
              {activeStaff.map(s => (
                <th key={s.id} className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {s.name.split(' ')[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {trends.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">{row.label}</td>
                {activeStaff.map(s => {
                  const entry = row.staff[s.id]
                  const rate  = entry?.rate ?? null
                  return (
                    <td key={s.id} className="px-4 py-3 text-center">
                      {rate !== null ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-sm font-bold ${getRateText(rate)}`}>{rate}%</span>
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${getRateColor(rate)}`} style={{ width: `${rate}%` }} />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100">
        {activeStaff.map(s => (
          <div key={s.id} className="flex items-center gap-2">
            <Avatar name={s.name} src={s.avatar_url} size="xs" />
            <span className="text-xs text-gray-600">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tab: Top Performers ────────────────────────────────────────────────────────

const TopPerformersTab = ({ data, period, loading }) => {
  if (loading) return <Spinner />

  const ranked = [...data]
    .filter(s => s.total > 0)
    .sort((a, b) => b.rate - a.rate)

  if (!ranked.length) return <EmptyState period={period} />

  return (
    <div className="p-5">
      <h4 className="font-semibold text-gray-700 mb-4">Top Performers — {period}</h4>
      <div className="space-y-3">
        {ranked.map((r, i) => (
          <div
            key={r.id}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors ${
              i === 0 ? 'bg-amber-50 border-amber-200' :
              i === 1 ? 'bg-gray-50 border-gray-200' :
              i === 2 ? 'bg-orange-50 border-orange-200' :
              'bg-white border-gray-100'
            }`}
          >
            <div className="flex-shrink-0 text-2xl w-10 text-center">
              {MEDALS[i] ?? <span className="text-base font-bold text-gray-400">#{i + 1}</span>}
            </div>
            <Avatar name={r.name} src={r.avatar_url} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800">{r.name}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {r.position && <Badge variant="blue">{r.position}</Badge>}
                <Stars count={toStars(r.rate)} />
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-xl font-bold ${getRateText(r.rate)}`}>{r.rate}%</p>
              <p className="text-xs text-gray-400">{r.completed}/{r.total} tasks</p>
              {r.trend !== null && (
                <div className="mt-0.5 flex justify-end">
                  <Trend value={r.trend} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary stats */}
      {ranked.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-100">
          {[
            { label: 'Avg Completion', value: `${Math.round(ranked.reduce((a, s) => a + s.rate, 0) / ranked.length)}%`, color: 'text-blue-600' },
            { label: 'Top Rate', value: `${ranked[0].rate}%`, color: 'text-green-600' },
            { label: 'Active Staff', value: ranked.length, color: 'text-gray-700' },
          ].map(stat => (
            <div key={stat.label} className="text-center p-3 rounded-xl bg-gray-50 border border-gray-100">
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

const TABS = ['Scorecards', 'Monthly Trends', 'Top Performers']

const PerformancePage = () => {
  const now = new Date()
  const [activeTab, setActiveTab] = useState(0)
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [loading, setLoading] = useState(true)
  const [scorecards,     setScorecards]     = useState([])
  const [monthlyTrends,  setMonthlyTrends]  = useState([])
  const [staffList,      setStaffList]      = useState([])
  const [period,         setPeriod]         = useState('')

  const load = useCallback(() => {
    setLoading(true)
    getPerformance({ year, month })
      .then(res => {
        const d = res.data.data
        setScorecards(d.scorecards || [])
        setMonthlyTrends(d.monthly_trends || [])
        setStaffList(d.staff_list || [])
        setPeriod(d.period || '')
      })
      .catch(() => toast.error('Failed to load performance data.'))
      .finally(() => setLoading(false))
  }, [year, month])

  useEffect(() => { load() }, [load])

  const handleMonthChange = (y, m) => { setYear(y); setMonth(m) }

  const tabContent = [
    <ScorecardsTab    key="sc" data={scorecards}    period={period} loading={loading} />,
    <MonthlyTrendsTab key="mt" trends={monthlyTrends} staffList={staffList} loading={loading} />,
    <TopPerformersTab key="tp" data={scorecards}    period={period} loading={loading} />,
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-2xl px-6 py-5 flex items-center gap-4 text-white shadow-sm">
        <div className="flex-shrink-0 bg-white/20 p-3 rounded-xl">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-red-200 text-xs font-semibold uppercase tracking-wider mb-0.5">People</p>
          <h1 className="text-2xl font-bold">Performance</h1>
          <p className="text-red-100 text-sm mt-0.5">Individual staff scorecards with task completion rates, ratings, and 6-month trends.</p>
        </div>
        <div className="flex-shrink-0">
          <MonthPicker year={year} month={month} onChange={handleMonthChange} />
        </div>
      </div>

      {/* Tabs + content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {TABS.map((label, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === i
                  ? 'text-red-600 border-red-500 bg-red-50/30'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}

          {/* Refresh button */}
          <div className="ml-auto flex items-center pr-4">
            <button
              onClick={load}
              disabled={loading}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
              title="Refresh"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        <div>{tabContent[activeTab]}</div>
      </div>
    </div>
  )
}

export default PerformancePage
