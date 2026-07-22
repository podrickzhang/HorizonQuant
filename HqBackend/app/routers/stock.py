from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import Stock
from app.schemas import StockCreate, StockOut
from app.routers.auth import get_current_user

router = APIRouter(prefix="/stocks", tags=["股票"])


@router.get("", response_model=List[StockOut])
def get_stocks(
    market: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(Stock).filter(Stock.is_deleted == 0)
    if market:
        query = query.filter(Stock.market == market)
    return query.all()


@router.get("/{stock_id}", response_model=StockOut)
def get_stock(stock_id: int, db: Session = Depends(get_db)):
    stock = db.query(Stock).filter(Stock.id == stock_id, Stock.is_deleted == 0).first()
    if not stock:
        raise HTTPException(status_code=404, detail="股票不存在")
    return stock


@router.get("/code/{code}", response_model=StockOut)
def get_stock_by_code(code: str, db: Session = Depends(get_db)):
    stock = db.query(Stock).filter(Stock.code == code, Stock.is_deleted == 0).first()
    if not stock:
        raise HTTPException(status_code=404, detail="股票不存在")
    return stock


@router.post("", response_model=StockOut, status_code=status.HTTP_201_CREATED)
def create_stock(stock: StockCreate, db: Session = Depends(get_db)):
    # 检查股票代码是否已存在
    existing = db.query(Stock).filter(Stock.code == stock.code, Stock.is_deleted == 0).first()
    if existing:
        raise HTTPException(status_code=400, detail="股票代码已存在")
    
    db_stock = Stock(
        code=stock.code,
        name=stock.name,
        market=stock.market,
        exchange_code=stock.exchange_code,
    )
    db.add(db_stock)
    db.commit()
    db.refresh(db_stock)
    return db_stock


@router.put("/{stock_id}", response_model=StockOut)
def update_stock(stock_id: int, stock_update: StockCreate, db: Session = Depends(get_db)):
    stock = db.query(Stock).filter(Stock.id == stock_id, Stock.is_deleted == 0).first()
    if not stock:
        raise HTTPException(status_code=404, detail="股票不存在")
    
    # 检查新代码是否被占用
    if stock_update.code != stock.code:
        existing = db.query(Stock).filter(Stock.code == stock_update.code, Stock.is_deleted == 0).first()
        if existing:
            raise HTTPException(status_code=400, detail="股票代码已存在")
    
    stock.code = stock_update.code
    stock.name = stock_update.name
    stock.market = stock_update.market
    stock.exchange_code = stock_update.exchange_code

    db.commit()
    db.refresh(stock)
    return stock


@router.delete("/{stock_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stock(stock_id: int, db: Session = Depends(get_db)):
    stock = db.query(Stock).filter(Stock.id == stock_id, Stock.is_deleted == 0).first()
    if not stock:
        raise HTTPException(status_code=404, detail="股票不存在")
    
    stock.is_deleted = 1
    db.commit()
    return None