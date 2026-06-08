import React, { useState } from 'react'
import { SampleData, AppColors, RebalanceType } from '../data'

function FilterChip({ text, selected, onClick }) {
  return (
    <button onClick={onClick} className={`px-5 py-1.5 rounded-full text-sm ${selected ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-500'}`}>
      {text}
    </button>
  )
}

function HistoryRecordCard({ record }) {
  const isBuy = record.type === RebalanceType.BUY
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs ${isBuy ? 'bg-blue-50 text-primary' : 'bg-red-50 text-negative'}`}>{isBuy ? '买入' : '卖出'}</span>
          <span className="font-bold text-gray-900">{record.stockName}</span>
        </div>
      </div>
      <div className="pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500">调仓理由：{record.reason}</p>
      </div>
    </div>
  )
}

export default function RebalanceHistoryScreen({ onBack }) {
  const [selectedFilter, setSelectedFilter] = useState('ALL')
  const filteredRecords = selectedFilter === 'ALL' ? SampleData.rebalanceRecords : SampleData.rebalanceRecords.filter(r => r.type === selectedFilter)
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <button onClick={onBack} className="p-2 -ml-2">
          <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">调仓历史</h1>
        <div className="w-12" />
      </div>
      <div className="flex gap-2 px-4 py-4">
        <FilterChip text="全部" selected={selectedFilter === 'ALL'} onClick={() => setSelectedFilter('ALL')} />
        <FilterChip text="买入" selected={selectedFilter === 'BUY'} onClick={() => setSelectedFilter('BUY')} />
        <FilterChip text="卖出" selected={selectedFilter === 'SELL'} onClick={() => setSelectedFilter('SELL')} />
      </div>
      <div className="px-4 pb-4 space-y-4">
        {filteredRecords.map((record) => (<HistoryRecordCard key={record.id} record={record} />))}
      </div>
    </div>
  )
}