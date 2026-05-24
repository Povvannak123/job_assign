import FeaturePage from '../../components/layout/FeaturePage'
import Badge from '../../components/ui/Badge'

const CLOCK_LOG = [
  { staff: 'Alice Johnson', dept: 'Bakery',    clockIn: '06:58', clockOut: '15:03', hours: 8.1,  status: 'On Time' },
  { staff: 'Bob Smith',     dept: 'Cashier',   clockIn: '09:12', clockOut: '17:15', hours: 8.1,  status: 'Late' },
  { staff: 'Carol White',   dept: 'Produce',   clockIn: '05:55', clockOut: '14:00', hours: 8.1,  status: 'On Time' },
  { staff: 'David Brown',   dept: 'Deli',      clockIn: '10:01', clockOut: '18:05', hours: 8.1,  status: 'On Time' },
  { staff: 'Eva Martinez',  dept: 'Frozen',    clockIn: '—',     clockOut: '—',     hours: 0,    status: 'Absent' },
]

const ABSENCES = [
  { staff: 'Eva Martinez',  dept: 'Frozen',  date: '12 May 2026', reason: 'Sick Leave',   approved: true  },
  { staff: 'Bob Smith',     dept: 'Cashier', date: '10 May 2026', reason: 'Personal',     approved: true  },
  { staff: 'Alice Johnson', dept: 'Bakery',  date: '08 May 2026', reason: 'Emergency',    approved: true  },
  { staff: 'Carol White',   dept: 'Produce', date: '05 May 2026', reason: 'Annual Leave',  approved: true  },
  { staff: 'David Brown',   dept: 'Deli',    date: '03 May 2026', reason: 'Sick Leave',   approved: false },
]

const PUNCTUALITY = [
  { staff: 'Alice Johnson', dept: 'Bakery',   onTime: 18, late: 1, absent: 0,  rate: 95 },
  { staff: 'Bob Smith',     dept: 'Cashier',  onTime: 14, late: 4, absent: 2,  rate: 70 },
  { staff: 'Carol White',   dept: 'Produce',  onTime: 19, late: 0, absent: 1,  rate: 95 },
  { staff: 'David Brown',   dept: 'Deli',     onTime: 16, late: 2, absent: 2,  rate: 80 },
  { staff: 'Eva Martinez',  dept: 'Frozen',   onTime: 13, late: 3, absent: 4,  rate: 65 },
]

const statusBadge = (s) => {
  if (s === 'On Time') return <Badge variant="green">On Time</Badge>
  if (s === 'Late')    return <Badge variant="yellow">Late</Badge>
  return <Badge variant="red">Absent</Badge>
}

const getRateColor = (r) => r >= 90 ? 'bg-green-500' : r >= 75 ? 'bg-amber-400' : 'bg-red-500'
const getRateText = (r) => r >= 90 ? 'text-green-600' : r >= 75 ? 'text-amber-600' : 'text-red-600'

const ClockInLogContent = () => (
  <div className="p-5">
    <div className="flex items-center justify-between mb-4">
      <h4 className="font-semibold text-gray-700">Clock-in Log — 12 May 2026</h4>
      <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
        {CLOCK_LOG.filter((r) => r.status !== 'Absent').length} / {CLOCK_LOG.length} present
      </span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {['Staff', 'Department', 'Clock In', 'Clock Out', 'Hours', 'Status'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {CLOCK_LOG.map((r, i) => (
            <tr key={i} className={`hover:bg-gray-50/50 ${r.status === 'Absent' ? 'bg-red-50/20' : ''}`}>
              <td className="px-4 py-3 font-medium text-gray-800">{r.staff}</td>
              <td className="px-4 py-3"><Badge variant="blue">{r.dept}</Badge></td>
              <td className="px-4 py-3 font-mono text-sm text-gray-700">{r.clockIn}</td>
              <td className="px-4 py-3 font-mono text-sm text-gray-700">{r.clockOut}</td>
              <td className="px-4 py-3 text-center font-semibold text-gray-700">{r.hours > 0 ? r.hours : '—'}</td>
              <td className="px-4 py-3">{statusBadge(r.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

const AbsencesContent = () => (
  <div className="p-5">
    <div className="flex items-center justify-between mb-4">
      <h4 className="font-semibold text-gray-700">Absence Records — May 2026</h4>
      <span className="text-xs bg-red-50 text-red-600 font-medium px-2.5 py-1 rounded-full">{ABSENCES.length} absences this month</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {['Staff', 'Department', 'Date', 'Reason', 'Approved'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {ABSENCES.map((r, i) => (
            <tr key={i} className="hover:bg-gray-50/50">
              <td className="px-4 py-3 font-medium text-gray-800">{r.staff}</td>
              <td className="px-4 py-3"><Badge variant="blue">{r.dept}</Badge></td>
              <td className="px-4 py-3 text-gray-500 text-xs">{r.date}</td>
              <td className="px-4 py-3 text-gray-600 text-xs">{r.reason}</td>
              <td className="px-4 py-3">
                {r.approved ? <Badge variant="green">Approved</Badge> : <Badge variant="yellow">Pending</Badge>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

const PunctualityRateContent = () => (
  <div className="p-5">
    <div className="flex items-center justify-between mb-4">
      <h4 className="font-semibold text-gray-700">Punctuality Rate — May 2026</h4>
      <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">20 working days</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {['Staff', 'Department', 'On Time', 'Late', 'Absent', 'Punctuality Rate'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {PUNCTUALITY.map((r, i) => (
            <tr key={i} className="hover:bg-gray-50/50">
              <td className="px-4 py-3 font-medium text-gray-800">{r.staff}</td>
              <td className="px-4 py-3"><Badge variant="blue">{r.dept}</Badge></td>
              <td className="px-4 py-3">
                <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-bold">{r.onTime}</span>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold">{r.late}</span>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-red-100 text-red-700 text-xs font-bold">{r.absent}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${getRateColor(r.rate)}`} style={{ width: `${r.rate}%` }} />
                  </div>
                  <span className={`text-xs font-bold ${getRateText(r.rate)}`}>{r.rate}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

const AttendancePage = () => (
  <FeaturePage
    title="Attendance"
    section="People"
    description="Daily clock-in/out log per staff member with late and absent indicators."
    icon={
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    }
    tabs={[
      { label: 'Clock-in Log',      content: <ClockInLogContent /> },
      { label: 'Absences',          content: <AbsencesContent /> },
      { label: 'Punctuality Rate',  content: <PunctualityRateContent /> },
    ]}
  />
)

export default AttendancePage
