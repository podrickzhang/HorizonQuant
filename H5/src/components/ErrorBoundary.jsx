import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-lg w-full">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 text-center mb-2">页面渲染出错</h2>
            <p className="text-sm text-red-500 text-center mb-4 font-mono bg-red-50 p-2 rounded">
              {this.state.error?.toString()}
            </p>
            <details className="text-xs text-gray-400 bg-gray-50 p-3 rounded max-h-40 overflow-auto">
              <summary className="cursor-pointer mb-2">查看调用栈</summary>
              <pre>{this.state.errorInfo?.componentStack}</pre>
            </details>
            <button
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              className="mt-4 w-full py-2 bg-primary text-white rounded-lg text-sm font-medium"
            >
              重试
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
