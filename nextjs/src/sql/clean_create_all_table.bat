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
call npx wrangler d1 execute DB %REMOTE_FLAG% --command "DROP TABLE IF EXISTS ChatMessage;"
if %ERRORLEVEL% neq 0 goto :error
call npx wrangler d1 execute DB %REMOTE_FLAG% --command "DROP TABLE IF EXISTS Chat;"
if %ERRORLEVEL% neq 0 goto :error
call npx wrangler d1 execute DB %REMOTE_FLAG% --command "DROP TABLE IF EXISTS User;"
if %ERRORLEVEL% neq 0 goto :error

echo.
echo Creating tables in order...

echo 1. Creating messages table...
call npx wrangler d1 execute DB %REMOTE_FLAG% --file "src\sql\0001_create_messages_table.sql"
if %ERRORLEVEL% neq 0 goto :error

echo 2. Creating chat sessions table...
call npx wrangler d1 execute DB %REMOTE_FLAG% --file "src\sql\0002_create_chat_sessions_table.sql"
if %ERRORLEVEL% neq 0 goto :error

echo 3. Adding feedback to messages...
call npx wrangler d1 execute DB %REMOTE_FLAG% --file "src\sql\0003_add_feedback_to_messages.sql"
if %ERRORLEVEL% neq 0 goto :error

echo 4. Creating users table...
call npx wrangler d1 execute DB %REMOTE_FLAG% --file "src\sql\0004_create_users_table.sql"
if %ERRORLEVEL% neq 0 goto :error

echo 5. Adding user ID to chat tables...
call npx wrangler d1 execute DB %REMOTE_FLAG% --file "src\sql\0005_add_user_id_to_chat_tables.sql"
if %ERRORLEVEL% neq 0 goto :error

echo.
echo Database cleanup and recreation completed successfully!
pause
exit /b 0

:error
echo.
echo Error occurred! Error code: %ERRORLEVEL%
pause
exit /b 1 