@echo off
echo Cleaning release directory...

if exist release (
    echo Removing release directory...
    rmdir /s /q release
    if errorlevel 1 (
        echo.
        echo [WARNING] Could not remove release directory.
        echo Please close any programs using files in the release directory.
        echo Then run this script again.
        pause
        exit /b 1
    )
    echo Release directory removed.
) else (
    echo Release directory does not exist.
)

echo.
echo Done!
pause
