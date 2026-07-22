from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app.models import Rebalance, Portfolio, Stock, Holding
from app.schemas import RebalanceCreate, RebalanceOut
from app.routers.auth import get_current_user

router = APIRouter(prefix="/rebalances", tags=["调仓记录"])


def decimal_to_float(d):
    if d is None:
        return None
    return float(d)


@router.get("", response_model=List[RebalanceOut])
def get_rebalances(
    portfolio_id: int = None,
    stock_id: int = None,
    type: int = None,
    search: str = None,
    limit: int = 20,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Rebalance).filter(Rebalance.is_deleted == 0)
    
    # 搜索：按股票名称或代码模糊匹配
    if search:
        # 先 JOIN 再 filter，确保只在匹配股票的结果中筛选
        query = query.join(Stock, Rebalance.stock_id == Stock.id)
        search_pattern = f"%{search}%"
        query = query.filter(
            (Stock.name.like(search_pattern)) | (Stock.code.like(search_pattern))
        )
        print(f"[搜索DEBUG] search={search!r}, pattern={search_pattern!r}")
    
    if portfolio_id:
        # 验证组合归属
        portfolio = db.query(Portfolio).filter(
            Portfolio.id == portfolio_id,
            Portfolio.user_id == current_user.id,
            Portfolio.is_deleted == 0
        ).first()
        if not portfolio:
            raise HTTPException(status_code=404, detail="组合不存在")
        query = query.filter(Rebalance.portfolio_id == portfolio_id)
    
    if stock_id:
        query = query.filter(Rebalance.stock_id == stock_id)
    if type:
        query = query.filter(Rebalance.type == type)
    
    rebalances = query.order_by(Rebalance.operate_time.desc()).limit(limit).all()
    
    result = []
    for r in rebalances:
        # 获取股票信息
        stock = db.query(Stock).filter(Stock.id == r.stock_id).first()
        stock_data = None
        if stock:
            stock_data = {
                "id": stock.id,
                "code": stock.code,
                "name": stock.name,
                "market": stock.market,
                "exchange_code": stock.exchange_code,
                "create_time": stock.create_time,
                "update_time": stock.update_time
            }
        
        result.append({
            "id": r.id,
            "portfolio_id": r.portfolio_id,
            "stock_id": r.stock_id,
            "type": r.type,
            "shares": r.shares,
            "before_ratio": decimal_to_float(r.before_ratio),
            "after_ratio": decimal_to_float(r.after_ratio),
            "change_percent": decimal_to_float(r.change_percent),
            "price": decimal_to_float(r.price),
            "cost_price": decimal_to_float(r.cost_price),
            "amount": decimal_to_float(r.amount),
            "profit": decimal_to_float(r.profit),
            "reason": r.reason,
            "operate_time": r.operate_time,
            "create_time": r.create_time,
            "update_time": r.update_time,
            "stock": stock_data
        })
    return result


@router.get("/{rebalance_id}", response_model=RebalanceOut)
def get_rebalance(rebalance_id: int, db: Session = Depends(get_db)):
    rebalance = db.query(Rebalance).filter(
        Rebalance.id == rebalance_id,
        Rebalance.is_deleted == 0
    ).first()
    if not rebalance:
        raise HTTPException(status_code=404, detail="调仓记录不存在")
    return rebalance


