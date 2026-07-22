import React, { useState, useEffect, useRef } from 'react'
import { portfolioApi, strategyApi } from '../api'

// 千位分隔
function formatAmountDisplay(val) {
  if (!val && val !== 0) return ''
  const str = String(val).replace(/[^0-9.]/g, '')
  const parts = str.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

function parseAmountDisplay(formatted) {
  return formatted.replace(/,/g, '')
}

export default function CreatePortfolioScreen({ onBack, onSuccess }) {
  const [name, setName] = useState('')
  const [initialAmount, setInitialAmount] = useState('')
  const [strategies, setStrategies] = useState([])
  const [strategyId, setStrategyId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [strategyLoading, setStrategyLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const wrapperRef = useRef(null)

  const isValid = name.length >= 2 && name.length <= 12
  const rawAmount = parseFloat(parseAmountDisplay(initialAmount)) || 0
  const isAmountValid = rawAmount >= 0 && rawAmount <= 10000000
  const canCreate = isValid && isAmountValid && !loading

  useEffect(() => {
    strategyApi.getList().then(setStrategies).catch(() => setStrategies([])).finally(() => setStrategyLoading(false))
  }, [])

  // 点击空白关闭下拉
  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [dropdownOpen])

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '')
    const parts = raw.split('.')
    if (parts.length > 2) return
    setInitialAmount(formatAmountDisplay(raw))
  }

  const handleCreate = async () => {
    if (!canCreate) return
    setLoading(true)
    try {
      await portfolioApi.create({
        name: name,
        initial_amount: rawAmount,
        strategy_id: strategyId || null
      })
      onSuccess && onSuccess()
    } catch (err) {
      alert('创建失败: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedStrategy = strategyId ? strategies.find(s => s.id === strategyId) : null

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* 顶部导航 */}
      <div className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-20 border-b border-[#F0F1F4]">
        <button onClick={onBack} className="p-2 -ml-2 active:opacity-60">
          <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-[17px] font-bold text-gray-900">创建组合</h1>
        <button
          onClick={handleCreate}
          disabled={!canCreate}
          className={`text-[15px] font-semibold px-2 py-1 transition-colors ${
            canCreate ? 'text-[#2563EB]' : 'text-[#C9CDD4]'
          }`}
        >
          {loading ? '创建中...' : '创建'}
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* ===== 组合名称 ===== */}
        <div className="bg-white rounded-2xl px-4 pt-5 pb-4">
          <label className="block text-[13px] font-semibold text-gray-700 mb-2.5">组合名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入组合名称"
            maxLength={12}
            className="w-full h-11 px-3.5 border border-[#E4E6EB] rounded-xl text-[15px] text-gray-900 placeholder:text-[#C2C6CF] bg-white focus:outline-none focus:border-[#2563EB] transition-colors"
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-[11px] text-[#C2C6CF]">2-12个字符</span>
            <span className={`text-[11px] tabular-nums ${name.length > 0 && !isValid ? 'text-[#FF3B30]' : 'text-[#C2C6CF]'}`}>
              {name.length}/12
            </span>
          </div>
        </div>

        {/* ===== 初始分配金额 ===== */}
        <div className="bg-white rounded-2xl px-4 pt-5 pb-4">
          <label className="block text-[13px] font-semibold text-gray-700 mb-2.5">初始分配金额</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-[#C2C6CF] font-medium">¥</span>
            <input
              type="text"
              inputMode="decimal"
              value={initialAmount}
              onChange={handleAmountChange}
              placeholder="0"
              className="w-full h-11 pl-7 pr-3.5 border border-[#E4E6EB] rounded-xl text-[15px] text-gray-900 placeholder:text-[#C2C6CF] bg-white focus:outline-none focus:border-[#2563EB] transition-colors tabular-nums"
            />
          </div>
          <p className="text-[11px] text-[#C2C6CF] mt-2">资金区间 0 ~ 1,000万</p>
        </div>

        {/* ===== 绑定策略（可选） ===== */}
        <div className="bg-white rounded-2xl px-4 pt-5 pb-4" ref={wrapperRef}>
          <label className="block text-[13px] font-semibold text-gray-700 mb-2.5">
            绑定策略
            <span className="ml-1 text-[11px] text-[#C2C6CF] font-normal">(可选)</span>
          </label>

          {/* 下拉触发器：常态浅灰边框，激活浅蓝边框，纤细上下箭头 */}
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`w-full h-11 flex items-center justify-between px-3.5 border rounded-xl text-[15px] bg-white transition-colors focus:outline-none ${
              dropdownOpen
                ? 'border-[#2563EB] text-gray-900'
                : 'border-[#E4E6EB] text-gray-900 hover:border-[#C2C6CF]'
            }`}
          >
            <span className={selectedStrategy ? 'text-gray-900' : 'text-[#C2C6CF]'}>
              {selectedStrategy ? selectedStrategy.name : '不绑定策略'}
            </span>
            {/* 纤细上下箭头 */}
            <span className="flex flex-col items-center justify-center gap-[2px]">
              <svg className={`w-3 h-2.5 text-[#C2C6CF] transition-colors ${dropdownOpen ? 'text-[#2563EB]' : ''}`} viewBox="0 0 10 6" fill="none">
                <path d="M1 5L5 1L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <svg className={`w-3 h-2.5 text-[#C2C6CF] transition-colors ${dropdownOpen ? 'text-[#2563EB]' : ''}`} viewBox="0 0 10 6" fill="none">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </button>

          {/* 下拉弹窗：与输入框等宽，柔和圆角+浅阴影 */}
          {dropdownOpen && (
            <div className="relative mt-1">
              <div className="absolute left-0 right-0 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-[#F0F1F4] z-30 overflow-hidden">
                {/* 不绑定策略 */}
                <button
                  onClick={() => { setStrategyId(null); setDropdownOpen(false) }}
                  className={`w-full text-left px-3.5 py-3 text-[14px] transition-colors ${
                    strategyId === null
                      ? 'bg-[#EBF2FF] text-[#2563EB]'
                      : 'text-gray-600 hover:bg-[#F8F9FB]'
                  }`}
                >
                  不绑定策略
                </button>

                {/* 策略列表 */}
                {strategyLoading ? (
                  <div className="px-3.5 py-3 text-[13px] text-gray-400">加载中...</div>
                ) : strategies.length === 0 ? (
                  <div className="px-3.5 py-3 text-[13px] text-gray-400">暂无可用策略</div>
                ) : (
                  <>
                    {/* 分隔线：标题与列表之间 */}
                    <div className="h-px bg-[#F0F1F4]" />
                    {strategies.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => { setStrategyId(s.id); setDropdownOpen(false) }}
                        className={`w-full text-left px-3.5 py-3 text-[14px] transition-colors ${
                          strategyId === s.id
                            ? 'bg-[#EBF2FF] text-[#2563EB]'
                            : 'text-gray-600 hover:bg-[#F8F9FB]'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          <p className="text-[11px] text-[#C2C6CF] mt-2">绑定后调仓自动复用策略风控规则</p>
        </div>
      </div>
    </div>
  )
}
