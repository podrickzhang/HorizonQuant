import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { formatPercent } from '../data'
import { portfolioApi } from '../api'

const PERIODS = [
  { key: '1m', label: '近1月' },
  { key: '3m', label: '近3月' },
  { key: '1y', label: '近1年' },
  { key: 'all', label: '成立以来' },
]

export default function YieldChart({ data: initialData, dataUpdateTime, portfolioId }) {
  const [selectedPeriod, setSelectedPeriod] = useState('all')
  const [hoverIndex, setHoverIndex] = useState(null)
  const [serverData, setServerData] = useState(null)  // { data: [], dates: [] }
  const [serverTotal, setServerTotal] = useState(initialData?.[initialData.length - 1] || 0)
  const [loading, setLoading] = useState(false)
  const [dataStale, setDataStale] = useState(false)
  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // 获取容器实际宽度
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      for (const e of entries) setContainerWidth(e.contentRect.width)
    })
    observer.observe(el)
    setContainerWidth(el.getBoundingClientRect().width)
    return () => observer.disconnect()
  }, [])

  // 切换周期时从后端拉数据
  useEffect(() => {
    if (!portfolioId) return
    let cancelled = false
    setLoading(true)
    portfolioApi.getYield(portfolioId, selectedPeriod)
      .then(res => {
        if (cancelled) return
        setServerData({ data: res.data, dates: res.dates })
        setServerTotal(res.total_return)
        setDataStale(res.data_stale === true)
      })
      .catch(() => {
        if (cancelled) return
        // API 失败时用本地数据
        if (initialData && initialData.length > 0) {
          setServerData(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [portfolioId, selectedPeriod, initialData])

  // 最终使用的数据：优先 serverData，其次 initialData
  const { data: chartData, dates } = useMemo(() => {
    if (serverData && serverData.data.length > 0) {
      return { data: serverData.data, dates: serverData.dates.map(d => new Date(d)) }
    }
    if (initialData && initialData.length > 0 && dataUpdateTime) {
      const end = new Date(dataUpdateTime)
      const ds = initialData.map((_, i) => {
        const d = new Date(end)
        d.setDate(d.getDate() - (initialData.length - 1 - i))
        return d
      })
      return { data: initialData, dates: ds }
    }
    return { data: initialData || [], dates: [] }
  }, [serverData, initialData, dataUpdateTime])

  // 图表尺寸
  const MARGIN = { top: 16, right: 12, bottom: 36, left: 52 }
  const CHART_HEIGHT = 240
  const width = Math.max(containerWidth, 200)
  const chartW = width - MARGIN.left - MARGIN.right
  const chartH = CHART_HEIGHT - MARGIN.top - MARGIN.bottom

  // Y 坐标映射
  const yVals = chartData
  const yMin = Math.min(...yVals, 0)
  const yMax = Math.max(...yVals, 0)
  const yRng = yMax - yMin || 1
  const yLo = yMin - yRng * 0.12
  const yHi = yMax + yRng * 0.12

  const xS = i => (i / (yVals.length - 1 || 1)) * chartW
  const yS = v => chartH - ((v - yLo) / (yHi - yLo)) * chartH

  // 曲线路径
  const linePts = yVals.map((v, i) => `${xS(i)},${yS(v)}`).join(' ')
  const areaPath = `M 0,${chartH} L ${linePts} L ${chartW},${chartH} Z`

  // Y 轴刻度
  const yTicks = []
  const tc = 4
  for (let i = 0; i <= tc; i++) {
    const v = yLo + (yHi - yLo) * (i / tc)
    yTicks.push({ value: v, y: yS(v) })
  }

  // X 轴刻度 - 按时间跨度自动选格式
  const calcXTicks = () => {
    const ticks = []
    if (dates.length < 2) return ticks
    
    const first = dates[0]
    const last = dates[dates.length - 1]
    const spanDays = (last - first) / 86400000
    
    // 生成 4-6 个均匀分布的候选索引
    const target = Math.max(3, Math.min(5, Math.floor(spanDays / 21) + 2))
    const step = Math.max(1, Math.floor((dates.length - 1) / target))
    const indices = []
    for (let i = 0; i < dates.length; i += step) indices.push(i)
    if (indices[indices.length - 1] < dates.length - 1) indices.push(dates.length - 1)
    
    // 根据跨度选择标签格式
    const fmtLabel = (d, prevLabel) => {
      if (spanDays > 500) {
        // 跨年 → 显示年份 "2023" "2024" "2025"
        const y = `${d.getFullYear()}`
        return y === prevLabel ? null : y
      }
      if (spanDays > 90) {
        // 跨季度 → 显示 "23/06" "23/12"（年份简写+月）
        const y = d.getFullYear()
        const m = d.getMonth() + 1
        const ym = `${String(y).slice(2)}/${String(m).padStart(2, '0')}`
        // 与前一个标签同月则跳过
        if (prevLabel && prevLabel.endsWith(`/${String(m).padStart(2, '0')}`) && Math.abs(y - first.getFullYear()) < 2) return null
        return ym
      }
      if (spanDays > 14) {
        // 周级别 → "6/3" "6/17" "7/1"
        return `${d.getMonth() + 1}/${d.getDate()}`
      }
      // 日级别 → "6/3" 带星期
      const weekdays = ['日','一','二','三','四','五','六']
      return `${d.getMonth() + 1}/${d.getDate()}周${weekdays[d.getDay()]}`
    }
    
    indices.forEach((idx) => {
      const label = fmtLabel(dates[idx], ticks.length > 0 ? ticks[ticks.length - 1].label : null)
      if (label) ticks.push({ index: idx, label })
    })
    
    return ticks
  }
  
  const xTicks = calcXTicks()

  // 鼠标悬停
  const handleMouseMove = useCallback(e => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left - MARGIN.left
    const idx = Math.round((x / chartW) * (yVals.length - 1))
    if (idx >= 0 && idx < yVals.length) setHoverIndex(idx)
  }, [yVals.length, chartW])

  // 空数据 / 加载态
  if (!chartData || chartData.length === 0) {
    return (
      <div ref={containerRef}>
        <div className="flex gap-2 mb-3 overflow-x-auto">
          {PERIODS.map(p => (
            <button key={p.key} disabled
              className="px-3 py-1.5 rounded-full text-sm font-medium bg-white border border-gray-200 text-gray-300"
            >{p.label}</button>
          ))}
        </div>
        <div className="w-full h-60 bg-gray-50 rounded-lg flex items-center justify-center">
          {loading
            ? <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            : <span className="text-gray-400">暂无数据</span>
          }
        </div>
      </div>
    )
  }

  const hovVal = hoverIndex !== null ? chartData[hoverIndex] : null
  const hovDate = hoverIndex !== null && dates[hoverIndex] ? dates[hoverIndex] : null

  let tx = 0, ty = 0
  if (hoverIndex !== null) {
    tx = MARGIN.left + xS(hoverIndex)
    ty = MARGIN.top + yS(chartData[hoverIndex])
  }

  return (
    <div ref={containerRef}>
      {/* 周期切换 */}
      <div className="flex gap-2 mb-3 overflow-x-auto">
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => { setSelectedPeriod(p.key); setHoverIndex(null) }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              selectedPeriod === p.key
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {p.label}
          </button>
        ))}
        {loading && (
          <div className="inline-flex items-center ml-1">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* 图表 */}
      <div className="relative select-none" style={{ height: CHART_HEIGHT }}>
        <svg width={width} height={CHART_HEIGHT}
          className="absolute inset-0"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
          style={{ touchAction: 'none' }}
        >
          <defs>
            <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
            {/* 水平网格线 */}
            {yTicks.map((t, i) => (
              <line key={i} x1={0} y1={t.y} x2={chartW} y2={t.y}
                stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3 3" />
            ))}
            {/* 0 轴 */}
            {yLo < 0 && yHi > 0 && (
              <line x1={0} y1={yS(0)} x2={chartW} y2={yS(0)}
                stroke="#9CA3AF" strokeWidth="1.5" strokeDasharray="5 4" />
            )}
            {/* 渐变填充 */}
            <path d={areaPath} fill="url(#areaG)" />
            {/* 曲线 */}
            <polyline points={linePts} fill="none" stroke="#2563EB"
              strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {/* 悬停 */}
            {hoverIndex !== null && (
              <>
                <line x1={xS(hoverIndex)} y1={0} x2={xS(hoverIndex)} y2={chartH}
                  stroke="#2563EB" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
                <line x1={0} y1={yS(hovVal)} x2={chartW} y2={yS(hovVal)}
                  stroke="#2563EB" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
                <circle cx={xS(hoverIndex)} cy={yS(hovVal)} r="5"
                  fill="#2563EB" stroke="#fff" strokeWidth="2" />
              </>
            )}
          </g>
        </svg>

        {/* Y 轴标签（HTML 渲染） */}
        {yTicks.map((t, i) => (
          <div key={i} className="absolute text-xs text-gray-400 leading-none pointer-events-none"
            style={{ left: '4px', top: MARGIN.top + t.y, transform: 'translateY(-50%)', fontSize: '11px' }}>
            {formatPercent(t.value)}
          </div>
        ))}

        {/* X 轴标签（HTML 渲染） */}
        {xTicks.map((t, i) => (
          <div key={i} className="absolute text-xs text-gray-400 leading-none pointer-events-none"
            style={{ left: MARGIN.left + xS(t.index), top: CHART_HEIGHT - 14, transform: 'translateX(-50%)', fontSize: '11px' }}>
            {t.label}
          </div>
        ))}

        {/* Tooltip */}
        {hoverIndex !== null && (
          <div className="absolute bg-gray-900 text-white rounded-lg px-3 py-2 shadow-lg pointer-events-none"
            style={{
              left: Math.min(tx, width - 140),
              top: Math.max(ty - 60, 4),
              fontSize: '12px',
              zIndex: 10,
              whiteSpace: 'nowrap',
            }}
          >
            <div className="font-medium mb-0.5 text-gray-300" style={{ fontSize: '11px' }}>
              {hovDate?.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block shrink-0"></span>
              <span className="font-semibold" style={{ color: hovVal >= 0 ? '#34C759' : '#FF3B30' }}>
                收益率 {formatPercent(hovVal)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 数据过期提示 */}
      {dataStale && (
        <div className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1 mb-2">
          数据截止 {dates.length > 0 ? dates[dates.length - 1].toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}，暂无最新净值
        </div>
      )}

      {/* 底部收益概览 */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-400">
          {dates.length > 0 &&
            (() => { const f = d => `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`; return `${f(dates[0])}~${f(dates[dates.length-1])}` })()
          }
        </div>
        <div className="text-sm font-semibold" style={{ color: serverTotal >= 0 ? '#34C759' : '#FF3B30' }}>
          累计 {formatPercent(serverTotal)}
        </div>
      </div>
    </div>
  )
}
