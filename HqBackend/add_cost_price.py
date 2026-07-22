import pymysql

conn = pymysql.connect(
    host='localhost',
    user='root',
    password='1234qwer',
    database='horizonquant',
    charset='utf8mb4'
)
cur = conn.cursor()

# 先检查列是否已存在
cur.execute("DESCRIBE rebalance")
cols = [row[0] for row in cur.fetchall()]
print("当前列:", cols)

if 'cost_price' not in cols:
    cur.execute("ALTER TABLE rebalance ADD COLUMN cost_price DECIMAL(20,4) NULL AFTER price")
    conn.commit()
    print("OK, cost_price 列已添加")
else:
    print("cost_price 列已存在，无需修改")

conn.close()
