import urllib.request, json, sys

# 用正确token试试 - 先尝试用admin账户
# 尝试直接访问
token = "test"
req = urllib.request.Request(
    "http://127.0.0.1:8000/api/portfolios/1",
    headers={"Authorization": f"Bearer {token}"}
)
try:
    with urllib.request.urlopen(req, timeout=5) as resp:
        print("Status:", resp.status)
        data = json.loads(resp.read())
        print("Keys:", list(data.keys()))
        print("profit_loss:", data.get("profit_loss"))
        print("holdings:", len(data.get("holdings", [])))
except Exception as e:
    print("Error:", type(e).__name__, str(e))

# 查数据库中的用户和token
import pymysql
conn = pymysql.connect(host='localhost', user='root', password='1234qwer', database='horizonquant', charset='utf8mb4')
cur = conn.cursor()
cur.execute("SELECT id, username FROM sys_user LIMIT 5")
users = cur.fetchall()
print("\nUsers in DB:", users)
conn.close()
