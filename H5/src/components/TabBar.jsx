// 底部TabBar组件 - 3项导航：组合、自选、我的
export default function TabBar({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'portfolio', label: '组合', icon: 'star' },
    { id: 'watchlist', label: '自选', icon: 'chart' },
    { id: 'my', label: '我的', icon: 'user' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50">
      <div className="flex justify-around py-2">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => onTabChange && onTabChange(tab.id)}
            className={`flex flex-col items-center py-1 px-6 ${activeTab === tab.id ? 'text-primary' : 'text-gray-400'}`}
          >
            {tab.icon === 'star' && (
              <svg className="w-6 h-6" fill={activeTab === tab.id ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            )}
            {tab.icon === 'chart' && (
              <svg className="w-6 h-6" fill={activeTab === tab.id ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            )}
            {tab.icon === 'user' && (
              <svg className="w-6 h-6" fill={activeTab === tab.id ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
            <span className="text-xs mt-1">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
