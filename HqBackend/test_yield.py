import urllib.request, urllib.parse, json

data = urllib.parse.urlencode({'username': 'test', 'password': '123456'})
req = urllib.request.Request('http://localhost:8002/api/auth/login', data=data.encode(), headers={'Content-Type': 'application/x-www-form-urlencoded'})
token = json.loads(urllib.request.urlopen(req, timeout=5).read())['access_token']
h = {'Authorization': f'Bearer {token}'}

for period in ['1m', '3m', 'all']:
    url = f'http://localhost:8002/api/portfolios/7/yield?period={period}'
    req2 = urllib.request.Request(url, headers=h)
    try:
        res = json.loads(urllib.request.urlopen(req2, timeout=5).read())
        print(f'period={period}: data_len={len(res.get("data", []))}, dates_len={len(res.get("dates", []))}, total_return={res.get("total_return")}, data_stale={res.get("data_stale")}')
    except Exception as e:
        print(f'period={period} error: {e}')
