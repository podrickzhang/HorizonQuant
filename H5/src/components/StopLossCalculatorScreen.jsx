import React, { useState, useEffect, useCallback } from 'react'

// ─── Top Header ───
function TopHeader({ title, onBack, onReset }) {
  return (
    <div className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <button onClick={onBack} className="p-2 -ml-2">
        <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 className="text-lg font-bold text-gray-900">{title}</h1>
      <button onClick={onReset} className="p-2 text-primary text-sm font-medium">
        重置
      </button>
    </div>
  )
}

// ─── Input Field ───
function InputField({ label, value, onChange, placeholder, prefix, suffix }) {
  return (
    <div className="mb-4">
      <label className="block text-xs text-gray-400 mb-2">{label}</label>
      <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
        {prefix && <span className="text-gray-500 text-base mr-1">{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-base text-gray-900 outline-none placeholder-gray-300"
        />
        {suffix && <span className="text-gray-400 text-sm ml-1">{suffix}</span>}
      </div>
    </div>
  )
}

// ─── Preset Buttons ───
const PRESET_RATIOS = [-4, -8, -10]

function PresetButtons({ selected, customValue, onSelect, onCustomChange }) {
  return (
    <div className="mb-4">
      <label className="block text-xs text-gray-400 mb-2">止损比例</label>
      <div className="flex items-center gap-2">
        {PRESET_RATIOS.map(ratio => (
          <button
            key={ratio}
            onClick={() => onSelect(ratio)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
              selected === ratio && !customValue
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
            }`}
          >
            {ratio}%
          </button>
        ))}
        <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
          <span className="text-gray-500 text-sm mr-0.5">-</span>
          <input
            type="number"
            inputMode="decimal"
            value={customValue}
            onChange={e => onCustomChange(e.target.value)}
            placeholder="自定义"
            className="flex-1 text-sm text-gray-900 outline-none placeholder-gray-300 text-center"
          />
          <span className="text-gray-400 text-sm">%</span>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2">止损价 = 现价 × (1 + 止损比例)</p>
    </div>
  )
}

// ─── Result Card ───
function ResultCard({ price, ratio, stopLoss }) {
  const isValid = price > 0 && ratio < 0
  const ratioAbs = Math.abs(ratio)

  return (
    <div className={`rounded-2xl p-5 mb-6 ${isValid ? 'bg-red-50 border border-red-100' : 'bg-gray-50 border border-gray-200'}`}>
      <div className="text-center">
        <div className="text-xs text-gray-400 mb-2">止损价</div>
        {isValid ? (
          <>
            <div className="text-4xl font-bold text-red-500 mb-3">
              ¥{stopLoss.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">
              若现价¥{price.toFixed(2)}下跌{ratioAbs.toFixed(1)}%，止损价为¥{stopLoss.toFixed(2)}
            </div>
          </>
        ) : (
          <div className="text-xl font-semibold text-gray-400">
            请输入标的信息
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Validation Message ───
function ValidationMsg({ message }) {
  if (!message) return null
  return (
    <div className="text-xs text-red-500 mb-3 px-1">{message}</div>
  )
}

// ─── Main Screen ───
export default function StopLossCalculatorScreen({ onBack }) {
  const [price, setPrice] = useState('')
  const [selectedRatio, setSelectedRatio] = useState(-4)
  const [customRatio, setCustomRatio] = useState('')
  const [validation, setValidation] = useState('')

  // 计算止损价（自定义输入自动取负）
  const stopLoss = useCallback(() => {
    const p = parseFloat(price)
    const rawRatio = customRatio !== '' ? parseFloat(customRatio) : selectedRatio
    const ratio = customRatio !== '' ? -Math.abs(rawRatio) : rawRatio
    if (isNaN(p) || isNaN(ratio)) return null
    if (p <= 0) return null
    if (ratio >= 0) return null
    if (ratio < -50) return null
    return p * (1 + ratio / 100)
  }, [price, selectedRatio, customRatio])

  const result = stopLoss()
  const activeRatio = customRatio !== '' ? -Math.abs(parseFloat(customRatio)) : selectedRatio

  // 校验（自定义输入自动取负）
  useEffect(() => {
    if (price === '' && customRatio === '') {
      setValidation('')
      return
    }
    const p = parseFloat(price)
    const rawR = customRatio !== '' ? parseFloat(customRatio) : selectedRatio
    const r = customRatio !== '' ? -Math.abs(rawR) : rawR
    if (isNaN(p) || p <= 0) {
      setValidation('请输入有效的股票价格')
    } else if (isNaN(r) || rawR === 0) {
      setValidation('请输入有效的止损比例')
    } else if (Math.abs(r) > 50) {
      setValidation('请输入合理的止损比例（不超过-50%）')
    } else {
      setValidation('')
    }
  }, [price, selectedRatio, customRatio])

  const handleReset = () => {
    setPrice('')
    setSelectedRatio(-4)
    setCustomRatio('')
    setValidation('')
  }

  const handleCustomChange = (val) => {
    setCustomRatio(val)
    if (val !== '') {
      setSelectedRatio(null)
    }
  }

  const handlePresetSelect = (ratio) => {
    setSelectedRatio(ratio)
    setCustomRatio('')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <TopHeader title="止损计算器" onBack={onBack} onReset={handleReset} />

      <div className="px-4 pt-4">
        <InputField
          label="标的现价"
          value={price}
          onChange={setPrice}
          placeholder="请输入现价"
          prefix="¥"
        />

        <PresetButtons
          selected={selectedRatio}
          customValue={customRatio}
          onSelect={handlePresetSelect}
          onCustomChange={handleCustomChange}
        />

        <ValidationMsg message={validation} />

        <ResultCard
          price={parseFloat(price) || 0}
          ratio={customRatio !== '' ? -Math.abs(parseFloat(customRatio) || 0) : (isNaN(selectedRatio) ? 0 : selectedRatio)}
          stopLoss={result || 0}
        />
      </div>
    </div>
  )
}
