import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.types import ASGIApp, Scope, Receive, Send
from app.database import engine, Base
from app.routers import auth, portfolio, stock, rebalance, strategy

logging.basicConfig(level=logging.INFO)

# 创建数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HorizonQuant API",
    description="地平线量化投资组合管理后端",
    version="1.0.0"
)


# 强制 CORS 中间件类 — 直接作为 ASGI app 包装，最外层优先执行
class ForceCORSMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        method = scope.get("method", "")
        headers = dict(scope.get("headers", []))

        # Preflight OPTIONS — 直接响应，不往后传
        if method == "OPTIONS":
            await send({
                "type": "http.response.start",
                "status": 200,
                "headers": [
                    (b"access-control-allow-origin", b"*"),
                    (b"access-control-allow-methods", b"GET,POST,PUT,DELETE,PATCH,OPTIONS"),
                    (b"access-control-allow-headers", b"*"),
                ],
            })
            await send({
                "type": "http.response.body",
                "body": b"",
            })
            return

        # 非 OPTIONS：加 header 后继续
        async def send_with_cors(message):
            if message["type"] == "http.response.start":
                message["headers"] = list(message.get("headers", [])) + [
                    (b"access-control-allow-origin", b"*"),
                ]
            await send(message)

        await self.app(scope, receive, send_with_cors)


app.add_middleware(ForceCORSMiddleware)

# 全局异常处理器（用于调试）
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    error_detail = traceback.format_exc()
    print(f"GLOBAL ERROR: {exc}")
    print(error_detail)
    return JSONResponse(
        status_code=500,
        content={"error": str(exc), "traceback": error_detail}
    )

# 请求日志中间件
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logging.info(f">>> {request.method} {request.url.path}")
    response = await call_next(request)
    logging.info(f"<< {response.status_code}")
    return response

# 注册路由
app.include_router(auth.router, prefix="/api")
app.include_router(portfolio.router, prefix="/api")
app.include_router(stock.router, prefix="/api")
app.include_router(rebalance.router, prefix="/api")
app.include_router(strategy.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "HorizonQuant API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}
