import urllib.request, urllib.parse, json

data = urllib.parse.urlencode({'username': 'test', 'password': '123456'})
req = urllib.request.Request('http://localhost:8002/api/auth/login', data=data.encode(), headers={'Content-Type': 'application/x-www-form-urlencoded'})
token = json.loads(urllib.request.urlopen(req, timeout=5).read())['access_token']
h = {'Authorization': f'Bearer {token}'}

# 获取组合7的详情
req2 = urllib.request.Request('http://localhost:8002/api/portfolios/7', headers=h)
try:
    res = json.loads(urllib.request.urlopen(req2, timeout=5).read())
    print('Portfolio 7 response:')
    print(json.dumps({k: v for k, v in res.items() if k in ['cash', 'total_market_value', 'initial_amount', 'holdings']}, indent=2))
except Exception as e:
    print('Error:', e)
