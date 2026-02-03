@echo off
echo 启动 Git 服务器 + NPM 私服...

echo.
echo 1. 安装依赖...
cd backend
call npm install

echo.
echo 2. 启动 Verdaccio NPM 私服...
start "Verdaccio NPM Server" cmd /k "npm run verdaccio:start"

echo.
echo 3. 等待 Verdaccio 启动...
timeout /t 3 /nobreak > nul

echo.
echo 4. 启动 Git 服务器...
start "Git Server" cmd /k "npm start"

echo.
echo ✅ 服务启动完成！
echo.
echo 📡 Git 服务器: http://localhost:3000
echo 📦 NPM 私服: http://localhost:4873 (仅后端使用)
echo 👤 默认账号: admin / 123456
echo.
echo 💡 提示: 
echo    - Git 服务器包含了 NPM 包管理界面
echo    - Verdaccio 在后台运行，无需直接访问
echo    - 可以通过 Git 服务器界面管理 NPM 包
echo.
pause
