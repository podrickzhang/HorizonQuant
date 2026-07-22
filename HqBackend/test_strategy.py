import urllib.request, urllib.parse, json

API = 'http://localhost:8002/api'

# 登录
data = urllib.parse.urlencode({'username': 'test', 'password': '123456'})
req = urllib.request.Request(API + '/auth/login', data=data.encode(), headers={'Content-Type': 'application/x-www-form-urlencoded'})
res = urllib.request.urlopen(req, timeout=5)
token = json.loads(res.read())['access_token']
print('登录成功')

# 策略列表
req2 = urllib.request.Request(API + '/strategies', headers={'Authorization': f'Bearer {token}'})
res2 = urllib.request.urlopen(req2, timeout=5)
print('策略列表:', res2.read().decode())

# 创建策略
payload = json.dumps({
    'name': '测试策略A',
    'description': '测试用',
    'max_position_pct': 20,
    'max_stock_pct': 30,
    'stop_loss_pct': -4,
    'take_profit_pct': 8,
    'max_daily_loss_pct': -2
}).encode()
req3 = urllib.request.Request(API + '/strategies', data=payload, headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
res3 = urllib.request.urlopen(req3, timeout=5)
print('创建策略:', res3.read().decode())