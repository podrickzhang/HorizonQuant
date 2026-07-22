import urllib.request, json, urllib.parse

data = urllib.parse.urlencode({"username": "test", "password": "123456"}).encode()
req = urllib.request.Request(
    "http://127.0.0.1:8000/api/auth/login",
    data=data,
    headers={"Content-Type": "application/x-www-form-urlencoded"}
)
with urllib.request.urlopen(req, timeout=5) as resp:
    token = json.loads(resp.read())["access_token"]

req2 = urllib.request.Request(
    "http://127.0.0.1:8000/api/portfolios/1",
    headers={"Authorization": f"Bearer {token}"}
)
with urllib.request.urlopen(req2, timeout=5) as resp:
    raw = resp.read()
    print("Response type:", type(raw))
    print("First 200 bytes:", raw[:200])
    data = json.loads(raw)

# Check operate_time
r0 = data["rebalances"][0]
print("operate_time type:", type(r0.get("operate_time")))
print("operate_time value:", r0.get("operate_time"))
print("rebalances[0] complete:", json.dumps(r0, default=str))
