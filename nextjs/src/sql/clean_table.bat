@echo off
setlocal enabledelayedexpansion

:: Get the directory where the script is located
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"
cd ..\..\

:: Verify we're in the correct directory
if not exist "src\sql\0001_create_messages_table.sql" (
    echo Error: Required SQL files not found. Please run this script from the nextjs directory.
    pause
    exit /b 1
)

echo Choose environment:
echo [1] Local (default)
echo [2] Remote
set /p ENV_CHOICE="Enter choice (1/2 or press Enter for local): "

set REMOTE_FLAG=
if "%ENV_CHOICE%"=="2" (
    set REMOTE_FLAG=--remote
    echo Selected: Remote environment
) else (
    echo Selected: Local environment
)

echo.
echo WARNING: This will DELETE ALL TABLES and recreate them.
set /p CONFIRM="Are you sure you want to continue? (y/N): "
if /i not "%CONFIRM%"=="y" (
    echo Operation cancelled.
    exit /b
)

echo.
echo Dropping existing tables...
call npx wrangler d1 execute DB %REMOTE_FLAG% --command "DROP TABLE IF EXISTS faq_likes;"
if %ERRORLEVEL% neq 0 goto :error
call npx wrangler d1 execute DB %REMOTE_FLAG% --command "DROP TABLE IF EXISTS faq_question_tags;"
if %ERRORLEVEL% neq 0 goto :error
call npx wrangler d1 execute DB %REMOTE_FLAG% --command "DROP TABLE IF EXISTS faq_tags;"
if %ERRORLEVEL% neq 0 goto :error
call npx wrangler d1 execute DB %REMOTE_FLAG% --command "DROP TABLE IF EXISTS faq_answers;"
if %ERRORLEVEL% neq 0 goto :error
call npx wrangler d1 execute DB %REMOTE_FLAG% --command "DROP TABLE IF EXISTS faq_questions;"
if %ERRORLEVEL% neq 0 goto :error
call npx wrangler d1 execute DB %REMOTE_FLAG% --command "DROP TABLE IF EXISTS faq_product_models;"
if %ERRORLEVEL% neq 0 goto :error
call npx wrangler d1 execute DB %REMOTE_FLAG% --command "DROP TABLE IF EXISTS faq_categories;"
if %ERRORLEVEL% neq 0 goto :error
call npx wrangler d1 execute DB %REMOTE_FLAG% --command "DROP TABLE IF EXISTS faq_import_jobs;"
if %ERRORLEVEL% neq 0 goto :error
call npx wrangler d1 execute DB %REMOTE_FLAG% --command "DROP TABLE IF EXISTS ChatMessage;"
if %ERRORLEVEL% neq 0 goto :error
call npx wrangler d1 execute DB %REMOTE_FLAG% --command "DROP TABLE IF EXISTS Chat;"
if %ERRORLEVEL% neq 0 goto :error
call npx wrangler d1 execute DB %REMOTE_FLAG% --command "DROP TABLE IF EXISTS User;"
if %ERRORLEVEL% neq 0 goto :error
call npx wrangler d1 execute DB %REMOTE_FLAG% --command "DROP TABLE IF EXISTS support_tickets;"
if %ERRORLEVEL% neq 0 goto :error
call npx wrangler d1 execute DB %REMOTE_FLAG% --command "DROP TABLE IF EXISTS Customers;"
if %ERRORLEVEL% neq 0 goto :error


echo Dropping existing tables finished!

exit /b 0
