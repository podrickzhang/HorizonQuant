with open('app/routers/portfolio.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_block = """# 实时计算现金和市值：cash = 初始金额 - 累计买入 + 累计卖出
    realized_sum = sum(
        (float(r.profit) if r.profit is not None else 0)
        for r in db.query(Rebalance).filter(
            Rebalance.portfolio_id==portfolio_id,
            Rebalance.type==2,
            Rebalance.is_deleted==0
        ).all()
    )
    buy_total = sum(
        float(r.amount) for r in db.query(Rebalance).filter(
            Rebalance.portfolio_id==portfolio_id,
            Rebalance.type==1,
            Rebalance.is_deleted==0
        ).all()
    )
    live_total_mv = round(sum(decimal_to_float(h.market_value) for h in holdings), 2)
    live_cash = round(decimal_to_float(portfolio.initial_amount) - buy_total + realized_sum, 2)
    live_profit_loss = round(live_cash + live_total_mv - decimal_to_float(portfolio.initial_amount), 2)"""

new_block = """# 实时计算现金和市值
    # 现金 = 初始金额 - 累计买入金额 + 累计卖出金额
    buy_total = sum(
        float(r.amount) for r in db.query(Rebalance).filter(
            Rebalance.portfolio_id==portfolio_id,
            Rebalance.type==1,
            Rebalance.is_deleted==0
        ).all()
    )
    sell_total = sum(
        float(r.amount) for r in db.query(Rebalance).filter(
            Rebalance.portfolio_id==portfolio_id,
            Rebalance.type==2,
            Rebalance.is_deleted==0
        ).all()
    )
    live_cash = round(decimal_to_float(portfolio.initial_amount) - buy_total + sell_total, 2)
    live_total_mv = round(sum(decimal_to_float(h.market_value) for h in holdings), 2)
    # 组合盈亏 = 当前现金 + 持仓市值 - 初始金额
    live_profit_loss = round(live_cash + live_total_mv - decimal_to_float(portfolio.initial_amount), 2)"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open('app/routers/portfolio.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed! buy_total + sell_total formula applied.")
else:
    print("Block not found! Showing context:")
    idx = content.find('buy_total')
    print(repr(content[idx-200:idx+300]))
