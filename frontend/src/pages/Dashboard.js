import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Person,
  Business,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Inventory,
  Receipt,
  Analytics,
  MonetizationOn,
  Assessment,
  Refresh,
  Schedule
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [stats, setStats] = useState({
    toplam_cari: 0,
    musteri_sayisi: 0,
    tedarikci_sayisi: 0,
    toplam_bakiye: 0,
    son_hareketler: []
  });
  const [realtimeData, setRealtimeData] = useState({
    bugun_satis: 0,
    bu_ay_satis: 0,
    aktif_islemler: 0,
    bekleyen_odemeler: 0
  });
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    // Real-time güncelleme (30 saniyede bir)
    const interval = setInterval(fetchRealTimeData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Paralel olarak tüm verileri çek
      const [cariResponse, analizResponse] = await Promise.all([
        axios.get('http://localhost:8000/cari-hesap/'),
        axios.get('http://localhost:8000/analiz/genel/kpi').catch(() => ({ data: null }))
      ]);

      const cariHesaplar = cariResponse.data;
      const analizData = analizResponse.data;
      
      const stats = {
        toplam_cari: cariHesaplar.length,
        musteri_sayisi: cariHesaplar.filter(h => h.tipi === 'Müşteri').length,
        tedarikci_sayisi: cariHesaplar.filter(h => h.tipi === 'Tedarikçi').length,
        toplam_bakiye: cariHesaplar.reduce((sum, h) => sum + (h.bakiye || 0), 0),
        son_hareketler: cariHesaplar
          .sort((a, b) => new Date(b.son_hareket_tarihi) - new Date(a.son_hareket_tarihi))
          .slice(0, 5)
      };
      
      setStats(stats);

      // Real-time data güncelle
      if (analizData) {
        setRealtimeData({
          bugun_satis: analizData.bugun_satis || 0,
          bu_ay_satis: analizData.bu_ay_satis || 0,
          aktif_islemler: cariHesaplar.length,
          bekleyen_odemeler: cariHesaplar.filter(h => h.bakiye < 0).length
        });
      }

      // Gerçek grafik verisi çek (son 7 günün performansı)
      await fetchChartData();


      setLastUpdate(new Date());
    } catch (error) {
      console.error('Dashboard verileri yüklenemedi:', error);
      // Demo veriler
      setStats({
        toplam_cari: 15,
        musteri_sayisi: 10,
        tedarikci_sayisi: 5,
        toplam_bakiye: 25500,
        son_hareketler: [
          {
            id: 1,
            hesap_adi: 'Müşteri A',
            tipi: 'Müşteri',
            bakiye: 1500,
            son_hareket_tarihi: '2024-07-20T10:00:00'
          },
          {
            id: 2,
            hesap_adi: 'Tedarikçi B',
            tipi: 'Tedarikçi',
            bakiye: -800,
            son_hareket_tarihi: '2024-07-19T14:30:00'
          },
          {
            id: 3,
            hesap_adi: 'Müşteri C',
            tipi: 'Müşteri',
            bakiye: 2200,
            son_hareket_tarihi: '2024-07-18T09:15:00'
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      // Son 7 günün gerçek performans verisi - paralel olarak satış ve gider verilerini çek
      const [satisResponse, giderResponse] = await Promise.all([
        axios.get('http://localhost:8000/analiz/satis/gunluk?gun_sayisi=7'),
        axios.get('http://localhost:8000/analiz/gider/gunluk?gun_sayisi=7').catch(() => ({ data: null }))
      ]);
      
      // Satış ve gider verilerini işle
      const satisData = satisResponse.data?.gunluk_veriler || [];
      const giderData = giderResponse.data?.gunluk_veriler || [];
      
      // Son 7 günün tarihlerini oluştur
      const today = new Date();
      const fullChartData = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('tr-TR');
        const isoDateStr = date.toISOString().split('T')[0];
        
        // O günün satış verisini bul
        const existingSatisData = satisData.find(item => 
          item.tarih === isoDateStr || item.tarih_tr === dateStr
        );
        
        // O günün gider verisini bul
        const existingGiderData = giderData.find(item => 
          item.tarih === isoDateStr || item.tarih_tr === dateStr
        );
        
        fullChartData.push({
          gun: dateStr,
          satis: existingSatisData ? existingSatisData.toplam_satis : 0,
          gider: existingGiderData ? existingGiderData.toplam_gider : 0
        });
      }
      
      setChartData(fullChartData);
      
    } catch (error) {
      console.error('Grafik verisi yüklenemedi:', error);
      // Hata durumunda boş veri göster
      const today = new Date();
      const emptyChartData = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - index));
        return {
          gun: date.toLocaleDateString('tr-TR'),
          satis: 0,
          gider: 0
        };
      });
      setChartData(emptyChartData);
    }
  };

  const fetchRealTimeData = async () => {
    try {
      const response = await axios.get('http://localhost:8000/analiz/genel/kpi');
      setRealtimeData(prev => ({
        ...prev,
        bugun_satis: response.data.bugun_satis || prev.bugun_satis,
        bu_ay_satis: response.data.bu_ay_satis || prev.bu_ay_satis
      }));
      setLastUpdate(new Date());
      
      // Grafik verisini de güncelle
      await fetchChartData();
    } catch (error) {
      console.error('Real-time veri güncellenemedi:', error);
    }
  };

  const formatTutar = (tutar) => {
    return `${tutar.toLocaleString('tr-TR')} TL`;
  };

  const formatTarih = (tarih) => {
    return new Date(tarih).toLocaleDateString('tr-TR');
  };

  const getBakiyeColor = (bakiye) => {
    if (bakiye > 0) return 'success.main';
    if (bakiye < 0) return 'error.main';
    return 'text.secondary';
  };

  const quickActions = [
    {
      title: 'Cari Hesap Yönetimi',
      description: 'Müşteri ve tedarikçi hesaplarını yönetin',
      icon: <Person fontSize="large" />,
      color: '#607afb',
      path: '/cari-hesap'
    },
    {
      title: 'Kasa Takibi',
      description: 'Nakit akışınızı takip edin',
      icon: <AccountBalance fontSize="large" />,
      color: '#28a745',
      path: '/kasa-takibi'
    },
    {
      title: 'Stok Takibi',
      description: 'Ürün stoklarınızı kontrol edin',
      icon: <Inventory fontSize="large" />,
      color: '#ffc107',
      path: '/stok-takibi'
    }
  ];

  return (
    <Box sx={{ p: 4 }}>
      {/* Başlık ve Real-time Bilgiler */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0d0f1c', mb: 1 }}>
              🏪 Reddy's Cafe - Canlı Dashboard
            </Typography>
            <Typography variant="body1" sx={{ color: '#47569e' }}>
              İşletmenizin anlık performansını takip edin
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Tooltip title="Verileri Yenile">
              <IconButton onClick={fetchDashboardData} disabled={loading}>
                <Refresh color="primary" />
              </IconButton>
            </Tooltip>
            <Chip 
              icon={<Schedule />}
              label={`Son güncelleme: ${lastUpdate.toLocaleTimeString('tr-TR')}`}
              size="small"
              variant="outlined"
            />
          </Box>
        </Box>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
      </Box>

      {/* Real-time KPI Kartları */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="rgba(255,255,255,0.8)" gutterBottom>
                    💰 Bugün Satış
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {formatTutar(realtimeData.bugun_satis)}
                  </Typography>
                  <Typography variant="caption" color="rgba(255,255,255,0.6)">
                    Canlı Veri
                  </Typography>
                </Box>
                <MonetizationOn sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="rgba(255,255,255,0.8)" gutterBottom>
                    📊 Bu Ay Satış
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {formatTutar(realtimeData.bu_ay_satis)}
                  </Typography>
                  <Typography variant="caption" color="rgba(255,255,255,0.6)">
                    Aylık Toplam
                  </Typography>
                </Box>
                <Assessment sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="rgba(255,255,255,0.8)" gutterBottom>
                    👥 Toplam Cari
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.toplam_cari}
                  </Typography>
                  <Typography variant="caption" color="rgba(255,255,255,0.6)">
                    Aktif Hesap
                  </Typography>
                </Box>
                <Person sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="rgba(255,255,255,0.8)" gutterBottom>
                    ⚠️ Bekleyen Ödeme
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {realtimeData.bekleyen_odemeler}
                  </Typography>
                  <Typography variant="caption" color="rgba(255,255,255,0.6)">
                    Negatif Bakiye
                  </Typography>
                </Box>
                <TrendingDown sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      {/* Ana İçerik - Tek Sütun Layout */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          {/* Performans Grafiği */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              📈 Son 7 Günün Performansı
            </Typography>
            {chartData.length > 0 && (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSatis" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#667eea" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorGider" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f093fb" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f093fb" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="gun" />
                  <YAxis tickFormatter={(value) => `₺${value.toLocaleString()}`} />
                  <RechartsTooltip formatter={(value) => formatTutar(value)} />
                  <Area 
                    type="monotone" 
                    dataKey="satis" 
                    stackId="1"
                    stroke="#667eea" 
                    fillOpacity={1} 
                    fill="url(#colorSatis)"
                    name="Satış"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="gider" 
                    stackId="2"
                    stroke="#f093fb" 
                    fillOpacity={1} 
                    fill="url(#colorGider)"
                    name="Gider"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Paper>

          {/* Hızlı İşlemler */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              🚀 Hızlı İşlemler
            </Typography>
            <Grid container spacing={3}>
              {quickActions.map((action, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      cursor: 'pointer',
                      '&:hover': { 
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                      },
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => navigate(action.path)}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Box sx={{ color: action.color, mb: 2 }}>
                        {action.icon}
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {action.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {action.description}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                      <Button 
                        size="small" 
                        sx={{ 
                          color: action.color,
                          fontWeight: 'bold',
                          textTransform: 'none'
                        }}
                      >
                        Detayına Git →
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    cursor: 'pointer',
                    '&:hover': { 
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    },
                    transition: 'all 0.3s ease',
                    border: '2px dashed #607afb'
                  }}
                  onClick={() => navigate('/analiz-raporlama')}
                >
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Box sx={{ color: '#607afb', mb: 2 }}>
                      <Analytics fontSize="large" />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Analiz ve Raporlama
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Detaylı analiz ve grafikler
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button 
                      size="small" 
                      sx={{ 
                        color: '#607afb',
                        fontWeight: 'bold',
                        textTransform: 'none'
                      }}
                    >
                      Analiz Et →
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 