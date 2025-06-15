@echo off
echo Reddy's Cafe Desktop Uygulamasi Baslatiliyor...
echo.

REM Frontend dizinine git
cd frontend

REM Node modules kurulu mu kontrol et
if not exist "node_modules" (
    echo Node modules kuruluyor...
    npm install
)

REM Electron bağımlılıkları kurulu mu kontrol et
echo Bağımlılıklar kontrol ediliyor...
npm install

REM Backend gereksinimlerini kontrol et
cd ..\backend
if not exist "..\venv" (
    echo Python virtual environment oluşturuluyor...
    python -m venv ..\venv
)

echo Backend bağımlılıkları kuruluyor...
..\venv\Scripts\pip.exe install -r requirements-electron.txt

REM Frontend'e geri dön ve uygulamayı başlat
cd ..\frontend
echo.
echo Uygulama başlatılıyor...
npm run electron-dev

pause 