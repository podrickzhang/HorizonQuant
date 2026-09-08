import React, { useState, useEffect, useRef } from 'react'
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

function PortfolioCard({ portfolio, onClick, onLongPress }) {
  const total = portfolio.total_return ?? 0
  const daily = portfolio.daily_return ?? 0
  const totalColor = total >= 0 ? '#22C55E' : '#EF4444'
  const dailyColor = daily >= 0 ? '#22C55E' : '#EF4444'

  const [pressing, setPressing] = useState(false)
  const timer = useRef(null)
  const longFired = useRef(false)

  const handleTouchStart = () => {
    longFired.current = false
    setPressing(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      longFired.current = true
      if (onLongPress) onLongPress(portfolio.id)
    }, 300)
  }
  const cancelPress = () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    setPressing(false)
  }

  return (
    <div
      onClick={() => { if (longFired.current) { longFired.current = false; return } onClick() }}
      onTouchStart={handleTouchStart}
      onTouchEnd={cancelPress}
      onTouchMove={cancelPress}
      onTouchCancel={cancelPress}
      style={{ transform: pressing ? 'scale(0.97)' : 'none', transition: 'transform 0.12s ease' }}
      className="bg-white rounded-2xl px-4 py-3 shadow-sm cursor-pointer active:opacity-80 hover:shadow-md flex items-center justify-between"
    >
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
  const [items, setItems] = useState(portfolios || [])
  const [sheetId, setSheetId] = useState(null)
  const [pendingId, setPendingId] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => { setItems(portfolios || []) }, [portfolios])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const openSheet = (id) => setSheetId(id)
  const closeSheet = () => setSheetId(null)
  const handleDeleteClick = () => {
    // 先保存待删除 id，再关闭底部面板（closeSheet 会把 sheetId 清零，否则 confirmDelete 会拿到 null）
    setPendingId(sheetId)
    setSheetId(null)
    setConfirmOpen(true)
  }
  const closeConfirm = () => { setConfirmOpen(false); setPendingId(null) }

  const confirmDelete = async () => {
    const id = pendingId
    setConfirmOpen(false)
    try {
      await portfolioApi.delete(id)
      setItems(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      setToast(err.message || '删除失败')
    } finally {
      setPendingId(null)
      setSheetId(null)
    }
  }

  return (
    <div className="pb-20 bg-gray-50">
      <TopHeader title="HorizonQuant" />
      <div className="p-4 space-y-3">
        {items?.length > 0 ? items.map(p => <PortfolioCard key={p.id} portfolio={p} onClick={() => onPortfolioClick(p)} onLongPress={openSheet} />) : <div className="text-center py-12 text-gray-400">暂无组合</div>}
        <div className="h-4" />
      </div>
      <button onClick={onCreatePortfolio} className="fixed bottom-24 right-5 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-md hover:shadow-lg active:scale-95">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8h-16" /></svg>
      </button>

      {/* 长按操作面板 ActionSheet（底部滑出） */}
      <div className={`fixed inset-0 z-40 transition-opacity duration-200 ${sheetId !== null ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-[#00000066]" onClick={closeSheet} />
        <div className={`absolute bottom-0 left-0 right-0 px-3 pb-3 transition-transform duration-200 ${sheetId !== null ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="bg-white rounded-[12px] overflow-hidden">
            <button onClick={handleDeleteClick} className="w-full h-[52px] flex items-center justify-center text-[17px] text-[#F53F3F] active:bg-[#F5F7FA]">删除组合</button>
          </div>
          <div className="h-2" />
          <button onClick={closeSheet} className="w-full h-[52px] flex items-center justify-center bg-white rounded-[12px] text-[17px] text-[#1D2129] active:bg-[#F5F7FA]">取消</button>
        </div>
      </div>

      {/* 二次确认弹窗 */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-8">
          <div className="absolute inset-0 bg-[#00000066]" onClick={closeConfirm} />
          <div className="relative bg-white rounded-[12px] w-full max-w-[320px] px-5 py-5">
            <h2 className="text-center text-[17px] font-medium text-[#1D2129] mb-2">确认删除组合</h2>
            <p className="text-center text-[14px] text-[#86909C] mb-5">删除后该组合全部历史数据将无法恢复，是否继续？</p>
            <div className="flex gap-3">
              <button onClick={closeConfirm} className="flex-1 h-11 rounded-[8px] bg-[#F2F3F5] text-[15px] text-[#1D2129] active:opacity-80">取消</button>
              <button onClick={confirmDelete} className="flex-1 h-11 rounded-[8px] bg-white border border-[#E5E7EB] text-[15px] text-[#F53F3F] active:opacity-80">确认删除</button>
            </div>
          </div>
        </div>
      )}

      {/* 错误 Toast */}
      {toast && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[60] bg-black/80 text-white text-[13px] px-4 py-2 rounded-lg whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  )
}