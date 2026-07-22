with open('app/routers/portfolio.py', 'r', encoding='utf-8') as f:
    content = f.read()

old = """    # 计算当前时间
    now = datetime.now()

    # 从快照表查询（快照是收益率历史的唯一可靠来源，按实际日期返回全部）
    snapshots = db.query(PortfolioSnapshot).filter(
        PortfolioSnapshot.portfolio_id == portfolio_id
    ).order_by(PortfolioSnapshot.snapshot_date.asc()).all()

    data = []
    dates = []

    if snapshots:
        # 有快照 -> 全部返回（前端按实际日期渲染）
        initial = float(snapshots[0].net_value) if snapshots[0].net_value else 1
        for s in snapshots:
            nv = float(s.net_value) if s.net_value else 1
            return_pct = round(((nv / initial) - 1) * 100 if initial else 0, 2)
            data.append(return_pct)
            dates.append(s.snapshot_date.strftime("%Y-%m-%d"))
    else:
        # 无快照 -> 用 mini_chart_data（以当前日期往前推）
        chart_data = json_to_list(portfolio.mini_chart_data) or []
        end = now
        for i in range(len(chart_data)):
            d = end - timedelta(days=(len(chart_data) - 1 - i))
            data.append(chart_data[i])
            dates.append(d.strftime("%Y-%m-%d"))"""

new = """    # 计算当前时间
    now = datetime.now()
    period_days_map = {"1m": 30, "3m": 90, "1y": 365}
    period_days = period_days_map.get(period)

    # 从快照表查询（按实际日期返回）
    snapshots = db.query(PortfolioSnapshot).filter(
        PortfolioSnapshot.portfolio_id == portfolio_id
    ).order_by(PortfolioSnapshot.snapshot_date.asc()).all()

    data = []
    dates = []
    data_stale = False  # 数据是否过期（超过请求的周期）

    if snapshots:
        # 用最后一条快照的日期判断数据是否过期
        latest_snapshot_date = snapshots[-1].snapshot_date
        cutoff = now - timedelta(days=period_days) if period_days else None
        if cutoff and latest_snapshot_date < cutoff:
            data_stale = True
        # 有快照 -> 全部返回（前端按实际日期渲染）
        initial = float(snapshots[0].net_value) if snapshots[0].net_value else 1
        for s in snapshots:
            nv = float(s.net_value) if s.net_value else 1
            return_pct = round(((nv / initial) - 1) * 100 if initial else 0, 2)
            data.append(return_pct)
            dates.append(s.snapshot_date.strftime("%Y-%m-%d"))
    else:
        # 无快照 -> 用 mini_chart_data（以当前日期往前推）
        chart_data = json_to_list(portfolio.mini_chart_data) or []
        end = now
        for i in range(len(chart_data)):
            d = end - timedelta(days=(len(chart_data) - 1 - i))
            data.append(chart_data[i])
            dates.append(d.strftime("%Y-%m-%d"))"""

if old in content:
    content = content.replace(old, new)
    # Also update YieldResponse to include data_stale
    old_schema = "data: List[float],\n    dates: List[str],\n    total_return: Optional[float],\n    daily_return: Optional[float]"
    new_schema = "data: List[float],\n    dates: List[str],\n    total_return: Optional[float],\n    daily_return: Optional[float],\n    data_stale: bool = False"
    if old_schema in content:
        content = content.replace(old_schema, new_schema)
    else:
        print("schema pattern not found - skip")
    # Update YieldResponse instantiation
    old_return = "return YieldResponse(\n        data=data,\n        dates=dates,"
    new_return = "return YieldResponse(\n        data=data,\n        dates=dates,\n        data_stale=data_stale,"
    if old_return in content:
        content = content.replace(old_return, new_return)
    else:
        print("return pattern not found - skip")
    with open('app/routers/portfolio.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("done")
else:
    print("old text NOT found")
