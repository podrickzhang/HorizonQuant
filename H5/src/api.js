// 后端接口地址自动按运行环境切换：
//   本地（localhost / 127.0.0.1）→ 连本机后端 localhost:8000，便于本地调试
//   线上（服务器 IP / 域名）      → 连线上后端 175.178.168.185:8000
// 也可用构建环境变量 VITE_API_URL 强制覆盖（优先级最高）
const isLocalEnv = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
const LOCAL_API = 'http://localhost:8000'
const REMOTE_API = 'http://175.178.168.185:8000'
const API_BASE_URL = (import.meta.env.VITE_API_URL || (isLocalEnv ? LOCAL_API : REMOTE_API)) + '/api'

// 存储token
const getToken = () => localStorage.getItem('hq_token')
const setToken = (token) => localStorage.setItem('hq_token', token)
const removeToken = () => localStorage.removeItem('hq_token')

// 请求头
const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

// 通用请求方法
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const config = {
    ...options,
    headers: { ...getHeaders(), ...options.headers }
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      // 401 → 清除过期token，跳转登录页
      if (response.status === 401) {
        removeToken()
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
        return
      }
      const error = await response.json().catch(() => ({ detail: '请求失败' }))
      throw new Error(error.detail || `请求失败: ${response.status}`)
    }

    if (response.status === 204) {
      return null
    }

    return response.json()
  } catch (err) {
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.name === 'TypeError') {
      throw new Error('无法连接后端（通常是跨域 CORS 或网络问题），请确认后端已启动并允许跨域')
    }
    throw err
  }
}

// ========== 认证相关 ==========
export const authApi = {
  register: (data) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  login: async (username, password) => {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: '登录失败' }))
      throw new Error(error.detail || '登录失败')
    }

    const data = await response.json()
    setToken(data.access_token)
    return data
  },

  logout: () => {
    removeToken()
  },

  getMe: () => request('/auth/me')
}

// ========== 投资组合相关 ==========
export const portfolioApi = {
  getList: () => request('/portfolios'),
  getDetail: (id) => request(`/portfolios/${id}`),
  create: (data) => request('/portfolios', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/portfolios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/portfolios/${id}`, { method: 'DELETE' }),
  getYield: (id, period = 'all') => request(`/portfolios/${id}/yield?period=${period}`)
}

// ========== 策略相关 ==========
export const strategyApi = {
  getList: () => request('/strategies'),
  create: (data) => request('/strategies', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/strategies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/strategies/${id}`, { method: 'DELETE' }),
  setDefault: (id, active) => request(`/strategies/${id}/default?active=${active}`, { method: 'PUT' })
}

// ========== 股票相关 ==========
export const stockApi = {
  getList: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/stocks${query ? '?' + query : ''}`)
  },
  get: (id) => request(`/stocks/${id}`),
  getByCode: (code) => request(`/stocks/code/${code}`),
  create: (data) => request('/stocks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/stocks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/stocks/${id}`, { method: 'DELETE' })
}

// ========== 调仓记录相关 ==========
export const rebalanceApi = {
  getList: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/rebalances${query ? '?' + query : ''}`)
  },
  get: (id) => request(`/rebalances/${id}`),
  create: (data) => request('/rebalances', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => request(`/rebalances/${id}`, { method: 'DELETE' })
}

// ========== 工具函数 ==========
export function formatDate(dateString) {
  if (!dateString) return ''
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

export function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined) return '-'
  return Number(num).toFixed(decimals)
}

export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '-'
  return '¥' + Number(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}