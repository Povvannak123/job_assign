import FeaturePage from '../../components/layout/FeaturePage'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'

const SCORECARDS = [
  { name: 'Alice Johnson', dept: 'Bakery',   total: 12, completed: 10, late: 1, rate: 83, rating: 4, trend: '+5%' },
  { name: 'Bob Smith',     dept: 'Cashier',  total: 8,  completed: 4,  late: 2, rate: 50, rating: 3, trend: '-10%' },
  { name: 'Carol White',   dept: 'Produce',  total: 10, completed: 9,  late: 0, rate: 90, rating: 5, trend: '+8%' },
  { name: 'David Brown',   dept: 'Deli',     total: 9,  completed: 6,  late: 1, rate: 67, rating: 3, trend: '+2%' },
  { name: 'Eva Martinez',  dept: 'Frozen',   total: 7,  completed: 3,  late: 2, rate: 43, rating: 2, trend: '-7%' },
]

const MONTHLY = [
  { month: 'Jan', alice: 88, bob: 60, carol: 92, david: 70, eva: 55 },
  { month: 'Feb', alice: 80, bob: 55, carol: 88, david: 65, eva: 50 },
  { month: 'Mar', alice: 85, bob: 58, carol: 90, david: 68, eva: 48 },
  { month: 'Apr', alice: 78, bob: 62, carol: 87, david: 72, eva: 45 },
  { month: 'May', alice: 83, bob: 50, carol: 90, david: 67, eva: 43 },
]

const STAFF_NAMES = ['Alice Johnson', 'Bob Smith', 'Carol White', 'David Brown', 'Eva Martinez']

const getRateColor = (r) => r >= 80 ? 'bg-green-500' : r >= 60 ? 'bg-amber-400' : 'bg-red-500'
const getRateText  = (r) => r >= 80 ? 'text-green-600' : r >= 60 ? 'text-amber-600' : 'text-red-600'
const getRateLabel = (r) => r >= 80 ? 'Good' : r >= 60 ? 'Fair' : 'Low'
const getRateLabelVariant = (r) => r >= 80 ? 'green' : r >= 60 ? 'yellow' : 'red'

const Stars = ({ count }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map((s) => (
      <svg key={s} className={`w-3.5 h-3.5 ${s <= count ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
)

const ScorecardsContent = () => (
  <div className="p-5">
    <div className="flex items-center justify-between mb-4">
      <h4 className="font-semibold text-gray-700">Staff Scorecards — May 2026</h4>
      <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">{SCORECARDS.length} staff</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {['Staff', 'Department', 'Tasks', 'Completed', 'Late', 'Completion Rate', 'Rating'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {SCORECARDS.map((r, i) => (
            <tr key={i} className="hover:bg-gray-50/50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={r.name} size="sm" />
                  <span className="font-medium text-gray-800">{r.name}</span>
                </div>
              </td>
              <td className="px-4 py-3"><Badge variant="blue">{r.dept}</Badge></td>
              <td className="px-4 py-3 text-center font-semibold text-gray-700">{r.total}</td>
              <td className="px-4 py-3 text-center">
                <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-bold">{r.completed}</span>
              </td>
              <td className="px-4 py-3 text-center">
                <span className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-xs font-bold ${r.late > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-400'}`}>{r.late}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${getRateColor(r.rate)}`} style={{ width: `${r.rate}%` }} />
                  </div>
                  <span className={`text-xs font-bold ${getRateText(r.rate)}`}>{r.rate}%</span>
                  <Badge variant={getRateLabelVariant(r.rate)}>{getRateLabel(r.rate)}</Badge>
                </div>
              </td>
              <td className="px-4 py-3"><Stars count={r.rating} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

const MonthlyTrendsContent = () => (
  <div className="p-5">
    <h4 className="font-semibold text-gray-700 mb-4">Monthly Completion Rate Trends (%)</h4>
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Month</th>
            {STAFF_NAMES.map((n) => (
              <th key={n} className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{n.split(' ')[0]}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {MONTHLY.map((row, i) => {
            const vals = [row.alice, row.bob, row.carol, row.david, row.eva]
            return (
              <tr key={i} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-semibold text-gray-600">{row.month}</td>
                {vals.map((v, j) => (
                  <td key={j} className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-sm font-bold ${getRateText(v)}`}>{v}%</span>
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${getRateColor(v)}`} style={{ width: `${v}%` }} />
                      </div>
                    </div>
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  </div>
)

const TopPerformersContent = () => {
  const sorted = [...SCORECARDS].sort((a, b) => b.rate - a.rate)
  const medals = ['🥇', '🥈', '🥉']
  return (
    <div className="p-5">
      <h4 className="font-semibold text-gray-700 mb-4">Top Performers — May 2026</h4>
      <div className="space-y-3">
        {sorted.map((r, i) => (
          <div
            key={r.name}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors ${i === 0 ? 'bg-amber-50 border-amber-200' : i === 1 ? 'bg-gray-50 border-gray-200' : i === 2 ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'}`}
          >
            <div className="flex-shrink-0 text-2xl w-10 text-center">{medals[i] ?? `#${i + 1}`}</div>
            <Avatar name={r.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800">{r.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="blue">{r.dept}</Badge>
                <Stars count={r.rating} />
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-xl font-bold ${getRateText(r.rate)}`}>{r.rate}%</p>
              <p className="text-xs text-gray-400">{r.completed}/{r.total} tasks</p>
              <p className={`text-xs font-medium mt-0.5 ${r.trend.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>{r.trend} vs last month</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const PerformancePage = () => (
  <FeaturePage
    title="Performance"
    section="People"
    description="Individual staff scorecards with task completion rates, ratings, and history over time."
    icon={
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    }
    tabs={[
      { label: 'Scorecards',      content: <ScorecardsContent /> },
      { label: 'Monthly Trends',  content: <MonthlyTrendsContent /> },
      { label: 'Top Performers',  content: <TopPerformersContent /> },
    ]}
  />
)

export default PerformancePage
