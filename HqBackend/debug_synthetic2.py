import sys
sys.path.insert(0, '.')
from datetime import datetime, timedelta
import random

# Test _generate_synthetic
def _generate_synthetic(days, total_return):
    random.seed(42)
    trend = total_return / 100 if total_return else 0.1
    daily_trend = trend / max(days, 1)
    daily_vol = abs(total_return) / 100 * 0.015 + 0.005 if total_return else 0.008

    data = []
    dates = []
    val = 0.0
    now = datetime.now()

    for i in range(days):
        val += daily_trend + random.gauss(0, daily_vol)
        data.append(round(val * 100, 3))
        d = now - timedelta(days=(days - 1 - i))
        dates.append(d.strftime("%Y-%m-%d"))
    return data, dates

# Test
data, dates = _generate_synthetic(30, 45.82)
print(f"count: {len(data)}, first: {dates[0]}, last: {dates[-1]}")
print("OK")
