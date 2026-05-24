import FeaturePage from '../../components/layout/FeaturePage'
import Badge from '../../components/ui/Badge'

const STOCK_CHECKS = [
  { aisle: 'A1 – Bread & Bakery',  assignee: 'Alice Johnson', scheduled: '12 May 09:00', status: 'Completed', items: 34 },
  { aisle: 'B2 – Dairy & Eggs',    assignee: 'Bob Smith',     scheduled: '12 May 10:00', status: 'In Progress', items: 22 },
  { aisle: 'C3 – Produce',         assignee: 'Carol White',   scheduled: '12 May 08:00', status: 'Completed', items: 48 },
  { aisle: 'D4 – Deli & Meats',    assignee: 'David Brown',   scheduled: '12 May 11:00', status: 'Pending', items: 19 },
  { aisle: 'E5 – Frozen Foods',    assignee: 'Eva Martinez',  scheduled: '12 May 07:00', status: 'Completed', items: 31 },
  { aisle: 'F6 – Beverages',       assignee: '(Unassigned)',  scheduled: '12 May 13:00', status: 'Pending', items: 27 },
]

const LOW_STOCK = [
  { sku: 'SKU-0021', name: 'Whole Milk 1L',         aisle: 'B2', qty: 3,  threshold: 20, dept: 'Dairy',    urgency: 'Critical' },
  { sku: 'SKU-0045', name: 'Sourdough Loaf',         aisle: 'A1', qty: 5,  threshold: 15, dept: 'Bakery',   urgency: 'High' },
  { sku: 'SKU-0088', name: 'Orange Juice 2L',        aisle: 'F6', qty: 8,  threshold: 18, dept: 'Beverages',urgency: 'High' },
  { sku: 'SKU-0112', name: 'Frozen Pizza 400g',      aisle: 'E5', qty: 4,  threshold: 12, dept: 'Frozen',   urgency: 'Critical' },
  { sku: 'SKU-0057', name: 'Greek Yoghurt 500g',     aisle: 'B2', qty: 11, threshold: 20, dept: 'Dairy',    urgency: 'Medium' },
  { sku: 'SKU-0093', name: 'Chicken Breast 500g',    aisle: 'D4', qty: 6,  threshold: 15, dept: 'Deli',     urgency: 'High' },
]

const AISLE_TASKS = [
  { aisle: 'A1 – Bread & Bakery',   task: 'Restock bread display',      assignee: 'Alice Johnson', due: '14 May', status: 'In Progress' },
  { aisle: 'B2 – Dairy & Eggs',     task: 'Check expiry dates',         assignee: 'Bob Smith',     due: '12 May', status: 'Completed' },
  { aisle: 'C3 – Produce',          task: 'Rotate fruit display',       assignee: 'Carol White',   due: '13 May', status: 'Completed' },
  { aisle: 'D4 – Deli & Meats',     task: 'Deep clean deli counter',    assignee: 'David Brown',   due: '15 May', status: 'Not Started' },
  { aisle: 'E5 – Frozen Foods',     task: 'Temperature log check',      assignee: 'Eva Martinez',  due: '12 May', status: 'In Progress' },
  { aisle: 'F6 – Beverages',        task: 'Restock cold beverages',     assignee: '(Unassigned)',  due: '14 May', status: 'Not Started' },
]

const checkBadge = (s) => {
  if (s === 'Completed')   return <Badge variant="green">Completed</Badge>
  if (s === 'In Progress') return <Badge variant="blue">In Progress</Badge>
  return <Badge variant="gray">Pending</Badge>
}

const urgencyBadge = (u) => {
  if (u === 'Critical') return <Badge variant="red">Critical</Badge>
  if (u === 'High')     return <Badge variant="yellow">High</Badge>
  return <Badge variant="blue">Medium</Badge>
}

const StockChecksContent = () => (
  <div className="p-5">
    <div className="flex items-center justify-between mb-4">
      <h4 className="font-semibold text-gray-700">Today's Stock Checks — 12 May 2026</h4>
      <button className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">+ Assign Check</button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {['Aisle / Section', 'Assignee', 'Scheduled', 'Items', 'Status'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {STOCK_CHECKS.map((r, i) => (
            <tr key={i} className="hover:bg-gray-50/50">
              <td className="px-4 py-3 font-medium text-gray-800">{r.aisle}</td>
              <td className="px-4 py-3 text-gray-600 text-xs">{r.assignee}</td>
              <td className="px-4 py-3 text-gray-500 text-xs">{r.scheduled}</td>
              <td className="px-4 py-3 text-center font-semibold text-gray-700">{r.items}</td>
              <td className="px-4 py-3">{checkBadge(r.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

const LowStockFlagsContent = () => (
  <div className="p-5">
    <div className="flex items-center justify-between mb-4">
      <h4 className="font-semibold text-gray-700">Low-Stock Alerts</h4>
      <span className="text-xs bg-red-50 text-red-600 font-semibold px-2.5 py-1 rounded-full">{LOW_STOCK.length} items flagged</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {['SKU', 'Product', 'Aisle', 'Qty Left', 'Min Threshold', 'Department', 'Urgency'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {LOW_STOCK.map((r, i) => (
            <tr key={i} className={`hover:bg-gray-50/50 ${r.urgency === 'Critical' ? 'bg-red-50/30' : ''}`}>
              <td className="px-4 py-3 font-mono text-xs text-gray-400">{r.sku}</td>
              <td className="px-4 py-3 font-medium text-gray-800">{r.name}</td>
              <td className="px-4 py-3 text-gray-500 text-xs">{r.aisle}</td>
              <td className="px-4 py-3 text-center">
                <span className={`font-bold text-sm ${r.urgency === 'Critical' ? 'text-red-600' : 'text-amber-600'}`}>{r.qty}</span>
              </td>
              <td className="px-4 py-3 text-center text-gray-500 text-xs">{r.threshold}</td>
              <td className="px-4 py-3"><Badge variant="blue">{r.dept}</Badge></td>
              <td className="px-4 py-3">{urgencyBadge(r.urgency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

const AisleTasksContent = () => (
  <div className="p-5">
    <div className="flex items-center justify-between mb-4">
      <h4 className="font-semibold text-gray-700">Tasks by Aisle</h4>
      <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">{AISLE_TASKS.length} tasks</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {['Aisle', 'Task', 'Assigned To', 'Due', 'Status'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {AISLE_TASKS.map((t, i) => (
            <tr key={i} className="hover:bg-gray-50/50">
              <td className="px-4 py-3 text-xs font-medium text-gray-600">{t.aisle}</td>
              <td className="px-4 py-3 font-medium text-gray-800">{t.task}</td>
              <td className="px-4 py-3 text-gray-500 text-xs">{t.assignee}</td>
              <td className="px-4 py-3 text-gray-500 text-xs">{t.due}</td>
              <td className="px-4 py-3">{checkBadge(t.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

const InventoryPage = () => (
  <FeaturePage
    title="Inventory"
    section="Operations"
    description="Assign stock-check tasks, track completion, and flag low-stock alerts per aisle."
    icon={
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    }
    tabs={[
      { label: 'Stock Checks',    content: <StockChecksContent /> },
      { label: 'Low-stock Flags', content: <LowStockFlagsContent /> },
      { label: 'Aisle Tasks',     content: <AisleTasksContent /> },
    ]}
  />
)

export default InventoryPage
