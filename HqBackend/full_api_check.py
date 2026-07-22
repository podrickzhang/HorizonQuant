import urllib.request, json, urllib.parse

# Login
data = urllib.parse.urlencode({"username": "test", "password": "123456"}).encode()
req = urllib.request.Request(
    "http://127.0.0.1:8000/api/auth/login",
    data=data,
    headers={"Content-Type": "application/x-www-form-urlencoded"}
)
with urllib.request.urlopen(req, timeout=5) as resp:
    token = json.loads(resp.read())["access_token"]

# Portfolio detail
req2 = urllib.request.Request(
    "http://127.0.0.1:8000/api/portfolios/1",
    headers={"Authorization": f"Bearer {token}"}
)
with urllib.request.urlopen(req2, timeout=5) as resp:
    data = json.loads(resp.read())

print("Keys:", sorted(data.keys()))
print()
print("mini_chart_data:", data.get("mini_chart_data"))
print("profit_loss:", data.get("profit_loss"))
print("holdings:", data.get("holdings"))
print("rebalances[0] keys:", list(data["rebalances"][0].keys()) if data["rebalances"] else "EMPTY")
print("rebalances[0] stock keys:", list(data["rebalances"][0]["stock"].keys()) if data["rebalances"] else "EMPTY")
