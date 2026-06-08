import React from 'react'
import { SampleData, AppColors } from '../data'

function DetailCard({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm mb-4 ${className}`}>
      {children}
    </div>
  )
}

function DetailHeader({ title, onBack }) {
  return (
    <div className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
      <button onClick={onBack} className="p-2 -ml-2">
        <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 className="text-lg font-bold text-gray-900">{title}</h1>
      <div className="w-12" />
    </div>
  )
}

function RebalanceItem({ record }) {
  const isBuy = record.type === 'BUY'
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isBuy ? 'bg-blue-50' : 'bg-red-50'}`}>
        <svg className={`w-4 h-4 ${isBuy ? 'text-primary' : 'text-negative'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isBuy ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-900">{record.date.slice(5)} {isBuy ? '买入' : '卖出'} {record.stockName}</p>
        <p className="text-xs text-gray-500 mt-1">{record.shares > 0 ? '+' : ''}{record.shares}股</p>
      </div>
    </div>
  )
}

export default function PortfolioDetailScreen({ portfolio, onBack, onViewHistory }) {
  const isPositive = portfolio.totalReturn >= 0
  const returnColor = isPositive ? AppColors.positive : AppColors.negative
  const chartData = portfolio.miniChartData
  const max = Math.max(...chartData)
  const min = Math.min(...chartData)
  const range = max - min || 1
  const chartPoints = chartData.map((value, index) => {
    const x = (index / (chartData.length - 1)) * 100
    const y = 100 - ((value - min) / range) * 100
    return `${x},${y}`
  }).join(' ')
  return (
    <div className="pb-24">
      <DetailHeader title={portfolio.name} onBack={onBack} />
      <div className="p-4 space-y-4">
        <DetailCard>
          <div>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-3xl font-bold" style={{ color: returnColor }}>{isPositive ? '+' : ''}{portfolio.totalReturn}%</span>
              <span className="text-sm text-gray-500 mb-1">总收益</span>
            </div>
            <div className="flex gap-6 mt-3">
              <div><p className="text-xs text-gray-500">月收益</p><p className="text-sm font-medium text-positive">+5.23%</p></div>
              <div><p className="text-xs text-gray-500">净值</p><p className="text-sm font-medium text-gray-900">1.3472</p></div>
            </div>
          </div>
        </DetailCard>
        <DetailCard>
          <div>
            <h3 className="font-bold text-gray-900 mb-4">收益率走势</h3>
            <div className="w-full h-60 bg-gray-100 rounded-lg relative overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline fill="none" stroke={AppColors.primary} strokeWidth="2" points={chartPoints} />
              </svg>
            </div>
          </div>
        </DetailCard>
        <DetailCard>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-900">当前仓位</h3>
            <span className="text-lg font-bold text-primary">85%</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full w-[85%] bg-gradient-to-r from-blue-400 to-primary rounded-full"></div>
          </div>
        </DetailCard>
        <DetailCard>
          <div>
            <h3 className="font-bold text-gray-900 mb-3">持仓明细</h3>
            {SampleData.holdings.map((holding, index) => (
              <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                <div><p className="text-sm font-medium text-gray-900">{holding.name}</p><p className="text-xs text-gray-500">{holding.code}</p></div>
                <div className="text-right"><p className="text-sm text-gray-900">{holding.proportion}%</p></div>
              </div>
            ))}
          </div>
        </DetailCard>
        <DetailCard>
          <div>
            <h3 className="font-bold text-gray-900 mb-3">最近调仓</h3>
            {SampleData.rebalanceRecords.slice(0, 2).map((record) => (<RebalanceItem key={record.id} record={record} />))}
            <button onClick={onViewHistory} className="w-full py-3 text-sm text-primary font-medium">查看全部调仓记录</button>
          </div>
        </DetailCard>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-safe">
        <div className="flex gap-3">
          <button className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold">模拟买入</button>
          <button className="flex-1 border border-primary text-primary py-3 rounded-lg font-semibold">模拟卖出</button>
        </div>
      </div>
    </div>
  )
}