@echo off
title Laundry Ultimate Enterprise
color 0A

echo ========================================
echo   LAUNDRY ULTIMATE ENTERPRISE
echo   Memulai aplikasi...
echo ========================================
echo.

cd /d "D:\laundry-ultimate\backend"
echo [1/2] Menjalankan Backend Server...
start "Laundry Backend" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul

cd /d "D:\laundry-ultimate\frontend"
echo [2/2] Menjalankan Frontend...
start "Laundry Frontend" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul

start chrome http://localhost:5173

echo.
echo ========================================
echo   APLIKASI SEDANG BERJALAN
echo ========================================
echo.
echo Akses: http://localhost:5173
echo Login: admin
echo Password: admin123
echo.
echo Jangan tutup jendela CMD ini!
echo.
pause