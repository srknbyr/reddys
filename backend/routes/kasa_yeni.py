from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from typing import List, Optional
from datetime import datetime, date, timedelta
from database import get_db
from models import KasaHareket, AltKategori, CariHesap, HareketTipi, CariHareket, OdemeTipi, GunlukKasaOzeti
from pydantic import BaseModel

router = APIRouter(prefix="/kasa", tags=["Kasa Takibi Yeni"])

# Pydantic modelleri
class KasaHareketCreate(BaseModel):
    hareket_tipi: str  # "Giriş" veya "Çıkış"
    kategori: str  # "Satış", "Gider", "Alım", "Tahsilat"
    alt_kategori_id: Optional[int] = None  # Gider kategorisi ID
    cari_hesap_id: Optional[int] = None  # Cari hesap ID (Alım/Tahsilat için)
    odeme_tipi: str  # "Nakit", "Kart", "Yemek Çeki", "Transfer"
    alt_odeme_tipi_id: Optional[int] = None  # Banka/Yemek çeki firması ID
    tutar: float
    aciklama: Optional[str] = None
    tarih: Optional[str] = None  # Hareket tarihi (YYYY-MM-DD formatında)

class KasaHareketResponse(BaseModel):
    id: int
    hareket_tipi: str
    kategori: str
    alt_kategori: Optional[str] = None
    cari_hesap: Optional[str] = None
    odeme_tipi: str
    alt_odeme_tipi: Optional[str] = None
    tutar: float
    aciklama: Optional[str] = None
    tarih: datetime

class AltKategoriResponse(BaseModel):
    id: int
    kategori_adi: str
    kategori_tipi: str
    aciklama: Optional[str] = None

class CariHesapResponse(BaseModel):
    id: int
    hesap_adi: str
    tipi: str

class KasaDurumuResponse(BaseModel):
    nakit_bakiye: float
    kart_bakiye: float
    yemek_ceki_bakiye: float
    transfer_bakiye: float
    toplam_bakiye: float
    bugun_giris: float
    bugun_cikis: float

class GunsonuSayimCreate(BaseModel):
    fiziksel_nakit: float
    aciklama: Optional[str] = None

class GunsonuResponse(BaseModel):
    tarih: date
    acilis_bakiye: float
    bugun_nakit_giris: float
    bugun_nakit_cikis: float
    hesaplanan_bakiye: float
    fiziksel_sayim: Optional[float] = None
    fark: Optional[float] = None
    kapanmis_mi: bool
    yeni_gun_baslatildi_mi: bool = False  # ✅ YENİ ALAN

class AltKategoriCreate(BaseModel):
    kategori_adi: str
    kategori_tipi: str  # "gider", "banka", "yemek_ceki", "nakit"
    aciklama: Optional[str] = None

class GelirlergiderlerResponse(BaseModel):
    nakit_satis: float
    pos_satis: float
    yemek_ceki_satis: float
    havale_satis: float
    nakit_gider: float
    kredi_karti_gider: float
    yemek_ceki_gider: float
    transfer_gider: float

class GunsOnuTarihResponse(BaseModel):
    tarih: datetime
    aciklama: str

