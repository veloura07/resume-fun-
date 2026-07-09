@echo off
echo ===================================================
echo 🍥 Ichiraku & Living Digital Ecosystem Web Server
echo ===================================================
echo.
cd /d "c:\Users\namir\Downloads\Resume"

:: Check if port 8000 is already in use
netstat -ano | findstr :8000 >nul
if %errorlevel% equ 0 (
    echo [WARNING] Port 8000 seems to be already in use!
    echo We will try starting the server on port 8080 instead.
    set PORT=8080
) else (
    set PORT=8000
)

echo Starting web server on port %PORT%...
echo Open your browser at http://localhost:%PORT%
echo.

:: Try running with python, and if that fails, try py
python -m http.server %PORT% 2>nul
if %errorlevel% neq 0 (
    echo 'python' command failed, trying 'py'...
    py -m http.server %PORT%
)

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start Python web server!
    echo Please make sure Python is installed and added to your system PATH.
    echo Alternatively, you can open the 'run_server.ipynb' notebook in your IDE
    echo and run the Web Server cell from there.
)

pause
