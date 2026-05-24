const colorMap = {
  blue: {
    card: 'bg-white border-blue-100',
    iconWrap: 'bg-blue-100 text-blue-600',
    value: 'text-gray-800',
    accent: 'bg-blue-500',
  },
  green: {
    card: 'bg-white border-green-100',
    iconWrap: 'bg-green-100 text-green-600',
    value: 'text-gray-800',
    accent: 'bg-green-500',
  },
  yellow: {
    card: 'bg-white border-amber-100',
    iconWrap: 'bg-amber-100 text-amber-600',
    value: 'text-gray-800',
    accent: 'bg-amber-400',
  },
  red: {
    card: 'bg-white border-red-100',
    iconWrap: 'bg-red-100 text-red-600',
    value: 'text-gray-800',
    accent: 'bg-red-500',
  },
  purple: {
    card: 'bg-white border-purple-100',
    iconWrap: 'bg-purple-100 text-purple-600',
    value: 'text-gray-800',
    accent: 'bg-purple-500',
  },
}

const StatsCard = ({ title, value, icon, color = 'blue', subtitle }) => {
  const c = colorMap[color] || colorMap.blue

  return (
    <div className={`relative ${c.card} rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}>
      <div className={`absolute top-0 left-0 w-1 h-full ${c.accent} rounded-l-2xl`} />
      <div className="pl-5 pr-5 pt-5 pb-4 flex items-start gap-4">
        <div className={`flex-shrink-0 ${c.iconWrap} p-3 rounded-xl`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider truncate">{title}</p>
          <p className={`text-3xl font-bold ${c.value} mt-1 leading-none`}>{value ?? '—'}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}

export default StatsCard
