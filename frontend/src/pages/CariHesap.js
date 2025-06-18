import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Collapse,
  Badge
} from '@mui/material';
import { Edit, Delete, Visibility, Home, FilterList, Clear, ExpandMore, ExpandLess } from '@mui/icons-material';
import axios from 'axios';

const CariHesap = () => {
  const navigate = useNavigate();
  const [cariHesaplar, setCariHesaplar] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    hesap_adi: '',
    tipi: 'Tedarikçi',
    telefon: '',
    email: '',
    adres: '',
    vergi_no: '',
    durum: 'Aktif'
  });

  // Filtre state'leri
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    hesap_adi: '',
    min_bakiye: '',
    max_bakiye: '',
    start_date: '',
    end_date: '',
    durum: ''
  });
  const [filteredCariHesaplar, setFilteredCariHesaplar] = useState([]);

  useEffect(() => {
    fetchCariHesaplar();
  }, []);

  const fetchCariHesaplar = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/cari-hesap/');
      setCariHesaplar(response.data);
    } catch (error) {
      console.error('Cari hesaplar yüklenemedi:', error);
      // Demo veriler
      setCariHesaplar([
        {
          id: 1,
          hesap_adi: 'Müşteri A',
          tipi: 'Müşteri',
          bakiye: 1500,
          telefon: '0532 123 45 67',
          email: 'musteri.a@email.com',
          vergi_no: '12345678901',
          son_hareket_tarihi: '2024-07-20T10:00:00',
          durum: 'Aktif'
        },
        {
          id: 2,
          hesap_adi: 'Tedarikçi B',
          tipi: 'Tedarikçi',
          bakiye: -800,
          telefon: '0212 456 78 90',
          email: 'tedarikci.b@email.com',
          vergi_no: '98765432109',
          son_hareket_tarihi: '2024-07-18T14:30:00',
          durum: 'Aktif'
        },
        {
          id: 3,
          hesap_adi: 'Müşteri C',
          tipi: 'Müşteri',
          bakiye: 2200,
          telefon: '0533 987 65 43',
          email: 'musteri.c@email.com',
          vergi_no: '11122334455',
          son_hareket_tarihi: '2024-07-15T09:15:00',
          durum: 'Pasif'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        // Güncelleme
        await axios.put(`http://localhost:8000/cari-hesap/${editingId}`, formData);
      } else {
        // Yeni ekleme
        await axios.post('http://localhost:8000/cari-hesap/', formData);
      }
      
      handleClose();
      fetchCariHesaplar();
    } catch (error) {
      console.error('Cari hesap kaydedilemedi:', error);
      alert('Hata: ' + (error.response?.data?.detail || 'Bilinmeyen bir hata oluştu'));
    }
  };

  const handleEdit = (hesap) => {
    setEditingId(hesap.id);
    setFormData({
      hesap_adi: hesap.hesap_adi,
      tipi: hesap.tipi,
      telefon: hesap.telefon || '',
      email: hesap.email || '',
      adres: hesap.adres || '',
      vergi_no: hesap.vergi_no || '',
      durum: hesap.durum
    });
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu cari hesabı silmek istediğinizden emin misiniz?')) {
      try {
        await axios.delete(`http://localhost:8000/cari-hesap/${id}`);
        fetchCariHesaplar();
      } catch (error) {
        console.error('Cari hesap silinemedi:', error);
        alert('Hata: Cari hesap silinemedi');
      }
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    setFormData({
      hesap_adi: '',
      tipi: 'Tedarikçi',
      telefon: '',
      email: '',
      adres: '',
      vergi_no: '',
      durum: 'Aktif'
    });
  };

  const formatTarih = (tarih) => {
    return new Date(tarih).toLocaleDateString('tr-TR');
  };

  const formatBakiye = (bakiye) => {
    return `${bakiye.toLocaleString('tr-TR')} TL`;
  };

  const getBakiyeColor = (bakiye) => {
    if (bakiye > 0) return 'success.main';
    if (bakiye < 0) return 'error.main';
    return 'text.secondary';
  };

  // Filtre fonksiyonları
  const applyFilters = useCallback(() => {
    let filtered = [...cariHesaplar];

    // Hesap adı filtresi
    if (filters.hesap_adi.trim()) {
      const searchTerm = filters.hesap_adi.toLowerCase().trim();
      filtered = filtered.filter(h => 
        h.hesap_adi.toLowerCase().includes(searchTerm)
      );
    }

    // Bakiye filtresi
    if (filters.min_bakiye) {
      filtered = filtered.filter(h => h.bakiye >= parseFloat(filters.min_bakiye));
    }
    if (filters.max_bakiye) {
      filtered = filtered.filter(h => h.bakiye <= parseFloat(filters.max_bakiye));
    }

    // Son hareket tarihi filtresi
    if (filters.start_date) {
      filtered = filtered.filter(h => 
        new Date(h.son_hareket_tarihi) >= new Date(filters.start_date)
      );
    }
    if (filters.end_date) {
      filtered = filtered.filter(h => 
        new Date(h.son_hareket_tarihi) <= new Date(filters.end_date)
      );
    }

    // Durum filtresi
    if (filters.durum) {
      filtered = filtered.filter(h => h.durum === filters.durum);
    }

    setFilteredCariHesaplar(filtered);
  }, [cariHesaplar, filters]);

  const clearFilters = () => {
    setFilters({
      hesap_adi: '',
      min_bakiye: '',
      max_bakiye: '',
      start_date: '',
      end_date: '',
      durum: ''
    });
    setFilteredCariHesaplar(cariHesaplar);
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => value && value.toString().trim()).length;
  };

  // useEffect'ler
  useEffect(() => {
    if (cariHesaplar.length > 0) {
      applyFilters();
    } else {
      setFilteredCariHesaplar([]);
    }
  }, [cariHesaplar, filters, applyFilters]);

  return (
    <Box sx={{ p: 4 }}>
      {/* Başlık */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0d0f1c', mb: 1 }}>
              👤 Cari Hesap Yönetimi
            </Typography>
            <Typography variant="body1" sx={{ color: '#47569e' }}>
              Müşteri ve tedarikçi cari hesap hareketlerini takip edin ve yeni hesaplar ekleyin.
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

      {/* Özet Kartları */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Toplam Cari Hesap
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {cariHesaplar.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Aktif Hesaplar
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {cariHesaplar.filter(h => h.durum === 'Aktif').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pasif Hesaplar
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                {cariHesaplar.filter(h => h.durum === 'Pasif').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Toplam Bakiye
              </Typography>
              <Typography variant="h4" sx={{ 
                fontWeight: 'bold', 
                color: getBakiyeColor(cariHesaplar.reduce((sum, h) => sum + (h.bakiye || 0), 0))
              }}>
                {formatBakiye(cariHesaplar.reduce((sum, h) => sum + (h.bakiye || 0), 0))}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tablo Başlığı ve Butonlar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>
            Cari Hesap Listesi
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
              Temizle ({filteredCariHesaplar.length}/{cariHesaplar.length})
            </Button>
          )}
        </Box>
        <Button
          variant="contained"
          onClick={() => setOpen(true)}
          sx={{
            bgcolor: '#607afb',
            '&:hover': { bgcolor: '#5068e5' },
            textTransform: 'none',
            fontWeight: 'bold'
          }}
        >
          Yeni Cari Hesap Ekle
        </Button>
      </Box>

      {/* Filtre Paneli */}
      <Collapse in={showFilters}>
        <Paper sx={{ p: 3, mb: 3, bgcolor: '#f8f9fc', border: '1px solid #ced2e9' }}>
          <Grid container spacing={2}>
            {/* Hesap Adı Arama */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#0d0f1c' }}>
                🔍 Hesap Adı Arama
              </Typography>
              <TextField
                label="Hesap adı ara..."
                size="small"
                value={filters.hesap_adi}
                onChange={(e) => setFilters({ ...filters, hesap_adi: e.target.value })}
                fullWidth
                placeholder="Hesap adı girin..."
              />
            </Grid>

            {/* Bakiye Aralığı */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#0d0f1c' }}>
                💰 Bakiye Aralığı
              </Typography>
              <TextField
                label="Min Bakiye"
                type="number"
                size="small"
                value={filters.min_bakiye}
                onChange={(e) => setFilters({ ...filters, min_bakiye: e.target.value })}
                fullWidth
                inputProps={{ step: 0.01 }}
                sx={{ mb: 1 }}
              />
              <TextField
                label="Max Bakiye"
                type="number"
                size="small"
                value={filters.max_bakiye}
                onChange={(e) => setFilters({ ...filters, max_bakiye: e.target.value })}
                fullWidth
                inputProps={{ step: 0.01 }}
              />
            </Grid>

            {/* Son Hareket Tarihi */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#0d0f1c' }}>
                📅 Son Hareket Tarihi
              </Typography>
              <TextField
                label="Başlangıç"
                type="date"
                size="small"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 1 }}
              />
              <TextField
                label="Bitiş"
                type="date"
                size="small"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Durum */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#0d0f1c' }}>
                📊 Hesap Durumu
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel>Durum Seçin</InputLabel>
                <Select
                  value={filters.durum}
                  onChange={(e) => setFilters({ ...filters, durum: e.target.value })}
                  label="Durum Seçin"
                >
                  <MenuItem value="">Hepsi</MenuItem>
                  <MenuItem value="Aktif">✅ Aktif</MenuItem>
                  <MenuItem value="Pasif">⏸️ Pasif</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Filtre İstatistikleri */}
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #ced2e9' }}>
            <Typography variant="body2" color="textSecondary">
              📊 Toplam {cariHesaplar.length} hesaptan {filteredCariHesaplar.length} tanesi gösteriliyor
              {getActiveFilterCount() > 0 && ` (${getActiveFilterCount()} filtre aktif)`}
            </Typography>
          </Box>
        </Paper>
      </Collapse>

      {/* Tablo */}
      <TableContainer component={Paper} sx={{ border: '1px solid #ced2e9' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8f9fc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Hesap Adı</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Tipi</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Telefon</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Bakiye</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Son Hareket</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>Durum</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#0d0f1c' }}>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCariHesaplar.map((hesap) => (
              <TableRow key={hesap.id} sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                <TableCell 
                  sx={{ 
                    color: '#607afb', 
                    fontWeight: 'medium',
                    cursor: 'pointer',
                    '&:hover': {
                      textDecoration: 'underline',
                      color: '#5068e5'
                    }
                  }}
                  onClick={() => navigate(`/cari-hesap/${hesap.id}`)}
                >
                  {hesap.hesap_adi}
                </TableCell>
                <TableCell>
                  <Chip
                    label="Tedarikçi/Müşteri"
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ color: '#47569e' }}>{hesap.telefon || '-'}</TableCell>
                <TableCell sx={{ color: '#47569e' }}>{hesap.email || '-'}</TableCell>
                <TableCell sx={{ color: getBakiyeColor(hesap.bakiye), fontWeight: 'bold' }}>
                  {formatBakiye(hesap.bakiye)}
                </TableCell>
                <TableCell sx={{ color: '#47569e' }}>
                  {formatTarih(hesap.son_hareket_tarihi)}
                </TableCell>
                <TableCell>
                  <Chip
                    label={hesap.durum}
                    color={hesap.durum === 'Aktif' ? 'success' : 'default'}
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="Düzenle">
                    <IconButton onClick={() => handleEdit(hesap)} size="small">
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Sil">
                    <IconButton onClick={() => handleDelete(hesap.id)} size="small" color="error">
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {filteredCariHesaplar.length === 0 && cariHesaplar.length > 0 && (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="textSecondary">
                    🔍 Filtre kriterlerinize uygun cari hesap bulunamadı
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
            {cariHesaplar.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="textSecondary">
                    👤 Henüz cari hesap kaydı bulunmuyor
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Form Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingId ? 'Cari Hesap Düzenle' : 'Yeni Cari Hesap Ekle'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Hesap Adı *"
                value={formData.hesap_adi}
                onChange={(e) => setFormData({ ...formData, hesap_adi: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Vergi No"
                value={formData.vergi_no}
                onChange={(e) => setFormData({ ...formData, vergi_no: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Telefon"
                value={formData.telefon}
                onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                fullWidth
                type="email"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Durum</InputLabel>
                <Select
                  value={formData.durum}
                  onChange={(e) => setFormData({ ...formData, durum: e.target.value })}
                  label="Durum"
                >
                  <MenuItem value="Aktif">Aktif</MenuItem>
                  <MenuItem value="Pasif">Pasif</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Adres"
                value={formData.adres}
                onChange={(e) => setFormData({ ...formData, adres: e.target.value })}
                multiline
                rows={3}
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>İptal</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.hesap_adi}
          >
            {editingId ? 'Güncelle' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CariHesap; 