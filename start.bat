@echo off
setlocal
chcp 65001 > nul
cd /d "%~dp0"
title RAHAF System Launcher

echo ============================================
echo        RAHAF Business System Launcher
echo ============================================
echo.

where docker > nul 2>&1
if not errorlevel 1 (
    docker compose version > nul 2>&1
    if not errorlevel 1 (
        echo Starting all services with Docker Compose...
        docker compose up --build -d
        if errorlevel 1 goto docker_error
        goto started
    )

    docker-compose --version > nul 2>&1
    if not errorlevel 1 (
        echo Starting all services with Docker Compose...
        docker-compose up --build -d
        if errorlevel 1 goto docker_error
        goto started
    )
)

echo Docker Compose was not found.
echo Starting local development servers instead.
echo Make sure PostgreSQL is running and database rahaf_db exists.
echo.

where npm > nul 2>&1
if errorlevel 1 (
    echo ERROR: npm was not found. Install Node.js or run setup.bat first.
    pause
    exit /b 1
)

where python > nul 2>&1
if errorlevel 1 (
    echo ERROR: python was not found. Install Python or run setup.bat first.
    pause
    exit /b 1
)

echo [1/2] Starting Backend API...
start "RAHAF Backend - FastAPI" cmd /k "cd /d ""%~dp0backend"" && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak > nul

echo [2/2] Starting Frontend...
start "RAHAF Frontend - React" cmd /k "cd /d ""%~dp0frontend"" && npm run dev -- --host 0.0.0.0 --port 3000"

goto started

:docker_error
echo.
echo ERROR: Docker Compose failed to start the system.
pause
exit /b 1

:started
echo.
echo ============================================
echo System is starting:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo.
echo Default login:
echo   Email:    owner@rahaf.com
echo   Password: admin123
echo ============================================
echo.

timeout /t 2 /nobreak > nul
start "" "http://localhost:3000"

pause
