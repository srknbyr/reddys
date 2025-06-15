from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime
from database import get_db
from models import CariHareket, CariHesap, OdemeTipi, Urun, StokHareket, HareketTipi, KasaHareket

router = APIRouter(prefix="/cari-hareket", tags=["Cari Hareket"])

# Pydantic modelleri
from pydantic import BaseModel

class UrunKalemi(BaseModel):
    urun_id: int
    miktar: float
    
class CariHareketCreate(BaseModel):
    cari_hesap_id: int
    hareket_tipi: str  # "Borç" veya "Alacak"
    tutar: float
    odeme_tipi: str  # "Nakit", "Kart", "Transfer", "Yemek Çeki"
    hareket_tarihi: datetime  # İşlemin gerçekleştiği tarih
    aciklama: str = None
    
    # Çoklu ürün işlemi için (opsiyonel)
    urun_kalemleri: Optional[List[UrunKalemi]] = None
    
    # Tek ürün işlemi için (geriye dönük uyumluluk)
    urun_id: Optional[int] = None
    miktar: Optional[float] = None

class CariHareketResponse(BaseModel):
    id: int
    cari_hesap_id: int
    hareket_tipi: str
    tutar: float
    odeme_tipi: str
    hareket_tarihi: datetime
    aciklama: str = None
    tarih: datetime  # Kayıt tarihi
    hesap_adi: str = None
    
    class Config:
        from_attributes = True

@router.get("/cari/{cari_hesap_id}", response_model=List[CariHareketResponse])
def get_cari_hareketler(cari_hesap_id: int, db: Session = Depends(get_db)):
    """Belirli cari hesabın tüm hareketlerini getir"""
    hareketler = (
        db.query(CariHareket, CariHesap.hesap_adi)
        .join(CariHesap, CariHareket.cari_hesap_id == CariHesap.id)
        .filter(CariHareket.cari_hesap_id == cari_hesap_id)
        .order_by(desc(CariHareket.tarih))
        .all()
    )
    
    result = []
    for hareket, hesap_adi in hareketler:
        result.append(CariHareketResponse(
            id=hareket.id,
            cari_hesap_id=hareket.cari_hesap_id,
            hareket_tipi=hareket.hareket_tipi,
            tutar=hareket.tutar,
            odeme_tipi=hareket.odeme_tipi.value if hareket.odeme_tipi else "Nakit",
            hareket_tarihi=hareket.hareket_tarihi,
            aciklama=hareket.aciklama,
            tarih=hareket.tarih,
            hesap_adi=hesap_adi
        ))
    
    return result

