from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, text, and_, or_
from datetime import datetime, timedelta, date
from typing import Optional, List, Dict, Any
import calendar

from database import get_db
from models import KasaHareket, GunlukKasaOzeti, CariHareket, CariHesap, AltKategori, HareketTipi, OdemeTipi

router = APIRouter(prefix="/analiz", tags=["Analiz ve Raporlama"])

# ================================
# SATIŞ ANALİZİ ENDPOINT'LEİ
# ================================

@router.get("/satis/ozet")
async def satis_ozeti(
    baslangic_tarihi: Optional[str] = Query(None, description="YYYY-MM-DD formatında"),
    bitis_tarihi: Optional[str] = Query(None, description="YYYY-MM-DD formatında"),
    db: Session = Depends(get_db)
):
    """
    Satış özeti - Ödeme tipi bazında toplam satışlar
    """
    try:
        # Tarih filtresi
        query = db.query(KasaHareket).filter(
            KasaHareket.kategori == "Satış",
            KasaHareket.hareket_tipi == HareketTipi.GIRIS
        )
        
        if baslangic_tarihi:
            baslangic = datetime.strptime(baslangic_tarihi, "%Y-%m-%d")
            query = query.filter(KasaHareket.tarih >= baslangic)
        
        if bitis_tarihi:
            bitis = datetime.strptime(bitis_tarihi, "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(KasaHareket.tarih < bitis)
        
        # Ödeme tipi bazında grupla
        result = query.with_entities(
            KasaHareket.odeme_tipi,
            func.sum(KasaHareket.tutar).label('toplam'),
            func.count(KasaHareket.id).label('adet')
        ).group_by(KasaHareket.odeme_tipi).all()
        
        # Toplam satış
        toplam_satis = sum([r.toplam for r in result])
        
        # Formatla
        satis_data = []
        for r in result:
            satis_data.append({
                "odeme_tipi": r.odeme_tipi,
                "toplam": round(r.toplam, 2),
                "adet": r.adet,
                "yuzde": round((r.toplam / toplam_satis * 100), 2) if toplam_satis > 0 else 0
            })
        
        return {
            "toplam_satis": round(toplam_satis, 2),
            "odeme_tipi_bazinda": satis_data,
            "tarih_araligi": {
                "baslangic": baslangic_tarihi,
                "bitis": bitis_tarihi
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Satış özeti hesaplanırken hata: {str(e)}")

@router.get("/satis/gunluk")
async def gunluk_satis_trendi(
    gun_sayisi: int = Query(30, description="Kaç günlük veri"),
    baslangic_tarihi: Optional[str] = Query(None, description="YYYY-MM-DD formatında"),
    bitis_tarihi: Optional[str] = Query(None, description="YYYY-MM-DD formatında"),
    db: Session = Depends(get_db)
):
    """
    Günlük satış trendi - Tarih aralığı veya son N gün
    """
    try:
        # Tarih filtresi belirleme
        if baslangic_tarihi and bitis_tarihi:
            # Özel tarih aralığı kullan
            baslangic = datetime.strptime(baslangic_tarihi, "%Y-%m-%d")
            bitis = datetime.strptime(bitis_tarihi, "%Y-%m-%d") + timedelta(days=1)
        else:
            # Varsayılan: Son N gün
            baslangic = datetime.now() - timedelta(days=gun_sayisi)
            bitis = datetime.now()
        
        # Günlük satışları al
        result = db.query(
            func.date(KasaHareket.tarih).label('tarih'),
            func.sum(KasaHareket.tutar).label('toplam_satis')
        ).filter(
            KasaHareket.kategori == "Satış",
            KasaHareket.hareket_tipi == HareketTipi.GIRIS,
            KasaHareket.tarih >= baslangic,
            KasaHareket.tarih < bitis
        ).group_by(func.date(KasaHareket.tarih)).order_by(func.date(KasaHareket.tarih)).all()
        
        # Formatla
        gunluk_data = []
        for r in result:
            # r.tarih bir date objesi, datetime'a çevirmemiz gerekiyor
            if isinstance(r.tarih, str):
                tarih_obj = datetime.strptime(r.tarih, "%Y-%m-%d").date()
            else:
                tarih_obj = r.tarih
            
            gunluk_data.append({
                "tarih": tarih_obj.strftime("%Y-%m-%d"),
                "tarih_tr": tarih_obj.strftime("%d.%m.%Y"),
                "gun_adi": calendar.day_name[tarih_obj.weekday()],
                "toplam_satis": round(r.toplam_satis, 2)
            })
        
        # İstatistikler
        if gunluk_data:
            toplam_satis = sum([d['toplam_satis'] for d in gunluk_data])
            ortalama_satis = toplam_satis / len(gunluk_data)
            en_yuksek_gun = max(gunluk_data, key=lambda x: x['toplam_satis'])
            en_dusuk_gun = min(gunluk_data, key=lambda x: x['toplam_satis'])
        else:
            toplam_satis = ortalama_satis = 0
            en_yuksek_gun = en_dusuk_gun = None
        
        return {
            "gunluk_veriler": gunluk_data,
            "istatistikler": {
                "toplam_satis": round(toplam_satis, 2),
                "ortalama_gunluk_satis": round(ortalama_satis, 2),
                "en_yuksek_gun": en_yuksek_gun,
                "en_dusuk_gun": en_dusuk_gun,
                "gun_sayisi": len(gunluk_data)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Günlük satış trendi hesaplanırken hata: {str(e)}")

@router.get("/satis/aylik")
async def aylik_satis_trendi(
    ay_sayisi: int = Query(12, description="Kaç aylık veri"),
    baslangic_tarihi: Optional[str] = Query(None, description="YYYY-MM-DD formatında"),
    bitis_tarihi: Optional[str] = Query(None, description="YYYY-MM-DD formatında"),
    db: Session = Depends(get_db)
):
    """
    Aylık satış trendi - Tarih aralığı veya son N ay
    """
    try:
        # Tarih filtresi belirleme
        if baslangic_tarihi and bitis_tarihi:
            # Özel tarih aralığı kullan
            baslangic = datetime.strptime(baslangic_tarihi, "%Y-%m-%d")
            bitis = datetime.strptime(bitis_tarihi, "%Y-%m-%d") + timedelta(days=1)
        else:
            # Varsayılan: Son N ay
            baslangic = datetime.now() - timedelta(days=ay_sayisi * 30)
            bitis = datetime.now()
        
        # Aylık satışları al
        result = db.query(
            func.extract('year', KasaHareket.tarih).label('yil'),
            func.extract('month', KasaHareket.tarih).label('ay'),
            func.sum(KasaHareket.tutar).label('toplam_satis')
        ).filter(
            KasaHareket.kategori == "Satış",
            KasaHareket.hareket_tipi == HareketTipi.GIRIS,
            KasaHareket.tarih >= baslangic,
            KasaHareket.tarih < bitis
        ).group_by(
            func.extract('year', KasaHareket.tarih),
            func.extract('month', KasaHareket.tarih)
        ).order_by(
            func.extract('year', KasaHareket.tarih),
            func.extract('month', KasaHareket.tarih)
        ).all()
        
        # Formatla
        aylik_data = []
        for r in result:
            ay_adi = calendar.month_name[int(r.ay)]
            aylik_data.append({
                "yil": int(r.yil),
                "ay": int(r.ay),
                "ay_adi": ay_adi,
                "ay_yil": f"{ay_adi} {int(r.yil)}",
                "toplam_satis": round(r.toplam_satis, 2)
            })
        
        return {
            "aylik_veriler": aylik_data,
            "toplam_ay_sayisi": len(aylik_data)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Aylık satış trendi hesaplanırken hata: {str(e)}")

# ================================
# GİDER ANALİZİ ENDPOINT'LEİ  
# ================================

@router.get("/gider/gunluk")
async def gunluk_gider_trendi(
    gun_sayisi: int = Query(30, description="Kaç günlük veri"),
    baslangic_tarihi: Optional[str] = Query(None, description="YYYY-MM-DD formatında"),
    bitis_tarihi: Optional[str] = Query(None, description="YYYY-MM-DD formatında"),
    db: Session = Depends(get_db)
):
    """
    Günlük gider trendi - Tarih aralığı veya son N gün
    """
    try:
        # Tarih filtresi belirleme
        if baslangic_tarihi and bitis_tarihi:
            # Özel tarih aralığı kullan
            baslangic = datetime.strptime(baslangic_tarihi, "%Y-%m-%d")
            bitis = datetime.strptime(bitis_tarihi, "%Y-%m-%d") + timedelta(days=1)
        else:
            # Varsayılan: Son N gün
            baslangic = datetime.now() - timedelta(days=gun_sayisi)
            bitis = datetime.now()
        
        # Günlük giderleri al
        result = db.query(
            func.date(KasaHareket.tarih).label('tarih'),
            func.sum(KasaHareket.tutar).label('toplam_gider')
        ).filter(
            KasaHareket.kategori == "Gider",
            KasaHareket.hareket_tipi == HareketTipi.CIKIS,
            KasaHareket.tarih >= baslangic,
            KasaHareket.tarih < bitis
        ).group_by(func.date(KasaHareket.tarih)).order_by(func.date(KasaHareket.tarih)).all()
        
        # Formatla
        gunluk_data = []
        for r in result:
            # r.tarih bir date objesi, datetime'a çevirmemiz gerekiyor
            if isinstance(r.tarih, str):
                tarih_obj = datetime.strptime(r.tarih, "%Y-%m-%d").date()
            else:
                tarih_obj = r.tarih
            
            gunluk_data.append({
                "tarih": tarih_obj.strftime("%Y-%m-%d"),
                "tarih_tr": tarih_obj.strftime("%d.%m.%Y"),
                "gun_adi": calendar.day_name[tarih_obj.weekday()],
                "toplam_gider": round(r.toplam_gider, 2)
            })
        
        # İstatistikler
        if gunluk_data:
            toplam_gider = sum([d['toplam_gider'] for d in gunluk_data])
            ortalama_gider = toplam_gider / len(gunluk_data)
            en_yuksek_gun = max(gunluk_data, key=lambda x: x['toplam_gider'])
            en_dusuk_gun = min(gunluk_data, key=lambda x: x['toplam_gider'])
        else:
            toplam_gider = ortalama_gider = 0
            en_yuksek_gun = en_dusuk_gun = None
        
        return {
            "gunluk_veriler": gunluk_data,
            "istatistikler": {
                "toplam_gider": round(toplam_gider, 2),
                "ortalama_gunluk_gider": round(ortalama_gider, 2),
                "en_yuksek_gun": en_yuksek_gun,
                "en_dusuk_gun": en_dusuk_gun,
                "gun_sayisi": len(gunluk_data)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Günlük gider trendi hesaplanırken hata: {str(e)}")

@router.get("/gider/ozet")
async def gider_ozeti(
    baslangic_tarihi: Optional[str] = Query(None, description="YYYY-MM-DD formatında"),
    bitis_tarihi: Optional[str] = Query(None, description="YYYY-MM-DD formatında"),
    db: Session = Depends(get_db)
):
    """
    Gider özeti - Kategori bazında toplam giderler
    """
    try:
        # Tarih filtresi
        query = db.query(KasaHareket).filter(
            KasaHareket.kategori == "Gider",
            KasaHareket.hareket_tipi == HareketTipi.CIKIS
        )
        
        if baslangic_tarihi:
            baslangic = datetime.strptime(baslangic_tarihi, "%Y-%m-%d")
            query = query.filter(KasaHareket.tarih >= baslangic)
        
        if bitis_tarihi:
            bitis = datetime.strptime(bitis_tarihi, "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(KasaHareket.tarih < bitis)
        
        # Alt kategori bazında grupla
        result = query.join(AltKategori, KasaHareket.alt_kategori_id == AltKategori.id, isouter=True)\
                     .with_entities(
                         AltKategori.kategori_adi.label('kategori_adi'),
                         func.sum(KasaHareket.tutar).label('toplam'),
                         func.count(KasaHareket.id).label('adet')
                     ).group_by(AltKategori.kategori_adi).all()
        
        # Toplam gider
        toplam_gider = sum([r.toplam for r in result])
        
        # Formatla
        gider_data = []
        for r in result:
            kategori_adi = r.kategori_adi if r.kategori_adi else "Diğer"
            gider_data.append({
                "kategori": kategori_adi,
                "toplam": round(r.toplam, 2),
                "adet": r.adet,
                "yuzde": round((r.toplam / toplam_gider * 100), 2) if toplam_gider > 0 else 0
            })
        
        return {
            "toplam_gider": round(toplam_gider, 2),
            "kategori_bazinda": gider_data,
            "tarih_araligi": {
                "baslangic": baslangic_tarihi,
                "bitis": bitis_tarihi
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gider özeti hesaplanırken hata: {str(e)}")

# ================================
# KASA PERFORMANSI ENDPOINT'LEİ
# ================================

@router.get("/kasa/gunluk-ozet")
async def kasa_gunluk_ozet(
    gun_sayisi: int = Query(30, description="Kaç günlük veri"),
    baslangic_tarihi: Optional[str] = Query(None, description="YYYY-MM-DD formatında"),
    bitis_tarihi: Optional[str] = Query(None, description="YYYY-MM-DD formatında"),
    db: Session = Depends(get_db)
):
    """
    Günlük kasa özet performansı - Tarih aralığı veya son N gün
    """
    try:
        # Tarih filtresi belirleme
        if baslangic_tarihi and bitis_tarihi:
            # Özel tarih aralığı kullan
            baslangic = datetime.strptime(baslangic_tarihi, "%Y-%m-%d")
            bitis = datetime.strptime(bitis_tarihi, "%Y-%m-%d") + timedelta(days=1)
        else:
            # Varsayılan: Son N gün
            baslangic = datetime.now() - timedelta(days=gun_sayisi)
            bitis = datetime.now()
        
        result = db.query(GunlukKasaOzeti).filter(
            GunlukKasaOzeti.tarih >= baslangic,
            GunlukKasaOzeti.tarih < bitis
        ).order_by(GunlukKasaOzeti.tarih.desc()).all()
        
        # Formatla
        ozet_data = []
        for ozet in result:
            ozet_data.append({
                "tarih": ozet.tarih.strftime("%Y-%m-%d"),
                "tarih_tr": ozet.tarih.strftime("%d.%m.%Y"),
                "acilis_bakiye": round(ozet.acilis_bakiye, 2),
                "nakit_satis": round(ozet.nakit_satis, 2),
                "kart_satis": round(ozet.kart_satis, 2),
                "yemek_ceki_satis": round(ozet.yemek_ceki_satis, 2),
                "transfer_satis": round(ozet.transfer_satis, 2),
                "toplam_satis": round(ozet.toplam_satis, 2),
                "toplam_gider": round(ozet.toplam_gider, 2),
                "kapanış_bakiye": round(ozet.kapanış_bakiye, 2) if ozet.kapanış_bakiye else None,
                "net_kar": round(ozet.toplam_satis - ozet.toplam_gider, 2)
            })
        
        return {
            "gunluk_ozetler": ozet_data,
            "toplam_gun": len(ozet_data)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Kasa günlük özet hesaplanırken hata: {str(e)}")

# ================================
# CARİ HESAP ANALİZİ ENDPOINT'LEİ
# ================================

@router.get("/cari/ozet")
async def cari_hesap_ozeti(
    db: Session = Depends(get_db)
):
    """
    Cari hesap analiz özeti
    """
    try:
        # Müşteri/Tedarikçi dağılımı
        cari_dagilim = db.query(
            CariHesap.tipi,
            func.count(CariHesap.id).label('adet'),
            func.sum(CariHesap.bakiye).label('toplam_bakiye')
        ).group_by(CariHesap.tipi).all()
        
        # En yüksek bakiyeli hesaplar
        en_yuksek_bakiye = db.query(CariHesap).order_by(CariHesap.bakiye.desc()).limit(10).all()
        
        # En düşük bakiyeli hesaplar (borçlu olanlar)
        en_dusuk_bakiye = db.query(CariHesap).order_by(CariHesap.bakiye.asc()).limit(10).all()
        
        # Formatla
        dagilim_data = []
        for d in cari_dagilim:
            dagilim_data.append({
                "tip": d.tipi.value,
                "adet": d.adet,
                "toplam_bakiye": round(d.toplam_bakiye, 2)
            })
        
        yuksek_bakiye_data = []
        for hesap in en_yuksek_bakiye:
            yuksek_bakiye_data.append({
                "id": hesap.id,
                "hesap_adi": hesap.hesap_adi,
                "tip": hesap.tipi.value,
                "bakiye": round(hesap.bakiye, 2)
            })
        
        dusuk_bakiye_data = []
        for hesap in en_dusuk_bakiye:
            dusuk_bakiye_data.append({
                "id": hesap.id,
                "hesap_adi": hesap.hesap_adi,
                "tip": hesap.tipi.value,
                "bakiye": round(hesap.bakiye, 2)
            })
        
        return {
            "tip_bazinda_dagilim": dagilim_data,
            "en_yuksek_bakiye": yuksek_bakiye_data,
            "en_dusuk_bakiye": dusuk_bakiye_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cari hesap özeti hesaplanırken hata: {str(e)}")

# ================================
# GENEL ÖZET ENDPOINT'İ
# ================================

@router.get("/genel/kpi")
async def genel_kpi(
    baslangic_tarihi: Optional[str] = Query(None, description="YYYY-MM-DD formatında"),
    bitis_tarihi: Optional[str] = Query(None, description="YYYY-MM-DD formatında"),
    db: Session = Depends(get_db)
):
    """
    Genel KPI'lar ve özet bilgiler - Gelir, Gider, Cari Ödemeler
    """
    try:
        # Tarih filtresi belirleme
        if baslangic_tarihi and bitis_tarihi:
            baslangic = datetime.strptime(baslangic_tarihi, "%Y-%m-%d")
            bitis = datetime.strptime(bitis_tarihi, "%Y-%m-%d") + timedelta(days=1)
        else:
            # Varsayılan: Bu ay
            bugun = datetime.now().date()
            baslangic = datetime.combine(bugun.replace(day=1), datetime.min.time())
            bitis = datetime.now()
        
        # 1. SATIŞLAR (GELİRLER)
        toplam_satis = db.query(func.sum(KasaHareket.tutar)).filter(
            KasaHareket.kategori == "Satış",
            KasaHareket.hareket_tipi == HareketTipi.GIRIS,
            KasaHareket.tarih >= baslangic,
            KasaHareket.tarih < bitis
        ).scalar() or 0
        
        # Ödeme tipi bazında satışlar
        satis_detay = db.query(
            KasaHareket.odeme_tipi,
            func.sum(KasaHareket.tutar).label('toplam')
        ).filter(
            KasaHareket.kategori == "Satış",
            KasaHareket.hareket_tipi == HareketTipi.GIRIS,
            KasaHareket.tarih >= baslangic,
            KasaHareket.tarih < bitis
        ).group_by(KasaHareket.odeme_tipi).all()
        
        # 2. GİDERLER
        toplam_gider = db.query(func.sum(KasaHareket.tutar)).filter(
            KasaHareket.kategori == "Gider",
            KasaHareket.hareket_tipi == HareketTipi.CIKIS,
            KasaHareket.tarih >= baslangic,
            KasaHareket.tarih < bitis
        ).scalar() or 0
        
        # Kategori bazında giderler
        gider_detay = db.query(
            AltKategori.kategori_adi.label('kategori'),
            func.sum(KasaHareket.tutar).label('toplam')
        ).join(
            AltKategori, KasaHareket.alt_kategori_id == AltKategori.id, isouter=True
        ).filter(
            KasaHareket.kategori == "Gider",
            KasaHareket.hareket_tipi == HareketTipi.CIKIS,
            KasaHareket.tarih >= baslangic,
            KasaHareket.tarih < bitis
        ).group_by(AltKategori.kategori_adi).all()
        
        # 3. CARİ ÖDEMELER (Tedarikçilere yapılan ödemeler + Müşterilerden alınan tahsilatlar)
        # Tedarikçi Alacak = Tedarikçiye ödeme yaptık
        # Müşteri Alacak = Müşteriden tahsilat aldık
        cari_odemeler = db.query(func.sum(CariHareket.tutar)).join(
            CariHesap, CariHareket.cari_hesap_id == CariHesap.id
        ).filter(
            CariHareket.hareket_tipi == "Alacak",  # Alacak hareketleri
            CariHareket.hareket_tarihi >= baslangic.date(),
            CariHareket.hareket_tarihi < bitis.date()
        ).scalar() or 0
        
        # Cari ödeme detayları (Alacak hareketleri)
        cari_odeme_detay = db.query(
            CariHareket.odeme_tipi,
            func.sum(CariHareket.tutar).label('toplam')
        ).join(
            CariHesap, CariHareket.cari_hesap_id == CariHesap.id
        ).filter(
            CariHareket.hareket_tipi == "Alacak",  # Alacak hareketleri
            CariHareket.hareket_tarihi >= baslangic.date(),
            CariHareket.hareket_tarihi < bitis.date()
        ).group_by(CariHareket.odeme_tipi).all()
        
        # 4. GENEL BİLGİLER
        toplam_cari = db.query(func.count(CariHesap.id)).scalar() or 0
        toplam_bakiye = db.query(func.sum(CariHesap.bakiye)).scalar() or 0
        
        # Net kar/zarar
        net_kar = toplam_satis - toplam_gider - cari_odemeler
        
        return {
            # Ana KPI'lar
            "toplam_satis": round(toplam_satis, 2),
            "toplam_gider": round(toplam_gider, 2),
            "cari_odemeler": round(cari_odemeler, 2),
            "net_kar": round(net_kar, 2),
            
            # Detaylar
            "satis_detay": [{"tip": s.odeme_tipi, "tutar": round(s.toplam, 2)} for s in satis_detay],
            "gider_detay": [{"kategori": g.kategori or "Diğer", "tutar": round(g.toplam, 2)} for g in gider_detay],
            "cari_odeme_detay": [{"tip": c.odeme_tipi, "tutar": round(c.toplam, 2)} for c in cari_odeme_detay],
            
            # Genel bilgiler
            "toplam_cari_hesap": toplam_cari,
            "toplam_cari_bakiye": round(toplam_bakiye, 2),
            "tarih_araligi": {
                "baslangic": baslangic.strftime("%Y-%m-%d"),
                "bitis": (bitis - timedelta(days=1)).strftime("%Y-%m-%d")
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Genel KPI hesaplanırken hata: {str(e)}") 