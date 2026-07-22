import pymysql

conn = pymysql.connect(host='localhost', user='root', password='1234qwer', database='horizonquant', charset='utf8mb4')
cur = conn.cursor()

cur.execute("SHOW TABLES LIKE 'industry_dist'")
exists = cur.fetchone()
print('industry_dist 表存在:', bool(exists))

cur.execute("SHOW COLUMNS FROM stock LIKE 'industry'")
col = cur.fetchone()
print('stock.industry 列存在:', bool(col))

cur.execute("SELECT COUNT(*) FROM stock WHERE industry IS NOT NULL")
print('stock 表中 industry 非空行数:', cur.fetchone()[0])

cur.execute("SELECT COUNT(*) FROM industry_dist")
print('industry_dist 表数据行数:', cur.fetchone()[0])

conn.close()
