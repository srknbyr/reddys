from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime
from database import get_db
from models import Urun, Kategori, Birim, StokHareket, HareketTipi
from pydantic import BaseModel

router = APIRouter(prefix="/stok", tags=["Stok Takibi"])

# Pydantic modelleri
class UrunResponse(BaseModel):
    id: int
    urun_adi: str
    barkod: Optional[str]
    kategori_id: int
    kategori_adi: str
    birim_id: int
    birim_adi: str
    birim_kisaltma: str
    stok_miktari: float
    minimum_stok: float
    durum: str
    
    class Config:
        from_attributes = True

class StokHareketCreate(BaseModel):
    urun_id: int
    hareket_tipi: str  # "Giriş" veya "Çıkış"
    miktar: float
    aciklama: Optional[str] = None

class StokHareketResponse(BaseModel):
    id: int
    urun_id: int
    urun_adi: str
    hareket_tipi: str
    miktar: float
    aciklama: Optional[str]
    tarih: datetime
    
    class Config:
        from_attributes = True

class UrunCreate(BaseModel):
    urun_adi: str
    barkod: Optional[str] = None
    kategori_id: int
    birim_id: int
    minimum_stok: float = 0.0
    durum: str = "Aktif"

class UrunUpdate(BaseModel):
    urun_adi: Optional[str] = None
    barkod: Optional[str] = None
    kategori_id: Optional[int] = None
    birim_id: Optional[int] = None
    minimum_stok: Optional[float] = None
    durum: Optional[str] = None

class KategoriCreate(BaseModel):
    kategori_adi: str

class BirimCreate(BaseModel):
    birim_adi: str

@router.get("/urunler")
def get_urunler(db: Session = Depends(get_db)):
    """Tüm aktif ürünleri listele (Tedarikçi alımı için)"""
    urunler = (
        db.query(Urun, Kategori.kategori_adi, Birim.birim_adi, Birim.kisaltma)
        .join(Kategori, Urun.kategori_id == Kategori.id)
        .join(Birim, Urun.birim_id == Birim.id)
        .filter(Urun.durum == "Aktif")
        .order_by(Urun.urun_adi)
        .all()
    )
    
    result = []
    for urun, kategori_adi, birim_adi, birim_kisaltma in urunler:
        result.append({
            "id": urun.id,
            "urun_adi": urun.urun_adi,
            "stok_miktari": urun.stok_miktari,
            "birim_kisaltma": birim_kisaltma or birim_adi,  # kisaltma yoksa birim_adi kullan
            "kategori_adi": kategori_adi
        })
    
    return result

@router.get("/urunler-detay", response_model=List[UrunResponse])
def get_urunler_detay(db: Session = Depends(get_db)):
    """Tüm aktif ürünleri detaylı listele (Stok yönetimi için)"""
    urunler = (
        db.query(Urun, Kategori.kategori_adi, Birim.birim_adi)
        .join(Kategori, Urun.kategori_id == Kategori.id)
        .join(Birim, Urun.birim_id == Birim.id)
        .filter(Urun.durum == "Aktif")
        .order_by(Urun.urun_adi)
        .all()
    )
    
    result = []
    for urun, kategori_adi, birim_adi in urunler:
        result.append(UrunResponse(
            id=urun.id,
            urun_adi=urun.urun_adi,
            barkod=urun.barkod,
            kategori_id=urun.kategori_id,
            kategori_adi=kategori_adi,
            birim_id=urun.birim_id,
            birim_adi=birim_adi,
            birim_kisaltma=birim_adi,  # birim_adi'yi kisaltma olarak kullan
            stok_miktari=urun.stok_miktari,
            minimum_stok=urun.minimum_stok,
            durum=urun.durum
        ))
    
    return result

@router.post("/urunler", response_model=UrunResponse)
def create_urun(urun: UrunCreate, db: Session = Depends(get_db)):
    """Yeni ürün oluştur"""
    
    # Kategori ve birim kontrol
    kategori = db.query(Kategori).filter(Kategori.id == urun.kategori_id).first()
    if not kategori:
        raise HTTPException(status_code=404, detail="Kategori bulunamadı")
    
    birim = db.query(Birim).filter(Birim.id == urun.birim_id).first()
    if not birim:
        raise HTTPException(status_code=404, detail="Birim bulunamadı")
    
    # Barkod kontrolü - boş string'i None'a çevir
    if urun.barkod == "":
        urun.barkod = None
    
    if urun.barkod:
        existing = db.query(Urun).filter(Urun.barkod == urun.barkod).first()
        if existing:
            raise HTTPException(status_code=400, detail="Bu barkod zaten kullanılıyor")
    
    db_urun = Urun(**urun.dict())
    db.add(db_urun)
    db.commit()
    db.refresh(db_urun)
    
    return UrunResponse(
        id=db_urun.id,
        urun_adi=db_urun.urun_adi,
        barkod=db_urun.barkod,
        kategori_id=db_urun.kategori_id,
        kategori_adi=kategori.kategori_adi,
        birim_id=db_urun.birim_id,
        birim_adi=birim.birim_adi,
        birim_kisaltma=birim.birim_adi,
        stok_miktari=db_urun.stok_miktari,
        minimum_stok=db_urun.minimum_stok,
        durum=db_urun.durum
    )

