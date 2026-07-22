import pymysql, json

conn = pymysql.connect(host='localhost', user='root', password='1234qwer', database='horizonquant', charset='utf8mb4')
cur = conn.cursor()

# portfolio cash + total_market_value + initial_amount
cur.execute("SELECT id, cash, total_market_value, initial_amount FROM portfolio WHERE id=1")
p = cur.fetchone()
print("Portfolio: cash=%s, total_market_value=%s, initial_amount=%s" % (
    p[1], p[2], p[3]))

# realized profit from rebalances
cur.execute("""
    SELECT COALESCE(SUM(profit), 0)
    FROM rebalance
    WHERE portfolio_id = 1 AND is_deleted = 0 AND type = 2 AND profit IS NOT NULL
""")
realized = cur.fetchone()[0]
print("Realized profit:", realized)

profit_loss = float(p[1] or 0) + float(p[2] or 0) + float(realized or 0) - float(p[3] or 0)
print("profit_loss = cash + mv + realized - initial =", profit_loss)

conn.close()
