from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
import json
from datetime import datetime, timedelta

from app.database import get_db
from app.models import Portfolio, Holding, Rebalance, Stock, PortfolioSnapshot, SysUser, Strategy
from app.schemas import (
    PortfolioCreate, PortfolioUpdate, PortfolioOut, PortfolioDetailOut,
    HoldingOut, RebalanceOut, MarketDistOut, StrategyOut,
    YieldResponse
)
from app.routers.auth import get_current_user


router = APIRouter(prefix="/portfolios", tags=["投资组合"])


def decimal_to_float(d):
    if d is None:
        return None
    return float(d)


def json_to_list(j):
    if j is None:
        return None
    if isinstance(j, list):
        return j
    return json.loads(j)


@router.get("", response_model=List[PortfolioOut])
def get_portfolios(
    current_user: SysUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    portfolios = db.query(Portfolio).filter(
        Portfolio.user_id == current_user.id,
        Portfolio.is_deleted == 0
    ).all()
    
    result = []
    for p in portfolios:
        result.append(PortfolioOut(
            id=p.id,
            user_id=p.user_id,
            name=p.name,
            description=p.description,
            total_return=decimal_to_float(p.total_return),
            daily_return=decimal_to_float(p.daily_return),
            stock_value=decimal_to_float(p.total_market_value),
            total_portfolio_value=decimal_to_float(p.cash or 0) + decimal_to_float(p.total_market_value),
            initial_amount=decimal_to_float(p.initial_amount),
            mini_chart_data=json_to_list(p.mini_chart_data),
            data_update_time=p.data_update_time,
            status=p.status,
            strategy_id=p.strategy_id,
            create_time=p.create_time,
            update_time=p.update_time
        ))
    return result


@router.get("/{portfolio_id}", response_model=PortfolioDetailOut)
def get_portfolio(
    portfolio_id: int,
    current_user: SysUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id,
        Portfolio.is_deleted == 0
    ).first()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="组合不存在")
    
    # 获取持仓
    holdings = db.query(Holding).filter(
        Holding.portfolio_id == portfolio_id,
        Holding.is_deleted == 0
    ).all()
    
    # 过滤掉 stock 为 None 的脏数据
    holdings = [h for h in holdings if h.stock is not None]
    
    # 总资产 = 现金 + 持仓市值（实时计算，现金来自调仓流水）
    # 现金 = 初始金额 - 累计买入 + 累计卖出
    buy_total = sum(
        float(r.amount) for r in db.query(Rebalance).filter(
            Rebalance.portfolio_id==portfolio_id,
            Rebalance.type==1,
            Rebalance.is_deleted==0
        ).all()
    )
    sell_total = sum(
        float(r.amount) for r in db.query(Rebalance).filter(
            Rebalance.portfolio_id==portfolio_id,
            Rebalance.type==2,
            Rebalance.is_deleted==0
        ).all()
    )
    live_cash = round(decimal_to_float(portfolio.initial_amount) - buy_total + sell_total, 2)
    holdings_total_mv = sum(decimal_to_float(h.market_value) for h in holdings if h.market_value is not None)
    total_portfolio_value = round(live_cash + holdings_total_mv, 2)

    holdings_out = []
    for h in holdings:
        holdings_out.append({
            "id": h.id,
            "portfolio_id": h.portfolio_id,
            "stock_id": h.stock_id,
            "shares": h.shares,
            # 实时计算比例：单只市值 / 总资产
            "proportion": round(
                decimal_to_float(h.market_value) / total_portfolio_value * 100, 4
            ) if total_portfolio_value > 0 else 0,
            "market_value": decimal_to_float(h.market_value),
            "cost_price": decimal_to_float(h.cost_price),
            "current_price": decimal_to_float(h.current_price),
            "profit_loss": decimal_to_float(h.profit_loss),
            "profit_loss_ratio": decimal_to_float(h.profit_loss_ratio),
            "create_time": h.create_time,
            "update_time": h.update_time,
            "stock": {
                "id": h.stock.id,
                "code": h.stock.code,
                "name": h.stock.name,
                "market": h.stock.market,
                "exchange_code": h.stock.exchange_code,
                "create_time": h.stock.create_time,
                "update_time": h.stock.update_time
            }
        })
    
    # 获取调仓记录
    rebalances = db.query(Rebalance).filter(
        Rebalance.portfolio_id == portfolio_id,
        Rebalance.is_deleted == 0
    ).order_by(Rebalance.operate_time.desc()).limit(20).all()
    
    # 过滤掉 stock 为 None 的脏数据
    rebalances = [r for r in rebalances if r.stock is not None]
    
    rebalances_out = []
    for r in rebalances:
        rebalances_out.append({
            "id": r.id,
            "portfolio_id": r.portfolio_id,
            "stock_id": r.stock_id,
            "type": r.type,
            "shares": r.shares,
            "before_ratio": decimal_to_float(r.before_ratio),
            "after_ratio": decimal_to_float(r.after_ratio),
            "change_percent": decimal_to_float(r.change_percent),
            "price": decimal_to_float(r.price),
            "amount": decimal_to_float(r.amount),
            "profit": decimal_to_float(r.profit),
            "reason": r.reason,
            "operate_time": r.operate_time,
            "create_time": r.create_time,
            "update_time": r.update_time,
            "stock": {
                "id": r.stock.id,
                "code": r.stock.code,
                "name": r.stock.name,
                "market": r.stock.market,
                "exchange_code": r.stock.exchange_code,
                "create_time": r.stock.create_time,
                "update_time": r.stock.update_time
            }
        })
    
    # 实时计算市场分布（按当前持仓的 market 字段 group by，库存内不再查 market_dist 表）
    from sqlalchemy import func as sa_func
    total_mv = sum(decimal_to_float(h.market_value) for h in holdings)
    market_group = db.query(
        Stock.market,
        sa_func.sum(Holding.market_value).label('total_mv')
    ).join(Holding, Holding.stock_id == Stock.id).filter(
        Holding.portfolio_id == portfolio_id,
        Holding.is_deleted == 0
    ).group_by(Stock.market).all()

    market_dists_out = []
    for idx, (mkt, mv_sum) in enumerate(market_group, start=1):
        mv_float = float(mv_sum or 0)
        pct = (mv_float / total_portfolio_value * 100) if total_portfolio_value > 0 else 0
        market_dists_out.append({
            "id": idx,
            "portfolio_id": portfolio_id,
            "market": mkt,
            "proportion": round(pct, 4),
            "create_time": portfolio.create_time,
            "update_time": portfolio.update_time
        })

    # 从快照表获取历史数据生成收益率曲线
    snapshots = db.query(PortfolioSnapshot).filter(
        PortfolioSnapshot.portfolio_id == portfolio_id
    ).order_by(PortfolioSnapshot.snapshot_date.asc()).all()
    
    # 生成收益率曲线数据
    mini_chart = []
    if snapshots:
        initial = float(snapshots[0].net_value) if snapshots[0].net_value else 1
        for s in snapshots:
            nv = float(s.net_value) if s.net_value else 1
            # 计算相对初始净值的收益率百分比
            return_pct = ((nv / initial) - 1) * 100 if initial else 0
            mini_chart.append(round(return_pct, 2))
    
    # 如果没有快照数据，使用portfolio.mini_chart_data
    if not mini_chart and portfolio.mini_chart_data:
        mini_chart = json_to_list(portfolio.mini_chart_data)
    
    strategy_out = None
    if portfolio.strategy_id:
        s = db.query(Strategy).filter(Strategy.id == portfolio.strategy_id, Strategy.is_deleted == 0).first()
        if s:
            strategy_out = {
                "id": s.id,
                "user_id": s.user_id,
                "name": s.name,
                "description": s.description,
                "max_position_pct": decimal_to_float(s.max_position_pct),
                "max_stock_pct": decimal_to_float(s.max_stock_pct),
                "stop_loss_pct": decimal_to_float(s.stop_loss_pct),
                "take_profit_pct": decimal_to_float(s.take_profit_pct),
                "max_daily_loss_pct": decimal_to_float(s.max_daily_loss_pct),
                "is_default": s.is_default,
                "create_time": s.create_time,
                "update_time": s.update_time,
            }
    return PortfolioDetailOut(
        id=portfolio.id,
        user_id=portfolio.user_id,
        name=portfolio.name,
        description=portfolio.description,
        total_return=decimal_to_float(portfolio.total_return),
        daily_return=decimal_to_float(portfolio.daily_return),
        stock_value=holdings_total_mv,
        total_portfolio_value=total_portfolio_value,
        cash=live_cash,
        initial_amount=decimal_to_float(portfolio.initial_amount),
        profit_loss=round(total_portfolio_value - decimal_to_float(portfolio.initial_amount), 2),
        mini_chart_data=mini_chart,
        data_update_time=portfolio.data_update_time,
        status=portfolio.status,
        strategy_id=portfolio.strategy_id,
        create_time=portfolio.create_time,
        update_time=portfolio.update_time,
        holdings=holdings_out,
        rebalances=rebalances_out,
        market_dists=market_dists_out,
        strategy=strategy_out
    )



