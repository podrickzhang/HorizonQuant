import pymysql, json
from decimal import Decimal

def df(v):
    if v is None: return 0.0
    if isinstance(v, Decimal): return float(v)
    return float(v)

conn = pymysql.connect(host='localhost', user='root', password='1234qwer', database='horizonquant', charset='utf8mb4')
cur = conn.cursor()

# Portfolio
cur.execute("SELECT id, name, cash, total_market_value, initial_amount, total_return, daily_return FROM portfolio WHERE id=1 AND is_deleted=0")
p = cur.fetchone()

# Holdings
cur.execute("""
    SELECT h.id, s.name, s.code, h.shares, h.cost_price, h.current_price, h.market_value, h.proportion, h.profit_loss, h.profit_loss_ratio
    FROM holding h JOIN stock s ON s.id=h.stock_id
    WHERE h.portfolio_id=1 AND h.is_deleted=0
""")
holdings = []
for r in cur.fetchall():
    holdings.append({"id": r[0], "stock_name": r[1], "stock_code": r[2], "shares": df(r[3]),
        "cost_price": df(r[4]), "current_price": df(r[5]), "market_value": df(r[6]),
        "proportion": df(r[7]), "profit_loss": df(r[8]), "profit_loss_ratio": df(r[9])})

# Rebalances
cur.execute("""
    SELECT r.id, r.type, r.shares, r.price, r.profit, s.name
    FROM rebalance r JOIN stock s ON s.id=r.stock_id
    WHERE r.portfolio_id=1 AND r.is_deleted=0
    ORDER BY r.operate_time DESC LIMIT 5
""")
rebalances = []
for r in cur.fetchall():
    rebalances.append({"id": r[0], "type": r[1], "shares": df(r[2]),
        "price": df(r[3]), "profit": df(r[4]) if r[4] is not None else None,
        "stock": {"name": r[5]}})

# Realized profit
cur.execute("""
    SELECT COALESCE(SUM(profit), 0) FROM rebalance
    WHERE portfolio_id=1 AND is_deleted=0 AND type=2 AND profit IS NOT NULL
""")
realized = df(cur.fetchone()[0])

profit_loss = df(p[2]) + df(p[3]) + realized - df(p[4])

data = {
    "id": p[0], "name": p[1], "cash": df(p[2]),
    "total_market_value": df(p[3]), "initial_amount": df(p[4]),
    "total_return": df(p[5]), "daily_return": df(p[6]),
    "profit_loss": profit_loss,
    "holdings": holdings, "rebalances": rebalances,
    "market_dists": [], "industry_dists": []
}
conn.close()
print(json.dumps(data, ensure_ascii=False, indent=2))
