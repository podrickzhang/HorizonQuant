import pymysql

conn = pymysql.connect(host='localhost', user='root', password='1234qwer', database='horizonquant', charset='utf8mb4')
cur = conn.cursor()

cur.execute("""
    SELECT r.id, r.shares, r.price, r.cost_price
    FROM rebalance r
    WHERE r.type = 2
      AND r.is_deleted = 0
      AND r.profit IS NULL
      AND r.cost_price IS NOT NULL
""")
rows = cur.fetchall()

updated = 0
for row in rows:
    rebalance_id, shares, price, cost_price = row
    profit = (float(price) - float(cost_price)) * abs(int(shares))
    cur.execute("UPDATE rebalance SET profit = %s WHERE id = %s", (profit, rebalance_id))
    updated += 1
    print("id=%d: (%.2f - %.2f) x %d = %.2f" % (rebalance_id, float(price), float(cost_price), abs(int(shares)), profit))

conn.commit()
print("Done, updated %d records" % updated)
conn.close()