@router.post("/", response_model=CariHareketResponse)
def create_cari_hareket(hareket: CariHareketCreate, db: Session = Depends(get_db)):
    """Yeni cari hareket oluştur ve bakiyeyi güncelle"""
    
    # Cari hesabın var olduğunu kontrol et
    cari_hesap = db.query(CariHesap).filter(CariHesap.id == hareket.cari_hesap_id).first()
    if not cari_hesap:
        raise HTTPException(status_code=404, detail="Cari hesap bulunamadı")
    
    # Hareket tipi kontrolü
    if hareket.hareket_tipi not in ["Borç", "Alacak"]:
        raise HTTPException(status_code=400, detail="Hareket tipi 'Borç' veya 'Alacak' olmalıdır")
    
    # Ödeme tipi kontrolü
    if hareket.odeme_tipi not in ["Nakit", "Kart", "Transfer", "Yemek Çeki", "Satın Alma"]:
        raise HTTPException(status_code=400, detail="Geçersiz ödeme tipi")
    
    # Tutar kontrolü
    if hareket.tutar <= 0:
        raise HTTPException(status_code=400, detail="Tutar sıfırdan büyük olmalıdır")
    
    # Ürün işlem kontrolü ve validasyonu
    urun_kalemleri_to_process = []
    
    # Çoklu ürün varsa onu kullan, yoksa tek ürün sistemini kullan (geriye dönük uyumluluk)
    if hareket.urun_kalemleri:
        urun_kalemleri_to_process = hareket.urun_kalemleri
    elif hareket.urun_id and hareket.miktar:
        # Tek ürün sistemini çoklu ürün formatına çevir
        urun_kalemleri_to_process = [UrunKalemi(
            urun_id=hareket.urun_id,
            miktar=hareket.miktar,
            birim_fiyat=hareket.tutar / hareket.miktar if hareket.miktar > 0 else 0
        )]
    
    # Ürün kontrolü ve stok validasyonu
    if hareket.hareket_tipi == "Borç" and urun_kalemleri_to_process:
        for kalem in urun_kalemleri_to_process:
            # Ürün var mı kontrol et
            urun = db.query(Urun).filter(Urun.id == kalem.urun_id).first()
            if not urun:
                raise HTTPException(status_code=404, detail=f"Ürün bulunamadı (ID: {kalem.urun_id})")
            
            # Müşteri için satış ise stok kontrolü yap
            if cari_hesap.tipi.value == "Müşteri":
                if urun.stok_miktari < kalem.miktar:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Yetersiz stok! Ürün: {urun.urun_adi}, Mevcut: {urun.stok_miktari}, İstenen: {kalem.miktar}"
                    )
    
    # Cari hareket oluştur
    hareket_data = hareket.dict()
    # OdemeTipi enum'una çevir
    odeme_tipi_enum = None
    for ot in OdemeTipi:
        if ot.value == hareket.odeme_tipi:
            odeme_tipi_enum = ot
            break
    
    hareket_data['odeme_tipi'] = odeme_tipi_enum
    # Ürün bilgilerini kaldır (cari hareket tablosunda saklanmıyor)
    hareket_data.pop('urun_kalemleri', None)
    hareket_data.pop('urun_id', None)
    hareket_data.pop('miktar', None)
    
    db_hareket = CariHareket(**hareket_data)
    db.add(db_hareket)
    
    # Bakiyeyi güncelle
    if hareket.hareket_tipi == "Borç":
        # Müşteri için: Borç = bakiye artışı (pozitif)
        # Tedarikçi için: Borç = borç artışı (negatif)
        if cari_hesap.tipi.value == "Müşteri":
            cari_hesap.bakiye += hareket.tutar
        else:  # Tedarikçi
            cari_hesap.bakiye -= hareket.tutar
    else:  # Alacak
        # Müşteri için: Alacak = ödeme (bakiye azalışı)
        # Tedarikçi için: Alacak = ödeme yapma (borç azalışı)
        if cari_hesap.tipi.value == "Müşteri":
            cari_hesap.bakiye -= hareket.tutar
        else:  # Tedarikçi
            cari_hesap.bakiye += hareket.tutar
    
    # Son hareket tarihini güncelle
    cari_hesap.son_hareket_tarihi = func.now()
    
    # Ürün hareketlerini işle
    if hareket.hareket_tipi == "Borç" and urun_kalemleri_to_process:
        for kalem in urun_kalemleri_to_process:
            urun = db.query(Urun).filter(Urun.id == kalem.urun_id).first()
            
            if cari_hesap.tipi.value == "Müşteri":
                # Müşteri satışı - Stok çıkışı
                stok_hareket = StokHareket(
                    urun_id=kalem.urun_id,
                    hareket_tipi=HareketTipi.CIKIS,
                    miktar=kalem.miktar,
                    aciklama=f"Satış - {cari_hesap.hesap_adi}",
                    tarih=hareket.hareket_tarihi  # Cari hareketin tarihini kullan
                )
                db.add(stok_hareket)
                # Stok miktarını azalt
                urun.stok_miktari -= kalem.miktar
            elif cari_hesap.tipi.value == "Tedarikçi":
                # Tedarikçi alımı - Stok girişi
                stok_hareket = StokHareket(
                    urun_id=kalem.urun_id,
                    hareket_tipi=HareketTipi.GIRIS,
                    miktar=kalem.miktar,
                    aciklama=f"Alım - {cari_hesap.hesap_adi}",
                    tarih=hareket.hareket_tarihi  # Cari hareketin tarihini kullan
                )
                db.add(stok_hareket)
                # Stok miktarını artır
                urun.stok_miktari += kalem.miktar
    
    # Kasa hareketi oluştur (otomatik entegrasyon)
    kasa_hareket_tipi = None
    kasa_kategori = ""
    kasa_aciklama = f"{cari_hesap.hesap_adi} - {hareket.aciklama or 'Hareket'}"
    
    if hareket.hareket_tipi == "Borç":
        if cari_hesap.tipi.value == "Müşteri":
            # Müşteri borç = Satış = Kasa girişi
            kasa_hareket_tipi = HareketTipi.GIRIS
            kasa_kategori = "Satış"
            kasa_aciklama = f"Satış - {cari_hesap.hesap_adi}"
        else:  # Tedarikçi
            # Tedarikçi borç = Alım = Kasa çıkışı (ödeme)
            kasa_hareket_tipi = HareketTipi.CIKIS
            kasa_kategori = "Alım"
            kasa_aciklama = f"Alım - {cari_hesap.hesap_adi}"
    else:  # Alacak
        if cari_hesap.tipi.value == "Müşteri":
            # Müşteri alacak = Tahsilat = Kasa girişi
            kasa_hareket_tipi = HareketTipi.GIRIS
            kasa_kategori = "Tahsilat"
            kasa_aciklama = f"Tahsilat - {cari_hesap.hesap_adi}"
        else:  # Tedarikçi
            # Tedarikçi alacak = Ödeme = Kasa çıkışı
            kasa_hareket_tipi = HareketTipi.CIKIS
            kasa_kategori = "Ödeme"
            kasa_aciklama = f"Ödeme - {cari_hesap.hesap_adi}"
    
    # Kasa hareketi kaydet
    if kasa_hareket_tipi:
        # ✅ Aktif periyodu bul ve hareketi ona ata
        from models import GunlukKasaOzeti
        aktif_periyot = db.query(GunlukKasaOzeti).filter(
            GunlukKasaOzeti.kapanış_bakiye.is_(None)
        ).order_by(GunlukKasaOzeti.tarih.desc()).first()
        
        # Eğer aktif periyot yoksa yeni periyot oluştur
        if not aktif_periyot:
            # Son kapalı periyodun kapanış bakiyesini bul
            son_kapali = db.query(GunlukKasaOzeti).filter(
                GunlukKasaOzeti.kapanış_bakiye.isnot(None)
            ).order_by(GunlukKasaOzeti.tarih.desc()).first()
            
            acilis_bakiye = son_kapali.kapanış_bakiye if son_kapali else 0.0
            
            # Yeni aktif periyot oluştur
            aktif_periyot = GunlukKasaOzeti(
                tarih=datetime.now(),
                acilis_bakiye=acilis_bakiye,
                nakit_satis=0.0,
                toplam_satis=0.0,
                toplam_gider=0.0,
                # kapanış_bakiye NULL (henüz kapatılmamış)
                yeni_gun_baslatildi=False
            )
            db.add(aktif_periyot)
            db.flush()  # ID'yi al
        
        kasa_hareket = KasaHareket(
            hareket_tipi=kasa_hareket_tipi,
            kategori=kasa_kategori,
            cari_hesap_id=hareket.cari_hesap_id,  # 🔥 EKSIK OLAN ALAN EKLENDI!
            odeme_tipi=odeme_tipi_enum.value,  # Enum'un string değerini kullan
            tutar=hareket.tutar,
            aciklama=kasa_aciklama,
            tarih=hareket.hareket_tarihi,  # Cari hareketin tarihini kullan
            gunsonu_tarihi=None,  # Açıkça NULL set et - henüz günsonu yapılmamış
            periyot_id=aktif_periyot.id  # ✅ Aktif periyoda ata
        )
        db.add(kasa_hareket)
    
    db.commit()
    db.refresh(db_hareket)
    
    return CariHareketResponse(
        id=db_hareket.id,
        cari_hesap_id=db_hareket.cari_hesap_id,
        hareket_tipi=db_hareket.hareket_tipi,
        tutar=db_hareket.tutar,
        odeme_tipi=db_hareket.odeme_tipi.value,
        hareket_tarihi=db_hareket.hareket_tarihi,
        aciklama=db_hareket.aciklama,
        tarih=db_hareket.tarih,
        hesap_adi=cari_hesap.hesap_adi
    )

