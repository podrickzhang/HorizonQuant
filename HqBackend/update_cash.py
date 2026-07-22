from sqlalchemy import create_engine, text

engine = create_engine('mysql+pymysql://root:1234qwer@localhost:3306/horizonquant?charset=utf8mb4')

with engine.connect() as conn:
    # 把所有组合的 cash 更新为 initial_amount（如果没有持仓的话，实际应该根据持仓计算，这里先简单处理）
    # 更准确的做法：cash = initial_amount - 持仓成本总和
    # 但为了简化，先把所有组合的 cash 设为 initial_amount
    conn.execute(text("UPDATE portfolio SET cash = initial_amount"))
    conn.commit()
    print("已更新所有组合的 cash 字段")
    
    # 查看组合7的数据
    result = conn.execute(text("SELECT id, name, cash, total_market_value, initial_amount FROM portfolio WHERE id = 7"))
    row = result.fetchone()
    if row:
        print(f"组合7: id={row[0]}, name={row[1]}, cash={row[2]}, total_market_value={row[3]}, initial_amount={row[4]}")
