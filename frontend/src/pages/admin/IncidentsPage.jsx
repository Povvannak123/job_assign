import { useState } from 'react'
import FeaturePage from '../../components/layout/FeaturePage'
import Badge from '../../components/ui/Badge'

const INCIDENTS = [
  { id: 'INC-001', title: 'Slippery floor in Produce aisle', reporter: 'Carol White',  date: '10 May 2026', priority: 'High',   status: 'Open',     dept: 'Produce' },
  { id: 'INC-002', title: 'Broken freezer door (Aisle 7)',   reporter: 'Eva Martinez', date: '11 May 2026', priority: 'Medium', status: 'In Review', dept: 'Frozen' },
  { id: 'INC-003', title: 'Cardboard baler jam',             reporter: 'Bob Smith',    date: '09 May 2026', priority: 'Low',    status: 'Resolved',  dept: 'Cashier' },
  { id: 'INC-004', title: 'Near-miss forklift near dock',    reporter: 'David Brown',  date: '08 May 2026', priority: 'High',   status: 'Resolved',  dept: 'Deli' },
  { id: 'INC-005', title: 'Ceiling leak over dairy shelf',   reporter: 'Alice Johnson',date: '07 May 2026', priority: 'Medium', status: 'Open',      dept: 'Bakery' },
]

const RESOLVED = INCIDENTS.filter((i) => i.status === 'Resolved')

const priorityBadge = (p) => {
  if (p === 'High')   return <Badge variant="red">High</Badge>
  if (p === 'Medium') return <Badge variant="yellow">Medium</Badge>
  return <Badge variant="gray">Low</Badge>
}

const statusBadge = (s) => {
  if (s === 'Resolved')  return <Badge variant="green">Resolved</Badge>
  if (s === 'In Review') return <Badge variant="blue">In Review</Badge>
  return <Badge variant="red">Open</Badge>
}

const DEPTS = ['Produce', 'Bakery', 'Cashier', 'Deli', 'Frozen', 'Beverages', 'Cleaning']
const TYPES = ['Slip / Trip / Fall', 'Equipment Failure', 'Near-Miss', 'Security Incident', 'Property Damage', 'Other']

const ReportIncidentContent = () => {
  const [form, setForm] = useState({ title: '', dept: '', type: '', date: '', desc: '', reporter: '' })
  return (
    <div className="p-6 max-w-2xl">
      <p className="text-sm text-gray-500 mb-5">Fill in the details below to log a new workplace incident.</p>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Incident Title *</label>
          <input
            type="text"
            placeholder="Brief description of the incident"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Department *</label>
            <select
              value={form.dept}
              onChange={(e) => setForm({ ...form, dept: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
            >
              <option value="">Select department</option>
              {DEPTS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Incident Type *</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
            >
              <option value="">Select type</option>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Date &amp; Time *</label>
            <input
              type="datetime-local"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Reported By *</label>
            <input
              type="text"
              placeholder="Your name"
              value={form.reporter}
              onChange={(e) => setForm({ ...form, reporter: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Full Description *</label>
          <textarea
            rows={4}
            placeholder="Describe what happened, where it occurred, and any immediate actions taken..."
            value={form.desc}
            onChange={(e) => setForm({ ...form, desc: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 resize-none"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors">Submit Report</button>
          <button className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Clear Form</button>
        </div>
      </div>
    </div>
  )
}

const StatusTrackingContent = () => (
  <div className="p-5">
    <div className="flex items-center justify-between mb-4">
      <h4 className="font-semibold text-gray-700">All Incidents</h4>
      <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">{INCIDENTS.length} records</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {['ID', 'Title', 'Department', 'Reported By', 'Date', 'Priority', 'Status'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {INCIDENTS.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50/50">
              <td className="px-4 py-3 font-mono text-xs text-gray-400">{r.id}</td>
              <td className="px-4 py-3 font-medium text-gray-800">{r.title}</td>
              <td className="px-4 py-3"><Badge variant="blue">{r.dept}</Badge></td>
              <td className="px-4 py-3 text-gray-600 text-xs">{r.reporter}</td>
              <td className="px-4 py-3 text-gray-500 text-xs">{r.date}</td>
              <td className="px-4 py-3">{priorityBadge(r.priority)}</td>
              <td className="px-4 py-3">{statusBadge(r.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

const ResolutionLogContent = () => (
  <div className="p-5">
    <div className="flex items-center justify-between mb-4">
      <h4 className="font-semibold text-gray-700">Resolved Incidents</h4>
      <span className="text-xs bg-green-50 text-green-600 font-medium px-2.5 py-1 rounded-full">{RESOLVED.length} resolved</span>
    </div>
    {RESOLVED.length === 0 ? (
      <div className="py-12 text-center text-gray-400 text-sm">No resolved incidents yet</div>
    ) : (
      <div className="space-y-3">
        {RESOLVED.map((r) => (
          <div key={r.id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50/50 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-gray-400">{r.id}</span>
                  <Badge variant="green">Resolved</Badge>
                  {priorityBadge(r.priority)}
                </div>
                <p className="font-semibold text-gray-800 text-sm">{r.title}</p>
                <p className="text-xs text-gray-400 mt-1">Reported by <span className="font-medium text-gray-600">{r.reporter}</span> on {r.date} · {r.dept}</p>
              </div>
              <button className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0">View →</button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)

const IncidentsPage = () => (
  <FeaturePage
    title="Incidents"
    section="Operations"
    description="Log and track workplace incidents, near-misses, or equipment issues in real time."
    icon={
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    }
    tabs={[
      { label: 'Report Incident',  content: <ReportIncidentContent /> },
      { label: 'Status Tracking',  content: <StatusTrackingContent /> },
      { label: 'Resolution Log',   content: <ResolutionLogContent /> },
    ]}
  />
)

export default IncidentsPage