@router.get("/bakiye/{cari_hesap_id}")
def get_cari_bakiye(cari_hesap_id: int, db: Session = Depends(get_db)):
    """Cari hesap bakiyesi ve özet bilgiler"""
    cari_hesap = db.query(CariHesap).filter(CariHesap.id == cari_hesap_id).first()
    if not cari_hesap:
        raise HTTPException(status_code=404, detail="Cari hesap bulunamadı")
    
    # Toplam borç ve alacak hesapla
    toplam_borc = (
        db.query(func.sum(CariHareket.tutar))
        .filter(
            CariHareket.cari_hesap_id == cari_hesap_id,
            CariHareket.hareket_tipi == "Borç"
        )
        .scalar() or 0
    )
    
    toplam_alacak = (
        db.query(func.sum(CariHareket.tutar))
        .filter(
            CariHareket.cari_hesap_id == cari_hesap_id,
            CariHareket.hareket_tipi == "Alacak"
        )
        .scalar() or 0
    )
    
    # Hareket sayısı
    hareket_sayisi = (
        db.query(func.count(CariHareket.id))
        .filter(CariHareket.cari_hesap_id == cari_hesap_id)
        .scalar() or 0
    )
    
    return {
        "hesap_adi": cari_hesap.hesap_adi,
        "tipi": cari_hesap.tipi.value,
        "bakiye": cari_hesap.bakiye,
        "toplam_borc": toplam_borc,
        "toplam_alacak": toplam_alacak,
        "hareket_sayisi": hareket_sayisi,
        "son_hareket_tarihi": cari_hesap.son_hareket_tarihi
    }

