import React from 'react'
import { SampleData, AppColors } from '../data'

function TopHeader({ title, showBack = false, onBack }) {
  return (
    <div className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
      {showBack ? (
        <button onClick={onBack} className="p-2 -ml-2">
          <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      ) : (
        <div className="w-12" />
      )}
      <h1 className="text-lg font-bold text-gray-900">{title}</h1>
      <div className="w-12" />
    </div>
  )
}

function MiniChart({ data, color }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = 100 - ((value - min) / range) * 100
    return `${x},${y}`
  }).join(' ')
  return (
    <div className="w-full h-24 relative bg-gray-100 rounded-lg overflow-hidden">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
      </svg>
    </div>
  )
}

function PortfolioCard({ portfolio, onClick }) {
  const isPositive = portfolio.totalReturn >= 0
  const returnColor = isPositive ? AppColors.positive : AppColors.negative
  return (
    <div onClick={onClick} className="bg-white rounded-2xl p-4 shadow-sm cursor-pointer active:opacity-80">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-gray-900">{portfolio.name}</h3>
          <p className="text-xs text-gray-500">更新于 {portfolio.updateTime}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold" style={{ color: returnColor }}>{isPositive ? '+' : ''}{portfolio.totalReturn}%</p>
          <p className="text-xs" style={{ color: returnColor }}>日收益 {isPositive ? '+' : ''}{portfolio.dailyReturn}%</p>
        </div>
      </div>
      <MiniChart data={portfolio.miniChartData} color={isPositive ? AppColors.positive : AppColors.negative} />
    </div>
  )
}

function BottomNavigationBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
      <div className="flex justify-center py-2">
        <button className="flex flex-col items-center py-1 px-3 text-primary">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <span className="text-xs mt-1">自选</span>
        </button>
      </div>
    </div>
  )
}

export default function PortfolioListScreen({ onPortfolioClick }) {
  return (
    <div className="pb-20">
      <TopHeader title="HorizonQuant" />
      <div className="p-4 space-y-4">
        {SampleData.portfolios.map((portfolio) => (
          <PortfolioCard key={portfolio.id} portfolio={portfolio} onClick={() => onPortfolioClick(portfolio)} />
        ))}
      </div>
      <BottomNavigationBar />
    </div>
  )
}