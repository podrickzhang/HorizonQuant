with open("app/routers/portfolio.py", "r", encoding="utf-8") as f:
    content = f.read()

old = """    # 计算起始日期
    now = datetime.now()
    period_days = {"1m": 30, "3m": 90, "1y": 365}.get(period)
    start_date = now - timedelta(days=period_days) if period_days else None

    # 从快照表查询（不做日期过滤，前端按实际日期渲染）
    snapshots = db.query(PortfolioSnapshot).filter(
        PortfolioSnapshot.portfolio_id == portfolio_id
    ).order_by(PortfolioSnapshot.snapshot_date.asc()).all()

    # 根据快照实际日期范围计算 period 过滤
    # 若快照无数据或日期太旧（超过 period），fallback 到 mini_chart_data
    snapshots_min_date = snapshots[0].snapshot_date if snapshots else None
    snapshots_max_date = snapshots[-1].snapshot_date if snapshots else None
    
    use_snapshot = False
    if snapshots and period_days:
        cutoff = now - timedelta(days=period_days)
        if snapshots_max_date and snapshots_max_date >= cutoff:
            # 快照数据足够新，使用快照
            snapshots = [s for s in snapshots if s.snapshot_date >= cutoff]
            use_snapshot = True
    elif snapshots and not period_days:
        # all 周期，使用全部快照
        use_snapshot = True

    data = []
    dates = []

    if use_snapshot and snapshots:
        initial = float(snapshots[0].net_value) if snapshots[0].net_value else 1
        for s in snapshots:
            nv = float(s.net_value) if s.net_value else 1
            return_pct = round(((nv / initial) - 1) * 100 if initial else 0, 2)
            data.append(return_pct)
            dates.append(s.snapshot_date.strftime("%Y-%m-%d"))
    else:
        # 无快照或数据太旧时使用 portfolio.mini_chart_data
        chart_data = json_to_list(portfolio.mini_chart_data) or []
        if chart_data:
            # 用当前时间作为截止日期往前走，保证 1m/3m 有足够数据
            end = now
            for i in range(len(chart_data)):
                d = end - timedelta(days=(len(chart_data) - 1 - i))
                if not period_days or d >= (now - timedelta(days=period_days)):
                    data.append(chart_data[i])
                    dates.append(d.strftime("%Y-%m-%d"))"""

new = """    # 计算当前时间
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

if old in content:
    content = content.replace(old, new)
    with open("app/routers/portfolio.py", "w", encoding="utf-8") as f:
        f.write(content)
    print("replaced ok")
else:
    print("NOT FOUND - checking partial match")
    if "period_days = " in content:
        print("period_days found in file")
    if "use_snapshot = " in content:
        print("use_snapshot found in file")
