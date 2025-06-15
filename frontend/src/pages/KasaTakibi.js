import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, IconButton,
  Tooltip, Alert, Snackbar, Divider, List, ListItem, ListItemText,
  ListItemIcon, Autocomplete
} from '@mui/material';
import {
  Add, Delete, AccountBalance, CreditCard, 
  LocalAtm, Restaurant, TrendingUp, TrendingDown,
  Receipt, Payment, MonetizationOn, ShoppingCart, Home
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const KasaTakibi = () => {
  const navigate = useNavigate();
  // State'ler
  const [kasaDurumu, setKasaDurumu] = useState(null);
  const [hareketler, setHareketler] = useState([]);
  const [gelirlerGiderler, setGelirlerGiderler] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [giderKategorileri, setGiderKategorileri] = useState([]);
  const [bankaKategorileri, setBankaKategorileri] = useState([]);
  const [yemekCekiKategorileri, setYemekCekiKategorileri] = useState([]);
  const [nakitKategorileri, setNakitKategorileri] = useState([]);
  const [cariHesaplar, setCariHesaplar] = useState([]);
  const [newCategoryModal, setNewCategoryModal] = useState({ open: false, type: '', title: '' });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedGunsonuTarihi, setSelectedGunsonuTarihi] = useState(null); // Tarih filtresi için
  const [gunsonuTarihleri, setGunsonuTarihleri] = useState([]); // Günsonu tarihleri
  const [gunsonuDurumu, setGunsonuDurumu] = useState(null);
  const [gunsonuModal, setGunsonuModal] = useState(false);
  const [fizikselSayim, setFizikselSayim] = useState('');
  const [sayimAciklama, setSayimAciklama] = useState('');
  const [formData, setFormData] = useState({
    hareket_tipi: 'Giriş',
    kategori: '',
    alt_kategori_id: '',
    odeme_tipi: 'Nakit',
    alt_odeme_tipi_id: '',
    tutar: '',
    aciklama: '',
    tarih: new Date().toISOString().split('T')[0] // Bugünün tarihi varsayılan
  });

  // Sayfa yüklendiğinde verileri çek
  useEffect(() => {
    console.log('🚀 KasaTakibi component yüklendi, fetchAll çağrılıyor');
    fetchAll();
  }, []);

  const fetchAll = async () => {
    await Promise.all([
      fetchKasaDurumu(),
      fetchHareketler(),
      fetchKategoriler(),
      fetchCariHesaplar(),
      fetchGunsonuDurumu(),
      fetchGelirlerGiderler(),
      fetchGunsonuTarihleri()
    ]);
  };

  const fetchKasaDurumu = async () => {
    try {
      const response = await axios.get('http://localhost:8000/kasa/durum');
      setKasaDurumu(response.data);
    } catch (error) {
      console.error('Kasa durumu çekilirken hata:', error);
      showSnackbar('Kasa durumu yüklenemedi', 'error');
    }
  };

  const fetchHareketler = async (gunsonuTarihi = null) => {
    try {
      let url = 'http://localhost:8000/kasa/hareketler-tarihe-gore?limit=100';
      if (gunsonuTarihi) {
        url += `&gunsonu_tarihi=${gunsonuTarihi}`;
      }
      const response = await axios.get(url);
      setHareketler(response.data);
    } catch (error) {
      console.error('Kasa hareketleri çekilirken hata:', error);
      showSnackbar('Kasa hareketleri yüklenemedi', 'error');
    }
  };

  const fetchGunsonuTarihleri = async () => {
    try {
      const response = await axios.get('http://localhost:8000/kasa/gunsonu-tarihleri');
      setGunsonuTarihleri(response.data);
    } catch (error) {
      console.error('Günsonu tarihleri çekilirken hata:', error);
      showSnackbar('Günsonu tarihleri yüklenemedi', 'error');
    }
  };

  const fetchKategoriler = async () => {
    try {
      const [gider, banka, yemekCeki, nakit] = await Promise.all([
        axios.get('http://localhost:8000/kasa/alt-kategoriler/gider'),
        axios.get('http://localhost:8000/kasa/alt-kategoriler/banka'),
        axios.get('http://localhost:8000/kasa/alt-kategoriler/yemek_ceki'),
        axios.get('http://localhost:8000/kasa/alt-kategoriler/nakit')
      ]);
      
      console.log('Çekilen kategoriler:', {
        gider: gider.data,
        banka: banka.data,
        yemekCeki: yemekCeki.data,
        nakit: nakit.data
      });
      
      setGiderKategorileri(gider.data);
      setBankaKategorileri(banka.data);
      setYemekCekiKategorileri(yemekCeki.data);
      setNakitKategorileri(nakit.data);
    } catch (error) {
      console.error('Kategoriler çekilirken hata:', error);
    }
  };

  const fetchCariHesaplar = async () => {
    try {
      const response = await axios.get('http://localhost:8000/kasa/cari-hesaplar');
      console.log('Çekilen cari hesaplar:', response.data);
      setCariHesaplar(response.data);
    } catch (error) {
      console.error('Cari hesaplar çekilirken hata:', error);
    }
  };

  const fetchGunsonuDurumu = async () => {
    try {
      const response = await axios.get('http://localhost:8000/kasa/gunsonu');
      setGunsonuDurumu(response.data);
    } catch (error) {
      console.error('Günsonu durumu çekilirken hata:', error);
    }
  };

  const fetchGelirlerGiderler = async () => {
    console.log('🔍 fetchGelirlerGiderler çağrıldı');
    try {
      console.log('📡 API isteği gönderiliyor: http://localhost:8000/kasa/gelirler-giderler');
      const response = await axios.get('http://localhost:8000/kasa/gelirler-giderler');
      console.log('✅ API yanıtı alındı:', response.data);
      setGelirlerGiderler(response.data);
      console.log('💾 State güncellendi:', response.data);
    } catch (error) {
      console.error('❌ Gelirler-giderler çekilirken hata:', error);
      console.error('❌ Hata detayı:', error.response?.data);
      showSnackbar('Gelirler-giderler yüklenemedi', 'error');
    }
  };

  const handleSubmit = async () => {
    if (!formData.tutar || parseFloat(formData.tutar) <= 0) {
      showSnackbar('Lütfen geçerli bir tutar girin', 'error');
      return;
    }

    // Giriş için kategori validasyonu
    if (formData.hareket_tipi === 'Çıkış' && !formData.alt_kategori_id) {
      showSnackbar('Lütfen gider kategorisi seçin', 'error');
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        // Giriş seçildiğinde kategoriyi otomatik "Satış" yap
        kategori: formData.hareket_tipi === 'Giriş' ? 'Satış' : 'Gider',
        tutar: parseFloat(formData.tutar),
        alt_kategori_id: formData.alt_kategori_id ? Number(formData.alt_kategori_id) : null,
        cari_hesap_id: null, // Yeni mantığa göre cari hesap yok
        alt_odeme_tipi_id: formData.alt_odeme_tipi_id ? Number(formData.alt_odeme_tipi_id) : null
      };
      
      await axios.post('http://localhost:8000/kasa/hareket-yeni', submitData);
      
      showSnackbar('Kasa hareketi başarıyla eklendi', 'success');
      handleClose();
      await fetchAll(); // Verileri yenile
    } catch (error) {
      console.error('Kasa hareketi eklenirken hata:', error);
      showSnackbar('Kasa hareketi eklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (hareketId) => {
    if (!window.confirm('Bu kasa hareketini silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:8000/kasa/hareket/${hareketId}`);
      showSnackbar('Kasa hareketi başarıyla silindi', 'success');
      await fetchAll(); // Verileri yenile
    } catch (error) {
      console.error('Kasa hareketi silinirken hata:', error);
      showSnackbar('Kasa hareketi silinirken hata oluştu', 'error');
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      hareket_tipi: 'Giriş',
      kategori: '',
      alt_kategori_id: '',
      odeme_tipi: 'Nakit',
      alt_odeme_tipi_id: '',
      tutar: '',
      aciklama: '',
      tarih: new Date().toISOString().split('T')[0] // Bugünün tarihi varsayılan
    });
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const openNewCategoryModal = (type, title) => {
    setNewCategoryModal({ open: true, type, title });
    setNewCategoryName('');
  };

  const closeNewCategoryModal = () => {
    setNewCategoryModal({ open: false, type: '', title: '' });
    setNewCategoryName('');
  };

  const handleCreateNewCategory = async () => {
    if (!newCategoryName.trim()) {
      showSnackbar('Lütfen kategori adı girin', 'error');
      return;
    }

    try {
      await axios.post('http://localhost:8000/kasa/alt-kategori', {
        kategori_adi: newCategoryName.trim(),
        kategori_tipi: newCategoryModal.type,
        aciklama: null
      });

      showSnackbar(`${newCategoryModal.title} başarıyla eklendi`, 'success');
      closeNewCategoryModal();
      
      // Kategorileri yenile
      await fetchKategoriler();
    } catch (error) {
      console.error('Kategori eklenemedi:', error);
      showSnackbar('Kategori eklenirken hata oluştu', 'error');
    }
  };

  const handleGunsonuSayim = async () => {
    if (!fizikselSayim || parseFloat(fizikselSayim) < 0) {
      showSnackbar('Lütfen geçerli bir sayım tutarı girin', 'error');
      return;
    }

    try {
      await axios.post('http://localhost:8000/kasa/gunsonu-sayim', {
        fiziksel_nakit: parseFloat(fizikselSayim),
        aciklama: sayimAciklama
      });

      showSnackbar('Günsonu sayımı başarıyla tamamlandı!', 'success');
      setGunsonuModal(false);
      setFizikselSayim('');
      setSayimAciklama('');
      
      // Verileri yenile
      await fetchAll();
    } catch (error) {
      console.error('Günsonu sayımı yapılırken hata:', error);
      showSnackbar(error.response?.data?.detail || 'Günsonu sayımı yapılırken hata oluştu', 'error');
    }
  };

  const handleGunsonuGeriAl = async () => {
    if (!window.confirm('Bugünün günsonu kapanışını geri almak istediğinizden emin misiniz?\n\nBu işlem:\n• Fiziksel sayım hareketlerini silecek\n• Fark düzeltme hareketlerini silecek\n• Günlük özeti silecek\n• Günsonu durumunu tekrar açık yapacak')) {
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/kasa/gunsonu-geri-al');
      
      showSnackbar(response.data.message, 'success');
      
      // Verileri yenile
      await fetchAll();
    } catch (error) {
      console.error('Günsonu geri alınırken hata:', error);
      showSnackbar(error.response?.data?.detail || 'Günsonu geri alınırken hata oluştu', 'error');
    }
  };

  const handleYeniGunBaslat = async () => {
    if (!window.confirm('Yeni günü başlatmak istediğinizden emin misiniz?\n\nBu işlem:\n• Mevcut kapanışı olduğu gibi bırakır\n• Yeni güne başlamak için sistemi hazırlar\n• Günsonu durumunu tekrar açık yapar')) {
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/kasa/yeni-gun-baslat');
      
      showSnackbar(response.data.message, 'success');
      
      // Verileri yenile
      await fetchAll();
    } catch (error) {
      console.error('Yeni gün başlatılırken hata:', error);
      showSnackbar(error.response?.data?.detail || 'Yeni gün başlatılırken hata oluştu', 'error');
    }
  };

  const handleTarihSecimi = async (gunsonuTarihi) => {
    setSelectedGunsonuTarihi(gunsonuTarihi);
    await fetchHareketler(gunsonuTarihi);
  };

  const formatTarih = (tarih) => {
    return new Date(tarih).toLocaleString('tr-TR');
  };

  const formatTutar = (tutar) => {
    return `${tutar.toFixed(2)} TL`;
  };

  const getKasaIcon = (tip) => {
    switch (tip) {
      case 'Nakit': return <LocalAtm />;
      case 'Kart': return <CreditCard />;
      case 'Transfer': return <AccountBalance />;
      case 'Yemek Çeki': return <Restaurant />;
      default: return <MonetizationOn />;
    }
  };

  const getHareketIcon = (kategori) => {
    switch (kategori) {
      case 'Satış': return <ShoppingCart />;
      case 'Tahsilat': return <TrendingUp />;
      case 'Gider': return <TrendingDown />;
      case 'Alım': return <Receipt />;
      case 'Ödeme': return <Payment />;
      default: return <MonetizationOn />;
    }
  };

  if (!kasaDurumu) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Typography variant="h6" sx={{ color: '#47569e' }}>
          📊 Kasa verileri yükleniyor...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, bgcolor: '#f8f9fc', minHeight: '100vh' }}>
      {/* Başlık */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0d0f1c', mb: 1 }}>
              💰 Kasa Takibi
            </Typography>
            <Typography variant="body1" sx={{ color: '#47569e' }}>
              Nakit akış takibi, kasa durumu ve hareket yönetimi
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Home />}
            onClick={() => navigate('/')}
            sx={{
              color: '#607afb',
              borderColor: '#607afb',
              '&:hover': {
                bgcolor: '#607afb',
                color: 'white'
              },
              fontWeight: 'bold',
              px: 3
            }}
          >
            Ana Sayfa
          </Button>
        </Box>
      </Box>

      {/* ANA NAKİT KASA - En Önemli Bölüm */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>
            💵 Ana Nakit Kasa
          </Typography>
          {gunsonuDurumu && (!gunsonuDurumu.kapanmis_mi || gunsonuDurumu.yeni_gun_baslatildi_mi) && (
            <Button
              variant="contained"
              color="warning"
              startIcon={<MonetizationOn />}
              onClick={() => setGunsonuModal(true)}
              sx={{
                bgcolor: '#ff9800',
                '&:hover': { bgcolor: '#f57c00' },
                fontWeight: 'bold'
              }}
            >
              🌙 Günsonu Sayım
            </Button>
          )}
        </Box>
        
        {/* Günsonu Bilgi Kartı */}
        {gunsonuDurumu && (
          <Card sx={{ 
            bgcolor: gunsonuDurumu.yeni_gun_baslatildi_mi ? '#e3f2fd' :
                    gunsonuDurumu.kapanmis_mi ? '#e8f5e8' : '#fff3e0',
            border: `2px solid ${gunsonuDurumu.yeni_gun_baslatildi_mi ? '#2196f3' :
                                 gunsonuDurumu.kapanmis_mi ? '#4caf50' : '#ff9800'}`
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 'bold', 
                  color: gunsonuDurumu.yeni_gun_baslatildi_mi ? 'info.main' :
                        gunsonuDurumu.kapanmis_mi ? 'success.main' : 'warning.main'
                }}>
                  {gunsonuDurumu.yeni_gun_baslatildi_mi ? 
                    '🌅 Yeni Gün Başlatılmış' : 
                    gunsonuDurumu.kapanmis_mi ? '✅ Gün Kapatılmış' : '⏰ Günsonu Bekliyor'
                  }
                </Typography>
                {gunsonuDurumu.kapanmis_mi && !gunsonuDurumu.yeni_gun_baslatildi_mi && (
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      color="success"
                      size="small"
                      onClick={handleYeniGunBaslat}
                      sx={{
                        fontWeight: 'bold',
                        borderColor: 'success.main',
                        color: 'success.main',
                        '&:hover': {
                          bgcolor: 'success.main',
                          color: 'white'
                        }
                      }}
                    >
                      🌅 Yeni Günü Başlat
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={handleGunsonuGeriAl}
                      sx={{
                        fontWeight: 'bold',
                        borderColor: 'error.main',
                        color: 'error.main',
                        '&:hover': {
                          bgcolor: 'error.main',
                          color: 'white'
                        }
                      }}
                    >
                      🔄 Kapamayı Geri Al
                    </Button>
                  </Box>
                )}
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">Açılış Bakiye</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {formatTutar(gunsonuDurumu.acilis_bakiye)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">Hesaplanan Bakiye</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {formatTutar(gunsonuDurumu.hesaplanan_bakiye)}
                  </Typography>
                </Grid>
                {gunsonuDurumu.kapanmis_mi && (
                  <>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">Fiziksel Sayım</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {formatTutar(gunsonuDurumu.fiziksel_sayim)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">Fark</Typography>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 'bold',
                        color: gunsonuDurumu.fark === 0 ? 'success.main' : 
                               gunsonuDurumu.fark > 0 ? 'info.main' : 'error.main'
                      }}>
                        {gunsonuDurumu.fark > 0 ? '+' : ''}{formatTutar(gunsonuDurumu.fark)}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* GELİRLER BÖLÜMÜ */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0d0f1c', mb: 2 }}>
          📈 Gelirler (Satışlar)
          {!gelirlerGiderler && <span style={{color: 'red', fontSize: '12px'}}> - Veri yükleniyor...</span>}
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#667eea' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="white" gutterBottom sx={{ opacity: 0.8 }}>
                      💵 Nakit Satış
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white' }}>
                      {gelirlerGiderler ? formatTutar(gelirlerGiderler.nakit_satis) : '0.00 TL'}
                    </Typography>
                    <Typography color="white" sx={{ opacity: 0.7, fontSize: '0.8rem' }}>
                      Kasa girişi
                    </Typography>
                  </Box>
                  <LocalAtm sx={{ color: 'white', fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#f093fb' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="white" gutterBottom sx={{ opacity: 0.8 }}>
                      💳 POS Satış
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white' }}>
                      {gelirlerGiderler ? formatTutar(gelirlerGiderler.pos_satis) : '0.00 TL'}
                    </Typography>
                    <Typography color="white" sx={{ opacity: 0.7, fontSize: '0.8rem' }}>
                      Banka hesabına
                    </Typography>
                  </Box>
                  <CreditCard sx={{ color: 'white', fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#fa709a' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="white" gutterBottom sx={{ opacity: 0.8 }}>
                      🍽️ Yemek Çeki Satış
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white' }}>
                      {gelirlerGiderler ? formatTutar(gelirlerGiderler.yemek_ceki_satis) : '0.00 TL'}
                    </Typography>
                    <Typography color="white" sx={{ opacity: 0.7, fontSize: '0.8rem' }}>
                      Firmaya tahsil
                    </Typography>
                  </Box>
                  <Restaurant sx={{ color: 'white', fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#4facfe' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="white" gutterBottom sx={{ opacity: 0.8 }}>
                      🏦 Havale Satış
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white' }}>
                      {gelirlerGiderler ? formatTutar(gelirlerGiderler.havale_satis) : '0.00 TL'}
                    </Typography>
                    <Typography color="white" sx={{ opacity: 0.7, fontSize: '0.8rem' }}>
                      Direkt banka
                    </Typography>
                  </Box>
                  <AccountBalance sx={{ color: 'white', fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* GİDERLER BÖLÜMÜ */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0d0f1c', mb: 2 }}>
          📉 Giderler
          {!gelirlerGiderler && <span style={{color: 'red', fontSize: '12px'}}> - Veri yükleniyor...</span>}
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#ff9a9e' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="white" gutterBottom sx={{ opacity: 0.8 }}>
                      💵 Nakit Gider
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white' }}>
                      {gelirlerGiderler ? formatTutar(gelirlerGiderler.nakit_gider) : '0.00 TL'}
                    </Typography>
                    <Typography color="white" sx={{ opacity: 0.7, fontSize: '0.8rem' }}>
                      Kasadan çıkış
                    </Typography>
                  </Box>
                  <LocalAtm sx={{ color: 'white', fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#ffa726' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="white" gutterBottom sx={{ opacity: 0.8 }}>
                      💳 Kredi Kartı Gider
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white' }}>
                      {gelirlerGiderler ? formatTutar(gelirlerGiderler.kredi_karti_gider) : '0.00 TL'}
                    </Typography>
                    <Typography color="white" sx={{ opacity: 0.7, fontSize: '0.8rem' }}>
                      Karttan ödeme
                    </Typography>
                  </Box>
                  <CreditCard sx={{ color: 'white', fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#ef5350' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="white" gutterBottom sx={{ opacity: 0.8 }}>
                      🍽️ Yemek Çeki Gider
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white' }}>
                      {gelirlerGiderler ? formatTutar(gelirlerGiderler.yemek_ceki_gider) : '0.00 TL'}
                    </Typography>
                    <Typography color="white" sx={{ opacity: 0.7, fontSize: '0.8rem' }}>
                      Y.Çeki ile ödeme
                    </Typography>
                  </Box>
                  <Restaurant sx={{ color: 'white', fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#9c27b0' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="white" gutterBottom sx={{ opacity: 0.8 }}>
                      🏦 Transfer Gider
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white' }}>
                      {gelirlerGiderler ? formatTutar(gelirlerGiderler.transfer_gider) : '0.00 TL'}
                    </Typography>
                    <Typography color="white" sx={{ opacity: 0.7, fontSize: '0.8rem' }}>
                      Havale ile ödeme
                    </Typography>
                  </Box>
                  <AccountBalance sx={{ color: 'white', fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Hareket Tablosu */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>
              📋 Kasa Hareketleri
            </Typography>
            <Typography variant="body2" sx={{ color: '#47569e' }}>
              {selectedGunsonuTarihi 
                ? `Seçilen günsonu tarihindeki hareketler` 
                : 'Son günsonu alındıktan sonraki güncel hareketler'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Tarih Filtresi</InputLabel>
              <Select
                value={selectedGunsonuTarihi || 'guncel'}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'guncel') {
                    handleTarihSecimi(null);
                  } else {
                    handleTarihSecimi(value);
                  }
                }}
                label="Tarih Filtresi"
              >
                <MenuItem value="guncel">📅 Güncel Hareketler</MenuItem>
                <Divider />
                {gunsonuTarihleri.map((tarih) => (
                  <MenuItem key={tarih.tarih} value={tarih.tarih}>
                    📊 {tarih.aciklama}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpen(true)}
              sx={{
                bgcolor: '#607afb',
                '&:hover': { bgcolor: '#5068e5' },
                textTransform: 'none',
                fontWeight: 'bold'
              }}
            >
              Yeni Hareket Ekle
            </Button>
          </Box>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ border: '1px solid #ced2e9' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8f9fc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Tarih</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Tip</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Kategori</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Ödeme</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Tutar</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Açıklama</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>İşlem</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {hareketler.map((hareket) => (
              <TableRow key={hareket.id} sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                <TableCell sx={{ color: '#47569e' }}>
                  {formatTarih(hareket.tarih)}
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getHareketIcon(hareket.kategori)}
                    label={hareket.hareket_tipi}
                    color={hareket.hareket_tipi === 'Giriş' ? 'success' : 'error'}
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={hareket.kategori}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                  {hareket.alt_kategori && (
                    <Chip
                      label={hareket.alt_kategori}
                      color="secondary"
                      variant="outlined"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                  {hareket.cari_hesap && (
                    <Chip
                      label={hareket.cari_hesap}
                      color="info"
                      variant="outlined"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getKasaIcon(hareket.odeme_tipi)}
                      <Typography sx={{ ml: 1 }}>
                        {hareket.odeme_tipi}
                      </Typography>
                    </Box>
                    {hareket.alt_odeme_tipi && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        {hareket.alt_odeme_tipi}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ 
                  color: hareket.hareket_tipi === 'Giriş' ? 'success.main' : 'error.main',
                  fontWeight: 'bold'
                }}>
                  {hareket.hareket_tipi === 'Giriş' ? '+' : '-'}{formatTutar(hareket.tutar)}
                </TableCell>
                <TableCell sx={{ color: '#47569e' }}>
                  {hareket.aciklama || '-'}
                </TableCell>
                <TableCell>
                  <Tooltip title="Sil">
                    <IconButton 
                      onClick={() => handleDelete(hareket.id)} 
                      size="small" 
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Yeni Hareket Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Kasa Hareketi Ekle</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 2 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Hareket Tipi *</InputLabel>
                <Select
                  value={formData.hareket_tipi}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    hareket_tipi: e.target.value,
                    kategori: '',
                    alt_kategori_id: '',
                    alt_odeme_tipi_id: ''
                  })}
                  label="Hareket Tipi *"
                >
                  <MenuItem value="Giriş">📈 Giriş (Gelir)</MenuItem>
                  <MenuItem value="Çıkış">📉 Çıkış (Gider)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.hareket_tipi === 'Giriş' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Kategori"
                  value="🛒 Satış"
                  disabled
                  sx={{ bgcolor: '#f5f5f5' }}
                />
              </Grid>
            )}

            {formData.hareket_tipi === 'Çıkış' && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  <Autocomplete
                    fullWidth
                    value={formData.alt_kategori_id ? 
                      giderKategorileri.find(k => k.id === parseInt(formData.alt_kategori_id)) : null
                    }
                    onChange={(event, newValue) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        alt_kategori_id: newValue ? newValue.id : '',
                        kategori: 'Gider'
                      }));
                    }}
                    options={giderKategorileri}
                    getOptionLabel={(option) => option ? `💸 ${option.kategori_adi}` : ''}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Gider Kategorisi *"
                        placeholder="Gider kategorisi seçin..."
                      />
                    )}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => openNewCategoryModal('gider', 'Gider Kategorisi')}
                    sx={{ minWidth: 120, height: 56 }}
                  >
                    Yeni Ekle
                  </Button>
                </Box>
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Ödeme Tipi *</InputLabel>
                <Select
                  value={formData.odeme_tipi}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    odeme_tipi: e.target.value,
                    alt_odeme_tipi_id: ''
                  })}
                  label="Ödeme Tipi *"
                >
                  <MenuItem value="Nakit">💵 Nakit (Fiziksel kasa)</MenuItem>
                  <MenuItem value="Kart">💳 Kart (POS tahsilatı)</MenuItem>
                  <MenuItem value="Transfer">🏦 Havale/EFT</MenuItem>
                  <MenuItem value="Yemek Çeki">🍽️ Yemek Çeki</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Alt ödeme tipi seçimi */}
            {formData.odeme_tipi === 'Nakit' && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Nakit Tipi *</InputLabel>
                  <Select
                    value={formData.alt_odeme_tipi_id}
                    onChange={(e) => setFormData({ ...formData, alt_odeme_tipi_id: e.target.value })}
                    label="Nakit Tipi *"
                  >
                    <MenuItem value="" disabled>
                      Nakit tipi seçin...
                    </MenuItem>
                    {nakitKategorileri.map((nakit) => (
                      <MenuItem key={nakit.id} value={nakit.id}>
                        💵 {nakit.kategori_adi}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {formData.odeme_tipi === 'Kart' && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  <FormControl fullWidth>
                    <InputLabel>Hangi Banka *</InputLabel>
                    <Select
                      value={formData.alt_odeme_tipi_id}
                      onChange={(e) => setFormData({ ...formData, alt_odeme_tipi_id: e.target.value })}
                      label="Hangi Banka *"
                    >
                      <MenuItem value="" disabled>
                        Banka seçin...
                      </MenuItem>
                      {bankaKategorileri.map((banka) => (
                        <MenuItem key={banka.id} value={banka.id}>
                          🏦 {banka.kategori_adi}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => openNewCategoryModal('banka', 'Banka')}
                    sx={{ minWidth: 120, height: 56 }}
                  >
                    Yeni Ekle
                  </Button>
                </Box>
              </Grid>
            )}

            {formData.odeme_tipi === 'Yemek Çeki' && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  <FormControl fullWidth>
                    <InputLabel>Yemek Çeki Firması *</InputLabel>
                    <Select
                      value={formData.alt_odeme_tipi_id}
                      onChange={(e) => setFormData({ ...formData, alt_odeme_tipi_id: e.target.value })}
                      label="Yemek Çeki Firması *"
                    >
                      <MenuItem value="" disabled>
                        Yemek çeki firması seçin...
                      </MenuItem>
                      {yemekCekiKategorileri.map((yemek) => (
                        <MenuItem key={yemek.id} value={yemek.id}>
                          🍽️ {yemek.kategori_adi}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => openNewCategoryModal('yemek_ceki', 'Yemek Çeki Firması')}
                    sx={{ minWidth: 120, height: 56 }}
                  >
                    Yeni Ekle
                  </Button>
                </Box>
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <TextField
                label="Hareket Tarihi *"
                type="date"
                value={formData.tarih}
                onChange={(e) => setFormData({ ...formData, tarih: e.target.value })}
                fullWidth
                required
                InputLabelProps={{
                  shrink: true,
                }}
                helperText="Saat bilgisi otomatik eklenir (aynı gün içinde sıralama için)"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Tutar *"
                type="number"
                value={formData.tutar}
                onChange={(e) => setFormData({ ...formData, tutar: e.target.value })}
                fullWidth
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Açıklama"
                value={formData.aciklama}
                onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                multiline
                rows={3}
                fullWidth
                placeholder="Kasa hareketi ile ilgili detay bilgi..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>İptal</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={loading || !formData.tutar || parseFloat(formData.tutar) <= 0}
          >
            {loading ? 'Kaydediyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Yeni Kategori Ekleme Modal */}
      <Dialog open={newCategoryModal.open} onClose={closeNewCategoryModal} maxWidth="sm" fullWidth>
        <DialogTitle>{newCategoryModal.title} Ekle</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={`${newCategoryModal.title} Adı`}
            fullWidth
            variant="outlined"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder={`${newCategoryModal.title} adını girin...`}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateNewCategory();
              }
            }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeNewCategoryModal}>İptal</Button>
          <Button 
            onClick={handleCreateNewCategory} 
            variant="contained"
            disabled={!newCategoryName.trim()}
          >
            Ekle
          </Button>
        </DialogActions>
      </Dialog>

      {/* Günsonu Sayım Modal */}
      <Dialog open={gunsonuModal} onClose={() => setGunsonuModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#ff9800', color: 'white', fontWeight: 'bold' }}>
          🌙 Günsonu Fiziksel Nakit Sayımı
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {gunsonuDurumu && (
            <Box sx={{ mb: 3 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Bugünün Özeti:</strong><br/>
                  • Açılış Bakiye: {formatTutar(gunsonuDurumu.acilis_bakiye)}<br/>
                  • Nakit Giriş: +{formatTutar(gunsonuDurumu.bugun_nakit_giris)}<br/>
                  • Nakit Çıkış: -{formatTutar(gunsonuDurumu.bugun_nakit_cikis)}<br/>
                  • <strong>Hesaplanan Bakiye: {formatTutar(gunsonuDurumu.hesaplanan_bakiye)}</strong>
                </Typography>
              </Alert>
              
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#ff9800' }}>
                💰 Kasadaki Fiziksel Nakit Miktarını Sayın
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Fiziksel Nakit Tutarı *"
                    type="number"
                    value={fizikselSayim}
                    onChange={(e) => setFizikselSayim(e.target.value)}
                    fullWidth
                    required
                    inputProps={{ min: 0, step: 0.01 }}
                    placeholder="Örn: 1250.50"
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: fizikselSayim && gunsonuDurumu ? 
                      (Math.abs(parseFloat(fizikselSayim) - gunsonuDurumu.hesaplanan_bakiye) <= 0.01 ? '#e8f5e8' : '#ffeaea') : 
                      '#f5f5f5',
                    borderRadius: 1,
                    border: '1px solid #ddd'
                  }}>
                    <Typography variant="body2" color="textSecondary">Fark</Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 'bold',
                      color: fizikselSayim && gunsonuDurumu ? 
                        (Math.abs(parseFloat(fizikselSayim) - gunsonuDurumu.hesaplanan_bakiye) <= 0.01 ? 'success.main' : 'error.main') :
                        'textSecondary'
                    }}>
                      {fizikselSayim && gunsonuDurumu ? 
                        `${parseFloat(fizikselSayim) - gunsonuDurumu.hesaplanan_bakiye >= 0 ? '+' : ''}${formatTutar(parseFloat(fizikselSayim) - gunsonuDurumu.hesaplanan_bakiye)}` :
                        '0.00 TL'
                      }
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Açıklama (İsteğe bağlı)"
                    value={sayimAciklama}
                    onChange={(e) => setSayimAciklama(e.target.value)}
                    multiline
                    rows={3}
                    fullWidth
                    placeholder="Sayım ile ilgili not, fark varsa açıklama..."
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGunsonuModal(false)}>İptal</Button>
          <Button 
            onClick={handleGunsonuSayim} 
            variant="contained"
            color="warning"
            disabled={!fizikselSayim || parseFloat(fizikselSayim) < 0}
            sx={{ fontWeight: 'bold' }}
          >
            🌙 Günsonu Kapat
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default KasaTakibi; 