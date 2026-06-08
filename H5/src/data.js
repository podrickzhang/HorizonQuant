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

export class Portfolio {
  constructor(id, name, updateTime, totalReturn, dailyReturn, vsHangSeng, isPositiveVsHS, miniChartData) {
    this.id = id
    this.name = name
    this.updateTime = updateTime
    this.totalReturn = totalReturn
    this.dailyReturn = dailyReturn
    this.vsHangSeng = vsHangSeng
    this.isPositiveVsHS = isPositiveVsHS
    this.miniChartData = miniChartData
  }
}

export class HoldingStock {
  constructor(name, code, proportion, marketValue, profitLoss) {
    this.name = name
    this.code = code
    this.proportion = proportion
    this.marketValue = marketValue
    this.profitLoss = profitLoss
  }
}

export class RebalanceRecord {
  constructor(id, date, type, stockName, stockCode, shares, sharesPercent, price, amount, profit, reason) {
    this.id = id
    this.date = date
    this.type = type
    this.stockName = stockName
    this.stockCode = stockCode
    this.shares = shares
    this.sharesPercent = sharesPercent
    this.price = price
    this.amount = amount
    this.profit = profit
    this.reason = reason
  }
}

export const RebalanceType = {
  BUY: 'BUY',
  SELL: 'SELL',
}

export const SampleData = {
  portfolios: [
    new Portfolio(0, '稳健增长组合', '10分钟前', 34.72, 2.18, 12.3, true, [10.0, 15.0, 12.0, 18.0, 22.0, 25.0, 34.72]),
    new Portfolio(1, '科技先锋组合', '2小时前', 18.55, -0.87, 5.1, true, [5.0, 20.0, 15.0, 25.0, 30.0, 22.0, 18.55]),
    new Portfolio(2, '消费龙头组合', '3天前', 8.92, 1.23, 2.7, true, [2.0, 4.0, 3.0, 6.0, 8.0, 7.0, 8.92]),
  ],
  holdings: [
    new HoldingStock('腾讯控股', '00700.HK', 25.3, '¥84,650', 12.5),
    new HoldingStock('贵州茅台', '600519.SH', 18.7, '¥62,380', -2.1),
    new HoldingStock('宁德时代', '300750.SZ', 15.2, '¥50,720', 8.3),
    new HoldingStock('美团-W', '03690.HK', 12.8, '¥42,650', 22.1),
    new HoldingStock('中国平安', '601318.SH', 10.5, '¥35,100', -1.8),
  ],
  rebalanceRecords: [
    new RebalanceRecord(1, '2025年03月15日', RebalanceType.BUY, '腾讯控股', '00700', 200, 5.7, '¥432.50', '¥86,500', null, '估值合理，AI业务前景看好'),
    new RebalanceRecord(2, '2025年03月10日', RebalanceType.SELL, '贵州茅台', '600519', -50, 2.8, '¥1,850.00', '¥92,500', '+¥12,800', '止盈操作，白酒板块轮动'),
  ],
}