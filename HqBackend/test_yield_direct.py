import sys
sys.path.insert(0, '.')
from app.routers.portfolio import get_portfolio_yield
from app.database import SessionLocal
from app.models import SysUser
from datetime import datetime, timedelta

db = SessionLocal()
user = db.query(SysUser).filter(SysUser.username == "test").first()
print("user:", user)

# Manually call the function
result = get_portfolio_yield(
    portfolio_id=1,
    period="1m",
    current_user=user,
    db=db
)
print("result:", result)
print("data_stale:", result.data_stale)
print("count:", len(result.data))
db.close()
