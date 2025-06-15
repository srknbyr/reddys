from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Enum, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

Base = declarative_base()

# ENUM'LAR
class CariTipi(enum.Enum):
    MUSTERI = "Müşteri"
    TEDARIKCI = "Tedarikçi"

class OdemeTipi(enum.Enum):
    NAKIT = "Nakit"
    KART = "Kart"
    TRANSFER = "Transfer"
    YEMEK_CEKI = "Yemek Çeki"
    SATIN_ALMA = "Satın Alma"

class HareketTipi(enum.Enum):
    GIRIS = "Giriş"
    CIKIS = "Çıkış"

# 1. CARİ HESAPLAR
class CariHesap(Base):
    __tablename__ = "cari_hesaplar"
    
    id = Column(Integer, primary_key=True, index=True)
    hesap_adi = Column(String, index=True)
    tipi = Column(Enum(CariTipi))
    bakiye = Column(Float, default=0.0)
    telefon = Column(String, nullable=True)
    email = Column(String, nullable=True)
    adres = Column(Text, nullable=True)
    vergi_no = Column(String, nullable=True)
    durum = Column(String, default="Aktif")
    olusturma_tarihi = Column(DateTime(timezone=True), server_default=func.now())
    son_hareket_tarihi = Column(DateTime(timezone=True), server_default=func.now())
    
    # İlişkiler
    cari_hareketler = relationship("CariHareket", back_populates="cari_hesap")

# 2. STOK YÖNETİMİ
class Kategori(Base):
    __tablename__ = "kategoriler"
    
    id = Column(Integer, primary_key=True, index=True)
    kategori_adi = Column(String, unique=True, index=True)
    aciklama = Column(Text, nullable=True)
    olusturma_tarihi = Column(DateTime(timezone=True), server_default=func.now())
    
    # İlişkiler
    urunler = relationship("Urun", back_populates="kategori")

class Birim(Base):
    __tablename__ = "birimler"
    
    id = Column(Integer, primary_key=True, index=True)
    birim_adi = Column(String, unique=True, index=True)
    kisaltma = Column(String, nullable=True)
    aciklama = Column(Text, nullable=True)
    olusturma_tarihi = Column(DateTime(timezone=True), server_default=func.now())
    
    # İlişkiler
    urunler = relationship("Urun", back_populates="birim")

class Urun(Base):
    __tablename__ = "urunler"
    
    id = Column(Integer, primary_key=True, index=True)
    urun_adi = Column(String, index=True)
    barkod = Column(String, unique=True, nullable=True)
    kategori_id = Column(Integer, ForeignKey("kategoriler.id"))
    birim_id = Column(Integer, ForeignKey("birimler.id"))
    stok_miktari = Column(Float, default=0.0)
    minimum_stok = Column(Float, default=0.0)
    durum = Column(String, default="Aktif")
    olusturma_tarihi = Column(DateTime(timezone=True), server_default=func.now())
    
    # İlişkiler
    kategori = relationship("Kategori", back_populates="urunler")
    birim = relationship("Birim", back_populates="urunler")
    stok_hareketleri = relationship("StokHareket", back_populates="urun")

class StokHareket(Base):
    __tablename__ = "stok_hareketler"
    
    id = Column(Integer, primary_key=True, index=True)
    urun_id = Column(Integer, ForeignKey("urunler.id"))
    hareket_tipi = Column(Enum(HareketTipi))
    miktar = Column(Float)
    aciklama = Column(Text, nullable=True)
    tarih = Column(DateTime(timezone=True), server_default=func.now())
    
    # İlişkiler
    urun = relationship("Urun", back_populates="stok_hareketleri")

# 4. CARİ HAREKET
class CariHareket(Base):
    __tablename__ = "cari_hareketler"
    
    id = Column(Integer, primary_key=True, index=True)
    cari_hesap_id = Column(Integer, ForeignKey("cari_hesaplar.id"))
    hareket_tipi = Column(String)  # Borç, Alacak
    tutar = Column(Float)
    odeme_tipi = Column(Enum(OdemeTipi))  # Nakit, Kart, Transfer vs.
    hareket_tarihi = Column(DateTime(timezone=True))  # İşlemin gerçekleştiği tarih
    aciklama = Column(Text, nullable=True)
    tarih = Column(DateTime(timezone=True), server_default=func.now())  # Kayıt tarihi
    
    # İlişkiler
    cari_hesap = relationship("CariHesap", back_populates="cari_hareketler")

# 5. ALT KATEGORİLER (Gider, Banka, Yemek Çeki vb.)
class AltKategori(Base):
    __tablename__ = "alt_kategoriler"
    
    id = Column(Integer, primary_key=True, index=True)
    kategori_adi = Column(String, index=True)
    kategori_tipi = Column(String)  # "gider", "banka", "yemek_ceki", "nakit"
    aciklama = Column(Text, nullable=True)
    olusturma_tarihi = Column(DateTime(timezone=True), server_default=func.now())

# 6. KASA YÖNETİMİ
class KasaHareket(Base):
    __tablename__ = "kasa_hareketler"
    
    id = Column(Integer, primary_key=True, index=True)
    hareket_tipi = Column(Enum(HareketTipi))
    kategori = Column(String)  # Satış, Gider, Alım, Tahsilat
    alt_kategori_id = Column(Integer, ForeignKey("alt_kategoriler.id"), nullable=True)
    cari_hesap_id = Column(Integer, ForeignKey("cari_hesaplar.id"), nullable=True)
    odeme_tipi = Column(String)  # Nakit, Kart, Yemek Çeki, Transfer
    alt_odeme_tipi_id = Column(Integer, ForeignKey("alt_kategoriler.id"), nullable=True)  # Banka, yemek çeki firması vs.
    tutar = Column(Float)
    aciklama = Column(Text, nullable=True)
    tarih = Column(DateTime(timezone=True), server_default=func.now())
    gunsonu_tarihi = Column(DateTime(timezone=True), nullable=True)  # Günsonu yapıldığında set edilir
    periyot_id = Column(Integer, ForeignKey("gunluk_kasa_ozeti.id"), nullable=True)  # ✅ YENİ: Hangi periyoda ait
    
    # İlişkiler
    alt_kategori = relationship("AltKategori", foreign_keys=[alt_kategori_id])
    alt_odeme_tipi = relationship("AltKategori", foreign_keys=[alt_odeme_tipi_id])
    cari_hesap = relationship("CariHesap")
    periyot = relationship("GunlukKasaOzeti", back_populates="hareketler")

class GunlukKasaOzeti(Base):
    __tablename__ = "gunluk_kasa_ozeti"
    
    id = Column(Integer, primary_key=True, index=True)
    tarih = Column(DateTime(timezone=True), unique=True, index=True)
    acilis_bakiye = Column(Float, default=0.0)
    nakit_satis = Column(Float, default=0.0)
    kart_satis = Column(Float, default=0.0)
    yemek_ceki_satis = Column(Float, default=0.0)
    transfer_satis = Column(Float, default=0.0)
    toplam_satis = Column(Float, default=0.0)
    toplam_gider = Column(Float, default=0.0)
    kapanış_bakiye = Column(Float, nullable=True)
    yeni_gun_baslatildi = Column(Boolean, default=False)
    olusturma_tarihi = Column(DateTime(timezone=True), server_default=func.now())
    
    # İlişkiler
    hareketler = relationship("KasaHareket", back_populates="periyot") 