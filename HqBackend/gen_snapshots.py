"""Generate portfolio_snapshot data: 2025-03 to 2026-06, denser for recent months."""
import random
import datetime
from app.database import engine
from sqlalchemy import text

def generate_dates():
    """Generate snapshot dates with varying density."""
    dates = []
    start = datetime.date(2025, 3, 1)
    end = datetime.date(2026, 6, 11)
    
    # Phase 1: 2025-03 to 2026-03 (~13 months) - weekly data
    # Phase 2: 2026-03 to 2026-06 (~3 months) - daily or every other day
    # Phase 3: 2026-05 to 2026-06 (~1 month) - daily
    
    current = start
    while current <= end:
        if current >= datetime.date(2026, 5, 1):
            # 近1个月：每个交易日（跳过周末）
            if current.weekday() < 5:
                dates.append(current)
            current += datetime.timedelta(days=1)
        elif current >= datetime.date(2026, 3, 1):
            # 近3个月：每1-2个交易日
            if current.weekday() < 5:
                dates.append(current)
                # 有时跳过下一个交易日增加变化
                if random.random() < 0.3:
                    current += datetime.timedelta(days=2)
            current += datetime.timedelta(days=1)
        else:
            # 更早：每周1次
            if current.weekday() == 0:  # Monday
                dates.append(current)
            current += datetime.timedelta(days=1)
    
    return dates

def generate_values(dates):
    """Generate realistic cumulative return values using random walk."""
    # Start at 0, random walk with positive drift
    values = []
    total_return = 0.0
    daily_returns = []
    
    seed = 42
    rng = random.Random(seed)
    
    # Daily return: mean ~0.15%, volatility ~1.2%
    for i in range(len(dates)):
        if i == 0:
            daily_ret = rng.gauss(0.001, 0.008)
        else:
            # Slight positive drift
            daily_ret = rng.gauss(0.0012, 0.012)
        
        total_return += daily_ret
        daily_returns.append(round(daily_ret * 100, 4))  # percentage
        
        # Cumulative total return as percentage
        values.append(round(total_return * 100, 4))
    
    return values, daily_returns

def main():
    dates = generate_dates()
    total_returns, daily_returns = generate_values(dates)
    
    print(f"Total dates: {len(dates)}")
    print(f"First: {dates[0]}, Last: {dates[-1]}")
    print(f"2026-03+: {len([d for d in dates if d >= datetime.date(2026,3,1)])}")
    print(f"2026-05+: {len([d for d in dates if d >= datetime.date(2026,5,1)])}")
    
    # Clear existing data
    with engine.connect() as conn:
        conn.execute(text("DELETE FROM portfolio_snapshot"))
        conn.commit()
        print("Cleared existing data")
        
        # Insert new data for portfolio_id=1
        initial_amount = 100000.0  # 10万初始资金
        
        for i, d in enumerate(dates):
            net_value = round(1 + total_returns[i] / 100, 4)
            total_assets = round(initial_amount * net_value, 2)
            # cash 10%, market_value 90%
            market_value = round(total_assets * 0.9, 2)
            cash = round(total_assets - market_value, 2)
            
            conn.execute(text("""
                INSERT INTO portfolio_snapshot 
                (portfolio_id, snapshot_date, total_return, daily_return, net_value, total_assets, cash, market_value, create_time)
                VALUES (:pid, :sdate, :tret, :dret, :nv, :ta, :cash, :mv, :ctime)
            """), {
                "pid": 1,
                "sdate": datetime.datetime(d.year, d.month, d.day),
                "tret": total_returns[i],
                "dret": daily_returns[i],
                "nv": net_value,
                "ta": total_assets,
                "cash": cash,
                "mv": market_value,
                "ctime": datetime.datetime(d.year, d.month, d.day, 12, 0, 0),
            })
        
        conn.commit()
        print(f"Inserted {len(dates)} rows")
        
        # Verify
        count = conn.execute(text("SELECT COUNT(*) FROM portfolio_snapshot")).scalar()
        rng = conn.execute(text("SELECT MIN(snapshot_date), MAX(snapshot_date) FROM portfolio_snapshot")).fetchone()
        print(f"Verify: {count} rows, {rng[0]} ~ {rng[1]}")

if __name__ == "__main__":
    main()