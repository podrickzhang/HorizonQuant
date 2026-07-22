import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams, useParams, Navigate } from 'react-router-dom'
import PortfolioListScreen from './components/PortfolioListScreen'
import PortfolioDetailScreen from './components/PortfolioDetailScreen'
import RebalanceHistoryScreen from './components/RebalanceHistoryScreen'
import LoginScreen from './components/LoginScreen'
import MyScreen from './components/MyScreen'
import CreatePortfolioScreen from './components/CreatePortfolioScreen'
import StopLossCalculatorScreen from './components/StopLossCalculatorScreen'
import StrategyListScreen from './components/StrategyListScreen'
import WatchlistScreen from './components/WatchlistScreen'
import MainLayout from './components/MainLayout'
import { portfolioApi, authApi } from './api'
import ErrorBoundary from './components/ErrorBoundary'

// 检查是否有token
const hasToken = () => !!localStorage.getItem('hq_token')

// 登录页面包装
function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/portfolio'

  const handleLoginSuccess = async (username, password) => {
    await authApi.login(username, password)
    navigate(redirect)
  }

  return <LoginScreen onLoginSuccess={handleLoginSuccess} />
}

// 组合列表页面包装
function PortfolioListPage() {
  const navigate = useNavigate()
  const [portfolios, setPortfolios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)


  // ✅ 无 token，直接在渲染阶段拦截跳转，不等 useEffect
  if (!hasToken()) {
    return <Navigate to="/login?redirect=/portfolio" replace />
  }

  const loadPortfolios = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await portfolioApi.getList()
      setPortfolios(data || [])
    } catch (err) {
      const msg = err.message || ''
      // 后端不可达 或 token 无效(401) → 清除过期token并跳转登录页
      if (msg.includes('后端服务未启动') || msg.includes('401') || msg.includes('Unauthorized') || msg.includes('未授权')) {
        localStorage.removeItem('hq_token')
        navigate('/login?redirect=/portfolio')
        return
      }
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPortfolios()
  }, [])

  const handlePortfolioClick = (portfolio) => {
    navigate(`/portfolio/${portfolio.id}`)
  }

  const handleCreatePortfolio = () => {
    navigate('/create')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-negative mb-4">{error}</p>
          <button onClick={loadPortfolios} className="px-4 py-2 bg-primary text-white rounded-lg">
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <PortfolioListScreen
      portfolios={portfolios}
      onPortfolioClick={handlePortfolioClick}
      onCreatePortfolio={handleCreatePortfolio}
    />
  )
}

// 组合详情页面包装
function PortfolioDetailPage() {
  const navigate = useNavigate()
  const { id: portfolioId } = useParams()
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ✅ 无 token，直接在渲染阶段拦截
  if (!hasToken()) {
    return <Navigate to="/login" replace />
  }

  useEffect(() => {
    if (!portfolioId) {
      navigate('/portfolio')
      return
    }
    loadDetail()
  }, [portfolioId])

  const loadDetail = async () => {
    try {
      setLoading(true)
      const data = await portfolioApi.getDetail(portfolioId)
      setPortfolio(data)
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('后端服务未启动') || msg.includes('401') || msg.includes('Unauthorized') || msg.includes('未授权') || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        localStorage.removeItem('hq_token')
        navigate('/login')
        return
      }
      // 其他错误：显示错误卡片，不白屏
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading || !portfolio) {
    if (error) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-900 font-semibold mb-2">数据加载失败</p>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button onClick={loadDetail} className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium">
              重试
            </button>
          </div>
        </div>
      )
    }
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <PortfolioDetailScreen
      portfolio={portfolio}
      onBack={() => navigate('/portfolio')}
      onViewHistory={() => navigate(`/portfolio/${portfolioId}/history`)}
      refreshDetail={loadDetail}
    />
  )
}

// 创建组合页面包装
function CreatePortfolioPage() {
  const navigate = useNavigate()

  return (
    <CreatePortfolioScreen
      onBack={() => navigate('/portfolio')}
      onSuccess={() => navigate('/portfolio')}
    />
  )
}

// 调仓历史页面包装
function RebalanceHistoryPage() {
  const navigate = useNavigate()
  const { id: portfolioId } = useParams()

  return (
    <RebalanceHistoryScreen
      onBack={() => navigate(`/portfolio/${portfolioId}`)}
      portfolioId={portfolioId}
    />
  )
}

// 我的页面包装
function MyPage() {
  const navigate = useNavigate()
  return <MyScreen onNavigate={(tab) => {
    if (tab === 'portfolio') navigate('/portfolio')
    else if (tab === 'calculator') navigate('/calculator')
    else if (tab === 'strategy') navigate('/strategy')
    else navigate('/my')
  }} />
}

// 止损计算器页面包装
function StopLossCalculatorPage() {
  const navigate = useNavigate()
  return <StopLossCalculatorScreen onBack={() => navigate('/my')} />
}

// 自选页面包装
function WatchlistPage() {
  const navigate = useNavigate()

  if (!hasToken()) {
    return <Navigate to="/login?redirect=/watchlist" replace />
  }

  const handleTrade = (stock) => {
    // TODO: 跳转到选择组合并调仓的页面
    alert(`即将为 ${stock.name} 调仓（功能开发中）`)
  }

  return <WatchlistScreen onTrade={handleTrade} />
}

// 策略页面包装
function StrategyPage() {
  const navigate = useNavigate()
  return <StrategyListScreen onBack={() => navigate('/my')} />
}

// 主应用组件
function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route index element={<Navigate to="/portfolio" replace />} />
        <Route path="/portfolio" element={<MainLayout activeTab="portfolio"><PortfolioListPage /></MainLayout>} />
        <Route path="/watchlist" element={<MainLayout activeTab="watchlist"><WatchlistPage /></MainLayout>} />
        <Route path="/portfolio/:id" element={<MainLayout activeTab="portfolio"><PortfolioDetailPage /></MainLayout>} />
        <Route path="/portfolio/:id/history" element={<MainLayout activeTab="portfolio"><RebalanceHistoryPage /></MainLayout>} />
        <Route path="/create" element={<CreatePortfolioPage />} />
        <Route path="/history/:id" element={<MainLayout activeTab="portfolio"><RebalanceHistoryPage /></MainLayout>} />
        <Route path="/my" element={<MainLayout activeTab="my"><MyPage /></MainLayout>} />
        <Route path="/calculator" element={<StopLossCalculatorPage />} />
        <Route path="/strategy" element={<StrategyPage />} />
      </Routes>
    </ErrorBoundary>
  )
}

// 根组件包装BrowserRouter
export default function Root() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  )
}
