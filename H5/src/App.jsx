import React, { useState } from 'react'
import PortfolioListScreen from './components/PortfolioListScreen'
import PortfolioDetailScreen from './components/PortfolioDetailScreen'
import RebalanceHistoryScreen from './components/RebalanceHistoryScreen'
import { SampleData } from './data'

const Screen = {
  PortfolioList: 'PortfolioList',
  PortfolioDetail: 'PortfolioDetail',
  RebalanceHistory: 'RebalanceHistory',
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState(Screen.PortfolioList)
  const [selectedPortfolio, setSelectedPortfolio] = useState(SampleData.portfolios[0])

  const handlePortfolioClick = (portfolio) => {
    setSelectedPortfolio(portfolio)
    setCurrentScreen(Screen.PortfolioDetail)
  }

  const handleBack = () => {
    setCurrentScreen(Screen.PortfolioList)
  }

  const handleViewHistory = () => {
    setCurrentScreen(Screen.RebalanceHistory)
  }

  return (
    <div className="min-h-screen bg-background">
      {currentScreen === Screen.PortfolioList && (
        <PortfolioListScreen onPortfolioClick={handlePortfolioClick} />
      )}
      {currentScreen === Screen.PortfolioDetail && (
        <PortfolioDetailScreen
          portfolio={selectedPortfolio}
          onBack={handleBack}
          onViewHistory={handleViewHistory}
        />
      )}
      {currentScreen === Screen.RebalanceHistory && (
        <RebalanceHistoryScreen onBack={handleBack} />
      )}
    </div>
  )
}