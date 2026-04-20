@echo off
:: build_setup.bat — Codeg desktop app setup ^& build for Windows
:: Run from the repo root: build_setup.bat
:: Delegates to build_setup.ps1 via PowerShell with execution policy bypass

setlocal

:: Check we're in the right directory
if not exist "src-tauri\Cargo.toml" (
    echo [ERR] Run this script from the codeg repo root ^(where src-tauri\ lives^).
    exit /b 1
)

:: Parse optional flags and pass them through
set "FLAGS="
:parse
if /i "%~1"=="-SkipInstall" ( set "FLAGS=%FLAGS% -SkipInstall" & shift & goto parse )
if /i "%~1"=="-DevBuild"    ( set "FLAGS=%FLAGS% -DevBuild"    & shift & goto parse )
if /i "%~1"=="/SkipInstall" ( set "FLAGS=%FLAGS% -SkipInstall" & shift & goto parse )
if /i "%~1"=="/DevBuild"    ( set "FLAGS=%FLAGS% -DevBuild"    & shift & goto parse )

echo.
echo ===================================================
echo   Codeg Build Setup
echo ===================================================
echo.
echo Launching PowerShell build script...
echo (If prompted by UAC, accept to allow winget installs)
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass ^
    -File "%~dp0build_setup.ps1" %FLAGS%

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERR] Build failed. Check the output above.
    pause
    exit /b %ERRORLEVEL%
)

echo.
pause
