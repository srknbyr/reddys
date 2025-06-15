from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import CariHesap, CariTipi
from schemas import CariHesap as CariHesapSchema, CariHesapCreate, CariHesapUpdate

router = APIRouter(prefix="/cari-hesap", tags=["Cari Hesap"])

@router.get("/", response_model=List[CariHesapSchema])
def get_cari_hesaplar(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Tüm cari hesapları listele"""
    cari_hesaplar = db.query(CariHesap).offset(skip).limit(limit).all()
    return cari_hesaplar

@router.get("/{hesap_id}", response_model=CariHesapSchema)
def get_cari_hesap(hesap_id: int, db: Session = Depends(get_db)):
    """Tek cari hesap getir"""
    cari_hesap = db.query(CariHesap).filter(CariHesap.id == hesap_id).first()
    if cari_hesap is None:
        raise HTTPException(status_code=404, detail="Cari hesap bulunamadı")
    return cari_hesap

@router.post("/", response_model=CariHesapSchema)
def create_cari_hesap(cari_hesap: CariHesapCreate, db: Session = Depends(get_db)):
    """Yeni cari hesap oluştur"""
    # Aynı isimde hesap var mı kontrol et
    existing = db.query(CariHesap).filter(CariHesap.hesap_adi == cari_hesap.hesap_adi).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu isimde bir cari hesap zaten mevcut")
    
    db_cari_hesap = CariHesap(**cari_hesap.dict())
    db.add(db_cari_hesap)
    db.commit()
    db.refresh(db_cari_hesap)
    return db_cari_hesap

@router.put("/{hesap_id}", response_model=CariHesapSchema)
def update_cari_hesap(hesap_id: int, cari_hesap: CariHesapUpdate, db: Session = Depends(get_db)):
    """Cari hesap güncelle"""
    db_cari_hesap = db.query(CariHesap).filter(CariHesap.id == hesap_id).first()
    if db_cari_hesap is None:
        raise HTTPException(status_code=404, detail="Cari hesap bulunamadı")
    
    update_data = cari_hesap.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_cari_hesap, field, value)
    
    db.commit()
    db.refresh(db_cari_hesap)
    return db_cari_hesap

@router.delete("/{hesap_id}")
def delete_cari_hesap(hesap_id: int, db: Session = Depends(get_db)):
    """Cari hesap sil"""
    db_cari_hesap = db.query(CariHesap).filter(CariHesap.id == hesap_id).first()
    if db_cari_hesap is None:
        raise HTTPException(status_code=404, detail="Cari hesap bulunamadı")
    
    db.delete(db_cari_hesap)
    db.commit()
    return {"message": "Cari hesap başarıyla silindi"}

@router.get("/tipi/{tipi}", response_model=List[CariHesapSchema])
def get_cari_hesaplar_by_type(tipi: CariTipi, db: Session = Depends(get_db)):
    """Tipine göre cari hesapları getir"""
    cari_hesaplar = db.query(CariHesap).filter(CariHesap.tipi == tipi).all()
    return cari_hesaplar

@router.get("/durum/{durum}", response_model=List[CariHesapSchema])
def get_cari_hesaplar_by_status(durum: str, db: Session = Depends(get_db)):
    """Duruma göre cari hesapları getir"""
    cari_hesaplar = db.query(CariHesap).filter(CariHesap.durum == durum).all()
    return cari_hesaplar 