@router.get("/{portfolio_id}/yield", response_model=YieldResponse)
def get_portfolio_yield(
    portfolio_id: int,
    period: str = Query("all", regex="^(1m|3m|1y|all)$"),
    current_user: SysUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取收益率曲线数据：优先真实快照，数据不够时合成对应周期的曲线"""
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id,
        Portfolio.is_deleted == 0
    ).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="组合不存在")

    period_days_map = {"1m": 30, "3m": 90, "1y": 365}
    period_days = period_days_map.get(period, 0)
    cutoff = datetime.now() - timedelta(days=period_days) if period_days else None

    snapshots = db.query(PortfolioSnapshot).filter(
        PortfolioSnapshot.portfolio_id == portfolio_id
    ).order_by(PortfolioSnapshot.snapshot_date.asc()).all()

    data, dates = [], []
    data_stale = False
    tr = decimal_to_float(portfolio.total_return)

    if snapshots:
        latest = snapshots[-1].snapshot_date
        if cutoff and latest >= cutoff:
            # 快照覆盖请求周期 -> 用真实数据，只取 cutoff 之后
            filtered = [s for s in snapshots if s.snapshot_date >= cutoff] if cutoff else snapshots
            initial = float(filtered[0].net_value) if filtered[0].net_value else 1.0
            for s in filtered:
                nv = float(s.net_value) if s.net_value else 1.0
                data.append(round(((nv / initial) - 1) * 100, 2))
                dates.append(s.snapshot_date.strftime("%Y-%m-%d"))
        else:
            # 快照不够新 -> 返回空数据
            data, dates = [], []
            data_stale = True
    else:
        # 无快照 -> 返回空数据，不生成假数据
        data, dates = [], []
        data_stale = False

    return YieldResponse(
        data=data,
        dates=dates,
        total_return=tr,
        daily_return=decimal_to_float(portfolio.daily_return),
        data_stale=data_stale,
    )


@router.post("", response_model=PortfolioOut, status_code=status.HTTP_201_CREATED)
def create_portfolio(
    portfolio: PortfolioCreate,
    current_user: SysUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_portfolio = Portfolio(
        user_id=current_user.id,
        name=portfolio.name,
        description=portfolio.description,
        initial_amount=portfolio.initial_amount or 0,
        strategy_id=portfolio.strategy_id
    )
    db.add(db_portfolio)
    db.commit()
    db.refresh(db_portfolio)
    return db_portfolio


@router.put("/{portfolio_id}", response_model=PortfolioOut)
def update_portfolio(
    portfolio_id: int,
    portfolio_update: PortfolioUpdate,
    current_user: SysUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id,
        Portfolio.is_deleted == 0
    ).first()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="组合不存在")
    
    if portfolio_update.name is not None:
        portfolio.name = portfolio_update.name
    if portfolio_update.description is not None:
        portfolio.description = portfolio_update.description
    if portfolio_update.total_return is not None:
        portfolio.total_return = portfolio_update.total_return
    if portfolio_update.daily_return is not None:
        portfolio.daily_return = portfolio_update.daily_return
    if portfolio_update.total_market_value is not None:
        portfolio.total_market_value = portfolio_update.total_market_value
    if portfolio_update.mini_chart_data is not None:
        portfolio.mini_chart_data = portfolio_update.mini_chart_data
    if portfolio_update.data_update_time is not None:
        portfolio.data_update_time = portfolio_update.data_update_time
    portfolio.strategy_id = portfolio_update.strategy_id  # allow None
    
    db.commit()
    db.refresh(portfolio)
    
    # 手动构造返回（PortfolioOut 要求计算字段）
    holdings = db.query(Holding).filter(
        Holding.portfolio_id == portfolio_id,
        Holding.is_deleted == 0
    ).all()
    holdings_total_mv = sum(float(h.market_value or 0) for h in holdings)
    
    # 计算现金
    buy_total = sum(float(r.amount) for r in db.query(Rebalance).filter(
        Rebalance.portfolio_id == portfolio_id,
        Rebalance.type == 1,
        Rebalance.is_deleted == 0
    ).all())
    sell_total = sum(float(r.amount) for r in db.query(Rebalance).filter(
        Rebalance.portfolio_id == portfolio_id,
        Rebalance.type == 2,
        Rebalance.is_deleted == 0
    ).all())
    live_cash = float(portfolio.initial_amount or 0) - buy_total + sell_total
    
    return {
        "id": portfolio.id,
        "user_id": portfolio.user_id,
        "name": portfolio.name,
        "description": portfolio.description,
        "initial_amount": float(portfolio.initial_amount or 0),
        "total_return": float(portfolio.total_return or 0),
        "daily_return": float(portfolio.daily_return or 0),
        "data_stale": False,
        "stock_value": round(holdings_total_mv, 2),
        "total_portfolio_value": round(live_cash + holdings_total_mv, 2),
        "cash": round(live_cash, 2),
        "mini_chart_data": json_to_list(portfolio.mini_chart_data),
        "data_update_time": portfolio.data_update_time,
        "status": portfolio.status,
        "strategy_id": portfolio.strategy_id,
        "create_time": portfolio.create_time,
        "update_time": portfolio.update_time,
    }


@router.delete("/{portfolio_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_portfolio(
    portfolio_id: int,
    current_user: SysUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id,
        Portfolio.is_deleted == 0
    ).first()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="组合不存在")
    
    portfolio.is_deleted = 1
    db.commit()
    return None