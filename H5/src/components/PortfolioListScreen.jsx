import React, { useState, useEffect } from 'react'
import { formatUpdateTime, formatPercent } from '../data'
import { portfolioApi } from '../api'

function TopHeader({ title }) {
  return (
    <div className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="w-12" />
      <h1 className="text-lg font-bold text-gray-900">{title}</h1>
      <div className="w-12" />
    </div>
  )
}

function smoothLine(points) {
  if (points.length < 2) return ''
  let d = `M${points[0].x},${points[0].y}`
  const t = 0.35
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]
    d += ` C${(p1.x + (p2.x - p0.x) * t).toFixed(2)},${(p1.y + (p2.y - p0.y) * t).toFixed(2)} ${(p2.x - (p3.x - p1.x) * t).toFixed(2)},${(p2.y - (p3.y - p1.y) * t).toFixed(2)} ${p2.x},${p2.y}`
  }
  return d
}

function MiniChart({ portfolioId, fallbackData }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!portfolioId) { setLoading(false); return }
    let cancelled = false
    setLoading(true)
    portfolioApi.getYield(portfolioId, '1m')
      .then(res => { if (!cancelled) setData(res?.data || fallbackData) })
      .catch(() => { if (!cancelled) setData(fallbackData) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [portfolioId])

  if (loading) return <div className="w-full h-[68px] flex items-center justify-center"><div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
  if (!data || data.length === 0) return <div className="w-full h-[68px] flex items-center justify-center text-xs text-gray-400">暂无数据</div>

  const max = Math.max(...data), min = Math.min(...data)
  const padding = 8        // 上下安全边距，曲线最高/低点距容器顶底各留 8px
  const H = 68, W = 100    // viewBox 高度 68，路径在 [8, 60] 区间内
  const scale = (v) => padding + ((max - v) / (max - min || 1)) * (H - 2 * padding)
  const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * W, y: scale(v) }))
  const line = smoothLine(pts)
  const area = line + ` L${W},${H} L0,${H} Z`

  return (
    <svg className="w-full h-[68px]" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs><linearGradient id={`g-${portfolioId}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563EB" stopOpacity="0.15" /><stop offset="100%" stopColor="#2563EB" stopOpacity="0.02" /></linearGradient></defs>
      <path d={area} fill={`url(#g-${portfolioId})`} />
      <path d={line} fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PortfolioCard({ portfolio, onClick }) {
  const total = portfolio.total_return ?? 0
  const daily = portfolio.daily_return ?? 0
  const totalColor = total >= 0 ? '#22C55E' : '#EF4444'
  const dailyColor = daily >= 0 ? '#22C55E' : '#EF4444'

  return (
    <div onClick={onClick} className="bg-white rounded-2xl px-4 py-3 shadow-sm cursor-pointer active:opacity-80 hover:shadow-md flex items-center justify-between">
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
        <div className="text-base font-bold text-gray-900 truncate leading-tight">{portfolio.name}</div>
        <div className="text-xs text-gray-400 leading-tight">更新于 {formatUpdateTime(portfolio.data_update_time)}</div>
        <div className="text-xl font-bold leading-tight mt-0.5" style={{ color: totalColor }}>{formatPercent(total)}</div>
        <div className="text-xs leading-tight" style={{ color: dailyColor }}>日收益 {formatPercent(daily)}</div>
      </div>
      <div className="w-[45%] shrink-0 flex items-center">
        <MiniChart portfolioId={portfolio.id} fallbackData={portfolio.mini_chart_data} />
      </div>
    </div>
  )
}

export default function PortfolioListScreen({ onPortfolioClick, portfolios, onCreatePortfolio }) {
  return (
    <div className="pb-20 bg-gray-50">
      <TopHeader title="HorizonQuant" />
      <div className="p-4 space-y-3">
        {portfolios?.length > 0 ? portfolios.map(p => <PortfolioCard key={p.id} portfolio={p} onClick={() => onPortfolioClick(p)} />) : <div className="text-center py-12 text-gray-400">暂无组合</div>}
        <div className="h-4" />
      </div>
      <button onClick={onCreatePortfolio} className="fixed bottom-24 right-5 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-md hover:shadow-lg active:scale-95">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8h-16" /></svg>
      </button>
    </div>
  )
}