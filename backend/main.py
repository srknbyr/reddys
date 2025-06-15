from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine
from models import Base
from routes import cari_hesap, cari_hareket, stok, kasa, kasa_yeni, analiz

# Veritabanı tablolarını oluştur
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Reddy's Cafe API")

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Geliştirme için tüm originlere izin veriyoruz
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Statik dosyalar için klasör
app.mount("/static", StaticFiles(directory="static"), name="static")

# Route'ları ekle
app.include_router(cari_hesap.router)
app.include_router(cari_hareket.router)
app.include_router(stok.router)
app.include_router(kasa.router)
app.include_router(kasa_yeni.router)
app.include_router(analiz.router)

@app.get("/")
async def root():
    return {"message": "Reddy's Cafe API'ye Hoş Geldiniz!"} 