@router.put("/urunler-detay/{urun_id}", response_model=UrunResponse)
def update_urun(urun_id: int, urun: UrunUpdate, db: Session = Depends(get_db)):
    """Ürün güncelle"""
    db_urun = db.query(Urun).filter(Urun.id == urun_id).first()
    if not db_urun:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    
    update_data = urun.dict(exclude_unset=True)
    
    # Barkod kontrolü - boş string'i None'a çevir
    if 'barkod' in update_data and update_data['barkod'] == "":
        update_data['barkod'] = None
    
    # Barkod unique kontrolü
    if 'barkod' in update_data and update_data['barkod']:
        existing = db.query(Urun).filter(
            Urun.barkod == update_data['barkod'],
            Urun.id != urun_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Bu barkod zaten kullanılıyor")
    
    for key, value in update_data.items():
        setattr(db_urun, key, value)
    
    db.commit()
    db.refresh(db_urun)
    
    # Response için join yap
    urun_data = (
        db.query(Urun, Kategori.kategori_adi, Birim.birim_adi)
        .join(Kategori, Urun.kategori_id == Kategori.id)
        .join(Birim, Urun.birim_id == Birim.id)
        .filter(Urun.id == urun_id)
        .first()
    )
    
    urun, kategori_adi, birim_adi = urun_data
    
    return UrunResponse(
        id=urun.id,
        urun_adi=urun.urun_adi,
        barkod=urun.barkod,
        kategori_id=urun.kategori_id,
        kategori_adi=kategori_adi,
        birim_id=urun.birim_id,
        birim_adi=birim_adi,
        birim_kisaltma=birim_adi,
        stok_miktari=urun.stok_miktari,
        minimum_stok=urun.minimum_stok,
        durum=urun.durum
    )

@router.delete("/urunler-detay/{urun_id}")
def delete_urun(urun_id: int, db: Session = Depends(get_db)):
    """Ürün sil"""
    db_urun = db.query(Urun).filter(Urun.id == urun_id).first()
    if not db_urun:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    
    # Stok hareketi var mı kontrol et
    hareket_count = db.query(StokHareket).filter(StokHareket.urun_id == urun_id).count()
    if hareket_count > 0:
        raise HTTPException(
            status_code=400, 
            detail="Bu ürünün stok hareketleri olduğu için silinemez. Durumunu 'Pasif' yapabilirsiniz."
        )
    
    db.delete(db_urun)
    db.commit()
    
    return {"message": "Ürün başarıyla silindi"}

@router.post("/hareket", response_model=StokHareketResponse)
def create_stok_hareket(hareket: StokHareketCreate, db: Session = Depends(get_db)):
    """Stok hareketi oluştur"""
    
    # Ürün kontrol
    urun = db.query(Urun).filter(Urun.id == hareket.urun_id).first()
    if not urun:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    
    # Hareket tipi kontrol
    if hareket.hareket_tipi not in ["Giriş", "Çıkış"]:
        raise HTTPException(status_code=400, detail="Hareket tipi 'Giriş' veya 'Çıkış' olmalıdır")
    
    # Miktar kontrol
    if hareket.miktar <= 0:
        raise HTTPException(status_code=400, detail="Miktar sıfırdan büyük olmalıdır")
    
    # Çıkış için stok kontrolü
    if hareket.hareket_tipi == "Çıkış" and urun.stok_miktari < hareket.miktar:
        raise HTTPException(
            status_code=400, 
            detail=f"Yetersiz stok! Mevcut: {urun.stok_miktari}, İstenen: {hareket.miktar}"
        )
    
    # Hareket tipi enum'a çevir
    hareket_tipi_enum = HareketTipi.GIRIS if hareket.hareket_tipi == "Giriş" else HareketTipi.CIKIS
    
    # Stok hareket oluştur
    db_hareket = StokHareket(
        urun_id=hareket.urun_id,
        hareket_tipi=hareket_tipi_enum,
        miktar=hareket.miktar,
        aciklama=hareket.aciklama
    )
    db.add(db_hareket)
    
    # Stok güncelle
    if hareket.hareket_tipi == "Giriş":
        urun.stok_miktari += hareket.miktar
    else:  # Çıkış
        urun.stok_miktari -= hareket.miktar
    
    db.commit()
    db.refresh(db_hareket)
    
    return StokHareketResponse(
        id=db_hareket.id,
        urun_id=db_hareket.urun_id,
        urun_adi=urun.urun_adi,
        hareket_tipi=db_hareket.hareket_tipi.value,
        miktar=db_hareket.miktar,
        aciklama=db_hareket.aciklama,
        tarih=db_hareket.tarih
    )

@router.get("/hareketler", response_model=List[StokHareketResponse])
def get_stok_hareketler(db: Session = Depends(get_db)):
    """Tüm stok hareketlerini listele"""
    hareketler = (
        db.query(StokHareket, Urun.urun_adi)
        .join(Urun, StokHareket.urun_id == Urun.id)
        .order_by(desc(StokHareket.tarih))
        .all()
    )
    
    result = []
    for hareket, urun_adi in hareketler:
        result.append(StokHareketResponse(
            id=hareket.id,
            urun_id=hareket.urun_id,
            urun_adi=urun_adi,
            hareket_tipi=hareket.hareket_tipi.value,
            miktar=hareket.miktar,
            aciklama=hareket.aciklama,
            tarih=hareket.tarih
        ))
    
    return result

@router.get("/hareketler/{urun_id}", response_model=List[StokHareketResponse])
def get_urun_hareketler(urun_id: int, db: Session = Depends(get_db)):
    """Belirli ürünün stok hareketlerini listele"""
    hareketler = (
        db.query(StokHareket, Urun.urun_adi)
        .join(Urun, StokHareket.urun_id == Urun.id)
        .filter(StokHareket.urun_id == urun_id)
        .order_by(desc(StokHareket.tarih))
        .all()
    )
    
    result = []
    for hareket, urun_adi in hareketler:
        result.append(StokHareketResponse(
            id=hareket.id,
            urun_id=hareket.urun_id,
            urun_adi=urun_adi,
            hareket_tipi=hareket.hareket_tipi.value,
            miktar=hareket.miktar,
            aciklama=hareket.aciklama,
            tarih=hareket.tarih
        ))
    
    return result

@router.get("/kritik-stoklar", response_model=List[UrunResponse])
def get_kritik_stoklar(db: Session = Depends(get_db)):
    """Minimum stok seviyesinin altındaki ürünleri listele"""
    urunler = (
        db.query(Urun, Kategori.kategori_adi, Birim.birim_adi)
        .join(Kategori, Urun.kategori_id == Kategori.id)
        .join(Birim, Urun.birim_id == Birim.id)
        .filter(Urun.stok_miktari <= Urun.minimum_stok)
        .filter(Urun.durum == "Aktif")
        .order_by(Urun.stok_miktari)
        .all()
    )
    
    result = []
    for urun, kategori_adi, birim_adi in urunler:
        result.append(UrunResponse(
            id=urun.id,
            urun_adi=urun.urun_adi,
            barkod=urun.barkod,
            kategori_id=urun.kategori_id,
            kategori_adi=kategori_adi,
            birim_id=urun.birim_id,
            birim_adi=birim_adi,
            birim_kisaltma=birim_adi,  # birim_adi'yi kisaltma olarak kullan
            stok_miktari=urun.stok_miktari,
            minimum_stok=urun.minimum_stok,
            durum=urun.durum
        ))
    
    return result

@router.get("/kategoriler")
def get_kategoriler(db: Session = Depends(get_db)):
    """Tüm kategorileri listele"""
    return db.query(Kategori).all()

@router.post("/kategoriler")
def create_kategori(kategori: KategoriCreate, db: Session = Depends(get_db)):
    """Yeni kategori oluştur"""
    # Kategori adı kontrolü
    existing = db.query(Kategori).filter(Kategori.kategori_adi == kategori.kategori_adi).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu kategori adı zaten kullanılıyor")
    
    db_kategori = Kategori(**kategori.dict())
    db.add(db_kategori)
    db.commit()
    db.refresh(db_kategori)
    
    return db_kategori

@router.get("/birimler")
def get_birimler(db: Session = Depends(get_db)):
    """Tüm birimleri listele"""
    return db.query(Birim).all()

@router.post("/birimler")
def create_birim(birim: BirimCreate, db: Session = Depends(get_db)):
    """Yeni birim oluştur"""
    # Birim adı kontrolü
    existing = db.query(Birim).filter(Birim.birim_adi == birim.birim_adi).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu birim adı zaten kullanılıyor")
    

    
    db_birim = Birim(**birim.dict())
    db.add(db_birim)
    db.commit()
    db.refresh(db_birim)
    
    return db_birim 