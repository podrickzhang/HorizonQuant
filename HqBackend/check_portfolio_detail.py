import pymysql, json

conn = pymysql.connect(host='localhost', user='root', password='1234qwer', database='horizonquant', charset='utf8mb4')
cur = conn.cursor()

# 检查 holdings 表数据
cur.execute("""
    SELECT h.id, s.name, h.shares, h.market_value, h.profit_loss, h.profit_loss_ratio, h.cost_price, h.current_price
    FROM holding h
    JOIN stock s ON s.id = h.stock_id
    WHERE h.portfolio_id = 1 AND h.is_deleted = 0
""")
rows = cur.fetchall()
conn.close()

print("Holdings:")
for r in rows:
    print("  id=%d, name=%s, shares=%s, mv=%s, profit_loss=%s, ratio=%s, cost=%s, current=%s" % (
        r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7]
    ))
if not rows:
    print("  (empty)")
