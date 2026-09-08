import React, { useState, useEffect } from 'react'
import { strategyApi } from '../api'

// ═══════════════════════════════════════════
// Toggle 开关组件
// ═══════════════════════════════════════════
function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-gray-300'}`}
    >
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${value ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
    </button>
  )
}

// ═══════════════════════════════════════════
// 策略表单（新增/编辑共用）
// ═══════════════════════════════════════════
export function StrategyForm({ initial, onSave, onCancel, onBack }) {
  const DEFAULT_STRATEGY = {
    name: '',
    description: '',
    max_position_pct: 20,
    max_stock_pct: 30,
    stop_loss_pct: -4,
    take_profit_pct: 8,
    max_daily_loss_pct: -2,
  }
  
  const [form, setForm] = useState(initial ? { ...DEFAULT_STRATEGY, ...initial } : { ...DEFAULT_STRATEGY })
  const [errors, setErrors] = useState({})

  const update = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }))
    setErrors(prev => ({ ...prev, [key]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = '请输入策略名称'
    if (form.max_position_pct <= 0 || form.max_position_pct > 100) errs.max_position_pct = '单笔仓位须在1~100%之间'
    if (form.max_stock_pct <= 0 || form.max_stock_pct > 100) errs.max_stock_pct = '单票仓位须在1~100%之间'
    if (form.max_stock_pct < form.max_position_pct) errs.max_stock_pct = '单票仓位应≥单笔仓位'
    if (form.stop_loss_pct >= 0 || form.stop_loss_pct < -50) errs.stop_loss_pct = '止损比例须在-1%~-50%之间'
    if (form.take_profit_pct <= 0 || form.take_profit_pct > 100) errs.take_profit_pct = '止盈比例须在1%~100%之间'
    if (form.max_daily_loss_pct >= 0 || form.max_daily_loss_pct < -10) errs.max_daily_loss_pct = '亏损限制须在-0%~-10%之间'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    onSave(form)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部栏 */}
      <div className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <button onClick={onCancel || onBack} className="p-2 -ml-2">
          <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">{initial ? '编辑策略' : '新增策略'}</h1>
        <button onClick={handleSave} className="text-primary text-sm font-semibold">
          保存
        </button>
      </div>

      <div className="px-4 pt-4 pb-8">
        {/* 基础信息 */}
        <div className="bg-white rounded-2xl p-4 mb-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-primary rounded-full" />
            基础信息
          </h3>
          <div className="mb-3">
            <label className="block text-xs text-gray-400 mb-1.5">策略名称</label>
            <input
              type="text"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="如：稳健保守型"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-gray-300"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">策略描述（选填）</label>
            <textarea
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder="简要描述策略特点..."
              rows={2}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-gray-300 resize-none"
            />
          </div>
        </div>

        {/* 仓位控制 */}
        <div className="bg-white rounded-2xl p-4 mb-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-500 rounded-full" />
            仓位控制
          </h3>
          <div className="mb-3">
            <label className="block text-xs text-gray-400 mb-1.5">单笔最大仓位</label>
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
              <input
                type="number"
                inputMode="decimal"
                value={form.max_position_pct}
                onChange={e => update('max_position_pct', parseFloat(e.target.value) || 0)}
                className="flex-1 text-sm text-gray-900 outline-none"
              />
              <span className="text-gray-400 text-sm">%</span>
            </div>
            {errors.max_position_pct && <p className="text-xs text-red-500 mt-1">{errors.max_position_pct}</p>}
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">单票最高仓位</label>
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
              <input
                type="number"
                inputMode="decimal"
                value={form.max_stock_pct}
                onChange={e => update('max_stock_pct', parseFloat(e.target.value) || 0)}
                className="flex-1 text-sm text-gray-900 outline-none"
              />
              <span className="text-gray-400 text-sm">%</span>
            </div>
            {errors.max_stock_pct && <p className="text-xs text-red-500 mt-1">{errors.max_stock_pct}</p>}
          </div>
        </div>

        {/* 止损规则 - 简化版 */}
        <div className="bg-white rounded-2xl p-4 mb-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-red-500 rounded-full" />
            止损规则
          </h3>
          <div className="mb-3">
            <label className="block text-xs text-gray-400 mb-1.5">止损比例</label>
            <div className="flex gap-2 mb-2">
              {[-4, -8, -10].map(val => (
                <button
                  key={val}
                  onClick={() => update('stop_loss_pct', val)}
                  className={`flex-1 py-2 text-xs font-medium rounded-xl ${
                    form.stop_loss_pct === val
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
              <span className="text-gray-400 text-sm mr-1">自定义</span>
              <input
                type="number"
                inputMode="decimal"
                value={form.stop_loss_pct}
                onChange={e => update('stop_loss_pct', parseFloat(e.target.value) || 0)}
                className="flex-1 text-sm text-gray-900 outline-none"
              />
              <span className="text-gray-400 text-sm">%</span>
            </div>
          </div>
          {errors.stop_loss_pct && <p className="text-xs text-red-500 mt-1">{errors.stop_loss_pct}</p>}
        </div>

        {/* 止盈规则 - 简化版 */}
        <div className="bg-white rounded-2xl p-4 mb-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-green-500 rounded-full" />
            止盈规则
          </h3>
          <div className="mb-3">
            <label className="block text-xs text-gray-400 mb-1.5">止盈比例</label>
            <div className="flex gap-2 mb-2">
              {[8, 15, 20].map(val => (
                <button
                  key={val}
                  onClick={() => update('take_profit_pct', val)}
                  className={`flex-1 py-2 text-xs font-medium rounded-xl ${
                    form.take_profit_pct === val
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  +{val}%
                </button>
              ))}
            </div>
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
              <span className="text-gray-400 text-sm mr-1">自定义</span>
              <input
                type="number"
                inputMode="decimal"
                value={form.take_profit_pct}
                onChange={e => update('take_profit_pct', parseFloat(e.target.value) || 0)}
                className="flex-1 text-sm text-gray-900 outline-none"
              />
              <span className="text-gray-400 text-sm">%</span>
            </div>
          </div>
          {errors.take_profit_pct && <p className="text-xs text-red-500 mt-1">{errors.take_profit_pct}</p>}
        </div>

        {/* 组合风控 - 简化版 */}
        <div className="bg-white rounded-2xl p-4 mb-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-amber-500 rounded-full" />
            组合风控
          </h3>
          <div className="mb-3">
            <label className="block text-xs text-gray-400 mb-1.5">日亏限制</label>
            <input
              type="range"
              min="-10"
              max="0"
              step="0.5"
              value={form.max_daily_loss_pct}
              onChange={e => update('max_daily_loss_pct', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>-10%</span>
              <span className="font-medium text-amber-600">{form.max_daily_loss_pct}%</span>
              <span>0%</span>
            </div>
          </div>
          {errors.max_daily_loss_pct && <p className="text-xs text-red-500 mt-1">{errors.max_daily_loss_pct}</p>}
          <div className="bg-amber-50 rounded-xl px-3 py-2.5 flex items-start gap-2">
            <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-xs text-amber-600 leading-relaxed">
              当组合当日累计亏损达到设定值时，系统将自动禁止当日开仓操作，仅允许平仓减亏。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// 策略卡片
// ═══════════════════════════════════════════
function StrategyCard({ strategy, isDefault, onToggleDefault, onEdit, onDelete }) {
  const stop = e => e.stopPropagation()

  return (
    <div className="bg-white rounded-2xl mb-3">
      {/* 点击区域1：上半区 */}
      <div
        onClick={onEdit}
        className="px-4 pt-3.5 pb-2.5 cursor-pointer active:bg-gray-50/60 rounded-t-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-[15px] font-bold text-gray-900">{strategy.name}</h4>
              {isDefault && (
                <span className="px-1.5 py-0.5 bg-primary/8 text-primary text-[10px] font-medium rounded">默认</span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">{strategy.created_at}{strategy.description ? ` · ${strategy.description}` : ''}</p>
          </div>
          <span onClick={stop} onPointerDown={stop}>
            <Toggle value={isDefault} onChange={onToggleDefault} />
          </span>
        </div>
      </div>

      {/* 点击区域2：规则预览区 */}
      <div
        onClick={onEdit}
        className="px-4 py-2.5 cursor-pointer active:bg-gray-50/60"
      >
        <div className="grid grid-cols-5 gap-1.5">
          {[
            { label: '单笔仓位', value: `${strategy.max_position_pct}%`, color: 'text-blue-600 bg-blue-50/80' },
            { label: '单票仓位', value: `${strategy.max_stock_pct}%`, color: 'text-blue-600 bg-blue-50/80' },
            { label: '止损', value: `${strategy.stop_loss_pct}%`, color: 'text-red-500 bg-red-50/80' },
            { label: '止盈', value: `+${strategy.take_profit_pct}%`, color: 'text-green-600 bg-green-50/80' },
            { label: '日亏限制', value: `${strategy.max_daily_loss_pct}%`, color: 'text-amber-600 bg-amber-50/80' },
          ].map(item => (
            <div key={item.label} className="text-center">
              <div className={`px-1 py-0.5 rounded text-[11px] font-medium ${item.color}`}>
                {item.value}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 底部操作按钮 */}
      <div className="flex gap-3 px-4 pb-3 pt-2" onClick={stop} onPointerDown={stop}>
        <button
          onClick={onEdit}
          className="flex-[0.48] py-2 text-xs font-medium text-primary border border-primary/30 rounded-xl active:bg-primary/5"
        >
          编辑
        </button>
        <button
          onClick={onDelete}
          className="flex-[0.48] py-2 text-xs font-medium text-red-500 border border-red-300 rounded-xl active:bg-red-50"
        >
          删除
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// 策略列表主页面
// ═══════════════════════════════════════════
export default function StrategyListScreen({ onBack }) {
  const [strategies, setStrategies] = useState([])
  const [defaultId, setDefaultId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  // 后端返回 create_time(ISO)，前端展示用 created_at(日期)
  const normalize = (s) => ({ ...s, created_at: (s.create_time || '').slice(0, 10) })

  useEffect(() => {
    const load = async () => {
      try {
        const list = await strategyApi.getList()
        const norm = (list || []).map(normalize)
        setStrategies(norm)
        setDefaultId((norm.find(s => s.is_default) || {}).id || '')
      } catch (err) {
        setError(err.message || '加载失败')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleToggleDefault = async (id) => {
    const willActive = defaultId !== id
    try {
      await strategyApi.setDefault(id, willActive)
      setStrategies(prev => prev.map(s => ({ ...s, is_default: s.id === id ? (willActive ? 1 : 0) : 0 })))
      setDefaultId(willActive ? id : '')
    } catch (err) {
      alert(err.message || '设置失败')
    }
  }

  const handleSave = async (form) => {
    try {
      if (editing === 'new') {
        const created = await strategyApi.create(form)
        setStrategies(prev => [...prev, normalize(created)])
      } else {
        const updated = await strategyApi.update(editing.id, form)
        setStrategies(prev => prev.map(s => s.id === updated.id ? normalize(updated) : s))
      }
      setEditing(null)
    } catch (err) {
      alert(err.message || '保存失败')
    }
  }

  const handleDelete = async (id) => {
    try {
      await strategyApi.delete(id)
      setStrategies(prev => prev.filter(s => s.id !== id))
      setDefaultId(prev => prev === id ? '' : prev)
      setDeleting(null)
    } catch (err) {
      alert(err.message || '删除失败')
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <p className="text-sm text-gray-400 text-center">{error}</p>
      </div>
    )
  }

  const deleteOverlay = deleting && (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-2xl mx-6 p-5 w-full max-w-xs shadow-lg">
        <h3 className="text-base font-bold text-gray-900 mb-2">确认删除</h3>
        <p className="text-sm text-gray-500 mb-5">删除后不可恢复，确定要删除「{deleting.name}」吗？</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleting(null)} className="flex-1 py-2.5 text-sm font-medium bg-gray-100 rounded-xl text-gray-600 active:bg-gray-200">取消</button>
          <button onClick={() => handleDelete(deleting.id)} className="flex-1 py-2.5 text-sm font-medium bg-red-500 rounded-xl text-white active:bg-red-500">删除</button>
        </div>
      </div>
    </div>
  )

  if (editing !== null) {
    return (
      <StrategyForm
        initial={editing === 'new' ? null : editing}
        onSave={handleSave}
        onCancel={() => setEditing(null)}
        onBack={onBack}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {deleteOverlay}
      {/* 顶部 */}
      <div className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="p-2 -ml-2">
          <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">我的策略</h1>
        <button
          onClick={() => setEditing('new')}
          className="p-2 -mr-2 text-primary"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* 统计 */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-xs text-gray-400">共 {strategies.length} 个策略</p>
      </div>

      {/* 列表 */}
      <div className="px-4">
        {strategies.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">暂无策略，点击右上角 + 创建</p>
          </div>
        ) : (
          strategies.map(s => (
            <StrategyCard
              key={s.id}
              strategy={s}
              isDefault={defaultId === s.id}
              onToggleDefault={() => handleToggleDefault(s.id)}
              onEdit={() => setEditing(s)}
              onDelete={() => setDeleting(s)}
            />
          ))
        )}
      </div>
    </div>
  )
}
