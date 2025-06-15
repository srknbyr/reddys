import React, { useState, useEffect } from 'react';
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
  Autocomplete
} from '@mui/material';
import { ArrowBack, Add, Delete, TrendingUp, TrendingDown } from '@mui/icons-material';
import axios from 'axios';

const CariHesapDetay = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [hesapBilgi, setHesapBilgi] = useState(null);
  const [hareketler, setHareketler] = useState([]);
  const [urunler, setUrunler] = useState([]); // Satış için ürün listesi
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    hareket_tipi: 'Borç',
    tutar: '',
    odeme_tipi: 'Satın Alma', // Borç için varsayılan Satın Alma
    hareket_tarihi: new Date().toISOString().split('T')[0],
    aciklama: '',
    is_satis: false,
    urun_id: '',
    miktar: ''
  });

  const [urunSepeti, setUrunSepeti] = useState([]);
  const [selectedUrun, setSelectedUrun] = useState(null);
  const [selectedMiktar, setSelectedMiktar] = useState('');
  const [selectedBirimFiyat, setSelectedBirimFiyat] = useState('');

  useEffect(() => {
    if (id) {
      fetchHesapBilgi();
      fetchHareketler();
      fetchUrunler();
    }
  }, [id]);

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

  const handleSubmit = async () => {
    try {
      const payload = {
        cari_hesap_id: parseInt(id),
        hareket_tipi: formData.hareket_tipi,
        tutar: parseFloat(formData.tutar),
        odeme_tipi: formData.odeme_tipi,
        hareket_tarihi: new Date(formData.hareket_tarihi).toISOString(),
        aciklama: formData.aciklama
      };

      // Çoklu ürün sistemi için sepet kontrolü
      if (formData.is_satis && urunSepeti.length > 0) {
        payload.urun_kalemleri = urunSepeti.map(item => ({
          urun_id: item.urun_id,
          miktar: item.miktar,
          birim_fiyat: item.birim_fiyat
        }));
      }
      // Geriye dönük uyumluluk için tek ürün sistemi
      else if (formData.is_satis && formData.urun_id && formData.miktar) {
        payload.urun_id = parseInt(formData.urun_id);
        payload.miktar = parseFloat(formData.miktar);
      }

      await axios.post('http://localhost:8000/cari-hareket/', payload);
      handleClose();
      fetchHesapBilgi();
      fetchHareketler();
    } catch (error) {
      console.error('Hareket eklenemedi:', error);
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

  const handleClose = () => {
    setOpen(false);
    setFormData({
      hareket_tipi: 'Borç',
      tutar: '',
      odeme_tipi: 'Satın Alma', // Borç için varsayılan Satın Alma
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
    setFormData({ ...formData, tutar: toplam.toString() });
  };

  const clearSepet = () => {
    setUrunSepeti([]);
    setFormData({ ...formData, tutar: '' });
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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Güncel Bakiye
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: getBakiyeColor(hesapBilgi.bakiye) }}>
                    {formatTutar(hesapBilgi.bakiye)}
                  </Typography>
                </Box>
                <Chip 
                  label={hesapBilgi.tipi} 
                  color={hesapBilgi.tipi === 'Müşteri' ? 'primary' : 'secondary'}
                  variant="outlined"
                />
              </Box>
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
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>
          Hareket Geçmişi
        </Typography>
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
            {hareketler.map((hareket) => (
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
                  {hareket.hareket_tipi === 'Borç' ? '+' : '-'}{formatTutar(hareket.tutar)}
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
          </TableBody>
        </Table>
      </TableContainer>

      {/* Hareket Ekleme Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Hareket Ekle</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 2 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Hareket Tipi *</InputLabel>
                <Select
                  value={formData.hareket_tipi}
                  onChange={(e) => {
                    const newHareketTipi = e.target.value;
                    setFormData({ 
                      ...formData, 
                      hareket_tipi: newHareketTipi,
                      // Alacak seçildiğinde satış checkbox'ını temizle
                      is_satis: newHareketTipi === 'Alacak' ? false : formData.is_satis,
                      // Hareket tipine göre ödeme tipini otomatik ayarla
                      odeme_tipi: newHareketTipi === 'Borç' ? 'Satın Alma' : 'Nakit'
                    });
                  }}
                  label="Hareket Tipi *"
                >
                  <MenuItem value="Borç">
                    Borç {hesapBilgi.tipi === 'Müşteri' ? '(Satış/Fatura)' : '(Alım/Gider)'}
                  </MenuItem>
                  <MenuItem value="Alacak">
                    Alacak {hesapBilgi.tipi === 'Müşteri' ? '(Tahsilat)' : '(Ödeme)'}
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Ürün İşlemi Checkbox'ı - Borç işlemleri için */}
            {formData.hareket_tipi === 'Borç' && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.is_satis}
                      onChange={async (e) => {
                        const isChecked = e.target.checked;
                        setFormData({ 
                          ...formData, 
                          is_satis: isChecked,
                          // Checkbox kapatıldığında ürün seçimini temizle
                          urun_id: isChecked ? formData.urun_id : '',
                          miktar: isChecked ? formData.miktar : ''
                        });
                        
                        // Checkbox işaretlendiğinde ürünleri çek
                        if (isChecked) {
                          await fetchUrunler();
                        } else {
                          // Checkbox kapatıldığında sepeti temizle
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
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Tutar *"
                type="number"
                value={formData.tutar}
                onChange={(e) => setFormData({ ...formData, tutar: e.target.value })}
                fullWidth
                required
                inputProps={{ min: 0, step: 0.01 }}
                // Eğer ürün satışı yapılıyorsa tutar readonly olsun
                InputProps={{
                  readOnly: formData.is_satis && urunSepeti.length > 0
                }}
                helperText={formData.is_satis && urunSepeti.length > 0 ? 
                  'Tutar otomatik hesaplanıyor' : 
                  'Manuel tutar girin'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Ödeme Tipi *</InputLabel>
                <Select
                  value={formData.odeme_tipi}
                  onChange={(e) => setFormData({ ...formData, odeme_tipi: e.target.value })}
                  label="Ödeme Tipi *"
                >
                  <MenuItem value="Nakit">💵 Nakit</MenuItem>
                  <MenuItem value="Kart">💳 Kredi/Banka Kartı</MenuItem>
                  <MenuItem value="Transfer">🏦 Banka Havalesi</MenuItem>
                  <MenuItem value="Yemek Çeki">🍽️ Yemek Çeki</MenuItem>
                  <MenuItem value="Satın Alma">🛒 Satın Alma</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {/* Çoklu Ürün Seçimi - Sepet Sistemi */}
            {formData.is_satis && (
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
                          💰 Toplam: {parseFloat(formData.tutar || 0).toLocaleString('tr-TR')} TL
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
                label="İşlem Tarihi *"
                type="date"
                value={formData.hareket_tarihi}
                onChange={(e) => setFormData({ ...formData, hareket_tarihi: e.target.value })}
                fullWidth
                required
                InputLabelProps={{
                  shrink: true,
                }}
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
                placeholder="Ödeme/tahsilat ile ilgili detay bilgi..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>İptal</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={
              !formData.tutar || 
              parseFloat(formData.tutar) <= 0 || 
              !formData.hareket_tarihi ||
              !formData.odeme_tipi ||
              // Çoklu ürün sistemi için validasyon
              (formData.is_satis && urunSepeti.length === 0)
            }
          >
            {formData.is_satis ? 
              (hesapBilgi.tipi === 'Müşteri' ? 'Satış Yap & Kaydet' : 'Alım Yap & Kaydet') : 
              'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CariHesapDetay; 