with open('app/routers/portfolio.py', 'r', encoding='utf-8') as f:
    content = f.read()

# --- 1. Rename variable + change definition to include cash ---
old_holdings_mv = """    # 持仓总市值（用于实时计算各持仓比例）
    holdings_total_mv = sum(decimal_to_float(h.market_value) for h in holdings)"""
new_holdings_mv = """    # 总资产 = 现金 + 持仓市值（实时计算，现金来自调仓流水）
    # 现金 = 初始金额 - 累计买入 + 累计卖出
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
    holdings_total_mv = sum(decimal_to_float(h.market_value) for h in holdings)
    total_portfolio_value = round(live_cash + holdings_total_mv, 2)"""

if old_holdings_mv in content:
    content = content.replace(old_holdings_mv, new_holdings_mv)
    print("OK: holdings_mv block updated")
else:
    print("ERROR: holdings_mv block not found")
    idx = content.find('holdings_total_mv')
    print(repr(content[idx-100:idx+200]))

# --- 2. Change proportion in holdings_out: holdings_total_mv -> total_portfolio_value ---
old_prop = """            # 实时计算比例：单只市值 / 持仓总市值
            "proportion": round(
                decimal_to_float(h.market_value) / holdings_total_mv * 100, 4
            ) if holdings_total_mv > 0 else 0,"""
new_prop = """            # 实时计算比例：单只市值 / 总资产
            "proportion": round(
                decimal_to_float(h.market_value) / total_portfolio_value * 100, 4
            ) if total_portfolio_value > 0 else 0,"""

if old_prop in content:
    content = content.replace(old_prop, new_prop)
    print("OK: holdings proportion updated")
else:
    print("ERROR: holdings proportion block not found")

# --- 3. Change market_dist proportion: total_mv -> total_portfolio_value ---
old_mkt_prop = """        pct = (mv_float / total_mv * 100) if total_mv > 0 else 0"""
new_mkt_prop = """        pct = (mv_float / total_portfolio_value * 100) if total_portfolio_value > 0 else 0"""

if old_mkt_prop in content:
    content = content.replace(old_mkt_prop, new_mkt_prop)
    print("OK: market_dist proportion updated")
else:
    print("ERROR: market_dist proportion not found")

# --- 4. List endpoint: add total_portfolio_value ---
old_list = """            stock_value=decimal_to_float(p.total_market_value),"""
new_list = """            stock_value=decimal_to_float(p.total_market_value),
            total_portfolio_value=decimal_to_float(p.cash or 0) + decimal_to_float(p.total_market_value),"""

if old_list in content:
    content = content.replace(old_list, new_list)
    print("OK: list endpoint updated")
else:
    print("ERROR: list endpoint not found")

with open('app/routers/portfolio.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("File saved.")
