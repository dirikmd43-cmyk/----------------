@echo off
title HotelBook - Project Launcher

echo ============================================================
echo   HotelBook - Starting backend and frontend
echo ============================================================
echo.

:: 1. Find Python
set PYTHON_EXE=
for %%P in (python3.exe python.exe) do (
    if not defined PYTHON_EXE (
        for /f "delims=" %%F in ('where %%P 2^>nul') do (
            echo %%F | findstr /i "WindowsApps" >nul || set PYTHON_EXE=%%F
        )
    )
)

if not defined PYTHON_EXE (
    echo [ERROR] Python not found in PATH.
    pause
    exit /b 1
)
echo [OK] Python found: %PYTHON_EXE%
echo.

:: 2. Create venv
if not exist "venv\Scripts\activate.bat" (
    echo [1/4] Creating virtual environment...
    "%PYTHON_EXE%" -m venv venv
) else (
    echo [1/4] venv already exists - skipping.
)

:: 3. Install backend deps
echo [2/4] Installing backend dependencies...
call venv\Scripts\activate.bat
cd backend
pip install -r requirements.txt -q
cd ..
echo [OK] Backend dependencies installed.
echo.

:: 4. Install frontend deps
echo [3/4] Installing frontend dependencies...
if not exist "frontend\node_modules" (
    cd frontend
    npm install
    cd ..
    echo [OK] Frontend dependencies installed.
) else (
    echo [3/4] node_modules already exists - skipping.
)
echo.

:: 5. Start servers
echo [4/4] Starting servers...

start "HotelBook Backend" cmd /k "call venv\Scripts\activate.bat && cd backend && echo Starting Backend on 127.0.0.1:8000 && uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

start "HotelBook Frontend" cmd /k "cd /d %~dp0frontend && echo Starting Frontend on 127.0.0.1:5173 && npm run dev -- --host 127.0.0.1"

echo.
echo ============================================================
echo   Servers are running in separate windows!
echo.
echo   Site:       http://127.0.0.1:5173
echo   API Docs:   http://127.0.0.1:8000/docs
echo ============================================================
echo.
start http://127.0.0.1:5173
pause