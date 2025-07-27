@echo off
setlocal enabledelayedexpansion

:: This script is designed to be run from the 'nextjs' directory.
:: It interactively copies (backs up) or writes (restores) the local Cloudflare D1 database.

:: --- Configuration ---
:: The database ID is automatically sourced from wrangler.jsonc.
set "DB_ID="
for /f "tokens=2 delims=:" %%a in ('findstr /c:"\"database_id\"" wrangler.jsonc') do (
    set "DB_ID_RAW=%%a"
)

if defined DB_ID_RAW (
    :: Clean up the extracted string: remove spaces, quotes, and trailing comma
    set "DB_ID=!DB_ID_RAW: =!"
    set "DB_ID=!DB_ID:"=!"
    set "DB_ID=!DB_ID:,=!"
)

if not defined DB_ID (
    echo [ERROR] Could not automatically find 'database_id' in wrangler.jsonc.
    echo [ERROR] Please ensure the file exists in the 'nextjs' directory and is correctly formatted.
    goto :end
)

set "DB_PATH=.\.wrangler\state\v3\d1"
set "BACKUP_PATH=.\src\sql\bak"
:: --- End Configuration ---

set "DB_FILE_PATH=%DB_PATH%\%DB_ID%.sqlite3"
set "BACKUP_FILE=%BACKUP_PATH%\%DB_ID%.bak.sqlite3"

:menu
echo.
echo ---------------------------------
echo  Local D1 Database Utility
echo ---------------------------------
echo.
echo  Database ID: %DB_ID%
echo.
echo  Please choose an option:
echo.
echo    1 - Backup (Copy) the current database
echo    2 - Restore (Write) from the backup
echo    3 - Exit
echo.
set /p "CHOICE=Enter your choice (1, 2, or 3): "

if /I "%CHOICE%"=="1" goto do_copy
if /I "%CHOICE%"=="2" goto do_write
if /I "%CHOICE%"=="3" goto end
echo [ERROR] Invalid choice. Please enter 1, 2, or 3.
goto menu

:do_copy
echo.
echo [INFO] Backing up database...
echo [INFO]   From: %DB_FILE_PATH%
echo [INFO]   To:   %BACKUP_FILE%
echo.

if not exist "%DB_FILE_PATH%" (
    echo [ERROR] Database file not found at: %DB_FILE_PATH%
    echo [ERROR] Please run the project once (e.g., "pnpm dev-d1") to generate the local database.
    goto :pause_and_exit
)

if not exist "%BACKUP_PATH%" (
    echo [INFO] Creating backup directory: %BACKUP_PATH%
    mkdir "%BACKUP_PATH%"
)

copy /Y "%DB_FILE_PATH%" "%BACKUP_FILE%" > nul
if %errorlevel% equ 0 (
    echo [SUCCESS] Database backup complete.
    echo           Backup saved to: %BACKUP_FILE%
) else (
    echo [ERROR] Database backup failed. Check file permissions.
)
goto :pause_and_exit

:do_write
echo.
echo [INFO] Restoring database from backup...
echo [INFO]   From: %BACKUP_FILE%
echo [INFO]   To:   %DB_FILE_PATH%
echo.

if not exist "%BACKUP_FILE%" (
    echo [ERROR] Backup file not found at: %BACKUP_FILE%
    echo [ERROR] Cannot restore. Create a backup first.
    goto :pause_and_exit
)

if not exist "%DB_PATH%" (
    echo [INFO] Creating database directory: %DB_PATH%
    mkdir "%DB_PATH%"
)

copy /Y "%BACKUP_FILE%" "%DB_FILE_PATH%" > nul
if %errorlevel% equ 0 (
    echo [SUCCESS] Database restore complete.
    echo           Please restart the dev server to see the changes.
) else (
    echo [ERROR] Database restore failed. Check file permissions.
)
goto :pause_and_exit

:pause_and_exit
echo.
pause
goto :end

:end
endlocal