@router.post("", response_model=RebalanceOut, status_code=status.HTTP_201_CREATED)
def create_rebalance(
    rebalance: RebalanceCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 验证组合归属
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == rebalance.portfolio_id,
        Portfolio.user_id == current_user.id,
        Portfolio.is_deleted == 0
    ).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="组合不存在")
    
    # 验证股票存在
    stock = db.query(Stock).filter(Stock.id == rebalance.stock_id).first()
    if not stock:
        raise HTTPException(status_code=400, detail=f"股票ID {rebalance.stock_id} 不存在")
    
    # 卖出时，从持仓获取买入价，并计算盈亏
    cost_price_val = None
    computed_profit = rebalance.profit
    if rebalance.type == 2:  # 卖出
        holding_for_cost = db.query(Holding).filter(
            Holding.portfolio_id == rebalance.portfolio_id,
            Holding.stock_id == rebalance.stock_id,
            Holding.is_deleted == 0
        ).first()
        if holding_for_cost:
            cost_price_val = holding_for_cost.cost_price
            # 盈亏 = (卖出价 - 买入价) × 股数
            computed_profit = (float(rebalance.price) - float(cost_price_val)) * abs(rebalance.shares)

    # 创建调仓记录
    db_rebalance = Rebalance(
        portfolio_id=rebalance.portfolio_id,
        stock_id=rebalance.stock_id,
        type=rebalance.type,
        shares=rebalance.shares,
        before_ratio=rebalance.before_ratio,
        after_ratio=rebalance.after_ratio,
        change_percent=rebalance.change_percent,
        price=rebalance.price,
        cost_price=cost_price_val,
        amount=rebalance.amount,
        profit=computed_profit,
        reason=rebalance.reason,
        operate_time=datetime.now()
    )
    db.add(db_rebalance)
    db.commit()
    db.refresh(db_rebalance)
    
    # 更新持仓表
    holding = db.query(Holding).filter(
        Holding.portfolio_id == rebalance.portfolio_id,
        Holding.stock_id == rebalance.stock_id,
        Holding.is_deleted == 0
    ).first()

    # 获取股票信息
    stock = db.query(Stock).filter(Stock.id == rebalance.stock_id).first()

    # 统一转为 float，避免 Decimal 和 float 直接运算报错
    trade_amount = float(rebalance.amount)
    current_mv = float(holding.market_value) if holding else 0.0

    if rebalance.type == 1:  # 买入
        if holding:
            new_shares = holding.shares + abs(rebalance.shares)
            new_market_value = current_mv + trade_amount
            holding.shares = new_shares
            holding.market_value = new_market_value
            holding.proportion = rebalance.after_ratio
            if stock:
                holding.current_price = rebalance.price
            # 更新持仓成本价为加权平均价
            old_cost = float(holding.cost_price or 0) * holding.shares
            new_cost = old_cost + trade_amount
            holding.cost_price = new_cost / new_shares if new_shares > 0 else 0
        else:
            # 查是否有软删除的持仓记录，优先复活
            deleted_holding = db.query(Holding).filter(
                Holding.portfolio_id == rebalance.portfolio_id,
                Holding.stock_id == rebalance.stock_id,
                Holding.is_deleted == 1
            ).first()
            if deleted_holding:
                deleted_holding.is_deleted = 0
                deleted_holding.shares = abs(rebalance.shares)
                deleted_holding.proportion = rebalance.after_ratio
                deleted_holding.market_value = trade_amount
                deleted_holding.current_price = rebalance.price
                deleted_holding.cost_price = rebalance.price
                deleted_holding.profit_loss = 0
                deleted_holding.profit_loss_ratio = 0
            else:
                new_holding = Holding(
                    portfolio_id=rebalance.portfolio_id,
                    stock_id=rebalance.stock_id,
                    shares=abs(rebalance.shares),
                    proportion=rebalance.after_ratio,
                    market_value=trade_amount,
                    current_price=rebalance.price,
                    cost_price=rebalance.price,
                    profit_loss=0,
                    profit_loss_ratio=0
                )
                db.add(new_holding)
    else:  # 卖出
        if holding:
            new_shares = holding.shares - abs(rebalance.shares)
            new_market_value = current_mv - trade_amount
            if new_shares > 0:
                holding.shares = new_shares
                holding.market_value = new_market_value
                holding.proportion = rebalance.after_ratio
                if stock:
                    holding.current_price = rebalance.price
            else:
                # 卖完了删除持仓
                holding.is_deleted = 1

    # 同步更新组合现金：买入减现金，卖出加现金
    if rebalance.type == 1:  # 买入
        portfolio.cash = float(portfolio.cash) - trade_amount
    else:  # 卖出
        portfolio.cash = float(portfolio.cash) + trade_amount

    # 重新计算组合总市值 = 所有当前持仓市值之和
    total_holding_mv = db.query(Holding).filter(
        Holding.portfolio_id == rebalance.portfolio_id,
        Holding.is_deleted == 0
    ).all()
    portfolio.total_market_value = sum(float(h.market_value or 0) for h in total_holding_mv)

    # 重算所有持仓的比例（以持仓总市值为分母，不再依赖旧的 portfolio.total_market_value）
    all_holdings = db.query(Holding).filter(
        Holding.portfolio_id == rebalance.portfolio_id,
        Holding.is_deleted == 0
    ).all()
    total_mv = sum(float(h.market_value or 0) for h in all_holdings)
    for h in all_holdings:
        h.proportion = round(float(h.market_value or 0) / total_mv * 100, 4) if total_mv > 0 else 0

    db.commit()
    return db_rebalance


@router.delete("/{rebalance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rebalance(
    rebalance_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rebalance = db.query(Rebalance).filter(Rebalance.id == rebalance_id, Rebalance.is_deleted == 0).first()
    if not rebalance:
        raise HTTPException(status_code=404, detail="调仓记录不存在")
    
    # 验证组合归属
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == rebalance.portfolio_id,
        Portfolio.user_id == current_user.id,
        Portfolio.is_deleted == 0
    ).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="组合不存在")
    
    rebalance.is_deleted = 1
    db.commit()
    return None