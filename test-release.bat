@echo off
title Testing Release Package
echo.
echo ========================================
echo   Testing Release Package
echo ========================================
echo.

if not exist release (
    echo [ERROR] Release directory not found!
    echo Please run build-release.bat first.
    pause
    exit /b 1
)

echo [INFO] Checking release structure...

if not exist release\backend\app.js (
    echo [ERROR] backend/app.js not found!
    pause
    exit /b 1
)

if not exist release\start.bat (
    echo [ERROR] start.bat not found!
    pause
    exit /b 1
)

echo [OK] Release structure looks good!
echo.
echo [INFO] Installing dependencies in release/backend...
cd release\backend
npm install
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies!
    cd ..\..
    pause
    exit /b 1
)
cd ..\..

echo.
echo ========================================
echo   Test Completed!
echo ========================================
echo.
echo Release package is ready to use.
echo.
echo To test the server:
echo 1. cd release
echo 2. Double-click start.bat
echo.
pause
