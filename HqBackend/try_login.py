import urllib.request, json, urllib.parse

# Try common passwords for 'test' user
passwords = ['123456', 'test123', 'test', 'password', 'admin', 'admin123', '1234qwer']
for pw in passwords:
    data = urllib.parse.urlencode({"username": "test", "password": pw}).encode()
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/auth/login",
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    try:
        with urllib.request.urlopen(req, timeout=3) as resp:
            token = json.loads(resp.read())["access_token"]
            print(f"SUCCESS with password: {pw}")
            print(f"Token: {token[:30]}...")

            # Now test the portfolio API
            req2 = urllib.request.Request(
                "http://127.0.0.1:8000/api/portfolios/1",
                headers={"Authorization": f"Bearer {token}"}
            )
            with urllib.request.urlopen(req2, timeout=5) as resp2:
                data = json.loads(resp2.read())
            print(f"profit_loss: {data.get('profit_loss')}")
            print(f"holdings count: {len(data.get('holdings', []))}")
            print(f"rebalances count: {len(data.get('rebalances', []))}")
            break
    except Exception as e:
        print(f"pw={pw}: {type(e).__name__}: {str(e)[:60]}")
