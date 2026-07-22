import requests
r = requests.post("http://localhost:8002/api/auth/login", data={"username":"test","password":"123456"})
token = r.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
for period in ["1m", "3m", "1y", "all"]:
    r = requests.get(f"http://localhost:8002/api/portfolios/1/yield?period={period}", headers=headers)
    data = r.json()
    print(f"{period}: count={len(data['data'])}, stale={data.get('data_stale')}, first={data['dates'][0]}, last={data['dates'][-1]}")
