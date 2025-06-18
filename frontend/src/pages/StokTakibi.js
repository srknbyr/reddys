import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Alert,
  Avatar,
  Collapse,
  Badge
} from '@mui/material';
import { 
  Edit, 
  Delete, 
  Add, 
  TrendingUp, 
  TrendingDown, 
  Warning,
  Inventory,
  ShoppingCart,
  LocalShipping,
  Home,
  FilterList,
  Clear,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const StokTakibi = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [urunler, setUrunler] = useState([]);
  const [hareketler, setHareketler] = useState([]);
  const [kritikStoklar, setKritikStoklar] = useState([]);
  const [kategoriler, setKategoriler] = useState([]);
  const [birimler, setBirimler] = useState([]);
  
  const [urunDialog, setUrunDialog] = useState(false);
  const [hareketDialog, setHareketDialog] = useState(false);
  const [kategoriDialog, setKategoriDialog] = useState(false);
  const [birimDialog, setBirimDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [urunForm, setUrunForm] = useState({
    urun_adi: '',
    barkod: '',
    kategori_id: '',
    birim_id: '',
    minimum_stok: 0,
    durum: 'Aktif'
  });

  const [hareketForm, setHareketForm] = useState({
    urun_id: '',
    hareket_tipi: 'Giriş',
    miktar: '',
    aciklama: ''
  });

  const [kategoriForm, setKategoriForm] = useState({
    kategori_adi: '',
    durum: 'Aktif'
  });

  const [birimForm, setBirimForm] = useState({
    birim_adi: '',
    kisaltma: ''
  });

  // Ürün listesi filtre state'leri
  const [showUrunFilters, setShowUrunFilters] = useState(false);
  const [urunFilters, setUrunFilters] = useState({
    urun_adi: '',
    barkod: '',
    kategori_id: '',
    min_stok: '',
    max_stok: '',
    stok_durumu: '', // 'normal', 'kritik', 'yeterli'
    durum: ''
  });
  const [filteredUrunler, setFilteredUrunler] = useState([]);

  // Stok hareketleri filtre state'leri
  const [showHareketFilters, setShowHareketFilters] = useState(false);
  const [hareketFilters, setHareketFilters] = useState({
    baslangic_tarihi: '',
    bitis_tarihi: '',
    urun_id: '',
    hareket_tipi: '',
    aciklama: ''
  });
  const [filteredHareketler, setFilteredHareketler] = useState([]);

  // Kritik stoklar filtre state'leri
  const [showKritikFilters, setShowKritikFilters] = useState(false);
  const [kritikFilters, setKritikFilters] = useState({
    urun_adi: '',
    kategori_id: '',
    min_stok_farki: '', // Minimum stok ile mevcut stok arasındaki fark
    max_stok_miktari: ''
  });
  const [filteredKritikStoklar, setFilteredKritikStoklar] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [urunResponse, hareketResponse, kritikResponse, kategoriResponse, birimResponse] = await Promise.all([
        axios.get('http://localhost:8000/stok/urunler-detay'),
        axios.get('http://localhost:8000/stok/hareketler'),
        axios.get('http://localhost:8000/stok/kritik-stoklar'),
        axios.get('http://localhost:8000/stok/kategoriler'),
        axios.get('http://localhost:8000/stok/birimler')
      ]);

      setUrunler(urunResponse.data);
      setHareketler(hareketResponse.data);
      setKritikStoklar(kritikResponse.data);
      setKategoriler(kategoriResponse.data);
      setBirimler(birimResponse.data);
    } catch (error) {
      console.error('Veriler yüklenemedi:', error);
      // Demo veriler
      setUrunler([
        {
          id: 1,
          urun_adi: 'Türk Kahvesi',
          barkod: '1234567890',
          kategori_adi: 'İçecekler',
          birim_adi: 'Kilogram',
          birim_kisaltma: 'kg',
          stok_miktari: 5.5,
          minimum_stok: 10,
          durum: 'Aktif'
        },
        {
          id: 2,
          urun_adi: 'Çay',
          barkod: '0987654321',
          kategori_adi: 'İçecekler',
          birim_adi: 'Paket',
          birim_kisaltma: 'pk',
          stok_miktari: 25,
          minimum_stok: 5,
          durum: 'Aktif'
        }
      ]);

      setHareketler([
        {
          id: 1,
          urun_adi: 'Türk Kahvesi',
          hareket_tipi: 'Giriş',
          miktar: 10,
          aciklama: 'Tedarikçiden alım',
          tarih: '2024-07-20T10:00:00'
        }
      ]);

      setKritikStoklar([
        {
          id: 1,
          urun_adi: 'Türk Kahvesi',
          stok_miktari: 5.5,
          minimum_stok: 10,
          kategori_adi: 'İçecekler'
        }
      ]);

      setKategoriler([
        { id: 1, kategori_adi: 'İçecekler' },
        { id: 2, kategori_adi: 'Gıda' }
      ]);

      setBirimler([
        { id: 1, birim_adi: 'Kilogram', kisaltma: 'kg' },
        { id: 2, birim_adi: 'Paket', kisaltma: 'pk' }
      ]);
    }
  };

  const handleUrunSubmit = async () => {
    try {
      if (editingId) {
        await axios.put(`http://localhost:8000/stok/urunler-detay/${editingId}`, urunForm);
      } else {
        await axios.post('http://localhost:8000/stok/urunler', urunForm);
      }
      handleUrunClose();
      fetchData();
    } catch (error) {
      console.error('Ürün kaydedilemedi:', error);
      alert('Hata: ' + (error.response?.data?.detail || 'Bilinmeyen bir hata oluştu'));
    }
  };

  const handleHareketSubmit = async () => {
    try {
      await axios.post('http://localhost:8000/stok/hareket', hareketForm);
      handleHareketClose();
      fetchData();
    } catch (error) {
      console.error('Hareket kaydedilemedi:', error);
      alert('Hata: ' + (error.response?.data?.detail || 'Bilinmeyen bir hata oluştu'));
    }
  };

  const handleUrunEdit = (urun) => {
    setEditingId(urun.id);
    setUrunForm({
      urun_adi: urun.urun_adi,
      barkod: urun.barkod || '',
      kategori_id: urun.kategori_id,
      birim_id: urun.birim_id,
      minimum_stok: urun.minimum_stok,
      durum: urun.durum
    });
    setUrunDialog(true);
  };

  const handleUrunDelete = async (id) => {
    if (window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
      try {
        await axios.delete(`http://localhost:8000/stok/urunler-detay/${id}`);
        fetchData();
      } catch (error) {
        console.error('Ürün silinemedi:', error);
        alert('Hata: ' + (error.response?.data?.detail || 'Ürün silinemedi'));
      }
    }
  };

  const handleUrunClose = () => {
    setUrunDialog(false);
    setEditingId(null);
    setUrunForm({
      urun_adi: '',
      barkod: '',
      kategori_id: '',
      birim_id: '',
      minimum_stok: 0,
      durum: 'Aktif'
    });
  };

  const handleHareketClose = () => {
    setHareketDialog(false);
    setHareketForm({
      urun_id: '',
      hareket_tipi: 'Giriş',
      miktar: '',
      aciklama: ''
    });
  };

  const handleKategoriSubmit = async () => {
    try {
      await axios.post('http://localhost:8000/stok/kategoriler', kategoriForm);
      handleKategoriClose();
      fetchData();
    } catch (error) {
      console.error('Kategori kaydedilemedi:', error);
      alert('Hata: ' + (error.response?.data?.detail || 'Bilinmeyen bir hata oluştu'));
    }
  };

  const handleKategoriClose = () => {
    setKategoriDialog(false);
    setKategoriForm({
      kategori_adi: '',
      durum: 'Aktif'
    });
  };

  const handleBirimSubmit = async () => {
    try {
      await axios.post('http://localhost:8000/stok/birimler', birimForm);
      handleBirimClose();
      fetchData();
    } catch (error) {
      console.error('Birim kaydedilemedi:', error);
      alert('Hata: ' + (error.response?.data?.detail || 'Bilinmeyen bir hata oluştu'));
    }
  };

  const handleBirimClose = () => {
    setBirimDialog(false);
    setBirimForm({
      birim_adi: '',
      kisaltma: ''
    });
  };

  const formatTutar = (tutar) => {
    return `${tutar.toLocaleString('tr-TR')} TL`;
  };

  const formatTarih = (tarih) => {
    return new Date(tarih).toLocaleString('tr-TR');
  };

  const getStokDurumu = (mevcutStok, minimumStok) => {
    if (mevcutStok <= minimumStok) {
      return { color: 'error', label: 'Kritik' };
    } else if (mevcutStok <= minimumStok * 1.5) {
      return { color: 'warning', label: 'Düşük' };
    } else {
      return { color: 'success', label: 'Normal' };
    }
  };

  // Ürün filtre fonksiyonları
  const applyUrunFilters = useCallback(() => {
    let filtered = [...urunler];

    // Ürün adı filtresi
    if (urunFilters.urun_adi.trim()) {
      const searchTerm = urunFilters.urun_adi.toLowerCase().trim();
      filtered = filtered.filter(u => 
        u.urun_adi.toLowerCase().includes(searchTerm)
      );
    }

    // Barkod filtresi
    if (urunFilters.barkod.trim()) {
      const searchTerm = urunFilters.barkod.toLowerCase().trim();
      filtered = filtered.filter(u => 
        (u.barkod || '').toLowerCase().includes(searchTerm)
      );
    }

    // Kategori filtresi
    if (urunFilters.kategori_id) {
      const kategori = kategoriler.find(k => k.id == urunFilters.kategori_id);
      if (kategori) {
        filtered = filtered.filter(u => 
          u.kategori_adi === kategori.kategori_adi
        );
      }
    }

    // Stok miktarı filtresi
    if (urunFilters.min_stok) {
      filtered = filtered.filter(u => u.stok_miktari >= parseFloat(urunFilters.min_stok));
    }
    if (urunFilters.max_stok) {
      filtered = filtered.filter(u => u.stok_miktari <= parseFloat(urunFilters.max_stok));
    }

    // Stok durumu filtresi
    if (urunFilters.stok_durumu) {
      filtered = filtered.filter(u => {
        const stokDurum = getStokDurumu(u.stok_miktari, u.minimum_stok);
        if (urunFilters.stok_durumu === 'kritik') {
          return stokDurum.label === 'Kritik';
        } else if (urunFilters.stok_durumu === 'dusuk') {
          return stokDurum.label === 'Düşük';
        } else if (urunFilters.stok_durumu === 'normal') {
          return stokDurum.label === 'Normal';
        }
        return true;
      });
    }

    // Durum filtresi
    if (urunFilters.durum) {
      filtered = filtered.filter(u => u.durum === urunFilters.durum);
    }

    setFilteredUrunler(filtered);
  }, [urunler, urunFilters, kategoriler]);

  const clearUrunFilters = () => {
    setUrunFilters({
      urun_adi: '',
      barkod: '',
      kategori_id: '',
      min_stok: '',
      max_stok: '',
      stok_durumu: '',
      durum: ''
    });
    setFilteredUrunler(urunler);
  };

  const getActiveUrunFilterCount = () => {
    return Object.values(urunFilters).filter(value => value && value.toString().trim()).length;
  };

  // Stok hareketleri filtre fonksiyonları
  const applyHareketFilters = useCallback(() => {
    let filtered = [...hareketler];

    // Tarih aralığı filtresi
    if (hareketFilters.baslangic_tarihi) {
      const baslangic = new Date(hareketFilters.baslangic_tarihi);
      filtered = filtered.filter(h => new Date(h.tarih) >= baslangic);
    }
    if (hareketFilters.bitis_tarihi) {
      const bitis = new Date(hareketFilters.bitis_tarihi);
      bitis.setHours(23, 59, 59); // Günün sonuna kadar
      filtered = filtered.filter(h => new Date(h.tarih) <= bitis);
    }

    // Ürün filtresi
    if (hareketFilters.urun_id) {
      const urun = urunler.find(u => u.id == hareketFilters.urun_id);
      if (urun) {
        filtered = filtered.filter(h => h.urun_adi === urun.urun_adi);
      }
    }

    // Hareket tipi filtresi
    if (hareketFilters.hareket_tipi) {
      filtered = filtered.filter(h => h.hareket_tipi === hareketFilters.hareket_tipi);
    }

    // Açıklama filtresi
    if (hareketFilters.aciklama.trim()) {
      const searchTerm = hareketFilters.aciklama.toLowerCase().trim();
      filtered = filtered.filter(h => 
        (h.aciklama || '').toLowerCase().includes(searchTerm)
      );
    }

    setFilteredHareketler(filtered);
  }, [hareketler, hareketFilters, urunler]);

  const clearHareketFilters = () => {
    setHareketFilters({
      baslangic_tarihi: '',
      bitis_tarihi: '',
      urun_id: '',
      hareket_tipi: '',
      aciklama: ''
    });
    setFilteredHareketler(hareketler);
  };

  const getActiveHareketFilterCount = () => {
    return Object.values(hareketFilters).filter(value => value && value.toString().trim()).length;
  };

  // Kritik stoklar filtre fonksiyonları
  const applyKritikFilters = useCallback(() => {
    let filtered = [...kritikStoklar];

    // Ürün adı filtresi
    if (kritikFilters.urun_adi.trim()) {
      const searchTerm = kritikFilters.urun_adi.toLowerCase().trim();
      filtered = filtered.filter(k => 
        k.urun_adi.toLowerCase().includes(searchTerm)
      );
    }

    // Kategori filtresi
    if (kritikFilters.kategori_id) {
      const kategori = kategoriler.find(kat => kat.id == kritikFilters.kategori_id);
      if (kategori) {
        filtered = filtered.filter(k => k.kategori_adi === kategori.kategori_adi);
      }
    }

    // Stok farkı filtresi (minimum stok - mevcut stok)
    if (kritikFilters.min_stok_farki) {
      const minFark = parseFloat(kritikFilters.min_stok_farki);
      filtered = filtered.filter(k => (k.minimum_stok - k.stok_miktari) >= minFark);
    }

    // Maksimum stok miktarı filtresi
    if (kritikFilters.max_stok_miktari) {
      const maxStok = parseFloat(kritikFilters.max_stok_miktari);
      filtered = filtered.filter(k => k.stok_miktari <= maxStok);
    }

    setFilteredKritikStoklar(filtered);
  }, [kritikStoklar, kritikFilters, kategoriler]);

  const clearKritikFilters = () => {
    setKritikFilters({
      urun_adi: '',
      kategori_id: '',
      min_stok_farki: '',
      max_stok_miktari: ''
    });
    setFilteredKritikStoklar(kritikStoklar);
  };

  const getActiveKritikFilterCount = () => {
    return Object.values(kritikFilters).filter(value => value && value.toString().trim()).length;
  };

  // useEffect'ler
  useEffect(() => {
    if (urunler.length > 0) {
      applyUrunFilters();
    } else {
      setFilteredUrunler([]);
    }
  }, [urunler, urunFilters, applyUrunFilters]);

  useEffect(() => {
    if (hareketler.length > 0) {
      applyHareketFilters();
    } else {
      setFilteredHareketler([]);
    }
  }, [hareketler, hareketFilters, applyHareketFilters]);

  useEffect(() => {
    if (kritikStoklar.length > 0) {
      applyKritikFilters();
    } else {
      setFilteredKritikStoklar([]);
    }
  }, [kritikStoklar, kritikFilters, applyKritikFilters]);

  return (
    <Box sx={{ p: 4 }}>
      {/* Başlık */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0d0f1c', mb: 1 }}>
              📦 Stok Takibi
            </Typography>
            <Typography variant="body1" sx={{ color: '#47569e' }}>
              Ürün stoklarınızı yönetin, giriş/çıkış hareketlerini takip edin.
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

      {/* Kritik Stok Uyarısı */}
      {kritikStoklar.length > 0 && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          icon={<Warning />}
        >
          {kritikStoklar.length} ürünün stoğu kritik seviyede! Acil tedarik gerekiyor.
        </Alert>
      )}

      {/* Özet Kartları */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Toplam Ürün
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#607afb' }}>
                    {urunler.length}
                  </Typography>
                </Box>
                <Inventory sx={{ fontSize: 40, color: '#607afb' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Kritik Stok
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                    {kritikStoklar.length}
                  </Typography>
                </Box>
                <Warning sx={{ fontSize: 40, color: 'error.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Toplam Hareket
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#28a745' }}>
                    {hareketler.length}
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: '#28a745' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Aktif Ürün
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ffc107' }}>
                    {urunler.filter(u => u.durum === 'Aktif').length}
                  </Typography>
                </Box>
                <ShoppingCart sx={{ fontSize: 40, color: '#ffc107' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tab Yapısı */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Ürün Listesi" />
          <Tab label="Stok Hareketleri" />
          <Tab label="Kritik Stoklar" />
        </Tabs>
      </Box>

      {/* Ürün Listesi Tab */}
      {tabValue === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>
              Ürün Listesi
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => setShowUrunFilters(!showUrunFilters)}
                sx={{
                  color: '#607afb',
                  borderColor: '#607afb',
                  '&:hover': { bgcolor: '#607afb', color: 'white' },
                  textTransform: 'none',
                  fontWeight: 'bold'
                }}
              >
                {showUrunFilters ? (
                  <>
                    <ExpandLess sx={{ ml: 1 }} />
                    Filtreleri Gizle
                  </>
                ) : (
                  <>
                    <ExpandMore sx={{ ml: 1 }} />
                    {getActiveUrunFilterCount() > 0 && (
                      <Badge badgeContent={getActiveUrunFilterCount()} color="error" sx={{ ml: 1 }} />
                    )}
                    Filtreler
                  </>
                )}
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setUrunDialog(true)}
                sx={{
                  bgcolor: '#607afb',
                  '&:hover': { bgcolor: '#5068e5' },
                  textTransform: 'none',
                  fontWeight: 'bold'
                }}
              >
                Yeni Ürün Ekle
              </Button>
            </Box>
          </Box>

          {/* Filtre Paneli */}
          <Collapse in={showUrunFilters}>
            <Card sx={{ mb: 3, border: '1px solid #ced2e9', bgcolor: '#fafbfe' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>
                    🔍 Filtreler
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<Clear />}
                    onClick={clearUrunFilters}
                    sx={{ color: '#607afb', textTransform: 'none' }}
                  >
                    Temizle
                  </Button>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      label="Ürün Adı"
                      value={urunFilters.urun_adi}
                      onChange={(e) => setUrunFilters({...urunFilters, urun_adi: e.target.value})}
                      variant="outlined"
                      size="small"
                      placeholder="Ürün adı ile ara..."
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      label="Barkod"
                      value={urunFilters.barkod}
                      onChange={(e) => setUrunFilters({...urunFilters, barkod: e.target.value})}
                      variant="outlined"
                      size="small"
                      placeholder="Barkod ile ara..."
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Kategori</InputLabel>
                      <Select
                        value={urunFilters.kategori_id}
                        onChange={(e) => setUrunFilters({...urunFilters, kategori_id: e.target.value})}
                        label="Kategori"
                      >
                        <MenuItem value="">Tüm Kategoriler</MenuItem>
                        {kategoriler.map(kategori => (
                          <MenuItem key={kategori.id} value={kategori.id}>
                            {kategori.kategori_adi}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Min Stok"
                      type="number"
                      value={urunFilters.min_stok}
                      onChange={(e) => setUrunFilters({...urunFilters, min_stok: e.target.value})}
                      variant="outlined"
                      size="small"
                      placeholder="0"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Max Stok"
                      type="number"
                      value={urunFilters.max_stok}
                      onChange={(e) => setUrunFilters({...urunFilters, max_stok: e.target.value})}
                      variant="outlined"
                      size="small"
                      placeholder="1000"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Stok Durumu</InputLabel>
                      <Select
                        value={urunFilters.stok_durumu}
                        onChange={(e) => setUrunFilters({...urunFilters, stok_durumu: e.target.value})}
                        label="Stok Durumu"
                      >
                        <MenuItem value="">Tümü</MenuItem>
                        <MenuItem value="kritik">Kritik</MenuItem>
                        <MenuItem value="dusuk">Düşük</MenuItem>
                        <MenuItem value="normal">Normal</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Durum</InputLabel>
                      <Select
                        value={urunFilters.durum}
                        onChange={(e) => setUrunFilters({...urunFilters, durum: e.target.value})}
                        label="Durum"
                      >
                        <MenuItem value="">Tümü</MenuItem>
                        <MenuItem value="Aktif">Aktif</MenuItem>
                        <MenuItem value="Pasif">Pasif</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                
                {/* Filtre İstatistikleri */}
                {getActiveUrunFilterCount() > 0 && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: '#e8f4fd', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ color: '#0d0f1c' }}>
                      📊 <strong>{filteredUrunler.length}</strong> ürün gösteriliyor 
                      (Toplam: {urunler.length})
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Collapse>

          <TableContainer component={Paper} sx={{ border: '1px solid #ced2e9' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8f9fc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Ürün Adı</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Barkod</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Kategori</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Stok</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Durum</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUrunler.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography sx={{ color: '#47569e' }}>
                        {getActiveUrunFilterCount() > 0 
                          ? '🔍 Filtre kriterlerinize uygun ürün bulunamadı.'
                          : '📦 Henüz ürün eklenmemiş.'
                        }
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUrunler.map((urun) => {
                    const stokDurum = getStokDurumu(urun.stok_miktari, urun.minimum_stok);
                    return (
                      <TableRow key={urun.id} sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                        <TableCell sx={{ color: '#0d0f1c', fontWeight: 'medium' }}>
                          {urun.urun_adi}
                        </TableCell>
                        <TableCell sx={{ color: '#47569e' }}>
                          {urun.barkod || '-'}
                        </TableCell>
                        <TableCell sx={{ color: '#47569e' }}>
                          {urun.kategori_adi}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ color: stokDurum.color }}>
                              {urun.stok_miktari} {urun.birim_kisaltma}
                            </Typography>
                            <Chip
                              label={stokDurum.label}
                              color={stokDurum.color}
                              variant="outlined"
                              size="small"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={urun.durum}
                            color={urun.durum === 'Aktif' ? 'success' : 'default'}
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                        <Tooltip title="Düzenle">
                          <IconButton onClick={() => handleUrunEdit(urun)} size="small">
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sil">
                          <IconButton onClick={() => handleUrunDelete(urun.id)} size="small" color="error">
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Stok Hareketleri Tab */}
      {tabValue === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>
              Stok Hareketleri
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => setShowHareketFilters(!showHareketFilters)}
                sx={{
                  color: '#607afb',
                  borderColor: '#607afb',
                  '&:hover': { bgcolor: '#607afb', color: 'white' },
                  textTransform: 'none',
                  fontWeight: 'bold'
                }}
              >
                {showHareketFilters ? (
                  <>
                    <ExpandLess sx={{ ml: 1 }} />
                    Filtreleri Gizle
                  </>
                ) : (
                  <>
                    <ExpandMore sx={{ ml: 1 }} />
                    {getActiveHareketFilterCount() > 0 && (
                      <Badge badgeContent={getActiveHareketFilterCount()} color="error" sx={{ ml: 1 }} />
                    )}
                    Filtreler
                  </>
                )}
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setHareketDialog(true)}
                sx={{
                  bgcolor: '#28a745',
                  '&:hover': { bgcolor: '#218838' },
                  textTransform: 'none',
                  fontWeight: 'bold'
                }}
              >
                Stok Hareketi Ekle
              </Button>
            </Box>
          </Box>

          {/* Filtre Paneli */}
          <Collapse in={showHareketFilters}>
            <Card sx={{ mb: 3, border: '1px solid #ced2e9', bgcolor: '#fafbfe' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>
                    🔍 Filtreler
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<Clear />}
                    onClick={clearHareketFilters}
                    sx={{ color: '#607afb', textTransform: 'none' }}
                  >
                    Temizle
                  </Button>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Başlangıç Tarihi"
                      type="date"
                      value={hareketFilters.baslangic_tarihi}
                      onChange={(e) => setHareketFilters({...hareketFilters, baslangic_tarihi: e.target.value})}
                      variant="outlined"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Bitiş Tarihi"
                      type="date"
                      value={hareketFilters.bitis_tarihi}
                      onChange={(e) => setHareketFilters({...hareketFilters, bitis_tarihi: e.target.value})}
                      variant="outlined"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Ürün</InputLabel>
                      <Select
                        value={hareketFilters.urun_id}
                        onChange={(e) => setHareketFilters({...hareketFilters, urun_id: e.target.value})}
                        label="Ürün"
                      >
                        <MenuItem value="">Tüm Ürünler</MenuItem>
                        {urunler.map(urun => (
                          <MenuItem key={urun.id} value={urun.id}>
                            {urun.urun_adi}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Hareket Tipi</InputLabel>
                      <Select
                        value={hareketFilters.hareket_tipi}
                        onChange={(e) => setHareketFilters({...hareketFilters, hareket_tipi: e.target.value})}
                        label="Hareket Tipi"
                      >
                        <MenuItem value="">Tümü</MenuItem>
                        <MenuItem value="Giriş">Giriş</MenuItem>
                        <MenuItem value="Çıkış">Çıkış</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Açıklama"
                      value={hareketFilters.aciklama}
                      onChange={(e) => setHareketFilters({...hareketFilters, aciklama: e.target.value})}
                      variant="outlined"
                      size="small"
                      placeholder="Açıklama ile ara..."
                    />
                  </Grid>
                </Grid>
                
                {/* Filtre İstatistikleri */}
                {getActiveHareketFilterCount() > 0 && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: '#e8f4fd', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ color: '#0d0f1c' }}>
                      📊 <strong>{filteredHareketler.length}</strong> hareket gösteriliyor 
                      (Toplam: {hareketler.length})
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Collapse>

          <TableContainer component={Paper} sx={{ border: '1px solid #ced2e9' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8f9fc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Tarih</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Ürün</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Tip</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Miktar</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Açıklama</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredHareketler.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography sx={{ color: '#47569e' }}>
                        {getActiveHareketFilterCount() > 0 
                          ? '🔍 Filtre kriterlerinize uygun hareket bulunamadı.'
                          : '📊 Henüz stok hareketi eklenmemiş.'
                        }
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHareketler.map((hareket) => (
                  <TableRow key={hareket.id} sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                    <TableCell sx={{ color: '#47569e' }}>
                      {formatTarih(hareket.tarih)}
                    </TableCell>
                    <TableCell sx={{ color: '#0d0f1c', fontWeight: 'medium' }}>
                      {hareket.urun_adi}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={hareket.hareket_tipi}
                        color={hareket.hareket_tipi === 'Giriş' ? 'success' : 'error'}
                        variant="outlined"
                        size="small"
                        icon={hareket.hareket_tipi === 'Giriş' ? <TrendingUp /> : <TrendingDown />}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#47569e' }}>
                      {hareket.miktar}
                    </TableCell>
                    <TableCell sx={{ color: '#47569e' }}>
                      {hareket.aciklama || '-'}
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Kritik Stoklar Tab */}
      {tabValue === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>
              Kritik Stok Seviyeleri
            </Typography>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setShowKritikFilters(!showKritikFilters)}
              sx={{
                color: '#607afb',
                borderColor: '#607afb',
                '&:hover': { bgcolor: '#607afb', color: 'white' },
                textTransform: 'none',
                fontWeight: 'bold'
              }}
            >
              {showKritikFilters ? (
                <>
                  <ExpandLess sx={{ ml: 1 }} />
                  Filtreleri Gizle
                </>
              ) : (
                <>
                  <ExpandMore sx={{ ml: 1 }} />
                  {getActiveKritikFilterCount() > 0 && (
                    <Badge badgeContent={getActiveKritikFilterCount()} color="error" sx={{ ml: 1 }} />
                  )}
                  Filtreler
                </>
              )}
            </Button>
          </Box>

          {/* Filtre Paneli */}
          <Collapse in={showKritikFilters}>
            <Card sx={{ mb: 3, border: '1px solid #ced2e9', bgcolor: '#fafbfe' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>
                    🔍 Filtreler
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<Clear />}
                    onClick={clearKritikFilters}
                    sx={{ color: '#607afb', textTransform: 'none' }}
                  >
                    Temizle
                  </Button>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      label="Ürün Adı"
                      value={kritikFilters.urun_adi}
                      onChange={(e) => setKritikFilters({...kritikFilters, urun_adi: e.target.value})}
                      variant="outlined"
                      size="small"
                      placeholder="Ürün adı ile ara..."
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Kategori</InputLabel>
                      <Select
                        value={kritikFilters.kategori_id}
                        onChange={(e) => setKritikFilters({...kritikFilters, kategori_id: e.target.value})}
                        label="Kategori"
                      >
                        <MenuItem value="">Tüm Kategoriler</MenuItem>
                        {kategoriler.map(kategori => (
                          <MenuItem key={kategori.id} value={kategori.id}>
                            {kategori.kategori_adi}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      fullWidth
                      label="Min Eksiklik"
                      type="number"
                      value={kritikFilters.min_stok_farki}
                      onChange={(e) => setKritikFilters({...kritikFilters, min_stok_farki: e.target.value})}
                      variant="outlined"
                      size="small"
                      placeholder="0"
                      helperText="Min-Mevcut fark"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      fullWidth
                      label="Max Stok"
                      type="number"
                      value={kritikFilters.max_stok_miktari}
                      onChange={(e) => setKritikFilters({...kritikFilters, max_stok_miktari: e.target.value})}
                      variant="outlined"
                      size="small"
                      placeholder="100"
                      helperText="Mevcut stok max"
                    />
                  </Grid>
                </Grid>
                
                {/* Filtre İstatistikleri */}
                {getActiveKritikFilterCount() > 0 && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: '#ffe8e8', borderRadius: 1, border: '1px solid #ffcccb' }}>
                    <Typography variant="body2" sx={{ color: '#0d0f1c' }}>
                      ⚠️ <strong>{filteredKritikStoklar.length}</strong> kritik ürün gösteriliyor 
                      (Toplam: {kritikStoklar.length})
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Collapse>

          {filteredKritikStoklar.length === 0 ? (
            <Alert severity={getActiveKritikFilterCount() > 0 ? "info" : "success"}>
              {getActiveKritikFilterCount() > 0 
                ? '🔍 Filtre kriterlerinize uygun kritik stok bulunamadı.'
                : 'Kritik seviyede stok bulunmuyor!'
              }
            </Alert>
          ) : (
            <TableContainer component={Paper} sx={{ border: '1px solid #ced2e9' }}>
              <Table>
                <TableHead sx={{ bgcolor: '#fff3cd' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Ürün Adı</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Kategori</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Mevcut Stok</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Minimum Stok</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Durum</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredKritikStoklar.map((urun) => (
                    <TableRow key={urun.id} sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                      <TableCell sx={{ color: '#0d0f1c', fontWeight: 'medium' }}>
                        {urun.urun_adi}
                      </TableCell>
                      <TableCell sx={{ color: '#47569e' }}>
                        {urun.kategori_adi}
                      </TableCell>
                      <TableCell sx={{ color: 'error.main', fontWeight: 'bold' }}>
                        {urun.stok_miktari}
                      </TableCell>
                      <TableCell sx={{ color: '#47569e' }}>
                        {urun.minimum_stok}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label="Kritik"
                          color="error"
                          variant="outlined"
                          size="small"
                          icon={<Warning />}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Ürün Ekleme/Düzenleme Dialog */}
      <Dialog open={urunDialog} onClose={handleUrunClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingId ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Ürün Adı *"
                value={urunForm.urun_adi}
                onChange={(e) => setUrunForm({ ...urunForm, urun_adi: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Barkod"
                value={urunForm.barkod}
                onChange={(e) => setUrunForm({ ...urunForm, barkod: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FormControl fullWidth>
                  <InputLabel>Kategori *</InputLabel>
                  <Select
                    value={urunForm.kategori_id}
                    onChange={(e) => setUrunForm({ ...urunForm, kategori_id: e.target.value })}
                    label="Kategori *"
                  >
                    {kategoriler.map((kategori) => (
                      <MenuItem key={kategori.id} value={kategori.id}>
                        {kategori.kategori_adi}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Tooltip title="Yeni Kategori Ekle">
                  <IconButton 
                    onClick={() => setKategoriDialog(true)}
                    color="primary"
                    size="large"
                  >
                    <Add />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FormControl fullWidth>
                  <InputLabel>Birim *</InputLabel>
                  <Select
                    value={urunForm.birim_id}
                    onChange={(e) => setUrunForm({ ...urunForm, birim_id: e.target.value })}
                    label="Birim *"
                  >
                    {birimler.map((birim) => (
                      <MenuItem key={birim.id} value={birim.id}>
                        {birim.birim_adi} ({birim.kisaltma})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Tooltip title="Yeni Birim Ekle">
                  <IconButton 
                    onClick={() => setBirimDialog(true)}
                    color="primary"
                    size="large"
                  >
                    <Add />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Minimum Stok"
                type="number"
                value={urunForm.minimum_stok}
                onChange={(e) => setUrunForm({ ...urunForm, minimum_stok: parseFloat(e.target.value) })}
                fullWidth
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUrunClose}>İptal</Button>
          <Button 
            onClick={handleUrunSubmit} 
            variant="contained"
            disabled={!urunForm.urun_adi || !urunForm.kategori_id || !urunForm.birim_id}
          >
            {editingId ? 'Güncelle' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stok Hareketi Dialog */}
      <Dialog open={hareketDialog} onClose={handleHareketClose} maxWidth="sm" fullWidth>
        <DialogTitle>Stok Hareketi Ekle</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 2 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Ürün *</InputLabel>
                <Select
                  value={hareketForm.urun_id}
                  onChange={(e) => setHareketForm({ ...hareketForm, urun_id: e.target.value })}
                  label="Ürün *"
                >
                  {urunler.map((urun) => (
                    <MenuItem key={urun.id} value={urun.id}>
                      {urun.urun_adi} (Stok: {urun.stok_miktari} {urun.birim_kisaltma})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Hareket Tipi *</InputLabel>
                <Select
                  value={hareketForm.hareket_tipi}
                  onChange={(e) => setHareketForm({ ...hareketForm, hareket_tipi: e.target.value })}
                  label="Hareket Tipi *"
                >
                  <MenuItem value="Giriş">📦 Stok Girişi</MenuItem>
                  <MenuItem value="Çıkış">📤 Stok Çıkışı</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Miktar *"
                type="number"
                value={hareketForm.miktar}
                onChange={(e) => setHareketForm({ ...hareketForm, miktar: e.target.value })}
                fullWidth
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Açıklama"
                value={hareketForm.aciklama}
                onChange={(e) => setHareketForm({ ...hareketForm, aciklama: e.target.value })}
                multiline
                rows={3}
                fullWidth
                placeholder="Stok hareketi ile ilgili açıklama..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleHareketClose}>İptal</Button>
          <Button 
            onClick={handleHareketSubmit} 
            variant="contained"
            disabled={!hareketForm.urun_id || !hareketForm.miktar || parseFloat(hareketForm.miktar) <= 0}
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Kategori Ekleme Dialog */}
      <Dialog open={kategoriDialog} onClose={handleKategoriClose} maxWidth="xs" fullWidth>
        <DialogTitle>Yeni Kategori Ekle</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 2 }}>
            <Grid item xs={12}>
              <TextField
                label="Kategori Adı *"
                value={kategoriForm.kategori_adi}
                onChange={(e) => setKategoriForm({ ...kategoriForm, kategori_adi: e.target.value })}
                fullWidth
                required
                placeholder="Örn: İçecekler, Gıda, Temizlik"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleKategoriClose}>İptal</Button>
          <Button 
            onClick={handleKategoriSubmit} 
            variant="contained"
            disabled={!kategoriForm.kategori_adi.trim()}
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Birim Ekleme Dialog */}
      <Dialog open={birimDialog} onClose={handleBirimClose} maxWidth="xs" fullWidth>
        <DialogTitle>Yeni Birim Ekle</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 2 }}>
            <Grid item xs={12}>
              <TextField
                label="Birim Adı *"
                value={birimForm.birim_adi}
                onChange={(e) => setBirimForm({ ...birimForm, birim_adi: e.target.value })}
                fullWidth
                required
                placeholder="Örn: Kilogram, Litre, Adet"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Kısaltma *"
                value={birimForm.kisaltma}
                onChange={(e) => setBirimForm({ ...birimForm, kisaltma: e.target.value })}
                fullWidth
                required
                placeholder="Örn: kg, lt, ad"
                inputProps={{ maxLength: 5 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBirimClose}>İptal</Button>
          <Button 
            onClick={handleBirimSubmit} 
            variant="contained"
            disabled={!birimForm.birim_adi.trim() || !birimForm.kisaltma.trim()}
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StokTakibi; 