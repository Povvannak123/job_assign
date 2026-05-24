import Badge from '../ui/Badge'

const statusConfig = {
  not_started: { label: 'Not Started', variant: 'gray' },
  in_progress: { label: 'In Progress', variant: 'blue' },
  completed: { label: 'Completed', variant: 'green' },
}

const TaskStatusBadge = ({ status }) => {
  const config = statusConfig[status] || statusConfig.not_started
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export default TaskStatusBadge
