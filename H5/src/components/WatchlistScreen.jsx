import React, { useState, useEffect } from 'react'
import { stockApi } from '../api'

// 市场标签颜色映射（富途风格）
const MARKET_COLORS = {
  'US': 'bg-sky-100 text-sky-600',
  'HK': 'bg-emerald-100 text-emerald-600',
  'SH': 'bg-cyan-100 text-cyan-600',
  'SZ': 'bg-violet-100 text-violet-600',
  'CN': 'bg-sky-100 text-sky-600',
}

const MARKET_LABELS = {
  'US': '美股',
  'HK': '港股',
  'SH': '沪市',
  'SZ': '深市',
  'CN': 'A股',
}

export default function WatchlistScreen({ onTrade }) {
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeMarket, setActiveMarket] = useState('ALL')
  const [showAddModal, setShowAddModal] = useState(false)
  const [longPressStock, setLongPressStock] = useState(null)

  // 加载自选股列表
  useEffect(() => {
    loadStocks()
  }, [])

  const loadStocks = async () => {
    try {
      setLoading(true)
      const data = await stockApi.getList()
      setStocks(Array.isArray(data) ? data : data.data || data.results || [])
    } catch (e) {
      console.error('加载自选股失败:', e)
    } finally {
      setLoading(false)
    }
  }

  // 搜索过滤
  const filtered = stocks.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return (s.name || '').toLowerCase().includes(q) || (s.code || '').toLowerCase().includes(q)
  })

  // 市场分组映射：US→美股, HK→港股, SH/SZ/CN→A股
  const marketGroupMap = { 'US': 'US', 'HK': 'HK', 'SH': 'CN', 'SZ': 'CN', 'CN': 'CN' }
  const marketGroupLabels = { 'US': '美股', 'HK': '港股', 'CN': 'A股' }

  // 按市场分组
  const grouped = {}
  filtered.forEach(s => {
    const m = s.market || 'OTHER'
    if (!grouped[m]) grouped[m] = []
    grouped[m].push(s)
  })

  // 市场排序：美股 > 港股 > 沪深
  const marketOrder = ['US', 'HK', 'SH', 'SZ', 'CN', 'OTHER']

  // 构建面包屑标签列表（按市场分组聚合）
  const groupCounts = {}
  filtered.forEach(s => {
    const group = marketGroupMap[s.market] || 'OTHER'
    groupCounts[group] = (groupCounts[group] || 0) + 1
  })
  const marketTabItems = [
    { key: 'ALL', label: '全部', count: filtered.length },
    ...['US', 'HK', 'CN'].filter(g => groupCounts[g]).map(g => ({
      key: g,
      label: marketGroupLabels[g] || g,
      count: groupCounts[g]
    }))
  ]

  // 根据当前选中市场组筛选展示列表
  const sortedMarkets = Object.keys(grouped).sort((a, b) => {
    const ia = marketOrder.indexOf(a)
    const ib = marketOrder.indexOf(b)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })
  const displayStocks = activeMarket === 'ALL'
    ? sortedMarkets.flatMap(m => grouped[m] || [])
    : sortedMarkets.filter(m => marketGroupMap[m] === activeMarket).flatMap(m => grouped[m] || [])

  // 点击股票 → 进入调仓
  const handleStockClick = (stock) => {
    onTrade && onTrade(stock)
  }

  // 长按 → 弹出删除确认（暂不做移除功能）
  // const handleLongPress = (stock) => {
  //   setLongPressStock(stock)
  // }

  // 确认移除自选（暂不做移除功能）
  // const handleRemoveConfirm = async () => {
  //   if (!longPressStock) return
  //   try {
  //     await stockApi.delete(longPressStock.id)
  //     setStocks(prev => prev.filter(s => s.id !== longPressStock.id))
  //     setLongPressStock(null)
  //   } catch (e) {
  //     alert('移除失败: ' + (e.message || '未知错误'))
  //   }
  // }

  // 添加自选成功
  const handleAddSuccess = (newStock) => {
    setStocks(prev => [...prev, newStock])
    setShowAddModal(false)
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* 顶部：搜索栏 + 面包屑 */}
      <div className="sticky top-0 bg-white z-10">
        {/* 第一行：标题 + 搜索框 + 添加按钮 */}
        <div className="px-4 pt-3 pb-2 flex items-center gap-2">
          <h1 className="text-lg font-bold text-gray-900 shrink-0">自选</h1>
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索股票名称/代码"
              className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="shrink-0 px-3 py-2 bg-primary text-white rounded-lg text-xs font-semibold"
          >
            + 添加
          </button>
        </div>
        {/* 第二行：市场面包屑标签（可横向滑动） */}
        <div className="px-4 pb-2 overflow-x-auto flex gap-1.5 scrollbar-hide border-b border-gray-100">
          {marketTabItems.map(item => {
            const isActive = activeMarket === item.key
            return (
              <button
                key={item.key}
                onClick={() => setActiveMarket(item.key)}
                className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                <span>{item.label}</span>
                <span className={isActive ? 'text-white/70' : 'text-gray-400'}>{item.count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 股票列表 */}
      <div className="px-4 py-1">
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">加载中...</div>
        ) : displayStocks.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm mb-1">
              {stocks.length === 0 ? '暂无自选股' : '该市场暂无自选股'}
            </p>
            <p className="text-gray-300 text-xs">点击右上角「添加」开始</p>
          </div>
        ) : (
          <div>
            {displayStocks.map((stock, idx) => {
              const m = stock.market || 'OTHER'
              const displayMarket = m === 'SH' || m === 'SZ' ? 'CN' : m
              const price = stock.current_price || 0
              const change = stock.change_percent || 0
              const isUp = change >= 0
              const changeColor = change === 0 ? 'text-gray-400' : isUp ? 'text-red-500' : 'text-green-500'
              
              return (
                <div
                  key={stock.id}
                  onClick={() => handleStockClick(stock)}
                  className="flex items-center justify-between py-3 border-b border-gray-50 active:bg-gray-50 cursor-pointer"
                >
                  {/* 左侧：市场标签 + 名称(加粗) + 下方代码 */}
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <span className={`shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${MARKET_COLORS[displayMarket] || 'bg-gray-100 text-gray-500'}`}>
                      {displayMarket}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate leading-tight">{stock.name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{stock.code}</p>
                    </div>
                  </div>
                  {/* 右侧：现价(放大加粗) + 涨跌幅 */}
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-[15px] font-bold text-gray-900 tabular-nums leading-tight">
                      {price ? `${price.toFixed(2)}` : '-'}
                    </p>
                    <p className={`text-xs tabular-nums mt-0.5 font-medium ${changeColor}`}>
                      {change > 0 ? '+' : ''}{change.toFixed(2)}%
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 添加自选弹窗 */}
      {showAddModal && (
        <AddStockModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddSuccess}
        />
      )}

      {/* 长按删除确认弹窗（暂不做移除功能） */}
      {/* {longPressStock && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6" onClick={() => setLongPressStock(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-2">移除自选</h3>
            <p className="text-sm text-gray-500 mb-4">
              确定将 <span className="font-semibold text-gray-900">{longPressStock.name}</span> 从自选列表中移除吗？
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setLongPressStock(null)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium"
              >
                取消
              </button>
              <button 
                onClick={handleRemoveConfirm}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium"
              >
                移除
              </button>
            </div>
          </div>
        </div>
      )} */}
    </div>
  )
}

// 添加自选弹窗组件
function AddStockModal({ onClose, onAdd }) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [market, setMarket] = useState('US')
  const [adding, setAdding] = useState(false)

  const handleSubmit = async () => {
    if (!code || !name || adding) return
    setAdding(true)
    try {
      const created = await stockApi.create({ code, name, market })
      onAdd(created)
      onClose()
    } catch (e) { 
      alert('添加失败: ' + (e.message || '未知错误')) 
    }
    finally { setAdding(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={onClose}>
      <div className="bg-white rounded-t-2xl w-full p-4 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-bold text-gray-900">添加自选</h2>
          <button onClick={onClose} className="p-1 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">股票代码 *</label>
            <input 
              value={code} 
              onChange={e => setCode(e.target.value.toUpperCase())} 
              placeholder="如 AAPL、00700.HK" 
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" 
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">股票名称 *</label>
            <input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="如 苹果、腾讯控股" 
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" 
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">市场</label>
            <div className="flex gap-2">
              {Object.entries(MARKET_LABELS).map(([k, v]) => (
                <button 
                  key={k} 
                  onClick={() => setMarket(k)} 
                  className={`flex-1 py-2 rounded-xl text-sm font-medium ${market === k ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button 
          onClick={handleSubmit} 
          disabled={!code || !name || adding} 
          className={`w-full mt-4 py-3 rounded-xl font-semibold ${!code || !name || adding ? 'bg-gray-100 text-gray-300' : 'bg-primary text-white'}`}
        >
          {adding ? '添加中...' : '添加'}
        </button>
      </div>
    </div>
  )
}