@router.delete("/{hareket_id}")
def delete_cari_hareket(hareket_id: int, db: Session = Depends(get_db)):
    """
    🚨 ENTEGRASYONLİ SİLME: Cari Hareket + İlgili Kasa Hareket + Stok Hareketleri
    Tüm sistem tutarlılığını koruyarak siler
    """
    hareket = db.query(CariHareket).filter(CariHareket.id == hareket_id).first()
    if not hareket:
        raise HTTPException(status_code=404, detail="Hareket bulunamadı")
    
    # Cari hesabı bul
    cari_hesap = db.query(CariHesap).filter(CariHesap.id == hareket.cari_hesap_id).first()
    
    silinen_kayitlar = []
    
    # 1. İLGİLİ STOK HAREKETLERİNİ BUL VE SİL + STOK MİKTARLARINI DÜZELT
    if hareket.hareket_tipi == "Borç":
        # Bu bir satış/alım işlemiydi - stok hareketleri var olabilir
        stok_aciklama_patterns = [
            f"Satış - {cari_hesap.hesap_adi}",
            f"Alım - {cari_hesap.hesap_adi}"
        ]
        
        stok_hareketleri = db.query(StokHareket).filter(
            StokHareket.aciklama.in_(stok_aciklama_patterns),
            func.date(StokHareket.tarih) == func.date(hareket.hareket_tarihi)
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
    
    # 2. İLGİLİ KASA HAREKETİNİ BUL VE SİL
    kasa_aciklama_patterns = [
        f"Satış - {cari_hesap.hesap_adi}",
        f"Alım - {cari_hesap.hesap_adi}",
        f"Tahsilat - {cari_hesap.hesap_adi}",
        f"Ödeme - {cari_hesap.hesap_adi}"
    ]
    
    # Kasa hareketini bul (açıklama, tutar ve tarih uyumu ile)
    kasa_hareket = db.query(KasaHareket).filter(
        KasaHareket.tutar == hareket.tutar,
        KasaHareket.aciklama.in_(kasa_aciklama_patterns),
        func.date(KasaHareket.tarih) == func.date(hareket.hareket_tarihi)
    ).first()
    
    if kasa_hareket:
        db.delete(kasa_hareket)
        silinen_kayitlar.append(f"💰 Kasa hareketi silindi: {kasa_hareket.aciklama}")
    else:
        silinen_kayitlar.append(f"⚠️ İlgili kasa hareketi bulunamadı")
    
    # 3. CARİ HESAP BAKİYESİNİ DÜZELT
    if hareket.hareket_tipi == "Borç":
        if cari_hesap.tipi.value == "Müşteri":
            cari_hesap.bakiye -= hareket.tutar
        else:
            cari_hesap.bakiye += hareket.tutar
    else:  # Alacak
        if cari_hesap.tipi.value == "Müşteri":
            cari_hesap.bakiye += hareket.tutar
        else:
            cari_hesap.bakiye -= hareket.tutar
    
    silinen_kayitlar.append(f"💰 Cari bakiye düzeltildi: {cari_hesap.hesap_adi}")
    
    # 4. CARİ HAREKETİ SİL
    db.delete(hareket)
    silinen_kayitlar.append(f"🧾 Cari hareket silindi: {hareket.hareket_tipi} {hareket.tutar}TL")
    
    # Tüm değişiklikleri kaydet
    db.commit()
    
    return {
        "message": "🎯 Entegre silme işlemi tamamlandı",
        "silinen_kayitlar": silinen_kayitlar,
        "toplam_silinen": len(silinen_kayitlar)
    }

@router.get("/urunler")
def get_urunler_for_satis(db: Session = Depends(get_db)):
    """Satış için ürün listesi"""
    from models import Kategori, Birim
    
    urunler = (
        db.query(Urun, Kategori.kategori_adi, Birim.birim_adi, Birim.kisaltma)
        .join(Kategori, Urun.kategori_id == Kategori.id)
        .join(Birim, Urun.birim_id == Birim.id)
        .filter(Urun.durum == "Aktif")
        .order_by(Urun.urun_adi)
        .all()
    )
    
    result = []
    for urun, kategori_adi, birim_adi, kisaltma in urunler:
        result.append({
            "id": urun.id,
            "urun_adi": urun.urun_adi,
            "stok_miktari": urun.stok_miktari,
            "birim_adi": birim_adi,
            "birim_kisaltma": kisaltma or birim_adi,  # kisaltma yoksa birim_adi kullan
            "kategori_adi": kategori_adi
        })
    
    return result

@router.get("/urun/{urun_id}/basit")
def get_urun_bilgi(urun_id: int, db: Session = Depends(get_db)):
    """Ürün bilgilerini getir (basitleştirilmiş)"""
    urun = db.query(Urun).filter(Urun.id == urun_id).first()
    if not urun:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    
    return {
        "urun_id": urun.id,
        "urun_adi": urun.urun_adi,
        "stok_miktari": urun.stok_miktari,
        "minimum_stok": urun.minimum_stok
    } 