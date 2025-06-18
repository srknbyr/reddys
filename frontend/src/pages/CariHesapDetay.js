import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Checkbox,
  FormControlLabel,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Autocomplete,
  Collapse,
  Badge
} from '@mui/material';
import { ArrowBack, Add, Delete, TrendingUp, TrendingDown, FilterList, Clear, ExpandMore, ExpandLess } from '@mui/icons-material';
import axios from 'axios';

const CariHesapDetay = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [hesapBilgi, setHesapBilgi] = useState(null);
  const [hareketler, setHareketler] = useState([]);
  const [urunler, setUrunler] = useState([]); // Satış için ürün listesi
  const [openBorc, setOpenBorc] = useState(false);
  const [openAlacak, setOpenAlacak] = useState(false);
  const [loading, setLoading] = useState(false);
  const [borcFormData, setBorcFormData] = useState({
    tutar: '',
    hareket_tarihi: new Date().toISOString().split('T')[0],
    aciklama: '',
    is_satis: false,
    urun_id: '',
    miktar: ''
  });

  const [alacakFormData, setAlacakFormData] = useState({
    tutar: '',
    odeme_tipi: 'Nakit',
    hareket_tarihi: new Date().toISOString().split('T')[0],
    aciklama: ''
  });

  const [urunSepeti, setUrunSepeti] = useState([]);
  const [selectedUrun, setSelectedUrun] = useState(null);
  const [selectedMiktar, setSelectedMiktar] = useState('');
  const [selectedBirimFiyat, setSelectedBirimFiyat] = useState('');

  // Filtre state'leri
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    hareket_tipi: '',
    min_tutar: '',
    max_tutar: '',
    odeme_tipi: '',
    aciklama: ''
  });
  const [filteredHareketler, setFilteredHareketler] = useState([]);

  // Filtre fonksiyonları
  const applyFilters = useCallback(() => {
    let filtered = [...hareketler];

    // Tarih filtresi
    if (filters.startDate) {
      filtered = filtered.filter(h => 
        new Date(h.hareket_tarihi || h.tarih) >= new Date(filters.startDate)
      );
    }
    if (filters.endDate) {
      filtered = filtered.filter(h => 
        new Date(h.hareket_tarihi || h.tarih) <= new Date(filters.endDate)
      );
    }

    // Hareket tipi filtresi
    if (filters.hareket_tipi) {
      filtered = filtered.filter(h => h.hareket_tipi === filters.hareket_tipi);
    }

    // Tutar filtresi
    if (filters.min_tutar) {
      filtered = filtered.filter(h => h.tutar >= parseFloat(filters.min_tutar));
    }
    if (filters.max_tutar) {
      filtered = filtered.filter(h => h.tutar <= parseFloat(filters.max_tutar));
    }

    // Ödeme tipi filtresi
    if (filters.odeme_tipi) {
      filtered = filtered.filter(h => h.odeme_tipi === filters.odeme_tipi);
    }

    // Açıklama filtresi
    if (filters.aciklama.trim()) {
      const searchTerm = filters.aciklama.toLowerCase().trim();
      filtered = filtered.filter(h => 
        (h.aciklama || '').toLowerCase().includes(searchTerm)
      );
    }

    setFilteredHareketler(filtered);
  }, [hareketler, filters]);

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      hareket_tipi: '',
      min_tutar: '',
      max_tutar: '',
      odeme_tipi: '',
      aciklama: ''
    });
    setFilteredHareketler(hareketler);
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => value && value.toString().trim()).length;
  };

  useEffect(() => {
    if (id) {
      fetchHesapBilgi();
      fetchHareketler();
      fetchUrunler();
    }
  }, [id]);

  // Hareketler değiştiğinde filtreleri uygula
  useEffect(() => {
    if (hareketler.length > 0) {
      applyFilters();
    } else {
      setFilteredHareketler([]);
    }
  }, [hareketler, filters, applyFilters]);

  const fetchHesapBilgi = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/cari-hareket/bakiye/${id}`);
      setHesapBilgi(response.data);
    } catch (error) {
      console.error('Hesap bilgisi yüklenemedi:', error);
      // Demo veri
      setHesapBilgi({
        hesap_adi: 'Müşteri A',
        tipi: 'Müşteri',
        bakiye: 1500,
        toplam_borc: 5000,
        toplam_alacak: 3500,
        hareket_sayisi: 8,
        son_hareket_tarihi: '2024-07-20T10:00:00'
      });
    }
  };

  const fetchHareketler = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8000/cari-hareket/cari/${id}`);
      setHareketler(response.data);
    } catch (error) {
      console.error('Hareketler yüklenemedi:', error);
      // Demo veriler
      setHareketler([
        {
          id: 1,
          hareket_tipi: 'Borç',
          tutar: 1500,
          odeme_tipi: 'Nakit',
          hareket_tarihi: '2024-07-20T10:00:00',
          aciklama: 'Satış faturası',
          tarih: '2024-07-20T10:00:00'
        },
        {
          id: 2,
          hareket_tipi: 'Alacak',
          tutar: 800,
          odeme_tipi: 'Kart',
          hareket_tarihi: '2024-07-18T14:30:00',
          aciklama: 'Nakit tahsilat',
          tarih: '2024-07-18T14:30:00'
        },
        {
          id: 3,
          hareket_tipi: 'Borç',
          tutar: 2200,
          odeme_tipi: 'Transfer',
          hareket_tarihi: '2024-07-15T09:15:00',
          aciklama: 'Kredi satışı',
          tarih: '2024-07-15T09:15:00'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUrunler = async () => {
    try {
      // Müşteri için sadece stokta olan ürünler, tedarikçi için tüm aktif ürünler
      const endpoint = hesapBilgi.tipi === 'Müşteri' ? 
        'http://localhost:8000/cari-hareket/urunler' : 
        'http://localhost:8000/stok/urunler';
      const response = await axios.get(endpoint);
      setUrunler(response.data);
    } catch (error) {
      console.error('Ürünler yüklenemedi:', error);
      // Demo ürünler
      setUrunler([
        {
          id: 1,
          urun_adi: 'Türk Kahvesi',
          stok_miktari: 50,
          birim_kisaltma: 'ad',
          kategori_adi: 'Kahve'
        },
        {
          id: 2,
          urun_adi: 'Americano',
          stok_miktari: 30,
          birim_kisaltma: 'ad',
          kategori_adi: 'Kahve'
        },
        {
          id: 3,
          urun_adi: 'Tost',
          stok_miktari: 25,
          birim_kisaltma: 'ad',
          kategori_adi: 'Yemek'
        },
        {
          id: 4,
          urun_adi: 'Çay',
          stok_miktari: 100,
          birim_kisaltma: 'ad',
          kategori_adi: 'İçecek'
        },
        {
          id: 5,
          urun_adi: 'Marlboro Touch Blue',
          stok_miktari: 0,
          birim_kisaltma: 'ad',
          kategori_adi: 'İçecek'
        },
        {
          id: 6,
          urun_adi: 'Icos silver',
          stok_miktari: 0,
          birim_kisaltma: 'ad',
          kategori_adi: 'İçecek'
        }
      ]);
    }
  };

  const handleBorcSubmit = async () => {
    try {
      const payload = {
        cari_hesap_id: parseInt(id),
        hareket_tipi: 'Borç',
        tutar: parseFloat(borcFormData.tutar),
        odeme_tipi: 'Satın Alma',
        hareket_tarihi: new Date(borcFormData.hareket_tarihi).toISOString(),
        aciklama: borcFormData.aciklama
      };

      // Çoklu ürün sistemi için sepet kontrolü
      if (borcFormData.is_satis && urunSepeti.length > 0) {
        payload.urun_kalemleri = urunSepeti.map(item => ({
          urun_id: item.urun_id,
          miktar: item.miktar,
          birim_fiyat: item.birim_fiyat
        }));
      }
      // Geriye dönük uyumluluk için tek ürün sistemi
      else if (borcFormData.is_satis && borcFormData.urun_id && borcFormData.miktar) {
        payload.urun_id = parseInt(borcFormData.urun_id);
        payload.miktar = parseFloat(borcFormData.miktar);
      }

      await axios.post('http://localhost:8000/cari-hareket/', payload);
      handleBorcClose();
      fetchHesapBilgi();
      fetchHareketler();
    } catch (error) {
      console.error('Borç hareketi eklenemedi:', error);
      alert('Hata: ' + (error.response?.data?.detail || 'Bilinmeyen bir hata oluştu'));
    }
  };

  const handleAlacakSubmit = async () => {
    try {
      const payload = {
        cari_hesap_id: parseInt(id),
        hareket_tipi: 'Alacak',
        tutar: parseFloat(alacakFormData.tutar),
        odeme_tipi: alacakFormData.odeme_tipi,
        hareket_tarihi: new Date(alacakFormData.hareket_tarihi).toISOString(),
        aciklama: alacakFormData.aciklama
      };

      await axios.post('http://localhost:8000/cari-hareket/', payload);
      handleAlacakClose();
      fetchHesapBilgi();
      fetchHareketler();
    } catch (error) {
      console.error('Alacak hareketi eklenemedi:', error);
      alert('Hata: ' + (error.response?.data?.detail || 'Bilinmeyen bir hata oluştu'));
    }
  };

  const handleDelete = async (hareketId) => {
    if (window.confirm('Bu hareketi silmek istediğinizden emin misiniz?')) {
      try {
        await axios.delete(`http://localhost:8000/cari-hareket/${hareketId}`);
        fetchHesapBilgi();
        fetchHareketler();
      } catch (error) {
        console.error('Hareket silinemedi:', error);
        alert('Hata: Hareket silinemedi');
      }
    }
  };

  const handleBorcClose = () => {
    setOpenBorc(false);
    setBorcFormData({
      tutar: '',
      hareket_tarihi: new Date().toISOString().split('T')[0],
      aciklama: '',
      is_satis: false,
      urun_id: '',
      miktar: ''
    });
    
    // Sepeti temizle
    setUrunSepeti([]);
    setSelectedUrun(null);
    setSelectedMiktar('');
    setSelectedBirimFiyat('');
  };

  const handleAlacakClose = () => {
    setOpenAlacak(false);
    setAlacakFormData({
      tutar: '',
      odeme_tipi: 'Nakit',
      hareket_tarihi: new Date().toISOString().split('T')[0],
      aciklama: ''
    });
  };

  const formatTarih = (tarih) => {
    return new Date(tarih).toLocaleString('tr-TR');
  };

  const formatTutar = (tutar) => {
    return `${tutar.toLocaleString('tr-TR')} TL`;
  };

  const getBakiyeColor = (bakiye) => {
    if (bakiye > 0) return 'success.main';
    if (bakiye < 0) return 'error.main';
    return 'text.secondary';
  };

  // Sepet yönetimi fonksiyonları
  const addToSepet = () => {
    if (!selectedUrun || !selectedMiktar || parseFloat(selectedMiktar) <= 0 || 
        !selectedBirimFiyat || parseFloat(selectedBirimFiyat) <= 0) {
      alert('Lütfen ürün, miktar ve birim fiyat bilgilerini doldurun');
      return;
    }

    const urun = selectedUrun; // selectedUrun artık obje
    if (!urun) return;

    const miktar = parseFloat(selectedMiktar);
    const birimFiyat = parseFloat(selectedBirimFiyat);

    // Aynı ürün sepette var mı kontrol et
    const existingIndex = urunSepeti.findIndex(item => item.urun_id === selectedUrun.id);
    
    const yeniKalem = {
      urun_id: selectedUrun.id,
      urun_adi: urun.urun_adi,
      miktar: miktar,
      birim_fiyat: birimFiyat,
      toplam: miktar * birimFiyat,
      birim_kisaltma: urun.birim_kisaltma
    };

    if (existingIndex >= 0) {
      // Mevcut ürünü güncelle
      const updatedSepet = [...urunSepeti];
      updatedSepet[existingIndex] = yeniKalem;
      setUrunSepeti(updatedSepet);
    } else {
      // Yeni ürün ekle
      setUrunSepeti([...urunSepeti, yeniKalem]);
    }

    // Formu temizle
    setSelectedUrun(null);
    setSelectedMiktar('');
    setSelectedBirimFiyat('');
    
    // Toplam tutarı güncelle
    updateToplamTutar([...urunSepeti, yeniKalem]);
  };

  const removeFromSepet = (urun_id) => {
    const updatedSepet = urunSepeti.filter(item => item.urun_id !== urun_id);
    setUrunSepeti(updatedSepet);
    updateToplamTutar(updatedSepet);
  };

  const updateToplamTutar = (sepet) => {
    const toplam = sepet.reduce((sum, item) => sum + item.toplam, 0);
    setBorcFormData({ ...borcFormData, tutar: toplam.toString() });
  };

  const clearSepet = () => {
    setUrunSepeti([]);
    setBorcFormData({ ...borcFormData, tutar: '' });
  };

  if (!hesapBilgi) {
    return <Box sx={{ p: 4 }}>Yükleniyor...</Box>;
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* Başlık ve Geri Butonu */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton onClick={() => navigate('/cari-hesap')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>
            {hesapBilgi.hesap_adi}
          </Typography>
          <Typography variant="body1" sx={{ color: '#47569e' }}>
            Cari Hesap Detayları ve Hareket Geçmişi
          </Typography>
        </Box>
      </Box>

      {/* Özet Kartları */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Güncel Bakiye
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: getBakiyeColor(hesapBilgi.bakiye) }}>
                {formatTutar(hesapBilgi.bakiye)}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Hesap Tipi: {hesapBilgi.tipi}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ color: 'error.main', mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Toplam Borç
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                    {formatTutar(hesapBilgi.toplam_borc)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingDown sx={{ color: 'success.main', mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Toplam Alacak
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {formatTutar(hesapBilgi.toplam_alacak)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Toplam Hareket
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {hesapBilgi.hareket_sayisi}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Son: {formatTarih(hesapBilgi.son_hareket_tarihi)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Hareket Tablosu */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>
            Hareket Geçmişi
          </Typography>
          <Badge badgeContent={getActiveFilterCount()} color="primary">
            <Button
              variant="outlined"
              startIcon={showFilters ? <ExpandLess /> : <ExpandMore />}
              endIcon={<FilterList />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{
                textTransform: 'none',
                fontWeight: 'bold',
                color: '#607afb',
                borderColor: '#607afb',
                '&:hover': {
                  bgcolor: '#607afb',
                  color: 'white'
                }
              }}
            >
              Filtreler
            </Button>
          </Badge>
          {getActiveFilterCount() > 0 && (
            <Button
              variant="text"
              startIcon={<Clear />}
              onClick={clearFilters}
              sx={{
                textTransform: 'none',
                color: '#f44336',
                '&:hover': { bgcolor: '#ffebee' }
              }}
            >
              Temizle ({filteredHareketler.length}/{hareketler.length})
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<TrendingUp />}
            onClick={() => setOpenBorc(true)}
            sx={{
              bgcolor: '#f44336',
              '&:hover': { bgcolor: '#d32f2f' },
              textTransform: 'none',
              fontWeight: 'bold'
            }}
          >
            Borç (Alım/Gider) Ekle
          </Button>
          <Button
            variant="contained"
            startIcon={<TrendingDown />}
            onClick={() => setOpenAlacak(true)}
            sx={{
              bgcolor: '#4caf50',
              '&:hover': { bgcolor: '#388e3c' },
              textTransform: 'none',
              fontWeight: 'bold'
            }}
          >
            Alacak (Ödeme) Ekle
          </Button>
        </Box>
      </Box>

      {/* Filtre Paneli */}
      <Collapse in={showFilters}>
        <Paper sx={{ p: 3, mb: 3, bgcolor: '#f8f9fc', border: '1px solid #ced2e9' }}>
          <Grid container spacing={2}>
            {/* Tarih Aralığı */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#0d0f1c' }}>
                📅 Tarih Aralığı
              </Typography>
              <TextField
                label="Başlangıç"
                type="date"
                size="small"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 1 }}
              />
              <TextField
                label="Bitiş"
                type="date"
                size="small"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Hareket Tipi */}
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#0d0f1c' }}>
                🔄 Hareket Tipi
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel>Tip Seçin</InputLabel>
                <Select
                  value={filters.hareket_tipi}
                  onChange={(e) => setFilters({ ...filters, hareket_tipi: e.target.value })}
                  label="Tip Seçin"
                >
                  <MenuItem value="">Hepsi</MenuItem>
                  <MenuItem value="Borç">🔺 Borç</MenuItem>
                  <MenuItem value="Alacak">🔻 Alacak</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Tutar Aralığı */}
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#0d0f1c' }}>
                💰 Tutar Aralığı
              </Typography>
              <TextField
                label="Min Tutar"
                type="number"
                size="small"
                value={filters.min_tutar}
                onChange={(e) => setFilters({ ...filters, min_tutar: e.target.value })}
                fullWidth
                inputProps={{ min: 0, step: 0.01 }}
                sx={{ mb: 1 }}
              />
              <TextField
                label="Max Tutar"
                type="number"
                size="small"
                value={filters.max_tutar}
                onChange={(e) => setFilters({ ...filters, max_tutar: e.target.value })}
                fullWidth
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            {/* Ödeme Tipi */}
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#0d0f1c' }}>
                💳 Ödeme Tipi
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel>Ödeme Tipi</InputLabel>
                <Select
                  value={filters.odeme_tipi}
                  onChange={(e) => setFilters({ ...filters, odeme_tipi: e.target.value })}
                  label="Ödeme Tipi"
                >
                  <MenuItem value="">Hepsi</MenuItem>
                  <MenuItem value="Nakit">💵 Nakit</MenuItem>
                  <MenuItem value="Kart">💳 Kart</MenuItem>
                  <MenuItem value="Transfer">🏦 Transfer</MenuItem>
                  <MenuItem value="Yemek Çeki">🍽️ Yemek Çeki</MenuItem>
                  <MenuItem value="Satın Alma">🛒 Satın Alma</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Açıklama Arama */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#0d0f1c' }}>
                🔍 Açıklama Arama
              </Typography>
              <TextField
                label="Açıklama ara..."
                size="small"
                value={filters.aciklama}
                onChange={(e) => setFilters({ ...filters, aciklama: e.target.value })}
                fullWidth
                placeholder="Metin girin..."
              />
            </Grid>
          </Grid>

          {/* Filtre İstatistikleri */}
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #ced2e9' }}>
            <Typography variant="body2" color="textSecondary">
              📊 Toplam {hareketler.length} kayıttan {filteredHareketler.length} tanesi gösteriliyor
              {getActiveFilterCount() > 0 && ` (${getActiveFilterCount()} filtre aktif)`}
            </Typography>
          </Box>
        </Paper>
      </Collapse>

      <TableContainer component={Paper} sx={{ border: '1px solid #ced2e9' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8f9fc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>İşlem Tarihi</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Tip</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Tutar</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Ödeme Tipi</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Açıklama</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>İşlem</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredHareketler.map((hareket) => (
              <TableRow key={hareket.id} sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                <TableCell sx={{ color: '#47569e' }}>
                  {formatTarih(hareket.hareket_tarihi || hareket.tarih)}
                </TableCell>
                <TableCell>
                  <Chip
                    label={hareket.hareket_tipi}
                    color={hareket.hareket_tipi === 'Borç' ? 'error' : 'success'}
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ 
                  color: hareket.hareket_tipi === 'Borç' ? 'error.main' : 'success.main',
                  fontWeight: 'bold'
                }}>
                  {hareket.hareket_tipi === 'Borç' ? '-' : '+'}{formatTutar(hareket.tutar)}
                </TableCell>
                <TableCell>
                  <Chip
                    label={hareket.odeme_tipi}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
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
              {filteredHareketler.length === 0 && hareketler.length > 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      🔍 Filtre kriterlerinize uygun hareket bulunamadı
                    </Typography>
                    <Button 
                      variant="text" 
                      onClick={clearFilters}
                      sx={{ mt: 1, color: '#607afb' }}
                    >
                      Filtreleri Temizle
                    </Button>
                  </TableCell>
                </TableRow>
              )}
              {hareketler.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      📝 Henüz hareket kaydı bulunmuyor
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

      {/* Borç Ekleme Modal */}
      <Dialog open={openBorc} onClose={handleBorcClose} maxWidth="md" fullWidth>
        <DialogTitle>Borç (Alım/Gider) Ekle</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 2 }}>
            {/* Ürün İşlemi Checkbox'ı */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={borcFormData.is_satis}
                    onChange={async (e) => {
                      const isChecked = e.target.checked;
                      setBorcFormData({ 
                        ...borcFormData, 
                        is_satis: isChecked,
                        urun_id: isChecked ? borcFormData.urun_id : '',
                        miktar: isChecked ? borcFormData.miktar : ''
                      });
                      
                      if (isChecked) {
                        await fetchUrunler();
                      } else {
                        clearSepet();
                      }
                    }}
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>
                      {hesapBilgi.tipi === 'Müşteri' ? 
                        '🛒 Bu bir satış işlemi (Stoktan düşülecek)' : 
                        '📦 Bu bir alım işlemi (Stoğa eklenecek)'}
                    </Typography>
                  </Box>
                }
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Tutar *"
                type="number"
                value={borcFormData.tutar}
                onChange={(e) => setBorcFormData({ ...borcFormData, tutar: e.target.value })}
                fullWidth
                required
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{
                  readOnly: borcFormData.is_satis && urunSepeti.length > 0
                }}
                helperText={borcFormData.is_satis && urunSepeti.length > 0 ? 
                  'Tutar otomatik hesaplanıyor' : 
                  'Manuel tutar girin'}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="İşlem Tarihi *"
                type="date"
                value={borcFormData.hareket_tarihi}
                onChange={(e) => setBorcFormData({ ...borcFormData, hareket_tarihi: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Çoklu Ürün Seçimi - Sepet Sistemi */}
            {borcFormData.is_satis && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }}>
                    <Typography variant="h6" color="primary">
                      {hesapBilgi.tipi === 'Müşteri' ? '🛒 Satış Sepeti' : '📦 Alım Sepeti'}
                    </Typography>
                  </Divider>
                </Grid>
                
                {/* Ürün Ekleme Formu */}
                <Grid item xs={12} sm={4}>
                  <Autocomplete
                    options={urunler}
                    getOptionLabel={(option) => 
                      `${option.urun_adi} (Stok: ${option.stok_miktari} ${option.birim_kisaltma})`
                    }
                    value={selectedUrun}
                    onChange={(event, newValue) => {
                      setSelectedUrun(newValue);
                      if (newValue) {
                        setSelectedBirimFiyat('');
                      } else {
                        setSelectedBirimFiyat('');
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Ürün Ara ve Seç"
                        placeholder="Ürün adı yazarak arayın..."
                        fullWidth
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {option.urun_adi}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {option.kategori_adi} • Stok: {option.stok_miktari} {option.birim_kisaltma}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    filterOptions={(options, { inputValue }) => {
                      return options.filter(option =>
                        option.urun_adi.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1 ||
                        option.kategori_adi.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
                      );
                    }}
                    noOptionsText="Ürün bulunamadı"
                    clearOnEscape
                  />
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Miktar"
                    type="number"
                    value={selectedMiktar}
                    onChange={(e) => setSelectedMiktar(e.target.value)}
                    fullWidth
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Birim Fiyat *"
                    type="number"
                    value={selectedBirimFiyat}
                    onChange={(e) => setSelectedBirimFiyat(e.target.value)}
                    fullWidth
                    required
                    inputProps={{ min: 0, step: 0.01 }}
                    placeholder="Fiyat girin..."
                  />
                </Grid>
                
                <Grid item xs={12} sm={2}>
                  <Button
                    onClick={addToSepet}
                    variant="contained"
                    startIcon={<Add />}
                    fullWidth
                    sx={{ height: '56px' }}
                    disabled={
                      !selectedUrun || 
                      !selectedMiktar || 
                      parseFloat(selectedMiktar) <= 0 ||
                      !selectedBirimFiyat ||
                      parseFloat(selectedBirimFiyat) <= 0
                    }
                  >
                    Ekle
                  </Button>
                </Grid>
                
                {/* Sepet Listesi */}
                {urunSepeti.length > 0 && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, bgcolor: '#f8f9fc' }}>
                      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Sepetteki Ürünler:
                      </Typography>
                      <List dense>
                        {urunSepeti.map((item, index) => (
                          <ListItem key={`${item.urun_id}-${index}`} sx={{ bgcolor: 'white', mb: 1, borderRadius: 1 }}>
                            <ListItemText
                              primary={item.urun_adi}
                              secondary={`${item.miktar} ${item.birim_kisaltma} × ${item.birim_fiyat} TL = ${item.toplam.toLocaleString('tr-TR')} TL`}
                            />
                            <ListItemSecondaryAction>
                              <IconButton 
                                edge="end" 
                                onClick={() => removeFromSepet(item.urun_id)}
                                color="error"
                                size="small"
                              >
                                <Delete />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" color="primary">
                          💰 Toplam: {parseFloat(borcFormData.tutar || 0).toLocaleString('tr-TR')} TL
                        </Typography>
                        <Button 
                          onClick={clearSepet} 
                          color="error" 
                          startIcon={<Delete />}
                          size="small"
                        >
                          Sepeti Temizle
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                )}
              </>
            )}
            
            <Grid item xs={12}>
              <TextField
                label="Açıklama"
                value={borcFormData.aciklama}
                onChange={(e) => setBorcFormData({ ...borcFormData, aciklama: e.target.value })}
                multiline
                rows={3}
                fullWidth
                placeholder="Alım/gider ile ilgili detay bilgi..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBorcClose}>İptal</Button>
          <Button 
            onClick={handleBorcSubmit} 
            variant="contained"
            disabled={
              !borcFormData.tutar || 
              parseFloat(borcFormData.tutar) <= 0 || 
              !borcFormData.hareket_tarihi ||
              (borcFormData.is_satis && urunSepeti.length === 0)
            }
            sx={{ bgcolor: '#f44336', '&:hover': { bgcolor: '#d32f2f' } }}
          >
            {borcFormData.is_satis ? 
              (hesapBilgi.tipi === 'Müşteri' ? 'Satış Yap & Kaydet' : 'Alım Yap & Kaydet') : 
              'Borç Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alacak Ekleme Modal */}
      <Dialog open={openAlacak} onClose={handleAlacakClose} maxWidth="sm" fullWidth>
        <DialogTitle>Alacak (Ödeme) Ekle</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Tutar *"
                type="number"
                value={alacakFormData.tutar}
                onChange={(e) => setAlacakFormData({ ...alacakFormData, tutar: e.target.value })}
                fullWidth
                required
                inputProps={{ min: 0, step: 0.01 }}
                helperText="Ödeme/tahsilat tutarı"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Ödeme Tipi *</InputLabel>
                <Select
                  value={alacakFormData.odeme_tipi}
                  onChange={(e) => setAlacakFormData({ ...alacakFormData, odeme_tipi: e.target.value })}
                  label="Ödeme Tipi *"
                >
                  <MenuItem value="Nakit">💵 Nakit</MenuItem>
                  <MenuItem value="Kart">💳 Kredi/Banka Kartı</MenuItem>
                  <MenuItem value="Transfer">🏦 Banka Havalesi</MenuItem>
                  <MenuItem value="Yemek Çeki">🍽️ Yemek Çeki</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="İşlem Tarihi *"
                type="date"
                value={alacakFormData.hareket_tarihi}
                onChange={(e) => setAlacakFormData({ ...alacakFormData, hareket_tarihi: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Açıklama"
                value={alacakFormData.aciklama}
                onChange={(e) => setAlacakFormData({ ...alacakFormData, aciklama: e.target.value })}
                multiline
                rows={3}
                fullWidth
                placeholder="Ödeme/tahsilat ile ilgili detay bilgi..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAlacakClose}>İptal</Button>
          <Button 
            onClick={handleAlacakSubmit} 
            variant="contained"
            disabled={
              !alacakFormData.tutar || 
              parseFloat(alacakFormData.tutar) <= 0 || 
              !alacakFormData.hareket_tarihi ||
              !alacakFormData.odeme_tipi
            }
            sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}
          >
            Alacak Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CariHesapDetay; 