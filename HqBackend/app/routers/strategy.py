from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal

from app.database import get_db
from app.models import Strategy, SysUser
from app.schemas import StrategyOut
from app.routers.auth import get_current_user


def decimal_to_float(d):
    if d is None:
        return None
    return float(d)


router = APIRouter(prefix="/strategies", tags=["策略"])


@router.get("", response_model=List[StrategyOut])
def get_strategies(
    current_user: SysUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    strategies = db.query(Strategy).filter(
        Strategy.user_id == current_user.id,
        Strategy.is_deleted == 0
    ).order_by(Strategy.is_default.desc(), Strategy.create_time.desc()).all()

    return [
        StrategyOut(
            id=s.id,
            user_id=s.user_id,
            name=s.name,
            description=s.description,
            max_position_pct=decimal_to_float(s.max_position_pct),
            max_stock_pct=decimal_to_float(s.max_stock_pct),
            stop_loss_pct=decimal_to_float(s.stop_loss_pct),
            take_profit_pct=decimal_to_float(s.take_profit_pct),
            max_daily_loss_pct=decimal_to_float(s.max_daily_loss_pct),
            is_default=s.is_default,
            create_time=s.create_time,
            update_time=s.update_time,
        )
        for s in strategies
    ]


@router.post("", response_model=StrategyOut, status_code=201)
def create_strategy(
    data: dict,
    current_user: SysUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # data expected keys: name, description, max_position_pct, max_stock_pct,
    #                    stop_loss_pct, take_profit_pct, max_daily_loss_pct
    s = Strategy(
        user_id=current_user.id,
        name=data.get("name", ""),
        description=data.get("description"),
        max_position_pct=data.get("max_position_pct", 20),
        max_stock_pct=data.get("max_stock_pct", 30),
        stop_loss_pct=data.get("stop_loss_pct", -4),
        take_profit_pct=data.get("take_profit_pct", 8),
        max_daily_loss_pct=data.get("max_daily_loss_pct", -2),
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@router.put("/{strategy_id}", response_model=StrategyOut)
def update_strategy(
    strategy_id: int,
    data: dict,
    current_user: SysUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    s = db.query(Strategy).filter(
        Strategy.id == strategy_id,
        Strategy.user_id == current_user.id,
        Strategy.is_deleted == 0
    ).first()
    if not s:
        raise HTTPException(status_code=404, detail="策略不存在")

    for field in ["name", "description", "max_position_pct", "max_stock_pct",
                  "stop_loss_pct", "take_profit_pct", "max_daily_loss_pct"]:
        if field in data:
            setattr(s, field, data[field])

    db.commit()
    db.refresh(s)
    return s


@router.delete("/{strategy_id}", status_code=204)
def delete_strategy(
    strategy_id: int,
    current_user: SysUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    s = db.query(Strategy).filter(
        Strategy.id == strategy_id,
        Strategy.user_id == current_user.id,
        Strategy.is_deleted == 0
    ).first()
    if not s:
        raise HTTPException(status_code=404, detail="策略不存在")
    s.is_deleted = 1
    db.commit()