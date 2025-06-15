@echo off
echo Reddy's Cafe Desktop Uygulamasi Build Ediliyor...
echo.

REM Frontend dizinine git
cd frontend

REM Bağımlılıkları kur
echo Bağımlılıklar kuruluyor...
npm install

REM Backend bağımlılıklarını kur
cd ..\backend
if not exist "..\venv" (
    echo Python virtual environment oluşturuluyor...
    python -m venv ..\venv
)
..\venv\Scripts\pip.exe install -r requirements-electron.txt

REM Frontend'e geri dön
cd ..\frontend

REM React uygulamasını build et
echo React uygulamasi build ediliyor...
npm run build

REM Electron uygulamasını build et
echo Electron uygulamasi build ediliyor...
npm run dist

echo.
echo Build tamamlandi! 
echo Dosyalar 'frontend/dist' klasöründe.
echo.
pause 