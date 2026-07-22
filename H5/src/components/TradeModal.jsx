/**
 * TradeModal.jsx - 富途牛牛风格「调仓」页面
 *
 * 结构:
 * 1. 顶栏(返回 + 标题 + 清空)
 * 2. 搜索 + 自选入口
 * 3. 卡片一：当前持仓(横向标签)
 * 4. 卡片二：新增自选(市场筛选标签+列表)
 * 5. 底部确认调仓
 * 6. StockSheet 浮层(买卖/数量/价格)
 * 7. 添加自选弹窗
 */
import React, { useState, useEffect } from 'react'
import { AppColors, RebalanceType } from '../data'
import { rebalanceApi, stockApi } from '../api'

// ── 市场标签 ──
const MARKET_LABELS = { 'HK': '港股', 'CN': 'A股', 'US': '美股' }
const MARKET_COLORS = {
  'HK': { bg: '#FFEBEE', text: '#E53935' },
  'CN': { bg: '#E8F5E9', text: '#43A047' },
  'US': { bg: '#EDE7F6', text: '#5E35B1' },
  'OTHER': { bg: '#ECEFF1', text: '#546E7A' },
}
// 东方财富风格仓位快捷按钮:1/4, 1/3, 1/2, 全部, 2/3
const QUICK_POSITIONS = [
  { label: '1/4仓', value: 25 },
  { label: '1/3仓', value: 33.33 },
  { label: '1/2仓', value: 50 },
  { label: '全部', value: 100 },
  { label: '2/3仓', value: 66.67 },
]

