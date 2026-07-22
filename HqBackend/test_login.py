import urllib.request, urllib.parse, json

API = 'http://localhost:8002/api'

data = urllib.parse.urlencode({'username': 'test', 'password': '123456'})
req = urllib.request.Request(API + '/auth/login', data=data.encode(), headers={'Content-Type': 'application/x-www-form-urlencoded'})
try:
    res = urllib.request.urlopen(req, timeout=5)
    print('OK:', res.read().decode())
except urllib.error.HTTPError as e:
    print('HTTP错误:', e.code)
    print('Body:', e.read().decode())
except Exception as ex:
    print('错误:', ex)