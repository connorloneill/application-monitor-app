import { useState } from 'react'
import GeneralTab from '../components/devtools/GeneralTab'
import AiUsageTab from '../components/devtools/AiUsageTab'
import SystemMappingsTab from '../components/devtools/SystemMappingsTab'
import ModelOverridesTab from '../components/devtools/ModelOverridesTab'
import BatchComparisonTab from '../components/devtools/BatchComparisonTab'
import RatingSummaryTab from '../components/devtools/RatingSummaryTab'

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'ai-usage', label: 'AI Usage' },
  { id: 'system-mappings', label: 'System Mappings' },
  { id: 'models', label: 'Models' },
  { id: 'batch-comparison', label: 'Batch Comparison' },
  { id: 'rating-summary', label: 'Rating Summary' },
] as const

type TabId = (typeof TABS)[number]['id']

const TAB_COMPONENTS: Record<TabId, React.FC> = {
  general: GeneralTab,
  'ai-usage': AiUsageTab,
  'system-mappings': SystemMappingsTab,
  models: ModelOverridesTab,
  'batch-comparison': BatchComparisonTab,
  'rating-summary': RatingSummaryTab,
}

export default function DevToolsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('general')
  const ActiveComponent = TAB_COMPONENTS[activeTab]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Dev Tools</h1>

      {/* Tab bar */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-secondary text-brand-secondary dark:text-brand-accent'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Active tab content */}
      <ActiveComponent />
    </div>
  )
}