// ── StockSheet ──
function StockSheet({ stock, portfolio, holding, onConfirm, onCancel }) {
  const [tradeType, setTradeType] = useState(RebalanceType.BUY)
  const [inputMode, setInputMode] = useState('shares')
  const [shares, setShares] = useState('')
  const [pct, setPct] = useState('')
  const [price, setPrice] = useState(stock.current_price ?? stock.price ?? '')
  const [error, setError] = useState('')

  const priceNum = parseFloat(price) || 0
  const sharesNum = parseInt(shares) || 0
  const pctNum = parseFloat(pct) || 0
  const totalValue = portfolio.total_portfolio_value || 0
  const cashValue = portfolio.cash || 0
  // 当前持仓市值 = 股数 × 当前价格
  const currentShares = holding?.shares || 0
  const currentProportion = holding?.proportion || 0
  const currentStockValue = currentShares * priceNum
  // 按仓位比例:
  //   买入 → 按组合现金的 % 来算
  //   卖出 → 按当前持仓市值的 % 来算
  const pctAmount = tradeType === RebalanceType.BUY
    ? cashValue * (pctNum / 100)
    : currentStockValue * (pctNum / 100)
  const sharesByPct = priceNum > 0 ? Math.floor(pctAmount / priceNum) : 0
  const amount = inputMode === 'percent' ? pctAmount : priceNum * sharesNum

  const validate = () => {
    const finalShares = inputMode === 'shares' ? sharesNum : sharesByPct
    if (!priceNum || priceNum <= 0) return '请输入价格'
    if (finalShares <= 0) return '请输入股数'
    if (tradeType === RebalanceType.SELL && finalShares > currentShares)
      return `当前持仓仅 ${currentShares} 股,卖出不能超过持仓`
    if (tradeType === RebalanceType.BUY && portfolio?.strategy?.max_stock_pct) {
      const maxPct = Number(portfolio.strategy.max_stock_pct)
      if (maxPct > 0) {
        const maxBuyAmount = cashValue * (maxPct / 100)
        if (amount > maxBuyAmount)
          return `买入金额 ¥${amount.toLocaleString()} 超过策略上限 ¥${maxBuyAmount.toLocaleString()}(${maxPct}%)`
      }
    }
    // 卖出时,仓位的 % 基于当前持仓市值,而非组合总市值
    if (tradeType === RebalanceType.SELL && inputMode === 'percent') {
      if (pctNum > 100) return '卖出比例不能超过100%'
      if (sharesByPct > currentShares) return `当前持仓仅 ${currentShares} 股,最多可卖 ${currentShares} 股`
    }
    return ''
  }
  const errorMsg = validate()
  const isValid = priceNum > 0 && (inputMode === 'shares' ? sharesNum > 0 : pctNum > 0) && !errorMsg

  const handleConfirm = () => {
    const finalShares = inputMode === 'shares' ? sharesNum : sharesByPct
    if (!isValid) return
    onConfirm({
      stock_id: stock.id,
      name: stock.name,
      code: stock.code,
      market: stock.market,
      tradeType,
      shares: finalShares,
      price: priceNum,
      amount: priceNum * finalShares,
    })
  }

  return (
    <div className="fixed inset-x-0 top-0 bottom-20 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative flex flex-col bg-white rounded-t-2xl animate-slide-up max-h-[70vh]">
        {/* drag handle */}
        <div className="w-9 h-1 bg-gray-200 rounded-full mx-auto mt-2 mb-1.5 shrink-0" />
        {/* stock info */}
        <div className="px-4 pb-2 shrink-0 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-gray-900">{stock.name}</span>
              <span className="text-xs text-gray-400">{stock.code}</span>
            </div>
            {stock.current_price ? (
              <div className="flex items-baseline gap-1 mb-0.5">
                <span className="text-xs text-gray-400">当前价</span>
                <span className="text-lg font-bold text-red-500 tabular-nums">¥{typeof stock.current_price === 'number' ? stock.current_price.toFixed(2) : stock.current_price}</span>
              </div>
            ) : null}
            {currentProportion > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-blue-500">持仓 {currentProportion.toFixed(1)}%({currentShares}股)</span>
              </div>
            )}
          </div>
          <button onClick={onCancel} className="shrink-0 p-1 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {/* form content */}
        <div className="flex-1 overflow-y-auto px-4 space-y-2.5">
          {/* trade type */}
          <div className="flex gap-2">
            {[{ type: RebalanceType.BUY, label: '买入', active: 'bg-red-500 text-white' }, { type: RebalanceType.SELL, label: '卖出', active: 'bg-green-500 text-white' }].map(({ type, label, active }) => (
              <button key={type} onClick={() => { setTradeType(type); setError('') }} className={'flex-1 py-1.5 rounded-lg font-semibold text-xs ' + (tradeType === type ? active : 'bg-gray-100 text-gray-500')}>{label}</button>
            ))}
          </div>
          {/* 仓位快捷按钮 - 东方财富风格 */}
          <div className="flex gap-2 flex-wrap">
            {QUICK_POSITIONS.map(({ label, value }) => (
              <button
                key={label}
                onClick={() => { setInputMode('percent'); setPct(String(value)) }}
                className={'flex-1 min-w-[56px] py-2 rounded-lg text-xs font-medium transition-colors ' + (
                  inputMode === 'percent' && Math.abs(parseFloat(pct || 0) - value) < 0.5
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 输入模式切换 */}
          <div className="flex gap-2">
            <button
              onClick={() => { setInputMode('shares'); setPct('') }}
              className={'flex-1 py-2 rounded-lg text-xs font-medium ' + (inputMode === 'shares' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500')}
            >
              按股数
            </button>
            <button
              onClick={() => { setInputMode('percent'); setShares('') }}
              className={'flex-1 py-2 rounded-lg text-xs font-medium ' + (inputMode === 'percent' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500')}
            >
              按仓位比例
            </button>
          </div>
          {/* 输入区域 */}
          {inputMode === 'shares' ? (
            <div>
              <label className="text-[11px] text-gray-500 block mb-1.5">股数</label>
              <input
                type="number"
                value={shares}
                onChange={e => setShares(e.target.value)}
                placeholder="输入股数"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          ) : (
            <div>
              <label className="text-[11px] text-gray-500 block mb-1.5">仓位比例 (%)</label>
              <input
                type="number"
                value={pct}
                onChange={e => { setPct(e.target.value); setError('') }}
                placeholder="输入比例,如 50"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              {pctNum > 0 && (
                <p className="text-[11px] text-gray-400 mt-1.5">
                  ≈ {sharesByPct.toLocaleString()} 股,约 ¥{pctAmount.toLocaleString()}
                </p>
              )}
            </div>
          )}
          {/* 持仓信息区 - 卖出模式显示历史买入价 */}
          {currentShares > 0 && tradeType === RebalanceType.SELL && (
            <div className="p-2.5 bg-orange-50 rounded-lg space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-orange-600/80">当前持仓</span>
                <span className="text-xs font-semibold text-orange-700">{currentShares.toLocaleString()} 股</span>
              </div>
              {holding?.cost_price > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-gray-500">历史买入价</span>
                  <span className="text-xs font-medium text-gray-600">¥{Number(holding.cost_price).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
          <div>
            <label className="text-[11px] text-gray-500 block mb-1.5">价格 (¥)</label>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="输入价格"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          {/* amount preview */}
          {amount > 0 && (
            <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
              <span className="text-xs text-gray-500">{tradeType === RebalanceType.SELL ? '卖出' : '买入'}金额</span>
              <span className={'font-bold text-sm ' + (tradeType === RebalanceType.SELL ? 'text-green-600' : 'text-red-500')}>¥{amount.toLocaleString()}</span>
            </div>
          )}
          {/* error */}
          {errorMsg && (
            <div className="p-2 bg-red-50 rounded-lg text-[11px] text-red-500">{errorMsg}</div>
          )}
        </div>
        {/* confirm button */}
        <div className="shrink-0 px-4 pt-2 pb-3">
          <button onClick={handleConfirm} disabled={!isValid} className={'w-full py-2.5 rounded-lg font-semibold text-sm transition-all ' + (isValid ? (tradeType === RebalanceType.BUY ? 'bg-red-500 text-white shadow-md shadow-red-500/20' : 'bg-green-500 text-white shadow-md shadow-green-500/20') : 'bg-gray-100 text-gray-300')}>确认添加{tradeType === RebalanceType.BUY ? '买入' : '卖出'}</button>
        </div>
      </div>
    </div>
  )
}

// ── AddStockModal ──
function AddStockModal({ onClose, onAdd }) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [market, setMarket] = useState('CN')
  const [adding, setAdding] = useState(false)

  const handleSubmit = async () => {
    if (!code || !name || adding) return
    setAdding(true)
    try {
      const created = await stockApi.create({ code, name, market })
      onAdd(created)  // 使用后端返回的真实股票对象(含真实 ID)
      onClose()
    } catch (e) { alert('添加失败: ' + (e.message || '未知错误')) }
    finally { setAdding(false) }
  }

  return (
    <div className="fixed inset-x-0 top-0 bottom-20 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-2xl px-4 py-4 animate-slide-up">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-bold text-gray-900">添加自选</h2>
          <button onClick={onClose} className="p-1 text-gray-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="space-y-3">
          <div><label className="text-xs text-gray-400 mb-1 block">股票代码 *</label><input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="如 00700.HK" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" /></div>
          <div><label className="text-xs text-gray-400 mb-1 block">股票名称 *</label><input value={name} onChange={e => setName(e.target.value)} placeholder="如 腾讯控股" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" /></div>
          <div><label className="text-xs text-gray-400 mb-1 block">市场 *</label><div className="flex gap-2">{Object.entries(MARKET_LABELS).map(([k, v]) => (<button key={k} onClick={() => setMarket(k)} className={'flex-1 py-2 rounded-xl text-sm font-medium ' + (market === k ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500')}>{v}</button>))}</div></div>
        </div>
        <button onClick={handleSubmit} disabled={!code || !name || adding} className={'w-full mt-4 py-3 rounded-xl font-semibold ' + (!code || !name || adding ? 'bg-gray-100 text-gray-300' : 'bg-blue-500 text-white')}>{adding ? '提交中...' : '添加'}</button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════
export default function TradeModal({ portfolio, onClose, onSuccess }) {
  const holdings = portfolio?.holdings || []
  const totalValue = portfolio?.total_portfolio_value || 0

  const [search, setSearch] = useState('')
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStocks, setSelectedStocks] = useState([])  // items with stock_id, name, code, market, tradeType, shares, price, amount
  const [showSheet, setShowSheet] = useState(false)
  const [sheetStock, setSheetStock] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [cardTwoMarket, setCardTwoMarket] = useState('ALL')

  useEffect(() => {
    stockApi.getList().then(d => { setStocks(Array.isArray(d) ? d : d.data || d.results || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  // 获取某只股票的当前持仓
  const getHolding = (stock) => holdings.find(h => (h.stock?.id || h.stock_id) === stock.id)

  // 过滤 + 分组
  // 展示所有自选标的(不再仅展示持仓股)
  const holdingIds = new Set(holdings.map(h => h.stock?.id || h.stock_id))

  // 搜索过滤(用于市场列表)
  const marketFiltered = search
    ? stocks.filter(s => {
        const q = search.toLowerCase()
        return (s.name || '').toLowerCase().includes(q) || (s.code || '').toLowerCase().includes(q)
      })
    : [...stocks]

  const grouped = {}
  marketFiltered.forEach(s => { const m = s.market || 'OTHER'; if (!grouped[m]) grouped[m] = []; grouped[m].push(s) })

  // 所有自选按添加时间倒序(新增自选卡片用)
  const sortedByTime = [...stocks].sort((a, b) => {
    const ta = a.create_time ? new Date(a.create_time).getTime() : 0
    const tb = b.create_time ? new Date(b.create_time).getTime() : 0
    return tb - ta
  })

  // 新增自选卡片内市场筛选
  const cardTwoMarketGroupMap = { 'US': 'US', 'HK': 'HK', 'SH': 'CN', 'SZ': 'CN', 'CN': 'CN', 'OTHER': 'OTHER' }
  const cardTwoMarketLabels = { 'US': '美股', 'HK': '港股', 'CN': 'A股' }

  const cardTwoCounts = {}
  stocks.forEach(s => {
    const g = cardTwoMarketGroupMap[s.market] || 'OTHER'
    cardTwoCounts[g] = (cardTwoCounts[g] || 0) + 1
  })
  const cardTwoTabItems = [
    { key: 'ALL', label: '全部', count: stocks.length },
    ...['US', 'HK', 'CN'].filter(g => cardTwoCounts[g]).map(g => ({
      key: g,
      label: cardTwoMarketLabels[g] || g,
      count: cardTwoCounts[g]
    }))
  ]

  // 按 market 筛选(如果选中全部则不过滤)
  const sortedByTimeFiltered = cardTwoMarket === 'ALL'
    ? sortedByTime.filter(s => {
        if (!search) return true
        const q = search.toLowerCase()
        return (s.name || '').toLowerCase().includes(q) || (s.code || '').toLowerCase().includes(q)
      })
    : sortedByTime.filter(s => {
        const marketMatch = (cardTwoMarketGroupMap[s.market] || 'OTHER') === cardTwoMarket
        if (!search) return marketMatch
        const q = search.toLowerCase()
        const textMatch = (s.name || '').toLowerCase().includes(q) || (s.code || '').toLowerCase().includes(q)
        return marketMatch && textMatch
      })
  const handleAddStock = (stock) => {
    setSheetStock(stock)
    setShowSheet(true)
  }

  // 浮层确认 → 加入已选列表
  const handleSheetConfirm = (data) => {
    setSelectedStocks(prev => {
      const idx = prev.findIndex(s => s.stock_id === data.stock_id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = data
        return next
      }
      return [...prev, data]
    })
    setShowSheet(false)
    setSheetStock(null)
  }

  // 移除已选
  const handleRemove = (stockId) => {
    setSelectedStocks(prev => prev.filter(s => s.stock_id !== stockId))
  }

  // 清空已选
  const handleClearAll = () => setSelectedStocks([])

  // 确认调仓(提交所有)
  const handleConfirmAll = async () => {
    if (selectedStocks.length === 0 || submitting) return
    setSubmitting(true)
    try {
      const totalValue = portfolio.total_portfolio_value || 0
      for (const sel of selectedStocks) {
        const h = getHolding({ id: sel.stock_id })
        const currentShares = h?.shares || 0
        const currentPrice = h?.current_price || sel.price || 0
        const currentStockValue = currentShares * currentPrice
        const tradeAmount = sel.shares * sel.price
        const remainingStockValue = Math.max(0, currentStockValue - tradeAmount)
        const newStockValue = sel.tradeType === RebalanceType.SELL ? remainingStockValue : currentStockValue + tradeAmount
        // before/after ratio: 数据库按百分比存储(如 25.0 = 25%)
        const beforeRatio = totalValue > 0 ? (currentStockValue / totalValue) * 100 : 0
        const afterRatio = totalValue > 0 ? (newStockValue / totalValue) * 100 : 0
        const changePercent = afterRatio - beforeRatio

        await rebalanceApi.create({
          portfolio_id: portfolio.id,
          stock_id: sel.stock_id,
          type: sel.tradeType,
          shares: sel.shares,
          price: sel.price,
          before_ratio: parseFloat(beforeRatio.toFixed(4)),
          after_ratio: parseFloat(afterRatio.toFixed(4)),
          change_percent: parseFloat(changePercent.toFixed(4)),
          amount: tradeAmount,
        })
      }
      onSuccess?.()
      onClose()
    } catch (e) {
      alert('调仓失败: ' + (e.message || '未知错误'))
    } finally {
      setSubmitting(false)
    }
  }

  // 持仓快捷栏:点击直接添加
  const handleHoldingClick = (holding) => {
    const stock = holding.stock || holding
    if (!stock?.id) return
    setSelectedStocks(prev => {
      if (prev.find(s => s.stock_id === stock.id)) return prev
      return [...prev, {
        stock_id: stock.id,
        name: stock.name || '-',
        code: stock.code || '-',
        market: stock.market || 'HK',
        tradeType: RebalanceType.SELL,  // 默认卖出
        shares: holding.shares || 0,
        price: stock.current_price || 0,
        amount: (holding.shares || 0) * (stock.current_price || 0),
      }]
    })
  }

  const isSelected = (stockId) => selectedStocks.some(s => s.stock_id === stockId)
  const getSelected = (stockId) => selectedStocks.find(s => s.stock_id === stockId)

  return (
    <div className="fixed inset-x-0 top-0 bottom-20 z-50 flex flex-col bg-white">
      {/* ── 1. 顶部标题栏 ── */}
      <div className="shrink-0 h-14 flex items-center justify-between px-5 border-b border-gray-100">
        <button onClick={onClose} className="p-2 text-gray-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">调仓</h1>
        <div className="w-14 text-right">
          {selectedStocks.length > 0 && (
            <button onClick={handleClearAll} className="text-sm text-gray-400">清空</button>
          )}
        </div>
      </div>

      {/* ── 2. 搜索与快捷区 ── */}
      <div className="shrink-0 px-5 py-4 flex gap-3 items-center">
        <div className="flex-1 relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索股票名称/代码"
            className="w-full pl-11 pr-4 py-3 bg-gray-100 rounded-xl text-base border-none outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <button onClick={() => setShowAddModal(true)} className="shrink-0 px-4 py-3 bg-blue-500 text-white rounded-xl text-sm font-semibold">+ 自选</button>
      </div>

      {/* ── 3. 卡片一:当前持仓 ── */}
      {holdings.length > 0 && (
        <div className="shrink-0 px-5 pt-2 pb-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-base font-bold text-gray-800 mb-4">当前持仓</p>
            <div className="flex gap-3 overflow-x-auto no-scrollbar">
              {holdings.map((h, i) => {
                const stock = h.stock || h
                const sid = stock.id || h.stock_id
                const selected = isSelected(sid)
                return (
                  <button
                    key={sid || i}
                    onClick={() => handleHoldingClick(h)}
                    disabled={selected}
                    className={'shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm transition-all ' + (selected ? 'bg-blue-50 border-blue-200 text-blue-500' : 'bg-gray-50 border-gray-100 text-gray-700 active:bg-gray-100')}
                  >
                    <span className="truncate max-w-[100px] font-medium">{stock.name || '-'}</span>
                    <span className="text-gray-400 font-semibold">{(h.proportion || 0).toFixed(1)}%</span>
                    {selected && <span className="text-blue-500">✓</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. 卡片二：新增自选标的 ── */}
      {sortedByTime.length > 0 && (
        <div className="flex-1 px-5 pb-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-base font-bold text-gray-800 mb-1">新增自选</p>
            <p className="text-sm text-gray-400 mb-4">近期添加的自选，可快速调仓</p>
            {/* 市场筛选面包屑标签 */}
            <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
              {cardTwoTabItems.map(item => {
                const isActive = cardTwoMarket === item.key
                return (
                  <button
                    key={item.key}
                    onClick={() => setCardTwoMarket(item.key)}
                    className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-500 border border-gray-200'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className={isActive ? 'text-white/70' : 'text-gray-300'}>{item.count}</span>
                  </button>
                )
              })}
            </div>
            {/* 筛选后无结果 */}
            {sortedByTimeFiltered.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-300">暂无该市场自选标的</div>
            ) : (
              sortedByTimeFiltered.slice(0, 5).map(stock => {
                const h = getHolding(stock)
                const sel = getSelected(stock.id)
                const added = !!sel
                return (
                  <div key={stock.id} className={'flex items-center py-4 border-b border-gray-50 last:border-b-0 ' + (added ? 'bg-blue-50/40 -mx-5 px-5 rounded' : '')}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-bold text-gray-900 truncate">{stock.name}</span>
                        <span className="text-xs text-gray-400 shrink-0">{stock.code}</span>
                      </div>
                      <div className="text-xs mt-1.5">
                        {h ? (
                          <span className="text-blue-500 font-medium">持仓 {h.proportion?.toFixed(1)}% · {h.shares}股</span>
                        ) : (
                          <span className="text-gray-400">未持仓</span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 ml-3">
                      {added ? (
                        <button onClick={() => handleRemove(stock.id)} className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">✓</button>
                      ) : (
                        <button onClick={() => handleAddStock(stock)} className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg font-bold shadow-sm active:scale-90 transition-transform">+</button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* ── 5. 底部已选预览 + 确认调仓 ── */}
      <div className="shrink-0 border-t border-gray-100 bg-white">
        {selectedStocks.length > 0 && (
          <div className="px-5 pt-3 pb-2 border-b border-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">已选调仓 <span className="font-bold text-blue-500">{selectedStocks.length}</span> 只</span>
              <span className="text-xs text-gray-400">可左右滑动查看</span>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {selectedStocks.map(sel => (
                <div key={sel.stock_id} className={'shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border ' + (sel.tradeType === RebalanceType.BUY ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100')}>
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-gray-900 truncate max-w-[80px]">{sel.name}</span>
                      <span className={'text-[11px] font-semibold ' + (sel.tradeType === RebalanceType.BUY ? 'text-red-500' : 'text-green-500')}>
                        {sel.tradeType === RebalanceType.BUY ? '买入' : '卖出'}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className={'text-[11px] font-medium ' + (sel.tradeType === RebalanceType.BUY ? 'text-red-400' : 'text-green-400')}>{sel.shares}股</span>
                      <span className="text-[10px] text-gray-400">¥{Number(sel.price).toFixed(2)}</span>
                    </div>
                  </div>
                  <button onClick={() => handleRemove(sel.stock_id)} className="shrink-0 w-6 h-6 rounded-full bg-white/80 text-gray-500 hover:text-red-500 hover:bg-white flex items-center justify-center text-base font-bold transition-colors">×</button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="px-5 py-4 flex items-center gap-4">
          <div className="flex-1">
            {selectedStocks.length > 0 ? (
              <span className="text-xs text-gray-400">点击确认完成调仓</span>
            ) : (
              <span className="text-sm text-gray-400">选择标的，点击确认调仓</span>
            )}
          </div>
          <button
            onClick={handleConfirmAll}
            disabled={selectedStocks.length === 0 || submitting}
            className={'px-8 py-3.5 rounded-xl text-base font-semibold transition-all ' + (selectedStocks.length > 0 && !submitting ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'bg-gray-100 text-gray-300')}
          >
            {submitting ? '提交中...' : '确认调仓'}
          </button>
        </div>
      </div>

      {/* ── 6. StockSheet 浮层 ── */}
      {showSheet && sheetStock && (
        <StockSheet
          stock={sheetStock}
          portfolio={portfolio}
          holding={getHolding(sheetStock)}
          onConfirm={handleSheetConfirm}
          onCancel={() => { setShowSheet(false); setSheetStock(null) }}
        />
      )}

      {/* ── 7. 添加自选弹窗 ── */}
      {showAddModal && (
        <AddStockModal
          onClose={() => setShowAddModal(false)}
          onAdd={(s) => {
            setStocks(prev => [...prev, s])
            setShowAddModal(false)
          }}
        />
      )}
    </div>
  )
}
