import React, { useState, useEffect } from 'react';
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
  Avatar
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
  Home
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

  // Stok değeri hesaplaması kaldırıldı

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
                {urunler.map((urun) => {
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
                })}
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
                {hareketler.map((hareket) => (
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
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Kritik Stoklar Tab */}
      {tabValue === 2 && (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0d0f1c', mb: 2 }}>
            Kritik Stok Seviyeleri
          </Typography>

          {kritikStoklar.length === 0 ? (
            <Alert severity="success">
              Kritik seviyede stok bulunmuyor!
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
                  {kritikStoklar.map((urun) => (
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