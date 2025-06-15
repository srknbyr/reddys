# Reddy's Cafe Yönetim Sistemi

Bu proje, bir cafe yönetim sistemi için geliştirilmiş web uygulamasıdır. Web uygulaması olarak çalışır veya **Windows Desktop uygulaması** olarak kullanılabilir.

## 🖥️ Desktop Uygulaması Özellikleri

- ✅ **Tek .exe dosyası** ile kurulum
- ✅ **Python kurulumu gerektirmez**
- ✅ **Offline çalışma** - internet bağlantısı gerektirmez
- ✅ **Otomatik backend başlatma** - tek tıkla çalışır
- ✅ **Windows entegrasyonu** - masa üstü kısayolu ve başlat menüsü
- ✅ **Modern arayüz** - tam Material-UI desteği

## Teknolojiler

### Backend
- FastAPI
- SQLite
- SQLAlchemy
- Python 3.8+

### Frontend
- React
- Material-UI
- React Router
- Axios
- Recharts
- XLSX
- React Bootstrap
- Tailwind CSS

### Desktop
- **Electron** - Cross-platform desktop framework
- **Node.js** - JavaScript runtime
- **Electron Builder** - Native installer creation

## 🚀 Kurulum Seçenekleri

### 🖥️ Windows Desktop Uygulaması (Önerilen)

#### Geliştirme Modunda Çalıştırma:
```bash
# Ana proje dizininde
start-electron.bat
```

#### Production Build (.exe) Oluşturma:
```bash
# Ana proje dizininde  
build-electron.bat
```

Bu komut `frontend/dist` klasöründe kurulum dosyası (.exe) oluşturur.

**Sistem Gereksinimleri:**
- Windows 10/11
- 4GB RAM (önerilen)
- 500MB disk alanı

### 🌐 Web Uygulaması Olarak Çalıştırma

#### Backend Kurulumu
```bash
# Sanal ortam oluşturma
python -m venv venv
source venv/bin/activate  # Linux/Mac
# veya
.\venv\Scripts\activate  # Windows

# Gereksinimleri yükleme
pip install -r requirements.txt

# Uygulamayı çalıştırma
cd backend
uvicorn main:app --reload
```

#### Frontend Kurulumu
```bash
cd frontend
npm install
npm start
```

## 📊 Özellikler

- 📊 **Cari Hesap Yönetimi** - Müşteri/tedarikçi takibi
- 💰 **Kasa Takibi** - Gelir/gider yönetimi  
- 📦 **Stok Takibi** - Ürün envanteri
- 📈 **Analiz ve Raporlama** - İstatistikler ve grafikler
- 🔄 **Otomatik yedekleme** - SQLite veritabanı
- 📱 **Responsive tasarım** - Tüm cihazlarda uyumlu

## API Dokümantasyonu

API dokümantasyonuna http://localhost:8000/docs adresinden erişebilirsiniz.

### Ana Endpoint'ler:
- `/cari-hesaplar` - Cari hesap işlemleri
- `/cari-hareketler` - Cari hareket işlemleri  
- `/stok` - Stok işlemleri
- `/kasa` - Kasa işlemleri
- `/analiz` - Analiz ve raporlama

## 🛠️ Geliştirme

Desktop uygulaması geliştirme için:

```bash
cd frontend
npm run electron-dev  # Development mode
npm run dist          # Production build
``` 