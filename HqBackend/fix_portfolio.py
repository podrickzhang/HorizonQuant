with open('app/routers/portfolio.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Return block spans lines 209-252 (1-indexed) = indices 208-251
# After return: starts at line 253 (1-indexed) = index 252

new_return_block = """    # 实时计算现金和市值：cash = 初始金额 - 累计买入 + 累计卖出
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
    live_profit_loss = round(live_cash + live_total_mv - decimal_to_float(portfolio.initial_amount), 2)

    return PortfolioDetailOut(
        id=portfolio.id,
        user_id=portfolio.user_id,
        name=portfolio.name,
        description=portfolio.description,
        total_return=decimal_to_float(portfolio.total_return),
        daily_return=decimal_to_float(portfolio.daily_return),
        total_market_value=live_total_mv,
        cash=live_cash,
        initial_amount=decimal_to_float(portfolio.initial_amount),
        profit_loss=live_profit_loss,
        mini_chart_data=mini_chart,
        data_update_time=portfolio.data_update_time,
        status=portfolio.status,
        strategy_id=portfolio.strategy_id,
        create_time=portfolio.create_time,
        update_time=portfolio.update_time,
        holdings=holdings_out,
        rebalances=rebalances_out,
        market_dists=market_dists_out,
        strategy=strategy_out
    )

"""

# Build new content: lines 0-207 (before blank line), then new block, then lines 252+ (after closing paren)
new_lines = lines[:208] + [new_return_block] + lines[252:]

with open('app/routers/portfolio.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Done! New file length:", len(new_lines))
