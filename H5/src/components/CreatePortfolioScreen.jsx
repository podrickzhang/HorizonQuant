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
      {/* 顶部导航 48px */}
      <div className="bg-white h-12 grid grid-cols-3 items-center sticky top-0 z-20 border-b border-[#E5E7EB] px-4">
        <button onClick={onBack} className="justify-self-start p-1 -ml-1 active:opacity-60">
          <svg className="w-5 h-5 text-[#1D2129]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-center text-[17px] font-medium text-[#1D2129]">创建组合</h1>
        <button
          onClick={handleCreate}
          disabled={!canCreate}
          className={`justify-self-end text-[15px] font-medium px-1 py-1 transition-colors ${
            canCreate ? 'text-[#2563EB]' : 'text-[#B4C1D3]'
          }`}
        >
          {loading ? '创建中...' : '创建'}
        </button>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* ===== 组合名称 ===== */}
        <div className="bg-white rounded-[12px] px-4 py-4">
          <label className="block text-[15px] font-medium text-[#1D2129] mb-3">组合名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入组合名称"
            maxLength={12}
            className="w-full bg-transparent border-0 border-b border-[#E5E7EB] pb-2 text-[16px] text-[#1D2129] placeholder:text-[#86909C] focus:outline-none focus:border-[#2563EB] transition-colors"
          />
          <div className="flex justify-between items-center mt-2">
            <span className={`text-[12px] ${name.length > 0 && !isValid ? 'text-[#F53F3F]' : 'text-[#86909C]'}`}>2-12个字符</span>
            <span className={`text-[12px] tabular-nums ${name.length > 0 && !isValid ? 'text-[#F53F3F]' : 'text-[#86909C]'}`}>{name.length}/12</span>
          </div>
        </div>

        {/* ===== 初始分配金额 ===== */}
        <div className="bg-white rounded-[12px] px-4 py-4">
          <label className="block text-[15px] font-medium text-[#1D2129] mb-3">初始分配金额</label>
          <div className="relative">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[16px] text-[#86909C] font-medium">¥</span>
            <input
              type="text"
              inputMode="decimal"
              value={initialAmount}
              onChange={handleAmountChange}
              placeholder="0"
              className="w-full bg-transparent border-0 border-b border-[#E5E7EB] pl-5 pb-2 text-[16px] text-right text-[#1D2129] placeholder:text-[#86909C] focus:outline-none focus:border-[#2563EB] transition-colors tabular-nums"
            />
          </div>
          <p className={`text-[12px] mt-2 ${initialAmount && !isAmountValid ? 'text-[#F53F3F]' : 'text-[#86909C]'}`}>资金区间 0 ~ 1,000万</p>
        </div>

        {/* ===== 绑定策略（可选） ===== */}
        <div className="bg-white rounded-[12px] px-4 py-4" ref={wrapperRef}>
          <label className="block text-[15px] font-medium text-[#1D2129] mb-3">
            绑定策略
            <span className="ml-1 text-[12px] text-[#86909C] font-normal">(可选)</span>
          </label>

          {/* 下拉触发器：富途下划线样式 */}
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`w-full flex items-center justify-between bg-transparent border-0 border-b pb-2 text-[16px] transition-colors focus:outline-none ${
              dropdownOpen ? 'border-[#2563EB]' : 'border-[#E5E7EB]'
            } ${selectedStrategy ? 'text-[#1D2129]' : 'text-[#86909C]'}`}
          >
            <span>{selectedStrategy ? selectedStrategy.name : '不绑定策略'}</span>
            <svg className={`w-4 h-4 transition-colors ${dropdownOpen ? 'text-[#2563EB]' : 'text-[#86909C]'}`} viewBox="0 0 20 20" fill="none">
              <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* 下拉弹窗：与输入框等宽，轻阴影 */}
          {dropdownOpen && (
            <div className="relative mt-2">
              <div className="absolute left-0 right-0 bg-white rounded-[12px] shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-[#E5E7EB] z-30 overflow-hidden">
                <button
                  onClick={() => { setStrategyId(null); setDropdownOpen(false) }}
                  className={`w-full text-left px-4 py-3 text-[15px] transition-colors ${
                    strategyId === null ? 'bg-[#EBF2FF] text-[#2563EB]' : 'text-[#4E5969] hover:bg-[#F5F7FA]'
                  }`}
                >
                  不绑定策略
                </button>
                {strategyLoading ? (
                  <div className="px-4 py-3 text-[13px] text-[#86909C]">加载中...</div>
                ) : strategies.length === 0 ? (
                  <div className="px-4 py-3 text-[13px] text-[#86909C]">暂无可用策略</div>
                ) : (
                  <>
                    <div className="h-px bg-[#E5E7EB]" />
                    {strategies.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => { setStrategyId(s.id); setDropdownOpen(false) }}
                        className={`w-full text-left px-4 py-3 text-[15px] transition-colors ${
                          strategyId === s.id ? 'bg-[#EBF2FF] text-[#2563EB]' : 'text-[#4E5969] hover:bg-[#F5F7FA]'
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

          <p className="text-[12px] text-[#86909C] mt-2">绑定后调仓自动复用策略风控规则</p>
        </div>
      </div>
    </div>
  )
}
