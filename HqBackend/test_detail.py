import urllib.request, json, socket

# set timeout
socket.setdefaulttimeout(5)

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
req = urllib.request.Request(
    "http://127.0.0.1:8000/api/portfolios/1",
    headers={"Authorization": f"Bearer {token}"}
)
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
    print("OK, profit_loss:", data.get("profit_loss"))
except Exception as e:
    print("Error:", type(e).__name__, str(e))
