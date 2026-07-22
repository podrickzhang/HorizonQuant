import React, { useState, useEffect, useMemo } from 'react'
import { AppColors, formatPercent, formatCurrency, RebalanceType } from '../data'
import { rebalanceApi } from '../api'

// ─── Stats Card（调仓数据概览）───
function StatsCard({ records }) {
  // 计算指标
  const totalTrades = records.length
  const profitableCount = records.filter(r => r.profit !== null && r.profit !== undefined && r.profit > 0).length
  const winRate = totalTrades > 0 ? (profitableCount / totalTrades * 100) : 0

  // 最近3个月
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const recentRecords = records.filter(r => {
    const d = new Date(r.operate_time)
    return d >= threeMonthsAgo
  })
  const recentProfitable = recentRecords.filter(r => r.profit !== null && r.profit !== undefined && r.profit > 0).length

  // 最赚钱的股票（按 stock.code 汇总 profit）
  const stockProfitMap = {}
  records.forEach(r => {
    if (r.profit === null || r.profit === undefined || !r.stock) return
    const code = r.stock.code || r.stock.name || '未知'
    if (!stockProfitMap[code]) stockProfitMap[code] = { name: r.stock.name || code, totalProfit: 0 }
    stockProfitMap[code].totalProfit += r.profit
  })
  const bestStock = Object.values(stockProfitMap).sort((a, b) => b.totalProfit - a.totalProfit)[0]

  return (
    <div className="mx-4 mt-5 mb-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* 主数据区 */}
        <div className="pt-5 pb-2 px-5">
          <p className="text-sm font-bold text-gray-900 mb-4">调仓数据概览</p>
          <div className="flex justify-between">
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold text-gray-900">{totalTrades}<span className="text-sm font-normal text-gray-400 ml-0.5">次</span></p>
              <p className="text-xs text-gray-400 mt-1.5">调仓总次数</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold text-amber-500">{profitableCount}<span className="text-sm font-normal text-gray-400 ml-0.5">次</span></p>
              <p className="text-xs text-gray-400 mt-1.5">调仓赚钱次数</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold text-amber-500">{winRate.toFixed(1)}<span className="text-sm font-normal text-gray-400 ml-0.5">%</span></p>
              <p className="text-xs text-gray-400 mt-1.5">调仓胜率</p>
            </div>
          </div>
        </div>

        {/* 底部信息条 */}
        <div className="bg-amber-50 px-5 py-3 mt-3">
          <div className="space-y-1">
            <p className="text-xs text-gray-500">
              最近3个月调仓<span className="text-gray-700 font-medium">{recentRecords.length}</span>次，<span className="text-gray-700 font-medium">{recentProfitable}</span>次赚了钱
            </p>
            {bestStock && (
              <p className="text-xs text-gray-500">
                最赚钱的股票：<span className="text-gray-700 font-medium">{bestStock.name}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── History Record Card ───
function HistoryRecordCard({ record }) {
  const isBuy = record.type === RebalanceType.BUY
  const stock = record.stock || {}

  // 仓位变化文字
  const sharesText = `${record.shares > 0 ? '+' : ''}${record.shares}股`
  const changePercent = record.change_percent
  const percentText = changePercent !== null && changePercent !== undefined
    ? `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`
    : ''

  return (
    <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-50">
      {/* 顶部：操作标签 + 标的名称 + 右箭头 */}
      <div className="flex justify-between items-center mb-2.5">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            isBuy ? 'bg-blue-50 text-primary' : 'bg-red-50 text-negative'
          }`}>
            {isBuy ? '买入' : '卖出'}
          </span>
          <span className="font-bold text-gray-900 text-sm">{stock.name} <span className="font-normal text-gray-400">{stock.code}</span></span>
        </div>
        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {/* 中间数据：两列布局 */}
      <div className="flex gap-4 mb-0">
        {/* 左列 */}
        <div className="flex-1 space-y-1.5">
          <div>
            <p className="text-xs text-gray-400 leading-tight">仓位变化</p>
            <p className="text-[13px] font-semibold text-gray-900 leading-tight">
              {sharesText}{percentText ? `（${percentText}）` : ''}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 leading-tight">成交金额</p>
            <p className="text-[13px] font-semibold text-gray-900 leading-tight">{formatCurrency(record.amount)}</p>
          </div>
        </div>
        {/* 右列 */}
        <div className="flex-1 space-y-1.5">
          {!isBuy && record.cost_price != null && record.cost_price !== undefined ? (
            <>
              <div>
                <p className="text-xs text-gray-400 leading-tight">买入价</p>
                <p className="text-[13px] font-semibold text-gray-900 leading-tight">{formatCurrency(record.cost_price)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 leading-tight">卖出价</p>
                <p className="text-[13px] font-semibold text-gray-900 leading-tight">{formatCurrency(record.price)}</p>
              </div>
            </>
          ) : (
            <div>
              <p className="text-xs text-gray-400 leading-tight">{isBuy ? '买入价' : '卖出价'}</p>
              <p className="text-[13px] font-semibold text-gray-900 leading-tight">{formatCurrency(record.price)}</p>
            </div>
          )}
          {/* 如果有该笔盈利才显示 */}
          {record.profit !== null && record.profit !== undefined && (
            <div>
              <p className="text-xs text-gray-400 leading-tight">该笔盈利</p>
              <p className={`text-[13px] font-semibold leading-tight ${record.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(record.profit)}
              </p>
            </div>
          )}
          {/* 占位保持对齐 */}
          {record.profit === null && <div />}
        </div>
      </div>

      {/* 底部：调仓理由 */}
      {record.reason && (
        <div className="pt-2 mt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400 leading-tight">调仓理由：{record.reason}</p>
        </div>
      )}
    </div>
  )
}

// ─── Main Screen ───
export default function RebalanceHistoryScreen({ onBack, portfolioId }) {
  const [search, setSearch] = useState('')
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadRecords = async (searchTerm = '') => {
    try {
      setLoading(true)
      setError(null)
      const params = {}
      if (portfolioId) params.portfolio_id = portfolioId
      if (searchTerm.trim()) params.search = searchTerm.trim()

      const data = await rebalanceApi.getList(params)
      setRecords(data || [])
    } catch (err) {
      console.error('加载调仓记录失败:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    loadRecords()
  }, [portfolioId])

  // 点击查询按钮触发搜索
  const handleSearch = () => {
    console.log('[搜索] search=', search, 'portfolioId=', portfolioId)
    loadRecords(search)
  }

  // 按日期分组（直接使用 records，已按后端返回顺序）
  const groupedRecords = useMemo(() => {
    return records.reduce((acc, record) => {
      const d = new Date(record.operate_time)
      const date = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
      if (!acc[date]) acc[date] = []
      acc[date].push(record)
      return acc
    }, {})
  }, [records])

  // 加载中
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
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
          <button onClick={loadRecords} className="px-4 py-2 bg-primary text-white rounded-lg">
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="bg-white px-4 pt-3 pb-2 sticky top-0 z-10 shadow-sm">
        {/* 顶栏：返回 + 标题 */}
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="p-2 -ml-2">
            <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900">调仓历史</h1>
          <div className="w-9" /> {/* 占位保持居中 */}
        </div>

        {/* 搜索栏 + 查询按钮 */}
        <div className="flex gap-2 mt-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索股票名称或代码"
              className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/20"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium shrink-0"
          >
            查询
          </button>
        </div>
      </div>

      {/* ── 统计卡片 ── */}
      <StatsCard records={records} />

      {/* ── 记录列表 ── */}
      <div className="px-4 pb-20 space-y-6">
        {records.length > 0 ? (
          Object.entries(groupedRecords).map(([date, dateRecords]) => (
            <div key={date}>
              <p className="text-xs text-gray-400 mb-3 pl-0.5">{date}</p>
              <div className="space-y-2">
                {dateRecords.map(record => (
                  <HistoryRecordCard key={record.id} record={record} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">{search ? '暂无匹配记录' : '暂无调仓记录'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
