// Color palette
export const AppColors = {
  primary: '#2563EB',
  positive: '#34C759',
  negative: '#FF3B30',
  background: '#F5F7FA',
  white: '#FFFFFF',
  gray100: '#F2F3F5',
  gray200: '#E5E6EB',
  gray500: '#86909C',
  gray900: '#1D2129',
}

// 调仓类型
export const RebalanceType = {
  BUY: 1,
  SELL: 2,
}

// 格式化工具函数
export function formatUpdateTime(dateString) {
  if (!dateString) return '未知'
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  
  return date.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: 'numeric', 
    day: 'numeric' 
  })
}

export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '-'
  return '¥' + Number(amount).toLocaleString('zh-CN', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export function formatPercent(value, showSign = true) {
  if (value === null || value === undefined) return '-'
  const sign = value >= 0 && showSign ? '+' : ''
  return `${sign}${Number(value).toFixed(2)}%`
}

