@echo off
echo ===================================================
echo 🍥 Sreeshanth Portfolio Git Deployer
echo ===================================================
echo.
cd /d "c:\Users\namir\Downloads\Resume"

echo Initializing Git repository...
git init

echo Adding remote origin repository...
git remote remove origin 2>nul
git remote add origin https://github.com/veloura07/resume-fun-.git

echo Staging all project files...
git add .

echo Committing files...
git commit -m "Initial commit of Sreeshanth Reddy Living Digital Ecosystem Portfolio"

echo Renaming main branch...
git branch -M main

echo.
echo ===================================================
echo READY TO PUSH!
echo This will push your portfolio code to:
echo https://github.com/veloura07/resume-fun-.git
echo ===================================================
echo.
git push -u origin main

echo.
echo Process complete! Check your repository at:
echo https://github.com/veloura07/resume-fun-
echo.
pause
