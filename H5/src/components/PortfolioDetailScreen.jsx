import React, { useEffect, useState } from 'react'
import { AppColors, formatPercent, formatCurrency, formatUpdateTime, RebalanceType } from '../data'
import { portfolioApi, rebalanceApi, strategyApi } from '../api'
import TradeModal from './TradeModal'
import YieldChart from './YieldChart'

// Detail Card component
function DetailCard({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm mb-4 ${className}`}>
      {children}
    </div>
  )
}

// Header component
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


// 策略选择弹层
function StrategyPicker({ currentId, strategies, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose}>
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900 mb-4">选择策略</h3>
        <div className="space-y-2">
          <button
            onClick={() => onSelect(null)}
            className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
              currentId === null ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-600'
            }`}
          >
            <span className="font-medium">不绑定策略</span>
          </button>
          {strategies.map(s => (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                currentId === s.id ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-600'
              }`}
            >
              <span className="font-medium">{s.name}</span>
              {s.description && <span className="text-xs text-gray-400 ml-2">{s.description}</span>}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-full mt-4 py-3 bg-gray-100 rounded-xl text-gray-500 font-medium">取消</button>
      </div>
    </div>
  )
}

// Rebalance Item component
function RebalanceItem({ record }) {
  const isBuy = record.type === RebalanceType.BUY
  const stock = record.stock || {}
  const amount = (record.shares || 0) * (record.price || 0)

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      {/* 左侧:操作图标 */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isBuy ? 'bg-green-50' : 'bg-red-50'}`}>
        <svg className={`w-4 h-4 ${isBuy ? 'text-positive' : 'text-negative'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isBuy ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
        </svg>
      </div>

      {/* 中间:标的主信息 */}
      <div className="flex-1">
        <p className="text-sm text-gray-900">
          <span className="text-gray-400">{new Date(record.operate_time).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}</span>
          <span className="ml-1 font-bold">{isBuy ? '买入' : '卖出'}</span>
          <span className="font-bold">{stock.name}</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">{stock.code}</p>
      </div>

      {/* 右侧:成交数据 */}
      <div className="text-right">
        <p className="text-sm font-bold text-gray-900">¥{amount.toLocaleString()}</p>
        <p className="text-xs text-gray-400 mt-1">
          {formatCurrency(record.price)} × {record.shares}股
        </p>
      </div>
    </div>
  )
}

// Main Portfolio Detail Screen
export default function PortfolioDetailScreen({ portfolio, onBack, onViewHistory, refreshDetail }) {
  const [loading, setLoading] = useState(false)
  const [showTradeModal, setShowTradeModal] = useState(false)
  const [showStrategyPicker, setShowStrategyPicker] = useState(false)
  const [strategies, setStrategies] = useState([])
  const [strategyLoading, setStrategyLoading] = useState(true)
  const [updatingStrategy, setUpdatingStrategy] = useState(false)

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  const isPositive = portfolio.total_return >= 0
  const returnColor = isPositive ? AppColors.positive : AppColors.negative

  // Generate chart data
  const chartData = portfolio.mini_chart_data || []

  // 计算各项数值
  const holdings = portfolio.holdings || []
  const hasHoldings = holdings.length > 0
  const rawMarketValue = holdings.reduce((sum, h) => sum + (h.market_value || 0), 0)
  const totalPortfolioValue = portfolio.total_portfolio_value || (portfolio.cash || 0) + rawMarketValue
  const initialAmount = portfolio.initial_amount || 0
  // 个股占持仓市值比例（sum=100%）
  const totalPosition = holdings.reduce((sum, h) => sum + (h.proportion || 0), 0)
  // 股票仓位占总资产比例
  const stockRatio = totalPortfolioValue > 0 ? (rawMarketValue / totalPortfolioValue * 100) : 0
  // 优先用后端算好的组合盈亏;兜底 = 现金 + 持仓市值 - 初始金额
  const profitLoss = portfolio.profit_loss != null && portfolio.profit_loss !== undefined
    ? portfolio.profit_loss
    : ((portfolio.cash || 0) + rawMarketValue - initialAmount)

  return (
    <div className="pb-40">
      <DetailHeader title={portfolio.name} onBack={onBack} />

      <div className="p-4 space-y-4">
        {/* 策略信息卡 */}
        <DetailCard>
          <div className="space-y-3">
            <p className="text-xs text-gray-400">更新于 {formatUpdateTime(portfolio.data_update_time)}</p>
            <div className="flex items-center justify-between">
              {portfolio.strategy ? (
                <p className="text-sm font-bold text-gray-900">{portfolio.strategy.name}</p>
              ) : portfolio.strategy_id ? (
                <p className="text-sm font-bold text-gray-900">策略 #{portfolio.strategy_id}</p>
              ) : (
                <p className="text-sm text-gray-400">未绑定策略</p>
              )}
              <button
                onClick={async () => {
                  if (strategies.length === 0) {
                    setStrategyLoading(true)
                    try {
                      const data = await strategyApi.getList()
                      setStrategies(data || [])
                    } catch { setStrategies([]) }
                    finally { setStrategyLoading(false) }
                  }
                  setShowStrategyPicker(true)
                }}
                className="text-xs text-primary font-medium px-3 py-1.5 border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
              >
                {portfolio.strategy || portfolio.strategy_id ? '更换' : '绑定'}
              </button>
            </div>
            {portfolio.strategy ? (
              <div className="text-[11px] text-gray-400 whitespace-nowrap overflow-x-auto">
                <span>单笔仓位<span className="text-gray-500 ml-0.5">{portfolio.strategy.max_position_pct}%</span></span>
                <span className="mx-1.5 text-gray-300">|</span>
                <span>单票仓位<span className="text-gray-500 ml-0.5">{portfolio.strategy.max_stock_pct}%</span></span>
                <span className="mx-1.5 text-gray-300">|</span>
                <span>止损<span className="text-red-400 ml-0.5">-{portfolio.strategy.stop_loss_pct}%</span></span>
                <span className="mx-1.5 text-gray-300">|</span>
                <span>止盈<span className="text-green-400 ml-0.5">+{portfolio.strategy.take_profit_pct}%</span></span>
                <span className="mx-1.5 text-gray-300">|</span>
                <span>单日亏损限制<span className="text-red-400 ml-0.5">-{portfolio.strategy.max_daily_loss_pct}%</span></span>
              </div>
            ) : (
              <p className="text-[11px] text-gray-400">未绑定任何交易策略</p>
            )}
          </div>
        </DetailCard>

        {/* 收益资产卡 */}
        <DetailCard>
          <div className="space-y-5">
            {/* 总收益 */}
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-gray-400">总收益</span>
              <span className="text-3xl font-bold" style={{ color: returnColor }}>
                {formatPercent(portfolio.total_return)}
              </span>
            </div>

            {/* 3列2行数据网格 */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-x-2">
                <div>
                  <p className="text-xs text-gray-400">总资产</p>
                  <p className="text-base font-semibold text-gray-900 mt-1">
                    ￥{totalPortfolioValue.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">日收益</p>
                  <p className="text-base font-medium mt-1" style={{ color: returnColor }}>
                    {formatPercent(portfolio.daily_return)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">净值</p>
                  <p className="text-base font-medium text-gray-900 mt-1">
                    {((portfolio.total_return || 0) / 100 + 1).toFixed(4)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-x-2">
                <div>
                  <p className="text-xs text-gray-400">持仓市值</p>
                  <p className="text-base font-medium text-gray-900 mt-1">
                    ¥{rawMarketValue.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">现金</p>
                  <p className="text-base font-medium text-gray-900 mt-1">
                    ¥{(portfolio.cash || 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">盈亏金额</p>
                  <p className="text-base font-medium mt-1" style={{ color: profitLoss >= 0 ? AppColors.positive : AppColors.negative }}>
                    {profitLoss >= 0 ? '+' : ''}¥{profitLoss.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DetailCard>

        {/* Main Chart */}
        <DetailCard>
          <div>
            <h3 className="font-bold text-gray-900 mb-4">收益率走势</h3>
            <YieldChart
              data={chartData}
              dataUpdateTime={portfolio.data_update_time}
              portfolioId={portfolio.id}
            />
          </div>
        </DetailCard>

        {/* Position */}
        <DetailCard>
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-900">股票仓位</h3>
              <span className="text-lg font-bold text-primary">{stockRatio.toFixed(1)}%</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-400 to-primary rounded-full" style={{ width: `${Math.min(stockRatio, 100)}%` }}></div>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {hasHoldings ? (
                <>持仓市值 ¥{rawMarketValue.toLocaleString()} / 总资产 ¥{totalPortfolioValue.toLocaleString()}</>
              ) : '暂无持仓'}
            </p>
          </div>
        </DetailCard>

        {/* Holdings */}
        <DetailCard>
          <div>
            <h3 className="font-bold text-gray-900 mb-2.5">持仓明细</h3>
            {holdings.length > 0 ? (
              <div>
              {holdings.map((holding, index) => {
                const stock = holding.stock || {}
                const isProfit = (holding.profit_loss_ratio || 0) >= 0
                const profitColor = isProfit ? AppColors.positive : AppColors.negative
                // 精简市值:去尾 .00
                const mv = holding.market_value || 0
                const mvText = mv % 1 === 0
                  ? '¥' + mv.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                  : formatCurrency(mv)
                // 买入价
                const costPrice = holding.cost_price || 0
                const costPriceText = costPrice ? `¥${costPrice.toFixed(2)}` : '-'
                return (
                  <div key={index} className="py-2 border-b border-gray-100 last:border-0">
                    {/* 富途风格: 左右分栏, 占比突出, 买入价+市值弱化 */}
                    <div className="flex items-center justify-between">
                      {/* 左侧: 名称(不截断) + 代码 */}
                      <div className="min-w-0">
                        <p className="text-[15px] font-bold text-gray-900">{stock.name}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{stock.code}</p>
                      </div>
                      {/* 右侧: 占比(突出) + 买入价|市值(弱化), 靠右堆叠 */}
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-lg font-bold text-gray-900 tabular-nums">{(holding.proportion || 0).toFixed(1)}%</p>
                        <p className="text-xs text-gray-400 tabular-nums mt-0.5">买入价 {costPriceText} <span className="mx-1">|</span> {mvText}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
              </div>
            ) : (
              <p className="text-gray-400 text-sm py-4">暂无持仓</p>
            )}
          </div>
        </DetailCard>

        {/* Charts Row */}
        <div className="flex gap-4">
          <DetailCard className="flex-1">
            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-3">市场分布</h3>
              {(portfolio.market_dists && portfolio.market_dists.length > 0) ? (
                <div className="space-y-2">
                  {portfolio.market_dists.map((dist, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-gray-500">{dist.market}</span>
                      <span className="font-medium">{(dist.proportion || 0).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-gray-400">暂无数据</span>
                </div>
              )}
            </div>
          </DetailCard>
        </div>

        {/* Recent Rebalance */}
        <DetailCard>
          <div>
            <h3 className="font-bold text-gray-900 text-base mb-4">最近调仓</h3>
            {(portfolio.rebalances && portfolio.rebalances.length > 0) ? (
              portfolio.rebalances.slice(0, 2).map((record) => (
                <RebalanceItem key={record.id} record={record} />
              ))
            ) : (
              <p className="text-gray-500 text-sm py-4">暂无调仓记录</p>
            )}
            <button
              onClick={onViewHistory}
              className="w-full py-3 text-sm text-primary font-medium"
            >
              查看全部调仓记录
            </button>
          </div>
        </DetailCard>
      </div>

      {/* Action Bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
        <div className="flex gap-3">
          <button
            onClick={() => setShowTradeModal(true)}
            className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold"
          >
            调仓
          </button>
        </div>
      </div>

      {/* 策略选择弹层 */}
      {showStrategyPicker && (
        <StrategyPicker
          currentId={portfolio.strategy_id}
          strategies={strategies}
          onSelect={async (id) => {
            setShowStrategyPicker(false)
            setUpdatingStrategy(true)
            try {
              await portfolioApi.update(portfolio.id, { strategy_id: id })
              refreshDetail && refreshDetail()
            } catch (err) {
              alert('更新策略失败: ' + err.message)
            } finally {
              setUpdatingStrategy(false)
            }
          }}
          onClose={() => setShowStrategyPicker(false)}
        />
      )}

      {/* 调仓弹窗 */}
      {showTradeModal && (
        <TradeModal
          portfolio={portfolio}
          onClose={() => setShowTradeModal(false)}
          onSuccess={() => {
            refreshDetail && refreshDetail()
          }}
        />
      )}
    </div>
  )
}