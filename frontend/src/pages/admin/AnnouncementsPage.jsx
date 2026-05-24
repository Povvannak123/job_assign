import { useState } from 'react'
import FeaturePage from '../../components/layout/FeaturePage'
import Badge from '../../components/ui/Badge'

const PINNED = [
  {
    id: 1, title: 'Public Holiday — 16 May 2026', author: 'Admin User',
    date: '10 May 2026', target: 'All Staff', pinned: true,
    body: 'The store will be closed on Friday 16 May for the national public holiday. All shifts scheduled for that day have been cancelled. Please check the updated roster.',
  },
  {
    id: 2, title: 'New Uniform Policy Effective 1 June', author: 'Admin User',
    date: '09 May 2026', target: 'All Staff', pinned: true,
    body: 'Starting 1 June 2026, all staff are required to wear the updated uniform. New uniforms will be distributed at the start of your next scheduled shift.',
  },
  {
    id: 3, title: 'Bakery Oven Maintenance — 13 May AM', author: 'Admin User',
    date: '11 May 2026', target: 'Bakery', pinned: true,
    body: 'The main oven in the Bakery will be serviced between 06:00–08:00 on 13 May. Bakery staff should adjust their morning prep schedule accordingly.',
  },
]

const READ_RECEIPTS = [
  { staff: 'Alice Johnson', dept: 'Bakery',    announcement: 'Public Holiday — 16 May', readAt: '10 May 14:32', read: true },
  { staff: 'Bob Smith',     dept: 'Cashier',   announcement: 'Public Holiday — 16 May', readAt: '10 May 15:01', read: true },
  { staff: 'Carol White',   dept: 'Produce',   announcement: 'Public Holiday — 16 May', readAt: '11 May 08:14', read: true },
  { staff: 'David Brown',   dept: 'Deli',      announcement: 'Public Holiday — 16 May', readAt: '—',            read: false },
  { staff: 'Eva Martinez',  dept: 'Frozen',    announcement: 'Public Holiday — 16 May', readAt: '—',            read: false },
  { staff: 'Alice Johnson', dept: 'Bakery',    announcement: 'Bakery Oven Maintenance', readAt: '11 May 09:00', read: true },
  { staff: 'Bob Smith',     dept: 'Cashier',   announcement: 'New Uniform Policy',      readAt: '—',            read: false },
]

const DEPTS = ['All Staff', 'Bakery', 'Cashier', 'Produce', 'Deli', 'Frozen', 'Beverages', 'Cleaning']

const PinnedNoticesContent = () => {
  const [expanded, setExpanded] = useState(null)
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-700">Pinned Announcements</h4>
        <button className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">+ New Announcement</button>
      </div>
      <div className="space-y-3">
        {PINNED.map((n) => (
          <div key={n.id} className="border border-gray-100 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === n.id ? null : n.id)}
              className="w-full flex items-start gap-3 p-4 hover:bg-gray-50/50 text-left transition-colors"
            >
              <div className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-800 text-sm">{n.title}</p>
                  <Badge variant="red">Pinned</Badge>
                  <Badge variant={n.target === 'All Staff' ? 'gray' : 'blue'}>{n.target}</Badge>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">By {n.author} · {n.date}</p>
              </div>
              <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${expanded === n.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expanded === n.id && (
              <div className="px-4 pb-4 pt-0 border-t border-gray-50">
                <p className="text-sm text-gray-600 leading-relaxed mt-3">{n.body}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const ReadReceiptsContent = () => {
  const readCount = READ_RECEIPTS.filter((r) => r.read).length
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-700">Read Receipts</h4>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700">
          {readCount} / {READ_RECEIPTS.length} read
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Staff', 'Department', 'Announcement', 'Read At', 'Status'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {READ_RECEIPTS.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-gray-800">{r.staff}</td>
                <td className="px-4 py-3"><Badge variant="blue">{r.dept}</Badge></td>
                <td className="px-4 py-3 text-gray-600 text-xs">{r.announcement}</td>
                <td className="px-4 py-3 text-gray-500 text-xs font-mono">{r.readAt}</td>
                <td className="px-4 py-3">
                  {r.read ? <Badge variant="green">Read</Badge> : <Badge variant="gray">Unread</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const TargetByDeptContent = () => {
  const [form, setForm] = useState({ title: '', body: '', dept: 'All Staff', pin: false })
  return (
    <div className="p-6 max-w-2xl">
      <p className="text-sm text-gray-500 mb-5">Create a department-specific announcement below.</p>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Announcement Title *</label>
          <input
            type="text"
            placeholder="Enter announcement title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Target Department *</label>
          <select
            value={form.dept}
            onChange={(e) => setForm({ ...form, dept: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
          >
            {DEPTS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Message *</label>
          <textarea
            rows={4}
            placeholder="Write your announcement here..."
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 resize-none"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.pin}
            onChange={(e) => setForm({ ...form, pin: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
          <span className="text-sm text-gray-700">Pin this announcement (staff see it on login)</span>
        </label>
        <div className="flex gap-3 pt-2">
          <button className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors">Post Announcement</button>
          <button className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Clear</button>
        </div>
      </div>
    </div>
  )
}

const AnnouncementsPage = () => (
  <FeaturePage
    title="Announcements"
    section="People"
    description="Post store-wide or department-specific notices. Staff see unread badges on login."
    icon={
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    }
    tabs={[
      { label: 'Pinned Notices', content: <PinnedNoticesContent /> },
      { label: 'Read Receipts',  content: <ReadReceiptsContent /> },
      { label: 'Target by Dept', content: <TargetByDeptContent /> },
    ]}
  />
)

export default AnnouncementsPage
