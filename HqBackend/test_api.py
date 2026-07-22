import urllib.request, urllib.parse, json

API = 'http://localhost:8002/api'

# 登录
data = urllib.parse.urlencode({'username': 'test', 'password': '123456'})
req = urllib.request.Request(API + '/auth/login', data=data.encode(), headers={'Content-Type': 'application/x-www-form-urlencoded'})
try:
    res = urllib.request.urlopen(req, timeout=5)
    result = json.loads(res.read())
    token = result['access_token']
    print('登录成功, token:', token[:20], '...')
except Exception as e:
    print('登录错误:', e)
    import traceback; traceback.print_exc()
    exit(1)