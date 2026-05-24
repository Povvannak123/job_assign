import { useState } from 'react'

const FeaturePage = ({ title, section, description, icon, badge, tabs }) => {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-2xl px-6 py-5 flex items-center gap-4 text-white shadow-sm">
        <div className="flex-shrink-0 bg-white/20 p-3 rounded-xl">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-red-200 text-xs font-semibold uppercase tracking-wider mb-0.5">{section}</p>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-red-100 text-sm mt-0.5">{description}</p>
        </div>
        {badge && (
          <span className="flex-shrink-0 bg-green-400 text-white text-xs font-bold uppercase px-2.5 py-1 rounded-lg tracking-wide">
            {badge}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === i
                  ? 'text-red-600 border-red-500 bg-red-50/30'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.icon && <span className="w-4 h-4 opacity-70">{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </div>
        <div>{tabs[activeTab]?.content}</div>
      </div>
    </div>
  )
}

export default FeaturePage
