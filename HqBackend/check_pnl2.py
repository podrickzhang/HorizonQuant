import pymysql, json

conn = pymysql.connect(host='localhost', user='root', password='1234qwer', database='horizonquant', charset='utf8mb4')
cur = conn.cursor()

# check all rebalances for portfolio 1
cur.execute("""
    SELECT id, type, shares, price, cost_price, profit, amount
    FROM rebalance
    WHERE portfolio_id = 1 AND is_deleted = 0
    ORDER BY id DESC
    LIMIT 10
""")
rows = cur.fetchall()
for r in rows:
    print("id=%d type=%d shares=%s price=%s cost=%s profit=%s amount=%s" % r)
conn.close()
