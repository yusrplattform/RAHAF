@echo off
echo ============================================
echo    إعداد نظام إدارة الأعمال
echo ============================================
echo.

echo [1/3] تثبيت مكتبات Python...
cd /d %~dp0backend
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo خطأ في تثبيت مكتبات Python
    pause
    exit /b 1
)

echo.
echo [2/3] تثبيت مكتبات Node.js...
cd /d %~dp0frontend
npm install
if %errorlevel% neq 0 (
    echo خطأ في تثبيت مكتبات Node.js
    pause
    exit /b 1
)

echo.
echo [3/3] إنشاء قاعدة البيانات...
cd /d %~dp0backend
echo تأكد من تشغيل PostgreSQL وإنشاء قاعدة بيانات باسم rahaf_db
echo.
echo CREATE DATABASE rahaf_db; -- شغّل هذا الأمر في psql

echo.
echo ============================================
echo تم الإعداد بنجاح!
echo الآن شغّل: start.bat
echo ============================================
pause
