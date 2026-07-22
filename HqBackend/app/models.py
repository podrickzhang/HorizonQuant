from sqlalchemy import Column, BigInteger, Integer, String, Numeric, DateTime, Boolean, JSON, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class SysUser(Base):
    __tablename__ = "sys_user"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    nickname = Column(String(50), nullable=True)
    password = Column(String(128), nullable=False)
    phone = Column(String(20), nullable=True, index=True)
    email = Column(String(100), nullable=True, index=True)
    status = Column(Integer, nullable=False, default=1)
    is_deleted = Column(Integer, nullable=False, default=0)
    create_time = Column(DateTime, nullable=False, server_default=func.now())
    update_time = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    portfolios = relationship("Portfolio", back_populates="user")


class Portfolio(Base):
    __tablename__ = "portfolio"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("sys_user.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    total_return = Column(Numeric(10, 4), nullable=False, default=0)
    daily_return = Column(Numeric(10, 4), nullable=False, default=0)
    total_market_value = Column(Numeric(20, 2), nullable=False, default=0)
    cash = Column(Numeric(20, 2), nullable=False, default=0)
    initial_amount = Column(Numeric(20, 2), nullable=False, default=0)
    mini_chart_data = Column(JSON, nullable=True)
    data_update_time = Column(DateTime, nullable=True, index=True)
    status = Column(Integer, nullable=False, default=1)
    is_deleted = Column(Integer, nullable=False, default=0)
    create_time = Column(DateTime, nullable=False, server_default=func.now())
    update_time = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    strategy_id = Column(BigInteger, nullable=True)

    user = relationship("SysUser", back_populates="portfolios")
    holdings = relationship("Holding", back_populates="portfolio")
    rebalances = relationship("Rebalance", back_populates="portfolio")
    market_dists = relationship("MarketDist", back_populates="portfolio")


class Strategy(Base):
    __tablename__ = "strategy"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    max_position_pct = Column(Numeric(10, 4), nullable=False, default=20)
    max_stock_pct = Column(Numeric(10, 4), nullable=False, default=30)
    stop_loss_pct = Column(Numeric(10, 4), nullable=False, default=-4)
    take_profit_pct = Column(Numeric(10, 4), nullable=False, default=8)
    max_daily_loss_pct = Column(Numeric(10, 4), nullable=False, default=-2)
    is_default = Column(Integer, nullable=False, default=0)
    is_deleted = Column(Integer, nullable=False, default=0)
    create_time = Column(DateTime, nullable=False, server_default=func.now())
    update_time = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())



class Stock(Base):
    __tablename__ = "stock"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    market = Column(String(10), nullable=False)
    exchange_code = Column(String(20), nullable=True)
    is_deleted = Column(Integer, nullable=False, default=0)
    create_time = Column(DateTime, nullable=False, server_default=func.now())
    update_time = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    holdings = relationship("Holding", back_populates="stock")
    rebalances = relationship("Rebalance", back_populates="stock")


class Holding(Base):
    __tablename__ = "holding"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    portfolio_id = Column(BigInteger, ForeignKey("portfolio.id"), nullable=False, index=True)
    stock_id = Column(BigInteger, ForeignKey("stock.id"), nullable=False, index=True)
    shares = Column(BigInteger, nullable=False, default=0)
    proportion = Column(Numeric(10, 4), nullable=False, default=0)
    market_value = Column(Numeric(20, 2), nullable=False, default=0)
    cost_price = Column(Numeric(20, 4), nullable=True)
    current_price = Column(Numeric(20, 4), nullable=True)
    profit_loss = Column(Numeric(20, 2), nullable=False, default=0)
    profit_loss_ratio = Column(Numeric(10, 4), nullable=False, default=0)
    is_deleted = Column(Integer, nullable=False, default=0)
    create_time = Column(DateTime, nullable=False, server_default=func.now())
    update_time = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    portfolio = relationship("Portfolio", back_populates="holdings")
    stock = relationship("Stock", back_populates="holdings")


class Rebalance(Base):
    __tablename__ = "rebalance"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    portfolio_id = Column(BigInteger, ForeignKey("portfolio.id"), nullable=False, index=True)
    stock_id = Column(BigInteger, ForeignKey("stock.id"), nullable=False, index=True)
    type = Column(Integer, nullable=False)
    shares = Column(BigInteger, nullable=False, default=0)
    before_ratio = Column(Numeric(10, 4), nullable=False, default=0)
    after_ratio = Column(Numeric(10, 4), nullable=False, default=0)
    change_percent = Column(Numeric(10, 4), nullable=False, default=0)
    price = Column(Numeric(20, 4), nullable=False)
    cost_price = Column(Numeric(20, 4), nullable=True)  # 买入价（卖出时记录当时成本价）
    amount = Column(Numeric(20, 2), nullable=False)
    profit = Column(Numeric(20, 2), nullable=True)
    reason = Column(String(500), nullable=True)
    operate_time = Column(DateTime, nullable=False, server_default=func.now(), index=True)
    is_deleted = Column(Integer, nullable=False, default=0)
    create_time = Column(DateTime, nullable=False, server_default=func.now())
    update_time = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    portfolio = relationship("Portfolio", back_populates="rebalances")
    stock = relationship("Stock", back_populates="rebalances")


class MarketDist(Base):
    __tablename__ = "market_dist"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    portfolio_id = Column(BigInteger, ForeignKey("portfolio.id"), nullable=False, index=True)
    market = Column(String(20), nullable=False)
    proportion = Column(Numeric(10, 4), nullable=False, default=0)
    is_deleted = Column(Integer, nullable=False, default=0)
    create_time = Column(DateTime, nullable=False, server_default=func.now())
    update_time = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    portfolio = relationship("Portfolio", back_populates="market_dists")


class PortfolioSnapshot(Base):
    __tablename__ = "portfolio_snapshot"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    portfolio_id = Column(BigInteger, ForeignKey("portfolio.id"), nullable=False, index=True)
    snapshot_date = Column(DateTime, nullable=False, index=True)
    total_return = Column(Numeric(10, 4), nullable=False, default=0)
    daily_return = Column(Numeric(10, 4), nullable=False, default=0)
    net_value = Column(Numeric(10, 4), nullable=False, default=1)
    total_assets = Column(Numeric(20, 2), nullable=False, default=0)
    cash = Column(Numeric(20, 2), nullable=False, default=0)
    market_value = Column(Numeric(20, 2), nullable=False, default=0)
    create_time = Column(DateTime, nullable=False, server_default=func.now())

    portfolio = relationship("Portfolio")


class OperationLog(Base):
    __tablename__ = "operation_log"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("sys_user.id"), nullable=False, index=True)
    module = Column(String(50), nullable=False)
    operation = Column(String(50), nullable=False)
    content = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    is_deleted = Column(Integer, nullable=False, default=0)
    create_time = Column(DateTime, nullable=False, server_default=func.now(), index=True)