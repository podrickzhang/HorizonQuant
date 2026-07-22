// 共享布局 - 带TabBar
import React from 'react'
import TabBar from './TabBar'
import { useLocation, useNavigate } from 'react-router-dom'

export default function MainLayout({ children, activeTab }) {
  const location = useLocation()
  const navigate = useNavigate()
  
  // 如果没有传入 activeTab，根据路径自动判断
  if (!activeTab) {
    const path = location.pathname
    activeTab = 'portfolio'
    if (path === '/my' || path.startsWith('/my')) {
      activeTab = 'my'
    } else if (path === '/watchlist') {
      activeTab = 'watchlist'
    }
  }
  
  const handleTabChange = (tab) => {
    if (tab === 'portfolio') {
      navigate('/portfolio')
    } else if (tab === 'watchlist') {
      navigate('/watchlist')
    } else if (tab === 'my') {
      navigate('/my')
    }
  }
  
  return (
    <div className="min-h-screen bg-background">
      {children}
      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  )
}
