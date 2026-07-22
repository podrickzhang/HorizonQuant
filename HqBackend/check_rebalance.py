import pymysql, json

conn = pymysql.connect(host='localhost', user='root', password='1234qwer', database='horizonquant', charset='utf8mb4')
cur = conn.cursor()
cur.execute("SELECT id, type, shares, price, cost_price, profit, amount FROM rebalance WHERE type=2 AND is_deleted=0 ORDER BY id DESC LIMIT 5")
rows = cur.fetchall()
conn.close()

for r in rows:
    print(json.dumps({
        "id": r[0], "type": r[1], "shares": r[2],
        "price": float(r[3]) if r[3] else None,
        "cost_price": float(r[4]) if r[4] else None,
        "profit": float(r[5]) if r[5] else None,
        "amount": float(r[6]) if r[6] else None,
    }, indent=2))
