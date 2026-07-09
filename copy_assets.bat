@echo off
echo ===================================================
echo 🍥 Sreeshanth Portfolio Asset Copier
echo ===================================================
echo.
echo Creating assets directory...
if not exist "c:\Users\namir\Downloads\Resume\assets" mkdir "c:\Users\namir\Downloads\Resume\assets"

echo Copying Naruto shop interior image...
copy "C:\Users\namir\.gemini\antigravity-ide\brain\afc459ba-159b-4ed9-9ab8-aad1077de185\media__1783575978389.jpg" "c:\Users\namir\Downloads\Resume\assets\naruto_shop.jpg" /Y

echo Copying custom nature hero background image...
copy "C:\Users\namir\.gemini\antigravity-ide\brain\afc459ba-159b-4ed9-9ab8-aad1077de185\naruto_nature_hero_1783576887366.png" "c:\Users\namir\Downloads\Resume\assets\naruto_nature.png" /Y

echo.
echo ===================================================
echo Done! All image assets copied successfully.
echo ===================================================
echo.
pause
