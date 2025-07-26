@echo off
setlocal enabledelayedexpansion

:: Get the directory where the script is located
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%\..\..\.."

echo.
echo WARNING: This will insert mock data
set /p CONFIRM="Are you sure you want to continue? (y/N): "
if /i not "%CONFIRM%"=="y" (
    echo Operation cancelled.
    exit /b
)

echo 1. Inserting FAQ categories...
call npx wrangler d1 execute DB --local --file "%SCRIPT_DIR%0000_insert_faq_categories.sql"
if %ERRORLEVEL% neq 0 goto :error

echo 2. Inserting FAQ test data...
call npx wrangler d1 execute DB --local --file "%SCRIPT_DIR%0001_test_insert_faq_test_data.sql"
if %ERRORLEVEL% neq 0 goto :error

echo.
echo Database mock data insertion completed successfully!
pause
exit /b 0

:error
echo.
echo Error occurred %ERRORLEVEL%
pause
exit /b 1 