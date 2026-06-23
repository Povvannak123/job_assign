import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const SEGMENTS = [
  { key: 'completed',   label: 'Completed',    color: '#22C55E', bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500' },
  { key: 'in_progress', label: 'In Progress',  color: '#3B82F6', bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  { key: 'overdue',     label: 'Overdue',      color: '#EF4444', bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500' },
  { key: 'not_started', label: 'Not Started',  color: '#9CA3AF', bg: 'bg-gray-100',  text: 'text-gray-600',   dot: 'bg-gray-400' },
]

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0]
    return (
      <div className="bg-white shadow-lg border border-gray-100 rounded-xl px-4 py-3 text-sm">
        <p className="font-semibold text-gray-800">{d.name}</p>
        <p className="text-gray-500 mt-0.5">{d.value} task{d.value !== 1 ? 's' : ''}</p>
      </div>
    )
  }
  return null
}

const TaskSummaryChart = ({ data }) => {
  const chartData = SEGMENTS.map((s) => ({
    ...s,
    value: data?.[s.key] || 0,
    name: s.label,
  }))

  const total = chartData.reduce((sum, d) => sum + d.value, 0)

  if (total === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
        <h3 className="font-semibold text-gray-800">Task Distribution</h3>
        <p className="text-xs text-gray-400 mt-0.5 mb-4">Breakdown by current status</p>
        <div className="flex items-center justify-center flex-1 min-h-[260px] text-gray-400 text-sm">
          <div className="text-center">
            <svg className="w-10 h-10 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            No tasks available
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="font-semibold text-gray-800">Task Distribution</h3>
          <p className="text-xs text-gray-400 mt-0.5">Breakdown by current status</p>
        </div>
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
          {total} total
        </span>
      </div>

      <div className="relative w-full" style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height={240} minWidth={0} debounce={50}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={72}
              outerRadius={105}
              paddingAngle={3}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {chartData.map((entry) => (
                <Cell key={entry.key} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center select-none"
          aria-hidden="true"
        >
          <span className="text-4xl font-bold leading-none tracking-tight text-gray-900 tabular-nums">
            {total}
          </span>
          <span className="mt-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400">Tasks</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        {chartData.map((entry) => {
          const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0
          return (
            <div key={entry.key} className={`${entry.bg} rounded-xl px-3 py-2.5 flex items-center gap-2.5`}>
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${entry.dot}`} />
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">{entry.label}</p>
                <p className={`text-sm font-bold ${entry.text} leading-tight`}>
                  {entry.value} <span className="font-normal text-xs opacity-70">({pct}%)</span>
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TaskSummaryChart
