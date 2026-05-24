import FeaturePage from '../../components/layout/FeaturePage'
import Badge from '../../components/ui/Badge'

const DEPARTMENTS = [
  { name: 'Bakery',     head: 'Alice Johnson', staff: 5, tasks: 8,  open: 2, color: 'bg-yellow-50 border-yellow-200', dot: 'bg-yellow-400' },
  { name: 'Cashier',    head: 'Bob Smith',     staff: 8, tasks: 12, open: 3, color: 'bg-blue-50 border-blue-200',   dot: 'bg-blue-400' },
  { name: 'Produce',    head: 'Carol White',   staff: 4, tasks: 6,  open: 1, color: 'bg-green-50 border-green-200', dot: 'bg-green-400' },
  { name: 'Deli',       head: 'David Brown',   staff: 3, tasks: 5,  open: 0, color: 'bg-orange-50 border-orange-200', dot: 'bg-orange-400' },
  { name: 'Frozen',     head: 'Eva Martinez',  staff: 3, tasks: 4,  open: 1, color: 'bg-sky-50 border-sky-200',    dot: 'bg-sky-400' },
  { name: 'Beverages',  head: '(Vacant)',      staff: 2, tasks: 3,  open: 0, color: 'bg-purple-50 border-purple-200', dot: 'bg-purple-400' },
  { name: 'Cleaning',   head: '(Vacant)',      staff: 2, tasks: 2,  open: 0, color: 'bg-gray-50 border-gray-200',  dot: 'bg-gray-400' },
]

const ALL_STAFF = [
  { name: 'Alice Johnson', dept: 'Bakery',    role: 'Head',             tasks: 3, status: 'Active' },
  { name: 'Bob Smith',     dept: 'Cashier',   role: 'Head',             tasks: 1, status: 'Active' },
  { name: 'Carol White',   dept: 'Produce',   role: 'Head',             tasks: 2, status: 'Active' },
  { name: 'David Brown',   dept: 'Deli',      role: 'Head',             tasks: 2, status: 'Active' },
  { name: 'Eva Martinez',  dept: 'Frozen',    role: 'Head',             tasks: 2, status: 'Active' },
  { name: '(Vacant)',      dept: 'Beverages', role: 'Head (unfilled)',   tasks: 0, status: 'Vacant' },
  { name: '(Vacant)',      dept: 'Cleaning',  role: 'Head (unfilled)',   tasks: 0, status: 'Vacant' },
]

const DEPT_TASKS = [
  { title: 'Restock bread display',    dept: 'Bakery',    assignee: 'Alice Johnson', due: '14 May', status: 'In Progress' },
  { title: 'End-of-day cash tally',    dept: 'Cashier',   assignee: 'Bob Smith',     due: '12 May', status: 'Completed' },
  { title: 'Fruit display rotation',   dept: 'Produce',   assignee: 'Carol White',   due: '13 May', status: 'Completed' },
  { title: 'Deli counter deep clean',  dept: 'Deli',      assignee: 'David Brown',   due: '15 May', status: 'Not Started' },
  { title: 'Freezer temperature log',  dept: 'Frozen',    assignee: 'Eva Martinez',  due: '12 May', status: 'In Progress' },
  { title: 'Restock cold beverages',   dept: 'Beverages', assignee: '(Unassigned)',  due: '14 May', status: 'Not Started' },
]

const taskStatusBadge = (s) => {
  if (s === 'Completed')   return <Badge variant="green">Completed</Badge>
  if (s === 'In Progress') return <Badge variant="blue">In Progress</Badge>
  return <Badge variant="gray">Not Started</Badge>
}

const SectionOverviewContent = () => (
  <div className="p-5">
    <p className="text-sm text-gray-500 mb-4">Overview of all store departments and their current task load.</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {DEPARTMENTS.map((d) => (
        <div key={d.name} className={`border rounded-2xl p-4 ${d.color}`}>
          <div className="flex items-center gap-2 mb-3">
            <span className={`w-3 h-3 rounded-full ${d.dot}`} />
            <h4 className="font-bold text-gray-800">{d.name}</h4>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/70 rounded-xl py-2">
              <p className="text-lg font-bold text-gray-800">{d.staff}</p>
              <p className="text-xs text-gray-500">Staff</p>
            </div>
            <div className="bg-white/70 rounded-xl py-2">
              <p className="text-lg font-bold text-gray-800">{d.tasks}</p>
              <p className="text-xs text-gray-500">Tasks</p>
            </div>
            <div className="bg-white/70 rounded-xl py-2">
              <p className={`text-lg font-bold ${d.open > 0 ? 'text-red-600' : 'text-green-600'}`}>{d.open}</p>
              <p className="text-xs text-gray-500">Open</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">Head: <span className="font-medium text-gray-700">{d.head}</span></p>
        </div>
      ))}
    </div>
  </div>
)

const HeadAssignmentContent = () => (
  <div className="p-5">
    <div className="flex items-center justify-between mb-4">
      <h4 className="font-semibold text-gray-700">Department Head Assignments</h4>
      <span className="text-xs bg-yellow-50 text-yellow-700 font-medium px-2.5 py-1 rounded-full">2 vacancies</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {['Department', 'Head', 'Role', 'Tasks Assigned', 'Status', 'Action'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {ALL_STAFF.map((r, i) => (
            <tr key={i} className="hover:bg-gray-50/50">
              <td className="px-4 py-3 font-semibold text-gray-700">{r.dept}</td>
              <td className="px-4 py-3 font-medium text-gray-800">{r.name}</td>
              <td className="px-4 py-3 text-xs text-gray-500">{r.role}</td>
              <td className="px-4 py-3 text-center font-semibold text-gray-700">{r.tasks}</td>
              <td className="px-4 py-3">
                {r.status === 'Active'
                  ? <Badge variant="green">Active</Badge>
                  : <Badge variant="yellow">Vacant</Badge>}
              </td>
              <td className="px-4 py-3">
                <button className="text-xs px-2.5 py-1 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium">
                  {r.status === 'Vacant' ? 'Assign' : 'Reassign'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

const TaskByDeptContent = () => (
  <div className="p-5">
    <div className="flex items-center justify-between mb-4">
      <h4 className="font-semibold text-gray-700">Tasks by Department</h4>
      <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">{DEPT_TASKS.length} tasks</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {['Task', 'Department', 'Assigned To', 'Due Date', 'Status'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {DEPT_TASKS.map((t, i) => (
            <tr key={i} className="hover:bg-gray-50/50">
              <td className="px-4 py-3 font-medium text-gray-800">{t.title}</td>
              <td className="px-4 py-3"><Badge variant="blue">{t.dept}</Badge></td>
              <td className="px-4 py-3 text-gray-600 text-xs">{t.assignee}</td>
              <td className="px-4 py-3 text-gray-500 text-xs">{t.due}</td>
              <td className="px-4 py-3">{taskStatusBadge(t.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

const DepartmentsPage = () => (
  <FeaturePage
    title="Departments"
    section="Operations"
    description="Manage store sections — Produce, Bakery, Cashier, etc. — and their assigned staff."
    icon={
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    }
    tabs={[
      { label: 'Section Overview',  content: <SectionOverviewContent /> },
      { label: 'Head Assignment',   content: <HeadAssignmentContent /> },
      { label: 'Task by Dept',      content: <TaskByDeptContent /> },
    ]}
  />
)

export default DepartmentsPage
