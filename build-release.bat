@echo off
title Building Release Package
color 0A

echo.
echo ========================================
echo   Building Release Package
echo ========================================
echo.

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist node_modules (
    echo [INFO] Installing build dependencies...
    npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
)

REM Run build script
echo [INFO] Running build script...
node build-release.js

if errorlevel 1 (
    echo.
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Build Completed!
echo ========================================
echo.
echo Release package is in: .\release\
echo.
echo Next steps:
echo 1. cd release\backend
echo 2. npm install
echo 3. cd ..
echo 4. Double-click start.bat
echo.
pause
