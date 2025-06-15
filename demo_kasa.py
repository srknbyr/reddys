import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from database import SessionLocal
from models import KasaHareket, HareketTipi, OdemeTipi, GiderKategorisi
from datetime import datetime, timedelta

db = SessionLocal()

# Demo kasa hareketleri ekle
demo_hareketler = [
    # Bugün
    KasaHareket(hareket_tipi=HareketTipi.GIRIS, kategori='Satış', odeme_tipi=OdemeTipi.NAKIT, tutar=150.00, aciklama='Kahve satışları'),
    KasaHareket(hareket_tipi=HareketTipi.GIRIS, kategori='Satış', odeme_tipi=OdemeTipi.KART, tutar=85.50, aciklama='Yemek satışları'),
    KasaHareket(hareket_tipi=HareketTipi.CIKIS, kategori='Gider', alt_kategori=GiderKategorisi.ELEKTRIK, odeme_tipi=OdemeTipi.TRANSFER, tutar=120.00, aciklama='Elektrik faturası'),
    KasaHareket(hareket_tipi=HareketTipi.CIKIS, kategori='Gider', alt_kategori=GiderKategorisi.TEMIZLIK, odeme_tipi=OdemeTipi.NAKIT, tutar=45.00, aciklama='Temizlik malzemeleri'),
    # Dün
    KasaHareket(hareket_tipi=HareketTipi.GIRIS, kategori='Satış', odeme_tipi=OdemeTipi.NAKIT, tutar=200.00, aciklama='Günlük satışlar', tarih=datetime.now() - timedelta(days=1)),
]

for hareket in demo_hareketler:
    db.add(hareket)

db.commit()
db.close()
print('Demo kasa hareketleri eklendi!') 