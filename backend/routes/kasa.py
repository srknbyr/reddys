from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from typing import List, Optional
from datetime import datetime, date
from database import get_db
from models import KasaHareket, GunlukKasaOzeti, HareketTipi, OdemeTipi
from pydantic import BaseModel

router = APIRouter(prefix="/kasa", tags=["Kasa Takibi"])

# Pydantic modelleri
class KasaHareketCreate(BaseModel):
    hareket_tipi: str  # "Giriş" veya "Çıkış"
    kategori: str  # "Satış", "Gider", "Devir"
    alt_kategori: Optional[str] = None  # Gider kategorisi
    odeme_tipi: str  # "Nakit", "Kart", "Transfer", "Yemek Çeki"
    tutar: float
    aciklama: Optional[str] = None

class KasaHareketResponse(BaseModel):
    id: int
    hareket_tipi: str
    kategori: str
    alt_kategori: Optional[str] = None
    odeme_tipi: str
    tutar: float
    aciklama: Optional[str] = None
    tarih: datetime
    
    class Config:
        from_attributes = True

class KasaDurumuResponse(BaseModel):
    nakit_bakiye: float
    kart_bakiye: float
    yemek_ceki_bakiye: float
    transfer_bakiye: float
    toplam_bakiye: float
    bugun_giris: float
    bugun_cikis: float
    
class GunlukOzetResponse(BaseModel):
    id: int
    tarih: datetime
    acilis_bakiye: float
    nakit_satis: float
    kart_satis: float
    yemek_ceki_satis: float
    transfer_satis: float
    toplam_satis: float
    toplam_gider: float
    kapanış_bakiye: float
    
    class Config:
        from_attributes = True

@router.get("/durum", response_model=KasaDurumuResponse)
def get_kasa_durumu(db: Session = Depends(get_db)):
    """Güncel kasa durumu"""
    
    # Ödeme tiplerine göre bakiye hesaplama (string olarak)
    nakit_giris = db.query(func.sum(KasaHareket.tutar)).filter(
        and_(KasaHareket.hareket_tipi == HareketTipi.GIRIS, 
             KasaHareket.odeme_tipi == "Nakit")
    ).scalar() or 0
    
    nakit_cikis = db.query(func.sum(KasaHareket.tutar)).filter(
        and_(KasaHareket.hareket_tipi == HareketTipi.CIKIS, 
             KasaHareket.odeme_tipi == "Nakit")
    ).scalar() or 0
    
    kart_giris = db.query(func.sum(KasaHareket.tutar)).filter(
        and_(KasaHareket.hareket_tipi == HareketTipi.GIRIS, 
             KasaHareket.odeme_tipi == "Kart")
    ).scalar() or 0
    
    kart_cikis = db.query(func.sum(KasaHareket.tutar)).filter(
        and_(KasaHareket.hareket_tipi == HareketTipi.CIKIS, 
             KasaHareket.odeme_tipi == "Kart")
    ).scalar() or 0
    
    yemek_ceki_giris = db.query(func.sum(KasaHareket.tutar)).filter(
        and_(KasaHareket.hareket_tipi == HareketTipi.GIRIS, 
             KasaHareket.odeme_tipi == "Yemek Çeki")
    ).scalar() or 0
    
    transfer_giris = db.query(func.sum(KasaHareket.tutar)).filter(
        and_(KasaHareket.hareket_tipi == HareketTipi.GIRIS, 
             KasaHareket.odeme_tipi == "Transfer")
    ).scalar() or 0
    
    transfer_cikis = db.query(func.sum(KasaHareket.tutar)).filter(
        and_(KasaHareket.hareket_tipi == HareketTipi.CIKIS, 
             KasaHareket.odeme_tipi == "Transfer")
    ).scalar() or 0
    
    # Bugünkü hareketler
    bugun = date.today()
    bugun_giris = db.query(func.sum(KasaHareket.tutar)).filter(
        and_(KasaHareket.hareket_tipi == HareketTipi.GIRIS,
             func.date(KasaHareket.tarih) == bugun)
    ).scalar() or 0
    
    bugun_cikis = db.query(func.sum(KasaHareket.tutar)).filter(
        and_(KasaHareket.hareket_tipi == HareketTipi.CIKIS,
             func.date(KasaHareket.tarih) == bugun)
    ).scalar() or 0
    
    # Bakiye hesaplama
    nakit_bakiye = nakit_giris - nakit_cikis
    kart_bakiye = kart_giris - kart_cikis
    yemek_ceki_bakiye = yemek_ceki_giris
    transfer_bakiye = transfer_giris - transfer_cikis
    toplam_bakiye = nakit_bakiye + kart_bakiye + yemek_ceki_bakiye + transfer_bakiye
    
    return KasaDurumuResponse(
        nakit_bakiye=nakit_bakiye,
        kart_bakiye=kart_bakiye,
        yemek_ceki_bakiye=yemek_ceki_bakiye,
        transfer_bakiye=transfer_bakiye,
        toplam_bakiye=toplam_bakiye,
        bugun_giris=bugun_giris,
        bugun_cikis=bugun_cikis
    )

