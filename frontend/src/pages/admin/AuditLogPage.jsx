import { useState } from 'react'
import FeaturePage from '../../components/layout/FeaturePage'
import Badge from '../../components/ui/Badge'

const CHANGES = [
  { id: 'CHG-041', action: 'Task Status Updated',  user: 'Alice Johnson', target: 'Restock bread display',     detail: 'not_started → in_progress', time: '12 May 10:32', type: 'task' },
  { id: 'CHG-040', action: 'Task Created',          user: 'Admin User',    target: 'Freezer temperature log',   detail: 'Assigned to Eva Martinez',   time: '12 May 09:15', type: 'task' },
  { id: 'CHG-039', action: 'Task Status Updated',  user: 'Carol White',   target: 'Fruit display rotation',    detail: 'in_progress → completed',    time: '11 May 16:45', type: 'task' },
  { id: 'CHG-038', action: 'Leave Approved',        user: 'Admin User',    target: 'Carol White',               detail: 'Annual Leave 20–22 May',     time: '11 May 14:22', type: 'leave' },
  { id: 'CHG-037', action: 'Staff Account Created', user: 'Admin User',    target: 'New Staff Member',          detail: 'Role: Staff, Dept: Cashier', time: '10 May 11:00', type: 'user' },
  { id: 'CHG-036', action: 'Incident Reported',     user: 'Carol White',   target: 'INC-001',                   detail: 'Slippery floor in Produce',  time: '10 May 08:45', type: 'incident' },
  { id: 'CHG-035', action: 'Task Deleted',          user: 'Admin User',    target: 'Old cleaning task',         detail: 'Removed by admin',           time: '09 May 17:30', type: 'task' },
  { id: 'CHG-034', action: 'Announcement Posted',   user: 'Admin User',    target: 'Public Holiday — 16 May',  detail: 'Target: All Staff',          time: '10 May 09:00', type: 'announcement' },
]

const WHO_DID_WHAT = [
  { user: 'Admin User',    role: 'Admin', actions: 12, lastAction: '12 May 09:15', summary: 'Created 3 tasks, approved 2 leaves, posted 1 announcement' },
  { user: 'Alice Johnson', role: 'Staff', actions: 4,  lastAction: '12 May 10:32', summary: 'Updated 4 task statuses' },
  { user: 'Carol White',   role: 'Staff', actions: 3,  lastAction: '11 May 16:45', summary: 'Updated 2 task statuses, filed 1 incident report' },
  { user: 'Bob Smith',     role: 'Staff', actions: 1,  lastAction: '10 May 14:00', summary: 'Updated 1 task status' },
  { user: 'David Brown',   role: 'Staff', actions: 1,  lastAction: '09 May 11:20', summary: 'Updated 1 task status' },
  { user: 'Eva Martinez',  role: 'Staff', actions: 0,  lastAction: '—',            summary: 'No actions this period' },
]

const typeConfig = {
  task:         { label: 'Task',         variant: 'blue' },
  leave:        { label: 'Leave',        variant: 'yellow' },
  user:         { label: 'User',         variant: 'purple' },
  incident:     { label: 'Incident',     variant: 'red' },
  announcement: { label: 'Notice',       variant: 'green' },
}

const ChangeHistoryContent = () => (
  <div className="p-5">
    <div className="flex items-center justify-between mb-4">
      <h4 className="font-semibold text-gray-700">Change History</h4>
      <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">{CHANGES.length} changes</span>
    </div>
    <div className="space-y-2">
      {CHANGES.map((c) => {
        const tc = typeConfig[c.type] || { label: c.type, variant: 'gray' }
        return (
          <div key={c.id} className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-100 hover:bg-gray-50/50 transition-colors">
            <div className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="font-medium text-gray-800 text-sm">{c.action}</span>
                <Badge variant={tc.variant}>{tc.label}</Badge>
              </div>
              <p className="text-xs text-gray-500">
                <span className="font-medium text-gray-700">{c.user}</span>
                {' · '}{c.target}
                {' · '}<span className="italic text-gray-400">{c.detail}</span>
              </p>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-xs text-gray-400 font-mono">{c.time}</p>
              <p className="text-xs text-gray-300 font-mono">{c.id}</p>
            </div>
          </div>
        )
      })}
    </div>
  </div>
)

const WhoDIdWhatContent = () => (
  <div className="p-5">
    <div className="flex items-center justify-between mb-4">
      <h4 className="font-semibold text-gray-700">User Activity — May 2026</h4>
      <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">{WHO_DID_WHAT.length} users</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {['User', 'Role', 'Total Actions', 'Last Activity', 'Summary'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {WHO_DID_WHAT.map((r, i) => (
            <tr key={i} className="hover:bg-gray-50/50">
              <td className="px-4 py-3 font-medium text-gray-800">{r.user}</td>
              <td className="px-4 py-3">
                <Badge variant={r.role === 'Admin' ? 'red' : 'blue'}>{r.role}</Badge>
              </td>
              <td className="px-4 py-3 text-center">
                <span className={`font-bold text-sm ${r.actions > 5 ? 'text-blue-600' : r.actions > 0 ? 'text-gray-700' : 'text-gray-300'}`}>
                  {r.actions}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-gray-500 font-mono">{r.lastAction}</td>
              <td className="px-4 py-3 text-xs text-gray-500 italic">{r.summary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

const ExportLogContent = () => {
  const [format, setFormat] = useState('csv')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  return (
    <div className="p-6 max-w-lg">
      <p className="text-sm text-gray-500 mb-5">Export the audit log for record-keeping or compliance purposes.</p>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Export Format</label>
          <div className="flex gap-3">
            {['csv', 'pdf', 'xlsx'].map((f) => (
              <label key={f} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-colors ${format === f ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" name="format" value={f} checked={format === f} onChange={() => setFormat(f)} className="sr-only" />
                <span className={`text-sm font-semibold uppercase ${format === f ? 'text-red-600' : 'text-gray-500'}`}>{f}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
            />
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
          <p className="font-semibold text-gray-700 mb-1">Export will include:</p>
          <ul className="list-disc list-inside space-y-1 text-xs text-gray-500">
            <li>All task create / update / delete events</li>
            <li>Leave approvals and rejections</li>
            <li>User account changes</li>
            <li>Incident reports filed</li>
            <li>Announcement posts</li>
          </ul>
        </div>
        <div className="flex gap-3 pt-1">
          <button className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export {format.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  )
}

const AuditLogPage = () => (
  <FeaturePage
    title="Audit Log"
    section="Admin"
    description="Full timeline of task assignments, edits, and status changes for accountability."
    icon={
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    }
    tabs={[
      { label: 'Change History', content: <ChangeHistoryContent /> },
      { label: 'Who Did What',   content: <WhoDIdWhatContent /> },
      { label: 'Export Log',     content: <ExportLogContent /> },
    ]}
  />
)

export default AuditLogPage
