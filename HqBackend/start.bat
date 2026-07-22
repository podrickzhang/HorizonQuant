@echo off
cd /d "%~dp0"
echo 安装依赖...
pip install -r requirements.txt
echo.
echo 启动后端服务...
uvicorn app.main:app --reload --port 8002
pause