@router.get("/hareketler", response_model=List[KasaHareketResponse])
def get_kasa_hareketler(
    limit: int = 50,
    offset: int = 0,
    tarih: Optional[str] = None,
    odeme_tipi: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Kasa hareketlerini listele"""
    
    query = db.query(KasaHareket)
    
    # Tarih filtresi
    if tarih:
        try:
            tarih_obj = datetime.strptime(tarih, "%Y-%m-%d").date()
            query = query.filter(func.date(KasaHareket.tarih) == tarih_obj)
        except ValueError:
            raise HTTPException(status_code=400, detail="Geçersiz tarih formatı. YYYY-MM-DD kullanın.")
    
    # Ödeme tipi filtresi
    if odeme_tipi:
        query = query.filter(KasaHareket.odeme_tipi == odeme_tipi)
    
    hareketler = (
        query
        .order_by(desc(KasaHareket.tarih))
        .offset(offset)
        .limit(limit)
        .all()
    )
    
    return [KasaHareketResponse(
        id=h.id,
        hareket_tipi=h.hareket_tipi.value,
        kategori=h.kategori,
        alt_kategori=h.alt_kategori.value if h.alt_kategori else None,
        odeme_tipi=h.odeme_tipi.value,
        tutar=h.tutar,
        aciklama=h.aciklama,
        tarih=h.tarih
    ) for h in hareketler]

@router.post("/hareket", response_model=KasaHareketResponse)
def create_kasa_hareket(hareket: KasaHareketCreate, db: Session = Depends(get_db)):
    """Yeni kasa hareketi oluştur"""
    
    # İnput validasyonları
    if hareket.hareket_tipi not in ["Giriş", "Çıkış"]:
        raise HTTPException(status_code=400, detail="Hareket tipi 'Giriş' veya 'Çıkış' olmalıdır")
    
    if hareket.odeme_tipi not in ["Nakit", "Kart", "Transfer", "Yemek Çeki"]:
        raise HTTPException(status_code=400, detail="Geçersiz ödeme tipi")
    
    if hareket.tutar <= 0:
        raise HTTPException(status_code=400, detail="Tutar sıfırdan büyük olmalıdır")
    
    # Enum dönüşümleri
    hareket_tipi_enum = HareketTipi.GIRIS if hareket.hareket_tipi == "Giriş" else HareketTipi.CIKIS
    
    odeme_tipi_enum = None
    for ot in OdemeTipi:
        if ot.value == hareket.odeme_tipi:
            odeme_tipi_enum = ot
            break
    
    alt_kategori_enum = None
    # Alt kategori artık ID olarak gelecek, bu kodu güncelleyeceğiz
    
    # Kasa hareket oluştur
    db_hareket = KasaHareket(
        hareket_tipi=hareket_tipi_enum,
        kategori=hareket.kategori,
        alt_kategori=alt_kategori_enum,
        odeme_tipi=odeme_tipi_enum,
        tutar=hareket.tutar,
        aciklama=hareket.aciklama
    )
    
    db.add(db_hareket)
    db.commit()
    db.refresh(db_hareket)
    
    return KasaHareketResponse(
        id=db_hareket.id,
        hareket_tipi=db_hareket.hareket_tipi.value,
        kategori=db_hareket.kategori,
        alt_kategori=db_hareket.alt_kategori.value if db_hareket.alt_kategori else None,
        odeme_tipi=db_hareket.odeme_tipi.value,
        tutar=db_hareket.tutar,
        aciklama=db_hareket.aciklama,
        tarih=db_hareket.tarih
    )

@router.delete("/hareket/{hareket_id}")
def delete_kasa_hareket(hareket_id: int, db: Session = Depends(get_db)):
    """
    🚨 ENTEGRASYONLİ SİLME: Kasa hareketi + İlgili Cari Hareket + Stok Hareketleri
    Bu hareket cari sistemden geliyorsa, tüm veri tutarlılığını koruyarak siler
    """
    from models import CariHareket, CariHesap, StokHareket, Urun
    
    hareket = db.query(KasaHareket).filter(KasaHareket.id == hareket_id).first()
    if not hareket:
        raise HTTPException(status_code=404, detail="Kasa hareketi bulunamadı")
    
    silinen_kayitlar = []
    
    # 1. İLGİLİ CARİ HAREKETİ BUL VE SİL
    cari_hareket = None
    cari_hesap = None
    
    if hareket.cari_hesap_id:
        # Cari hesap bağlantısı var - bu hareket cari sistemden gelmiş
        cari_hareket = db.query(CariHareket).filter(
            CariHareket.cari_hesap_id == hareket.cari_hesap_id,
            CariHareket.tutar == hareket.tutar,
            func.date(CariHareket.hareket_tarihi) == func.date(hareket.tarih)
        ).first()
        
        cari_hesap = db.query(CariHesap).filter(CariHesap.id == hareket.cari_hesap_id).first()
    else:
        # Cari hesap ID yok - açıklama pattern'i ile ara (eski sistem uyumluluğu)
        if hareket.aciklama:
            # "Satış - Müşteri A" formatından hesap adını çıkar
            if " - " in hareket.aciklama:
                hesap_adi = hareket.aciklama.split(" - ", 1)[1]
                cari_hesap = db.query(CariHesap).filter(CariHesap.hesap_adi == hesap_adi).first()
                
                if cari_hesap:
                    cari_hareket = db.query(CariHareket).filter(
                        CariHareket.cari_hesap_id == cari_hesap.id,
                        CariHareket.tutar == hareket.tutar,
                        func.date(CariHareket.hareket_tarihi) == func.date(hareket.tarih)
                    ).first()
                    
                    silinen_kayitlar.append(f"🔍 Cari hesap pattern ile bulundu: {hesap_adi}")
        
    if cari_hareket and cari_hesap:
        # 2. CARİ HESAP BAKİYESİNİ DÜZELT
        # Bakiye düzeltmesi - cari hareket ekleme işleminin tersini yap
        if cari_hareket.hareket_tipi == "Borç":
            if cari_hesap.tipi.value == "Müşteri":
                cari_hesap.bakiye -= cari_hareket.tutar  # Ters işlem
            else:  # Tedarikçi
                cari_hesap.bakiye += cari_hareket.tutar  # Ters işlem
        else:  # Alacak
            if cari_hesap.tipi.value == "Müşteri":
                cari_hesap.bakiye += cari_hareket.tutar  # Ters işlem
            else:  # Tedarikçi
                cari_hesap.bakiye -= cari_hareket.tutar  # Ters işlem
        
        silinen_kayitlar.append(f"💰 Cari bakiye düzeltildi: {cari_hesap.hesap_adi}")
        
        # 3. İLGİLİ STOK HAREKETLERİNİ BUL VE SİL + STOK MİKTARLARINI DÜZELT
        if cari_hareket.hareket_tipi == "Borç":
            # Bu bir satış/alım işlemiydi - stok hareketleri var olabilir
            stok_aciklama_patterns = [
                f"Satış - {cari_hesap.hesap_adi}",
                f"Alım - {cari_hesap.hesap_adi}"
            ]
            
            stok_hareketleri = db.query(StokHareket).filter(
                StokHareket.aciklama.in_(stok_aciklama_patterns),
                func.date(StokHareket.tarih) == func.date(hareket.tarih)
            ).all()
            
            for stok_hareket in stok_hareketleri:
                # Stok miktarını ters işlemle düzelt
                urun = db.query(Urun).filter(Urun.id == stok_hareket.urun_id).first()
                if urun:
                    if stok_hareket.hareket_tipi.value == "Giriş":
                        # Giriş iptal - stoktan düş
                        urun.stok_miktari -= stok_hareket.miktar
                        silinen_kayitlar.append(f"📦 Stok düzeltildi (azaltıldı): {urun.urun_adi} -{stok_hareket.miktar}")
                    else:  # Çıkış
                        # Çıkış iptal - stoğa ekle
                        urun.stok_miktari += stok_hareket.miktar
                        silinen_kayitlar.append(f"📦 Stok düzeltildi (artırıldı): {urun.urun_adi} +{stok_hareket.miktar}")
                
                # Stok hareketini sil
                db.delete(stok_hareket)
                silinen_kayitlar.append(f"📋 Stok hareketi silindi: {stok_hareket.aciklama}")
        
        # 4. CARİ HAREKETİ SİL
        db.delete(cari_hareket)
        silinen_kayitlar.append(f"🧾 Cari hareket silindi: {cari_hareket.hareket_tipi} {cari_hareket.tutar}TL")
    
    # 5. KASA HAREKETİ SİL
    db.delete(hareket)
    silinen_kayitlar.append(f"💰 Kasa hareketi silindi: {hareket.kategori} {hareket.tutar}TL")
    
    # Tüm değişiklikleri kaydet
    db.commit()
    
    return {
        "message": "🎯 Entegre silme işlemi tamamlandı",
        "silinen_kayitlar": silinen_kayitlar,
        "toplam_silinen": len(silinen_kayitlar)
    }

@router.get("/gider-kategorileri")
def get_gider_kategorileri(db: Session = Depends(get_db)):
    """Gider kategorilerini listele"""
    from models import AltKategori
    kategoriler = db.query(AltKategori).filter(
        AltKategori.kategori_tipi == "gider",
        AltKategori.durum == "Aktif"
    ).all()
    return [{"value": k.kategori_adi, "label": k.kategori_adi} for k in kategoriler]

@router.get("/odeme-tipleri")
def get_odeme_tipleri():
    """Ödeme tiplerini listele"""
    return [{"value": ot.value, "label": ot.value} for ot in OdemeTipi] 