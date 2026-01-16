@echo off
echo ========================================
echo NPM 发布脚本
echo ========================================
echo.

echo [1/5] 检查发布前准备...
node scripts/pre-publish-check.js
if errorlevel 1 (
    echo.
    echo 检查失败，请修复问题后重试
    pause
    exit /b 1
)

echo.
echo [2/5] 查看将要发布的文件...
npm pack --dry-run
echo.

echo [3/5] 确认发布信息
set /p confirm="确认要发布到 npm 吗？(y/n): "
if /i not "%confirm%"=="y" (
    echo 已取消发布
    pause
    exit /b 0
)

echo.
echo [4/5] 检查 npm 登录状态...
npm whoami
if errorlevel 1 (
    echo.
    echo 未登录 npm，请先登录
    npm login
)

echo.
echo [5/5] 开始发布...
npm publish --access public

if errorlevel 1 (
    echo.
    echo ❌ 发布失败
    pause
    exit /b 1
) else (
    echo.
    echo ========================================
    echo ✅ 发布成功！
    echo ========================================
    echo.
    echo 你的包已发布到 npm
    echo 用户可以通过以下方式安装:
    echo   npm install -g git-server
    echo   或
    echo   npx git-server
    echo.
    echo 查看包信息:
    echo   npm info git-server
    echo.
    echo 访问 npm 页面:
    echo   https://www.npmjs.com/package/git-server
    echo.
)

pause
