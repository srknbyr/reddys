from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from models import CariTipi, OdemeTipi, HareketTipi

# CARİ HESAP ŞEMALARI
class CariHesapBase(BaseModel):
    hesap_adi: str
    tipi: CariTipi
    telefon: Optional[str] = None
    email: Optional[str] = None
    adres: Optional[str] = None
    vergi_no: Optional[str] = None
    durum: str = "Aktif"

class CariHesapCreate(CariHesapBase):
    pass

class CariHesapUpdate(BaseModel):
    hesap_adi: Optional[str] = None
    telefon: Optional[str] = None
    email: Optional[str] = None
    adres: Optional[str] = None
    vergi_no: Optional[str] = None
    durum: Optional[str] = None

class CariHesap(CariHesapBase):
    id: int
    bakiye: float
    olusturma_tarihi: datetime
    son_hareket_tarihi: datetime
    
    class Config:
        from_attributes = True

# CARİ HAREKET ŞEMALARI
class CariHareketBase(BaseModel):
    cari_hesap_id: int
    hareket_tipi: str  # "Borç" veya "Alacak"
    tutar: float
    odeme_tipi: OdemeTipi  # Nakit, Kart, Transfer vs.
    hareket_tarihi: datetime  # İşlemin gerçekleştiği tarih
    aciklama: Optional[str] = None

class CariHareketCreate(CariHareketBase):
    pass

class CariHareket(CariHareketBase):
    id: int
    tarih: datetime  # Kayıt tarihi
    cari_hesap: Optional[CariHesap] = None
    
    class Config:
        from_attributes = True

# STOK ŞEMALARI
class KategoriBase(BaseModel):
    kategori_adi: str
    aciklama: Optional[str] = None

class KategoriCreate(KategoriBase):
    pass

class Kategori(KategoriBase):
    id: int
    olusturma_tarihi: datetime
    
    class Config:
        from_attributes = True

class BirimBase(BaseModel):
    birim_adi: str
    aciklama: Optional[str] = None

class BirimCreate(BirimBase):
    pass

class Birim(BirimBase):
    id: int
    olusturma_tarihi: datetime
    
    class Config:
        from_attributes = True

class UrunBase(BaseModel):
    urun_adi: str
    barkod: Optional[str] = None
    kategori_id: int
    birim_id: int
    minimum_stok: float = 0.0
    durum: str = "Aktif"

class UrunCreate(UrunBase):
    pass

class UrunUpdate(BaseModel):
    urun_adi: Optional[str] = None
    barkod: Optional[str] = None
    kategori_id: Optional[int] = None
    birim_id: Optional[int] = None
    minimum_stok: Optional[float] = None
    durum: Optional[str] = None

class Urun(UrunBase):
    id: int
    stok_miktari: float
    olusturma_tarihi: datetime
    kategori: Optional[Kategori] = None
    birim: Optional[Birim] = None
    
    class Config:
        from_attributes = True

class StokHareketBase(BaseModel):
    urun_id: int
    hareket_tipi: HareketTipi
    miktar: float
    aciklama: Optional[str] = None

class StokHareketCreate(StokHareketBase):
    pass

class StokHareket(StokHareketBase):
    id: int
    tarih: datetime
    urun: Optional[Urun] = None
    
    class Config:
        from_attributes = True

# KASA ŞEMALARI
class KasaHareketBase(BaseModel):
    hareket_tipi: HareketTipi
    kategori: str
    alt_kategori: Optional[str] = None  # Artık string olarak
    odeme_tipi: OdemeTipi
    tutar: float
    aciklama: Optional[str] = None

class KasaHareketCreate(KasaHareketBase):
    pass

class KasaHareket(KasaHareketBase):
    id: int
    tarih: datetime
    
    class Config:
        from_attributes = True

# ALT KATEGORİ ŞEMALARI
class AltKategoriBase(BaseModel):
    kategori_adi: str
    kategori_tipi: str  # "gider", "banka", "yemek_ceki", "nakit"
    aciklama: Optional[str] = None

class AltKategoriCreate(AltKategoriBase):
    pass

class AltKategori(AltKategoriBase):
    id: int
    olusturma_tarihi: datetime
    
    class Config:
        from_attributes = True 