@router.get("/durum", response_model=KasaDurumuResponse)
def get_kasa_durumu(db: Session = Depends(get_db)):
    """Güncel kasa durumu - Hibrit yaklaşım"""
    
    # Ödeme tiplerine göre bakiye hesaplama
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
    
    # Bugünkü SADECE NAKİT hareketler (Ana odak)
    bugun = date.today()
    bugun_nakit_giris = db.query(func.sum(KasaHareket.tutar)).filter(
        and_(KasaHareket.hareket_tipi == HareketTipi.GIRIS,
             KasaHareket.odeme_tipi == "Nakit",
             func.date(KasaHareket.tarih) == bugun)
    ).scalar() or 0
    
    bugun_nakit_cikis = db.query(func.sum(KasaHareket.tutar)).filter(
        and_(KasaHareket.hareket_tipi == HareketTipi.CIKIS,
             KasaHareket.odeme_tipi == "Nakit",
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
        bugun_giris=bugun_nakit_giris,  # Sadece nakit
        bugun_cikis=bugun_nakit_cikis   # Sadece nakit
    )

@router.get("/alt-kategoriler/{kategori_tipi}", response_model=List[AltKategoriResponse])
def get_alt_kategoriler(kategori_tipi: str, db: Session = Depends(get_db)):
    """Kategori tipine göre alt kategorileri listele"""
    kategoriler = db.query(AltKategori).filter(
        AltKategori.kategori_tipi == kategori_tipi
    ).all()
    
    return kategoriler

@router.get("/cari-hesaplar", response_model=List[CariHesapResponse])
def get_cari_hesaplar(db: Session = Depends(get_db)):
    """Aktif cari hesapları listele"""
    cariler = db.query(CariHesap).all()
    
    return [CariHesapResponse(
        id=c.id,
        hesap_adi=c.hesap_adi,
        tipi=c.tipi.value
    ) for c in cariler]

@router.post("/alt-kategori", response_model=AltKategoriResponse)
def create_alt_kategori(kategori: AltKategoriCreate, db: Session = Depends(get_db)):
    """Yeni alt kategori oluştur"""
    
    # Validasyonlar
    if not kategori.kategori_adi.strip():
        raise HTTPException(status_code=400, detail="Kategori adı boş olamaz")
    
    if kategori.kategori_tipi not in ["gider", "banka", "yemek_ceki", "nakit"]:
        raise HTTPException(status_code=400, detail="Geçersiz kategori tipi")
    
    # Aynı isimde kategori var mı kontrol et
    existing = db.query(AltKategori).filter(
        AltKategori.kategori_adi == kategori.kategori_adi.strip(),
        AltKategori.kategori_tipi == kategori.kategori_tipi
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Bu isimde kategori zaten mevcut")
    
    # Yeni kategori oluştur
    db_kategori = AltKategori(
        kategori_adi=kategori.kategori_adi.strip(),
        kategori_tipi=kategori.kategori_tipi,
        aciklama=kategori.aciklama
    )
    
    db.add(db_kategori)
    db.commit()
    db.refresh(db_kategori)
    
    return AltKategoriResponse(
        id=db_kategori.id,
        kategori_adi=db_kategori.kategori_adi,
        kategori_tipi=db_kategori.kategori_tipi,
        aciklama=db_kategori.aciklama
    )

@router.post("/hareket-yeni", response_model=KasaHareketResponse)
def create_kasa_hareket_yeni(hareket: KasaHareketCreate, db: Session = Depends(get_db)):
    """Yeni sistem ile kasa hareketi oluştur"""
    
    # Validasyonlar
    if hareket.hareket_tipi not in ["Giriş", "Çıkış"]:
        raise HTTPException(status_code=400, detail="Hareket tipi 'Giriş' veya 'Çıkış' olmalıdır")
    
    if hareket.tutar <= 0:
        raise HTTPException(status_code=400, detail="Tutar sıfırdan büyük olmalıdır")
    
    # Kategori validasyonları
    if hareket.kategori == "Gider" and not hareket.alt_kategori_id:
        raise HTTPException(status_code=400, detail="Gider kategorisi seçmelisiniz")
        
    if hareket.kategori in ["Alım", "Tahsilat"] and not hareket.cari_hesap_id:
        raise HTTPException(status_code=400, detail="Cari hesap seçmelisiniz")
        
    if hareket.odeme_tipi in ["Kart", "Yemek Çeki"] and not hareket.alt_odeme_tipi_id:
        raise HTTPException(status_code=400, detail="Ödeme tipi detayı seçmelisiniz")
    
    # Hareket tipi enum
    hareket_tipi_enum = HareketTipi.GIRIS if hareket.hareket_tipi == "Giriş" else HareketTipi.CIKIS
    
    # Tarih işleme - eğer tarih verilmişse o günün şu anki saatini kullan
    hareket_tarihi = None
    if hareket.tarih:
        try:
            from datetime import datetime, time
            # Sadece tarih verildi, şu anki saat bilgisini ekle
            tarih_obj = datetime.strptime(hareket.tarih, "%Y-%m-%d").date()
            su_anki_saat = datetime.now().time()
            hareket_tarihi = datetime.combine(tarih_obj, su_anki_saat)
        except ValueError:
            raise HTTPException(status_code=400, detail="Geçersiz tarih formatı. YYYY-MM-DD kullanın.")
    
    # ✅ Aktif periyodu bul ve hareketi ona ata
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

    # Kasa hareket oluştur
    db_hareket = KasaHareket(
        hareket_tipi=hareket_tipi_enum,
        kategori=hareket.kategori,
        alt_kategori_id=hareket.alt_kategori_id,
        cari_hesap_id=hareket.cari_hesap_id,
        odeme_tipi=hareket.odeme_tipi,
        alt_odeme_tipi_id=hareket.alt_odeme_tipi_id,
        tutar=hareket.tutar,
        aciklama=hareket.aciklama,
        gunsonu_tarihi=None,  # Açıkça NULL set et - henüz günsonu yapılmamış
        periyot_id=aktif_periyot.id  # ✅ Aktif periyoda ata
    )
    
    # Eğer özel tarih verilmişse onu set et, yoksa default (şu an) kullanılır
    if hareket_tarihi:
        db_hareket.tarih = hareket_tarihi
    
    db.add(db_hareket)
    
    # Cari hesap varsa bakiyesini güncelle
    if hareket.cari_hesap_id:
        cari_hesap = db.query(CariHesap).filter(CariHesap.id == hareket.cari_hesap_id).first()
        if cari_hesap:
            # Cari hareket tipi belirle
            cari_hareket_tipi = ""
            
            if hareket.kategori == "Alım":
                # Alım = Tedarikçi borcu = Cari hesapta borç artışı
                cari_hareket_tipi = "Borç"
                if cari_hesap.tipi.value == "Tedarikçi":
                    cari_hesap.bakiye -= hareket.tutar  # Tedarikçi borcu arttı (negatif)
                else:
                    cari_hesap.bakiye += hareket.tutar  # Müşteri borcu arttı (pozitif)
                    
            elif hareket.kategori == "Tahsilat":
                # Tahsilat = Müşteri ödemesi = Cari hesapta alacak
                cari_hareket_tipi = "Alacak"
                if cari_hesap.tipi.value == "Müşteri":
                    cari_hesap.bakiye -= hareket.tutar  # Müşteri borcu azaldı
                else:
                    cari_hesap.bakiye += hareket.tutar  # Tedarikçi borcu azaldı
            
            # Cari hareket kaydı oluştur
            if cari_hareket_tipi:
                # OdemeTipi enum'una çevir
                odeme_tipi_enum = None
                for ot in OdemeTipi:
                    if ot.value == hareket.odeme_tipi:
                        odeme_tipi_enum = ot
                        break
                
                if odeme_tipi_enum:
                    cari_hareket = CariHareket(
                        cari_hesap_id=hareket.cari_hesap_id,
                        hareket_tipi=cari_hareket_tipi,
                        tutar=hareket.tutar,
                        odeme_tipi=odeme_tipi_enum,
                        aciklama=f"Kasa Hareketi - {hareket.aciklama or hareket.kategori}"
                    )
                    db.add(cari_hareket)
                
                # Son hareket tarihini güncelle
                cari_hesap.son_hareket_tarihi = func.now()
    
    db.commit()
    db.refresh(db_hareket)
    
    # Response oluştur
    return KasaHareketResponse(
        id=db_hareket.id,
        hareket_tipi=db_hareket.hareket_tipi.value,
        kategori=db_hareket.kategori,
        alt_kategori=db_hareket.alt_kategori.kategori_adi if db_hareket.alt_kategori else None,
        cari_hesap=db_hareket.cari_hesap.hesap_adi if db_hareket.cari_hesap else None,
        odeme_tipi=db_hareket.odeme_tipi,
        alt_odeme_tipi=db_hareket.alt_odeme_tipi.kategori_adi if db_hareket.alt_odeme_tipi else None,
        tutar=db_hareket.tutar,
        aciklama=db_hareket.aciklama,
        tarih=db_hareket.tarih
    )

@router.get("/gunsonu", response_model=GunsonuResponse)
def get_gunsonu_durumu(tarih: Optional[str] = None, db: Session = Depends(get_db)):
    """✅ YENİ MANTIK: Aktif günü (son kapanmamış) veya belirtilen tarihi göster"""
    
    from models import GunlukKasaOzeti
    
    if tarih:
        # Belirli tarih istendi - o tarihi bul
        try:
            tarih_obj = datetime.strptime(tarih, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Geçersiz tarih formatı. YYYY-MM-DD kullanın.")
        
        hedef_ozet = db.query(GunlukKasaOzeti).filter(
            func.date(GunlukKasaOzeti.tarih) == tarih_obj
        ).order_by(GunlukKasaOzeti.id.desc()).first()
        
        if not hedef_ozet:
            raise HTTPException(status_code=404, detail="Belirtilen tarih için kayıt bulunamadı")
            
        # Belirtilen tarihin önceki gününü bul
        onceki_ozet = db.query(GunlukKasaOzeti).filter(
            GunlukKasaOzeti.tarih < hedef_ozet.tarih
        ).order_by(GunlukKasaOzeti.tarih.desc()).first()
        
        acilis_bakiye = onceki_ozet.kapanış_bakiye if onceki_ozet else 0.0
        
        # O günün hareketleri
        gun_nakit_giris = db.query(func.sum(KasaHareket.tutar)).filter(
            and_(KasaHareket.hareket_tipi == HareketTipi.GIRIS,
                 KasaHareket.odeme_tipi == "Nakit",
                 func.date(KasaHareket.tarih) == tarih_obj)
        ).scalar() or 0
        
        gun_nakit_cikis = db.query(func.sum(KasaHareket.tutar)).filter(
            and_(KasaHareket.hareket_tipi == HareketTipi.CIKIS,
                 KasaHareket.odeme_tipi == "Nakit",
                 func.date(KasaHareket.tarih) == tarih_obj)
        ).scalar() or 0
        
        hesaplanan_bakiye = acilis_bakiye + gun_nakit_giris - gun_nakit_cikis
        
        return GunsonuResponse(
            tarih=tarih_obj,
            acilis_bakiye=acilis_bakiye,
            bugun_nakit_giris=gun_nakit_giris,
            bugun_nakit_cikis=gun_nakit_cikis,
            hesaplanan_bakiye=hesaplanan_bakiye,
            fiziksel_sayim=hedef_ozet.kapanış_bakiye,
            fark=hedef_ozet.kapanış_bakiye - hesaplanan_bakiye if hedef_ozet.kapanış_bakiye else None,
            kapanmis_mi=hedef_ozet.kapanış_bakiye is not None,
            yeni_gun_baslatildi_mi=hedef_ozet.yeni_gun_baslatildi or False
        )
    
    else:
        # Tarih belirtilmedi - AKTİF (kapanmamış) günü göster
        # ✅ YENİ MANTIK: kapanış_bakiye=NULL olan en son kaydı bul
        aktif_gun = db.query(GunlukKasaOzeti).filter(
            GunlukKasaOzeti.kapanış_bakiye.is_(None)
        ).order_by(GunlukKasaOzeti.tarih.desc()).first()
        
        if aktif_gun:
            # Aktif gün var - onun bilgilerini göster
            tarih_obj = aktif_gun.tarih.date() if hasattr(aktif_gun.tarih, 'date') else aktif_gun.tarih
            acilis_bakiye = aktif_gun.acilis_bakiye
            
            # ✅ PERİYOT BAZLI: Aktif periyodun hareketleri (FİZİKSEL SAYIM HARİÇ)
            gun_nakit_giris = db.query(func.sum(KasaHareket.tutar)).filter(
                and_(KasaHareket.hareket_tipi == HareketTipi.GIRIS,
                     KasaHareket.odeme_tipi == "Nakit",
                     KasaHareket.periyot_id == aktif_gun.id,  # ✅ Periyot bazlı
                     KasaHareket.kategori != "Fiziksel Sayım")  # ✅ Fiziksel sayım hariç
            ).scalar() or 0
            
            gun_nakit_cikis = db.query(func.sum(KasaHareket.tutar)).filter(
                and_(KasaHareket.hareket_tipi == HareketTipi.CIKIS,
                     KasaHareket.odeme_tipi == "Nakit",
                     KasaHareket.periyot_id == aktif_gun.id,  # ✅ Periyot bazlı
                     KasaHareket.kategori != "Fiziksel Sayım")  # ✅ Fiziksel sayım hariç
            ).scalar() or 0
            
            hesaplanan_bakiye = acilis_bakiye + gun_nakit_giris - gun_nakit_cikis
            
            return GunsonuResponse(
                tarih=tarih_obj,
                acilis_bakiye=acilis_bakiye,
                bugun_nakit_giris=gun_nakit_giris,
                bugun_nakit_cikis=gun_nakit_cikis,
                hesaplanan_bakiye=hesaplanan_bakiye,
                fiziksel_sayim=None,  # Henüz kapatılmamış
                fark=None,
                kapanmis_mi=False,
                yeni_gun_baslatildi_mi=False  # Aktif gün henüz başlatılmamış
            )
        
        else:
            # Aktif gün yok - son kapatılmış günü göster veya ilk gün oluştur
            son_kapali_gun = db.query(GunlukKasaOzeti).filter(
                GunlukKasaOzeti.kapanış_bakiye.isnot(None)
            ).order_by(GunlukKasaOzeti.tarih.desc()).first()
            
            if not son_kapali_gun:
                # ✅ İLK GÜN MANTITI: Hiç kayıt yok, bugün için ilk günü oluştur
                bugun = date.today()
                
                # Bugünkü hareketleri kontrol et (henüz günsonu yapılmamış)
                gun_nakit_giris = db.query(func.sum(KasaHareket.tutar)).filter(
                    and_(KasaHareket.hareket_tipi == HareketTipi.GIRIS,
                         KasaHareket.odeme_tipi == "Nakit",
                         KasaHareket.gunsonu_tarihi.is_(None))  # Henüz günsonu yapılmamış
                ).scalar() or 0
                
                gun_nakit_cikis = db.query(func.sum(KasaHareket.tutar)).filter(
                    and_(KasaHareket.hareket_tipi == HareketTipi.CIKIS,
                         KasaHareket.odeme_tipi == "Nakit",
                         KasaHareket.gunsonu_tarihi.is_(None))  # Henüz günsonu yapılmamış
                ).scalar() or 0
                
                acilis_bakiye = 0.0  # İlk gün açılış bakiyesi sıfır
                hesaplanan_bakiye = acilis_bakiye + gun_nakit_giris - gun_nakit_cikis
                
                return GunsonuResponse(
                    tarih=bugun,
                    acilis_bakiye=acilis_bakiye,
                    bugun_nakit_giris=gun_nakit_giris,
                    bugun_nakit_cikis=gun_nakit_cikis,
                    hesaplanan_bakiye=hesaplanan_bakiye,
                    fiziksel_sayim=None,  # Henüz kapatılmamış
                    fark=None,
                    kapanmis_mi=False,  # İlk gün açık
                    yeni_gun_baslatildi_mi=False
                )
            
            tarih_obj = son_kapali_gun.tarih.date() if hasattr(son_kapali_gun.tarih, 'date') else son_kapali_gun.tarih
            
            # Önceki günü bul
            onceki_ozet = db.query(GunlukKasaOzeti).filter(
                GunlukKasaOzeti.tarih < son_kapali_gun.tarih
            ).order_by(GunlukKasaOzeti.tarih.desc()).first()
            
            acilis_bakiye = onceki_ozet.kapanış_bakiye if onceki_ozet else 0.0
            
            # ✅ PERİYOT BAZLI: O periyodun hareketleri (FİZİKSEL SAYIM HARİÇ)
            gun_nakit_giris = db.query(func.sum(KasaHareket.tutar)).filter(
                and_(KasaHareket.hareket_tipi == HareketTipi.GIRIS,
                     KasaHareket.odeme_tipi == "Nakit",
                     KasaHareket.periyot_id == son_kapali_gun.id,  # ✅ Periyot bazlı
                     KasaHareket.kategori != "Fiziksel Sayım")  # ✅ Fiziksel sayım hariç
            ).scalar() or 0
            
            gun_nakit_cikis = db.query(func.sum(KasaHareket.tutar)).filter(
                and_(KasaHareket.hareket_tipi == HareketTipi.CIKIS,
                     KasaHareket.odeme_tipi == "Nakit",
                     KasaHareket.periyot_id == son_kapali_gun.id,  # ✅ Periyot bazlı
                     KasaHareket.kategori != "Fiziksel Sayım")  # ✅ Fiziksel sayım hariç
            ).scalar() or 0
            
            hesaplanan_bakiye = acilis_bakiye + gun_nakit_giris - gun_nakit_cikis
            
            return GunsonuResponse(
                tarih=tarih_obj,
                acilis_bakiye=acilis_bakiye,
                bugun_nakit_giris=gun_nakit_giris,
                bugun_nakit_cikis=gun_nakit_cikis,
                hesaplanan_bakiye=hesaplanan_bakiye,
                fiziksel_sayim=son_kapali_gun.kapanış_bakiye,
                fark=son_kapali_gun.kapanış_bakiye - hesaplanan_bakiye,
                kapanmis_mi=True,
                yeni_gun_baslatildi_mi=son_kapali_gun.yeni_gun_baslatildi or False
            )

@router.post("/gunsonu-sayim", response_model=GunsonuResponse)
def gunsonu_sayim_yap(sayim: GunsonuSayimCreate, db: Session = Depends(get_db)):
    """✅ YENİ MANTIK: Aktif (kapanmamış) güne yazarak günsonu yap"""
    
    simdi = datetime.now()
    
    try:
        # ✅ YENİ MANTIK: Kapanmamış (NULL) günü bul ve ona yaz
        aktif_gun = db.query(GunlukKasaOzeti).filter(
            GunlukKasaOzeti.kapanış_bakiye.is_(None)
        ).order_by(GunlukKasaOzeti.tarih.desc()).first()
        
        if aktif_gun:
            # Aktif gün var - ona kapanış yazacağız
            acilis_bakiye = aktif_gun.acilis_bakiye  # Zaten doğru
            
        else:
            # Aktif gün yok - İlk günsonu, yeni kayıt oluştur
            # Önceki günün kapanış bakiyesini bul (açılış bakiyesi için)
            son_ozet = db.query(GunlukKasaOzeti).order_by(GunlukKasaOzeti.tarih.desc()).first()
            acilis_bakiye = son_ozet.kapanış_bakiye if son_ozet else 0.0
            
            # Yeni kayıt oluştur
            aktif_gun = GunlukKasaOzeti(
                tarih=simdi,
                acilis_bakiye=acilis_bakiye,
                nakit_satis=0.0,
                toplam_satis=0.0,
                toplam_gider=0.0,
                kapanış_bakiye=None,  # Henüz kapatılmamış
                yeni_gun_baslatildi=False
            )
            db.add(aktif_gun)
            db.flush()  # ID'yi al
        
        # ✅ PERİYOT BAZLI: Aktif periyodun hareketlerini hesapla (FİZİKSEL SAYIM HARİÇ)
        nakit_giris = db.query(func.sum(KasaHareket.tutar)).filter(
            and_(
                KasaHareket.hareket_tipi == HareketTipi.GIRIS,
                KasaHareket.odeme_tipi == "Nakit",
                KasaHareket.periyot_id == aktif_gun.id,  # ✅ Periyot bazlı
                KasaHareket.kategori != "Fiziksel Sayım"  # ✅ Fiziksel sayım hariç
            )
        ).scalar() or 0
        
        nakit_cikis = db.query(func.sum(KasaHareket.tutar)).filter(
            and_(
                KasaHareket.hareket_tipi == HareketTipi.CIKIS,
                KasaHareket.odeme_tipi == "Nakit",
                KasaHareket.periyot_id == aktif_gun.id,  # ✅ Periyot bazlı
                KasaHareket.kategori != "Fiziksel Sayım"  # ✅ Fiziksel sayım hariç
            )
        ).scalar() or 0
        
        hesaplanan_bakiye = acilis_bakiye + nakit_giris - nakit_cikis
        fark = sayim.fiziksel_nakit - hesaplanan_bakiye
        
        # ✅ Aktif günü güncelle (kapanış yaz)
        aktif_gun.nakit_satis = nakit_giris
        aktif_gun.toplam_satis = nakit_giris
        aktif_gun.toplam_gider = nakit_cikis
        aktif_gun.kapanış_bakiye = sayim.fiziksel_nakit  # ✅ KAPANIŞ YAZILDI
        aktif_gun.yeni_gun_baslatildi = False  # Günsonu yapıldı
        
        gunluk_ozet = aktif_gun
        
        # ✅ PERİYOT BAZLI: Bu periyodun hareketlerine günsonu damgası ata
        periyot_hareketleri = db.query(KasaHareket).filter(
            KasaHareket.periyot_id == aktif_gun.id
        ).all()
        
        for hareket in periyot_hareketleri:
            hareket.gunsonu_tarihi = simdi
        
        # ✅ Fiziksel sayım hareketi ekle (sadece fark varsa) - periyoda ata
        if fark != 0:
            fiziksel_sayim_hareket = KasaHareket(
                hareket_tipi=HareketTipi.GIRIS if fark > 0 else HareketTipi.CIKIS,
                kategori="Fiziksel Sayım",
                odeme_tipi="Nakit",
                tutar=abs(fark),
                aciklama=f"Fiziksel sayım - {sayim.aciklama}" if sayim.aciklama else "Fiziksel sayım",
                tarih=simdi,
                gunsonu_tarihi=simdi,  # Bu hareket de hemen kapanışa dahil
                periyot_id=aktif_gun.id  # ✅ Periyoda ata
            )
            db.add(fiziksel_sayim_hareket)
        
        # Değişiklikleri kaydet
        db.commit()
        db.refresh(gunluk_ozet)
        
        return GunsonuResponse(
            tarih=aktif_gun.tarih.date(),
            acilis_bakiye=acilis_bakiye,
            bugun_nakit_giris=nakit_giris,
            bugun_nakit_cikis=nakit_cikis,
            hesaplanan_bakiye=hesaplanan_bakiye,
            fiziksel_sayim=sayim.fiziksel_nakit,
            fark=fark,
            kapanmis_mi=True
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Günsonu sayımı yapılırken hata oluştu: {str(e)}"
        )

@router.post("/gunsonu-geri-al", response_model=dict)
def gunsonu_geri_al(db: Session = Depends(get_db)):
    """✅ YENİ MANTIK: Son kapatılmış periyodun günsonu kapanışını geri al"""
    from models import GunlukKasaOzeti
    
    # ✅ PERİYOT BAZLI: Son kapatılmış periyodu bul (kapanış_bakiye dolu olan en son)
    son_kapali_periyot = db.query(GunlukKasaOzeti).filter(
        GunlukKasaOzeti.kapanış_bakiye.isnot(None)
    ).order_by(GunlukKasaOzeti.id.desc()).first()
    
    if not son_kapali_periyot:
        raise HTTPException(
            status_code=400, 
            detail="Kapatılmış periyot bulunamadı. Geri alınacak günsonu yok."
        )
    
    try:
        # 1. ✅ PERİYOT BAZLI: Bu periyodun fiziksel sayım hareketlerini bul ve sil
        fiziksel_sayim_hareketleri = db.query(KasaHareket).filter(
            and_(
                KasaHareket.periyot_id == son_kapali_periyot.id,
                KasaHareket.kategori == "Fiziksel Sayım"
            )
        ).all()
        
        silinen_hareket_sayisi = len(fiziksel_sayim_hareketleri)
        
        for hareket in fiziksel_sayim_hareketleri:
            db.delete(hareket)
        
        # 2. ✅ PERİYOT BAZLI: Bu periyodun tüm hareketlerini tekrar açık duruma getir
        periyot_hareketleri = db.query(KasaHareket).filter(
            KasaHareket.periyot_id == son_kapali_periyot.id
        ).all()
        
        for hareket in periyot_hareketleri:
            hareket.gunsonu_tarihi = None  # Açık duruma getir
        
        # 3. ✅ Periyodu açık duruma getir (kapanış_bakiye = NULL)
        son_kapali_periyot.kapanış_bakiye = None
        son_kapali_periyot.yeni_gun_baslatildi = False
        
        # 4. Değişiklikleri kaydet
        db.commit()
        
        periyot_tarihi = son_kapali_periyot.tarih.strftime('%d.%m.%Y %H:%M') if hasattr(son_kapali_periyot.tarih, 'strftime') else str(son_kapali_periyot.tarih)
        
        return {
            "success": True,
            "message": f"{periyot_tarihi} tarihli periyot kapanışı başarıyla geri alındı",
            "silinen_hareket_sayisi": silinen_hareket_sayisi,
            "periyot_id": son_kapali_periyot.id
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Günsonu geri alınırken hata oluştu: {str(e)}"
        )

@router.get("/gelirler-giderler", response_model=GelirlergiderlerResponse)
def get_gelirler_giderler(db: Session = Depends(get_db)):
    """Kullanıcının istediği kasa takibi kartları için verileri getir - Yeni günsonu sistemi"""
    
    # Yeni mantık: Sadece gunsonu_tarihi NULL olan hareketleri getir
    # Bu, günsonu yapılmamış (yeni gün) hareketleri demektir
    
    # GELİRLER (Satış kategorisi - günsonu yapılmamış)
    nakit_satis = db.query(func.sum(KasaHareket.tutar)).filter(
        KasaHareket.kategori == "Satış",
        KasaHareket.odeme_tipi == "Nakit",
        KasaHareket.gunsonu_tarihi.is_(None)
    ).scalar() or 0
    
    pos_satis = db.query(func.sum(KasaHareket.tutar)).filter(
        KasaHareket.kategori == "Satış",
        KasaHareket.odeme_tipi == "Kart",
        KasaHareket.gunsonu_tarihi.is_(None)
    ).scalar() or 0
    
    yemek_ceki_satis = db.query(func.sum(KasaHareket.tutar)).filter(
        KasaHareket.kategori == "Satış",
        KasaHareket.odeme_tipi == "Yemek Çeki",
        KasaHareket.gunsonu_tarihi.is_(None)
    ).scalar() or 0
    
    havale_satis = db.query(func.sum(KasaHareket.tutar)).filter(
        KasaHareket.kategori == "Satış",
        KasaHareket.odeme_tipi == "Transfer",
        KasaHareket.gunsonu_tarihi.is_(None)
    ).scalar() or 0
    
    # GİDERLER (Gider ve Ödeme kategorileri - günsonu yapılmamış)
    nakit_gider = db.query(func.sum(KasaHareket.tutar)).filter(
        KasaHareket.kategori.in_(["Gider", "Ödeme"]),
        KasaHareket.odeme_tipi == "Nakit",
        KasaHareket.gunsonu_tarihi.is_(None)
    ).scalar() or 0
    
    kredi_karti_gider = db.query(func.sum(KasaHareket.tutar)).filter(
        KasaHareket.kategori.in_(["Gider", "Ödeme"]),
        KasaHareket.odeme_tipi == "Kart",
        KasaHareket.gunsonu_tarihi.is_(None)
    ).scalar() or 0
    
    yemek_ceki_gider = db.query(func.sum(KasaHareket.tutar)).filter(
        KasaHareket.kategori.in_(["Gider", "Ödeme"]),
        KasaHareket.odeme_tipi == "Yemek Çeki",
        KasaHareket.gunsonu_tarihi.is_(None)
    ).scalar() or 0
    
    transfer_gider = db.query(func.sum(KasaHareket.tutar)).filter(
        KasaHareket.kategori.in_(["Gider", "Ödeme"]),
        KasaHareket.odeme_tipi == "Transfer",
        KasaHareket.gunsonu_tarihi.is_(None)
    ).scalar() or 0
    
    return GelirlergiderlerResponse(
        nakit_satis=nakit_satis,
        pos_satis=pos_satis,
        yemek_ceki_satis=yemek_ceki_satis,
        havale_satis=havale_satis,
        nakit_gider=nakit_gider,
        kredi_karti_gider=kredi_karti_gider,
        yemek_ceki_gider=yemek_ceki_gider,
        transfer_gider=transfer_gider
    )

@router.post("/yeni-gun-baslat", response_model=dict)
def yeni_gun_baslat(db: Session = Depends(get_db)):
    """✅ YENİ MANTIK: Yeni çalışma periyodu başlat (herhangi bir saatte olabilir)"""
    
    simdi = datetime.now()
    
    try:
        # Son kapatılmış periyodu bul (kapanış_bakiye dolu olan en son kayıt)
        son_kapali_periyot = db.query(GunlukKasaOzeti).filter(
            GunlukKasaOzeti.kapanış_bakiye.isnot(None)
        ).order_by(GunlukKasaOzeti.id.desc()).first()
        
        if not son_kapali_periyot:
            raise HTTPException(
                status_code=400, 
                detail="Kapatılmış periyot bulunamadı. Önce günsonu sayımı yapmalısınız."
            )
        
        # Önceki periyodun kapanış bakiyesi = yeni periyodun açılış bakiyesi
        acilis_bakiye = son_kapali_periyot.kapanış_bakiye
        
        # ✅ YENİ PERIYOT KAYDI OLUŞTUR (şu anki zaman ile)
        yeni_periyot = GunlukKasaOzeti(
            tarih=simdi,  # Şu anki zaman
            acilis_bakiye=acilis_bakiye,  # Önceki periyodun kapanışı
            nakit_satis=0.0,
            toplam_satis=0.0,
            toplam_gider=0.0,
            # kapanış_bakiye hiç set etme - NULL kalsın
            yeni_gun_baslatildi=False  # Yeni periyot
        )
        
        # Son kapatılmış periyodu "başlatılmış" olarak işaretle
        son_kapali_periyot.yeni_gun_baslatildi = True
        
        # Veritabanına kaydet
        db.add(yeni_periyot)
        db.commit()
        db.refresh(yeni_periyot)
        
        return {
            "message": f"🌅 Yeni çalışma periyodu başlatıldı! Sistem hazır.",
            "tarih": simdi.strftime("%d.%m.%Y %H:%M"),
            "aciklama": f"Yeni periyot kaydı oluşturuldu. Önceki periyot tarihçede korundu.",
            "onceki_kapanis": f"Açılış bakiye: {acilis_bakiye} TL olarak ayarlandı",
            "yeni_periyot_id": yeni_periyot.id
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Yeni periyot başlatılırken hata oluştu: {str(e)}"
        )

@router.get("/gunsonu-tarihleri", response_model=List[GunsOnuTarihResponse])
def get_gunsonu_tarihleri(db: Session = Depends(get_db)):
    """Gün sonu alınan tarihleri listele"""
    
    # Benzersiz günsonu tarihlerini getir (grupla)
    gunsonu_tarihleri = db.query(
        KasaHareket.gunsonu_tarihi,
        func.count(KasaHareket.id).label('hareket_sayisi')
    ).filter(
        KasaHareket.gunsonu_tarihi.isnot(None)
    ).group_by(
        KasaHareket.gunsonu_tarihi
    ).order_by(
        KasaHareket.gunsonu_tarihi.desc()
    ).all()
    
    return [
        GunsOnuTarihResponse(
            tarih=tarih,
            aciklama=f"{tarih.strftime('%d.%m.%Y')} ({hareket_sayisi} hareket)"
        )
        for tarih, hareket_sayisi in gunsonu_tarihleri
    ]

@router.get("/hareketler-tarihe-gore", response_model=List[KasaHareketResponse])
def get_hareketler_tarihe_gore(
    gunsonu_tarihi: str = None,  # ISO format: 2023-12-25T10:30:00
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Seçilen günsonu tarihine göre veya son gün sonundan sonraki hareketleri getir"""
    
    if gunsonu_tarihi:
        # Belirli bir günsonu tarihindeki hareketleri getir
        try:
            tarih_obj = datetime.fromisoformat(gunsonu_tarihi.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Geçersiz tarih formatı")
            
        query = db.query(KasaHareket).filter(
            KasaHareket.gunsonu_tarihi == tarih_obj
        )
    else:
        # Son gün sonundan sonraki hareketleri getir (NULL olanlar)
        query = db.query(KasaHareket).filter(
            KasaHareket.gunsonu_tarihi.is_(None)
        )
    
    # Sıralama ve sayfalama
    hareketler = query.order_by(KasaHareket.tarih.desc()).offset(offset).limit(limit).all()
    
    # Response formatına çevir
    return [
        KasaHareketResponse(
            id=h.id,
            hareket_tipi=h.hareket_tipi.value,
            kategori=h.kategori,
            alt_kategori=h.alt_kategori.kategori_adi if h.alt_kategori else None,
            cari_hesap=h.cari_hesap.hesap_adi if h.cari_hesap else None,
            odeme_tipi=h.odeme_tipi,
            alt_odeme_tipi=h.alt_odeme_tipi.kategori_adi if h.alt_odeme_tipi else None,
            tutar=h.tutar,
            aciklama=h.aciklama,
            tarih=h.tarih
        )
        for h in hareketler
    ] 