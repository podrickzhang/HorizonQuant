import requests
r = requests.post("http://localhost:8002/api/auth/login", data={"username":"test","password":"123456"})
token = r.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
r2 = requests.get("http://localhost:8002/api/portfolios/1", headers=headers)
print("portfolio:", r2.json())
