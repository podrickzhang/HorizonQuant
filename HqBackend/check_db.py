from sqlalchemy import create_engine, text

# 使用与后端相同的数据库 URL
engine = create_engine('mysql+pymysql://root:1234qwer@localhost:3306/horizonquant?charset=utf8mb4')

with engine.connect() as conn:
    # 检查 portfolio 表结构
    result = conn.execute(text("DESCRIBE portfolio"))
    columns = {row[0] for row in result}
    print("portfolio 表字段:", columns)
    
    if 'cash' not in columns:
        print("缺少 cash 列，正在添加...")
        conn.execute(text("ALTER TABLE portfolio ADD COLUMN cash DECIMAL(20,2) NOT NULL DEFAULT 0"))
        conn.commit()
        print("cash 列已添加")
    else:
        print("cash 列已存在")
    
    # 查看组合7的数据
    result = conn.execute(text("SELECT id, name, cash, total_market_value, initial_amount FROM portfolio WHERE id = 7"))
    row = result.fetchone()
    if row:
        print(f"组合7: id={row[0]}, name={row[1]}, cash={row[2]}, total_market_value={row[3]}, initial_amount={row[4]}")
