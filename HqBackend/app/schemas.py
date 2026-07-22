from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


# ========== 用户相关 ==========
class UserBase(BaseModel):
    username: str
    nickname: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    nickname: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    status: Optional[int] = None


class UserOut(UserBase):
    id: int
    status: int
    create_time: datetime
    update_time: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ========== 投资组合相关 ==========
class PortfolioBase(BaseModel):
    name: str
    description: Optional[str] = None
    initial_amount: Optional[float] = 0


class PortfolioCreate(PortfolioBase):
    strategy_id: Optional[int] = None


class PortfolioUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    total_return: Optional[float] = None
    daily_return: Optional[float] = None
    total_market_value: Optional[float] = None
    mini_chart_data: Optional[List[float]] = None
    data_update_time: Optional[datetime] = None
    strategy_id: Optional[int] = None


class StrategyOut(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str] = None
    max_position_pct: float
    max_stock_pct: float
    stop_loss_pct: float
    take_profit_pct: float
    max_daily_loss_pct: float
    is_default: int
    create_time: datetime
    update_time: datetime

    class Config:
        from_attributes = True


class PortfolioOut(PortfolioBase):
    id: int
    user_id: int
    total_return: float
    daily_return: float
    data_stale: bool = False
    stock_value: float  # 持仓市值（不含现金）
    total_portfolio_value: float  # 总资产 = 现金 + 持仓市值
    cash: Optional[float] = None
    initial_amount: Optional[float] = 0
    mini_chart_data: Optional[List[float]]
    data_update_time: Optional[datetime]
    status: int
    strategy_id: Optional[int] = None
    create_time: datetime
    update_time: datetime

    class Config:
        from_attributes = True


# ========== 股票相关 ==========
class StockBase(BaseModel):
    code: str
    name: str
    market: str
    exchange_code: Optional[str] = None


class StockCreate(StockBase):
    pass


class StockOut(StockBase):
    id: int
    create_time: datetime
    update_time: datetime

    class Config:
        from_attributes = True


# ========== 持仓相关 ==========
class HoldingBase(BaseModel):
    stock_id: int
    shares: int
    proportion: float
    market_value: float
    cost_price: Optional[float] = None
    current_price: Optional[float] = None
    profit_loss: float
    profit_loss_ratio: float


class HoldingCreate(HoldingBase):
    portfolio_id: int


class HoldingUpdate(BaseModel):
    shares: Optional[int] = None
    proportion: Optional[float] = None
    market_value: Optional[float] = None
    cost_price: Optional[float] = None
    current_price: Optional[float] = None
    profit_loss: Optional[float] = None
    profit_loss_ratio: Optional[float] = None


class HoldingOut(HoldingBase):
    id: int
    portfolio_id: int
    create_time: datetime
    update_time: datetime

    class Config:
        from_attributes = True


class HoldingWithStock(HoldingOut):
    stock: StockOut

    class Config:
        from_attributes = True


# ========== 调仓记录相关 ==========
class RebalanceBase(BaseModel):
    stock_id: int
    type: int
    shares: int
    before_ratio: float
    after_ratio: float
    change_percent: float
    price: float
    cost_price: Optional[float] = None  # 买入价（卖出时记录）
    amount: float
    profit: Optional[float] = None
    reason: Optional[str] = None


class RebalanceCreate(RebalanceBase):
    portfolio_id: int


class RebalanceOut(RebalanceBase):
    id: int
    portfolio_id: int
    operate_time: datetime
    create_time: datetime
    update_time: datetime
    stock: Optional[StockOut] = None

    class Config:
        from_attributes = True


class RebalanceWithStock(RebalanceOut):
    stock: StockOut

    class Config:
        from_attributes = True


# ========== 市场分布相关 ==========
class MarketDistBase(BaseModel):
    market: str
    proportion: float


class MarketDistCreate(MarketDistBase):
    portfolio_id: int


class MarketDistOut(MarketDistBase):
    id: int
    portfolio_id: int
    create_time: datetime
    update_time: datetime

    class Config:
        from_attributes = True


# ========== 组合详情（含关联数据）==========
class PortfolioDetailOut(PortfolioOut):
    profit_loss: float = 0  # 组合总盈亏 = 现金+持仓市值+已实现卖出盈亏-初始金额
    holdings: List[HoldingWithStock] = []
    rebalances: List[RebalanceWithStock] = []
    market_dists: List[MarketDistOut] = []
    strategy: Optional[StrategyOut] = None

    class Config:
        from_attributes = True


# ========== 收益率曲线 ==========
class YieldResponse(BaseModel):
    data: List[float]
    dates: List[str]
    total_return: float
    daily_return: float
    data_stale: bool = False
