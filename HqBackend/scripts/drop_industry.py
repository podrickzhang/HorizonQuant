import pymysql

conn = pymysql.connect(host='localhost', user='root', password='1234qwer', database='horizonquant', charset='utf8mb4')
cur = conn.cursor()

# 1. 删除 industry_dist 表
cur.execute("DROP TABLE IF EXISTS industry_dist")
print("[1/2] DROP TABLE industry_dist OK")

# 2. 删除 stock 表的 industry 列
cur.execute("ALTER TABLE stock DROP COLUMN industry")
print("[2/2] ALTER TABLE stock DROP COLUMN industry OK")

conn.commit()

# 验证
cur.execute("SHOW TABLES LIKE 'industry_dist'")
print('industry_dist 表还存在:', bool(cur.fetchone()))
cur.execute("SHOW COLUMNS FROM stock LIKE 'industry'")
print('stock.industry 列还存在:', bool(cur.fetchone()))

conn.close()
