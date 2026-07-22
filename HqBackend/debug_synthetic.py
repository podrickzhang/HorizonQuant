import sys
sys.path.insert(0, '.')
from app.routers.portfolio import get_portfolio_yield
from unittest.mock import MagicMock
from datetime import datetime, timedelta

# Mock dependencies
mock_user = MagicMock()
mock_user.id = 1
mock_db = MagicMock()

# Mock portfolio
mock_portfolio = MagicMock()
mock_portfolio.id = 1
mock_portfolio.total_return = 45.82
mock_portfolio.mini_chart_data = None

# Mock snapshot
mock_snapshot = MagicMock()
mock_snapshot.snapshot_date = datetime(2025, 8, 30)
mock_snapshot.net_value = 1.4582

mock_db.query.return_value.filter.return_value.first.return_value = mock_portfolio
mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = [mock_snapshot]

result = get_portfolio_yield(portfolio_id=1, period='1m', current_user=mock_user, db=mock_db)
print("result:", result)
print("data count:", len(result.data) if result else "None")
