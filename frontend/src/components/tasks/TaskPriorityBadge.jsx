import Badge from '../ui/Badge'

const priorityConfig = {
  low: { label: 'Low', variant: 'green' },
  medium: { label: 'Medium', variant: 'yellow' },
  high: { label: 'High', variant: 'red' },
}

const TaskPriorityBadge = ({ priority }) => {
  const config = priorityConfig[priority] || priorityConfig.medium
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export default TaskPriorityBadge
