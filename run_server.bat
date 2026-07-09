@echo off
echo ===================================================
echo 🍥 Ichiraku & Living Digital Ecosystem Web Server
echo ===================================================
echo.
cd /d "c:\Users\namir\Downloads\Resume"
echo Starting python web server on port 8000...
echo Open your browser at http://localhost:8000
echo.
python -m http.server 8000
pause
