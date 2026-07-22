import React, { useState, useEffect } from 'react'
import { AppColors } from '../data'
import { authApi, portfolioApi } from '../api'

// 菜单项组件
function MenuItem({ icon, label, onClick, showBorder = true }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 py-3 px-4 bg-white active:opacity-70 ${showBorder ? 'border-b border-gray-100' : ''}`}
    >
      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1">
        <span className="text-sm text-gray-900">{label}</span>
      </div>
      <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  )
}

// 图标组件
const Icons = {
  // 持仓/组合 — 饼图/组合图标
  portfolio: (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c1.93 0 3.68.69 5.05 1.83L12 12V4z" fill="#3B82F6"/>
      <path d="M12 4v8l5.05-4.17A7.96 7.96 0 0012 4z" fill="#93C5FD"/>
    </svg>
  ),
  // 交易记录 — 折线趋势图标
  trade: (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none">
      <path d="M3 17l4-4 4 4 6-6 4 4" stroke="#F59E0B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17 11l4 4V11h-4z" fill="#F59E0B" opacity={0.3}/>
    </svg>
  ),
  // 资金流水 — 钱币流转图标
  fund: (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#10B981" strokeWidth={2}/>
      <path d="M9 9.5c0-1.38 1.34-2.5 3-2.5s3 1.12 3 2.5-1.34 2.5-3 2.5-3 1.12-3 2.5 1.34 2.5 3 2.5 3-1.12 3-2.5" stroke="#10B981" strokeWidth={1.8} strokeLinecap="round"/>
      <path d="M12 5.5V4M12 20v-1.5" stroke="#10B981" strokeWidth={2} strokeLinecap="round"/>
    </svg>
  ),
  // 我的策略 — 灯泡/智慧图标
  strategy: (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none">
      <path d="M9 21h6M12 3a6 6 0 00-3.5 10.87V17h7v-3.13A6 6 0 0012 3z" stroke="#8B5CF6" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 17h6" stroke="#8B5CF6" strokeWidth={1.8} strokeLinecap="round"/>
      <path d="M10 14.5c.67-.33 1.33-.33 2 0s1.33.33 2 0" stroke="#8B5CF6" strokeWidth={1.2} strokeLinecap="round" opacity={0.5}/>
    </svg>
  ),
  // 止损计算器 — 计算器图标
  calculator: (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="2" width="16" height="20" rx="2" stroke="#10B981" strokeWidth="1.8"/>
      <rect x="7" y="5" width="10" height="5" rx="1" fill="#10B981" opacity="0.15" stroke="#10B981" strokeWidth="1.2"/>
      <line x1="7" y1="13" x2="10" y2="13" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="12" y1="13" x2="17" y2="13" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="7" y1="16" x2="10" y2="16" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="12" y1="16" x2="17" y2="16" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="7" y1="19" x2="10" y2="19" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round"/>
      <rect x="12" y="17.5" width="5" height="3" rx="1" fill="#10B981"/>
    </svg>
  ),

  // 设置 — 齿轮图标（优化版）
  settings: (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none">
      <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="#6B7280" strokeWidth={1.8}/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="#6B7280" strokeWidth={1.5}/>
    </svg>
  ),
}

// 底部导航
function BottomNavigation({ activeTab, onTabChange }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
      <div className="flex justify-around py-2">
        <button 
          onClick={() => onTabChange && onTabChange('portfolio')}
          className={`flex flex-col items-center py-1 px-6 ${activeTab === 'portfolio' ? 'text-primary' : 'text-gray-400'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <span className="text-xs mt-1">自选</span>
        </button>
        <button 
          onClick={() => onTabChange && onTabChange('my')}
          className={`flex flex-col items-center py-1 px-6 ${activeTab === 'my' ? 'text-primary' : 'text-gray-400'}`}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
            <rect x="6" y="14" width="12" height="8" rx="3" stroke="currentColor" strokeWidth="1.8"/>
          </svg>
          <span className="text-xs mt-1">我的</span>
        </button>
      </div>
    </div>
  )
}

export default function MyScreen({ onNavigate }) {
  const [user, setUser] = useState(null)
  const [portfolios, setPortfolios] = useState([])
  const [loading, setLoading] = useState(true)

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await authApi.getMe()
        setUser(userData)
        
        // 获取组合列表
        const portfolioList = await portfolioApi.getList()
        
        // 获取每个组合的详情（包含持仓）
        const portfoliosWithDetails = await Promise.all(
          (portfolioList || []).map(async (p) => {
            try {
              const detail = await portfolioApi.getDetail(p.id)
              return { ...p, holdings: detail.holdings || [] }
            } catch {
              return { ...p, holdings: [] }
            }
          })
        )
        
        setPortfolios(portfoliosWithDetails)
      } catch (err) {
        console.error('加载失败:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // 计算总资产 = 所有持仓的市值之和
  const totalAsset = portfolios.reduce((sum, p) => {
    const holdingsSum = (p.holdings || []).reduce((hSum, h) => hSum + (h.market_value || 0), 0)
    return sum + holdingsSum
  }, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部个人信息 */}
      <div className="bg-white px-4 py-4">
        <div className="flex items-center gap-3">
          {/* 头像 */}
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <span className="text-lg text-gray-500 font-medium">
              {user?.nickname?.charAt(0) || user?.username?.charAt(0) || '我'}
            </span>
          </div>
          
          {/* 昵称和ID */}
          <div className="flex-1">
            <p className="text-base font-bold text-gray-900">
              {user?.nickname || user?.username || '用户'}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">ID: {user?.id}</p>
          </div>
        </div>

        {/* 资产总览 */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-[11px] text-gray-400">总资产</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">¥{totalAsset.toLocaleString()}</p>
          </div>
          <div className="text-center border-l border-gray-100">
            <p className="text-[11px] text-gray-400">持仓市值</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">¥{totalAsset.toLocaleString()}</p>
          </div>
          <div className="text-center border-l border-gray-100">
            <p className="text-[11px] text-gray-400">组合数</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{portfolios.length}</p>
          </div>
        </div>
      </div>

      {/* 功能入口 */}
      <div className="mt-3 bg-white">
        <MenuItem 
          icon={Icons.portfolio}
          label="持仓/组合"
          onClick={() => onNavigate && onNavigate('portfolios')}
          showBorder={true}
        />
        <MenuItem 
          icon={Icons.trade}
          label="交易记录"
          onClick={() => onNavigate && onNavigate('history')}
          showBorder={false}
        />
      </div>

      <div className="mt-3 bg-white">
        <MenuItem 
          icon={Icons.fund}
          label="资金流水"
          onClick={() => {}}
          showBorder={true}
        />
        <MenuItem 
          icon={Icons.strategy}
          label="我的策略"
          onClick={() => onNavigate && onNavigate('strategy')}
          showBorder={true}
        />
        <MenuItem 
          icon={Icons.calculator}
          label="止损计算器"
          onClick={() => onNavigate && onNavigate('calculator')}
          showBorder={false}
        />
      </div>

      <div className="mt-3 bg-white">
        <MenuItem 
          icon={Icons.settings}
          label="设置"
          onClick={() => {}}
          showBorder={false}
        />
      </div>

      {/* 版本信息 */}
      <div className="text-center py-6">
        <p className="text-xs text-gray-400">HorizonQuant v1.0.0</p>
      </div>
    </div>
  )
}