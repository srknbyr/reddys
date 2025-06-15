import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  MonetizationOn as MonetizationOnIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  RadialBarChart,
  RadialBar
} from 'recharts';
import axios from 'axios';
import AdvancedDateFilter from '../components/AdvancedDateFilter';
import GaugeChart from '../components/GaugeChart';

// Tab Panel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analiz-tabpanel-${index}`}
      aria-labelledby={`analiz-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function AnalizRaporlama() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State'ler
  const [satisOzeti, setSatisOzeti] = useState(null);
  const [gunlukSatis, setGunlukSatis] = useState(null);
  const [aylikSatis, setAylikSatis] = useState(null);
  const [giderOzeti, setGiderOzeti] = useState(null);
  const [kasaOzeti, setKasaOzeti] = useState(null);
  const [cariOzeti, setCariOzeti] = useState(null);
  const [genelKPI, setGenelKPI] = useState(null);

  // Filtreler
  const [gunSayisi, setGunSayisi] = useState(30);
  const [aySayisi, setAySayisi] = useState(12);
  const [currentDateFilter, setCurrentDateFilter] = useState(null);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Veri yükleme fonksiyonları
  const loadSatisOzeti = async (dateFilter = null) => {
    try {
      let url = 'http://localhost:8000/analiz/satis/ozet';
      if (dateFilter && dateFilter.startDate && dateFilter.endDate) {
        // Date objelerini YYYY-MM-DD formatına çevir
        const startDate = dateFilter.startDate instanceof Date 
          ? dateFilter.startDate.toISOString().split('T')[0]
          : dateFilter.startDate;
        const endDate = dateFilter.endDate instanceof Date 
          ? dateFilter.endDate.toISOString().split('T')[0]
          : dateFilter.endDate;
        url += `?baslangic_tarihi=${startDate}&bitis_tarihi=${endDate}`;
      }
      const response = await axios.get(url);
      setSatisOzeti(response.data);
    } catch (err) {
      console.error('Satış özeti yüklenirken hata:', err);
    }
  };

  const loadGunlukSatis = async (dateFilter = null) => {
    try {
      let url = `http://localhost:8000/analiz/satis/gunluk?gun_sayisi=${gunSayisi}`;
      if (dateFilter && dateFilter.startDate && dateFilter.endDate) {
        // Date objelerini YYYY-MM-DD formatına çevir
        const startDate = dateFilter.startDate instanceof Date 
          ? dateFilter.startDate.toISOString().split('T')[0]
          : dateFilter.startDate;
        const endDate = dateFilter.endDate instanceof Date 
          ? dateFilter.endDate.toISOString().split('T')[0]
          : dateFilter.endDate;
        url += `&baslangic_tarihi=${startDate}&bitis_tarihi=${endDate}`;
      }
      const response = await axios.get(url);
      setGunlukSatis(response.data);
    } catch (err) {
      console.error('Günlük satış trendi yüklenirken hata:', err);
    }
  };

  const loadAylikSatis = async (dateFilter = null) => {
    try {
      let url = `http://localhost:8000/analiz/satis/aylik?ay_sayisi=${aySayisi}`;
      if (dateFilter && dateFilter.startDate && dateFilter.endDate) {
        // Date objelerini YYYY-MM-DD formatına çevir
        const startDate = dateFilter.startDate instanceof Date 
          ? dateFilter.startDate.toISOString().split('T')[0]
          : dateFilter.startDate;
        const endDate = dateFilter.endDate instanceof Date 
          ? dateFilter.endDate.toISOString().split('T')[0]
          : dateFilter.endDate;
        url += `&baslangic_tarihi=${startDate}&bitis_tarihi=${endDate}`;
      }
      const response = await axios.get(url);
      setAylikSatis(response.data);
    } catch (err) {
      console.error('Aylık satış trendi yüklenirken hata:', err);
    }
  };

  const loadGiderOzeti = async (dateFilter = null) => {
    try {
      let url = 'http://localhost:8000/analiz/gider/ozet';
      if (dateFilter && dateFilter.startDate && dateFilter.endDate) {
        // Date objelerini YYYY-MM-DD formatına çevir
        const startDate = dateFilter.startDate instanceof Date 
          ? dateFilter.startDate.toISOString().split('T')[0]
          : dateFilter.startDate;
        const endDate = dateFilter.endDate instanceof Date 
          ? dateFilter.endDate.toISOString().split('T')[0]
          : dateFilter.endDate;
        url += `?baslangic_tarihi=${startDate}&bitis_tarihi=${endDate}`;
      }
      const response = await axios.get(url);
      setGiderOzeti(response.data);
    } catch (err) {
      console.error('Gider özeti yüklenirken hata:', err);
    }
  };

  const loadKasaOzeti = async (dateFilter = null) => {
    try {
      let url = `http://localhost:8000/analiz/kasa/gunluk-ozet?gun_sayisi=${gunSayisi}`;
      if (dateFilter && dateFilter.startDate && dateFilter.endDate) {
        // Date objelerini YYYY-MM-DD formatına çevir
        const startDate = dateFilter.startDate instanceof Date 
          ? dateFilter.startDate.toISOString().split('T')[0]
          : dateFilter.startDate;
        const endDate = dateFilter.endDate instanceof Date 
          ? dateFilter.endDate.toISOString().split('T')[0]
          : dateFilter.endDate;
        url += `&baslangic_tarihi=${startDate}&bitis_tarihi=${endDate}`;
      }
      const response = await axios.get(url);
      setKasaOzeti(response.data);
    } catch (err) {
      console.error('Kasa özeti yüklenirken hata:', err);
    }
  };

  const loadCariOzeti = async () => {
    try {
      const response = await axios.get('http://localhost:8000/analiz/cari/ozet');
      setCariOzeti(response.data);
    } catch (err) {
      console.error('Cari özeti yüklenirken hata:', err);
    }
  };

  const loadGenelKPI = async (dateFilter = null) => {
    try {
      let url = 'http://localhost:8000/analiz/genel/kpi';
      if (dateFilter && dateFilter.startDate && dateFilter.endDate) {
        // Date objelerini YYYY-MM-DD formatına çevir
        const startDate = dateFilter.startDate instanceof Date 
          ? dateFilter.startDate.toISOString().split('T')[0]
          : dateFilter.startDate;
        const endDate = dateFilter.endDate instanceof Date 
          ? dateFilter.endDate.toISOString().split('T')[0]
          : dateFilter.endDate;
        url += `?baslangic_tarihi=${startDate}&bitis_tarihi=${endDate}`;
      }
      const response = await axios.get(url);
      setGenelKPI(response.data);
    } catch (err) {
      console.error('Genel KPI yüklenirken hata:', err);
    }
  };

  const loadAllData = async (dateFilter = null) => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        loadSatisOzeti(dateFilter),
        loadGunlukSatis(dateFilter),
        loadAylikSatis(dateFilter),
        loadGiderOzeti(dateFilter),
        loadKasaOzeti(dateFilter),
        loadCariOzeti(),
        loadGenelKPI(dateFilter)
      ]);
    } catch (err) {
      setError('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Tarih filtresi değişikliği
  const handleDateFilterChange = (filterData) => {
    setCurrentDateFilter(filterData);
    loadAllData(filterData);
  };

  useEffect(() => {
    loadAllData();
  }, [gunSayisi, aySayisi]);

  // Para formatı
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  // Grafik renk paleti
  const COLORS = ['#607afb', '#47569e', '#8e99f3', '#c7ccf0', '#e6e9f4'];

  // Grafik için veri formatı
  const formatChartData = (data, key, valueKey = 'toplam') => {
    return data?.map(item => ({
      name: item[key],
      value: item[valueKey],
      formattedValue: formatCurrency(item[valueKey])
    })) || [];
  };

  // Özet Kart Bileşeni
  const OzetKart = ({ title, value, icon, color = "primary", subtitle = null, trend = null }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" color={color}>
              {typeof value === 'number' ? formatCurrency(value) : value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box color={`${color}.main`}>
            {icon}
          </Box>
        </Box>
        {trend && (
          <Box mt={1} display="flex" alignItems="center">
            {trend > 0 ? (
              <TrendingUpIcon color="success" fontSize="small" />
            ) : (
              <TrendingDownIcon color="error" fontSize="small" />
            )}
            <Typography variant="body2" color={trend > 0 ? 'success.main' : 'error.main'}>
              {Math.abs(trend)}%
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  // Satış Analizi Tab İçeriği
  const SatisAnaliziTab = () => (
    <Box>


      {/* Satış Özet Kartları */}
      {satisOzeti && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <OzetKart
              title="Toplam Satış"
              value={satisOzeti.toplam_satis}
              icon={<MonetizationOnIcon sx={{ fontSize: 40 }} />}
              color="primary"
            />
          </Grid>
          {satisOzeti.odeme_tipi_bazinda.map((item, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <OzetKart
                title={item.odeme_tipi}
                value={item.toplam}
                subtitle={`${item.adet} işlem`}
                icon={<ShoppingCartIcon sx={{ fontSize: 40 }} />}
                color="secondary"
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Günlük Satış İstatistikleri */}
      {gunlukSatis && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Son {gunSayisi} Günün Performansı
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {formatCurrency(gunlukSatis.istatistikler.toplam_satis)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Toplam Satış
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="secondary">
                  {formatCurrency(gunlukSatis.istatistikler.ortalama_gunluk_satis)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Günlük Ortalama
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                {gunlukSatis.istatistikler.en_yuksek_gun && (
                  <>
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(gunlukSatis.istatistikler.en_yuksek_gun.toplam_satis)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      En İyi Gün ({gunlukSatis.istatistikler.en_yuksek_gun.tarih_tr})
                    </Typography>
                  </>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                {gunlukSatis.istatistikler.en_dusuk_gun && (
                  <>
                    <Typography variant="h6" color="error.main">
                      {formatCurrency(gunlukSatis.istatistikler.en_dusuk_gun.toplam_satis)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      En Düşük Gün ({gunlukSatis.istatistikler.en_dusuk_gun.tarih_tr})
                    </Typography>
                  </>
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Grafik Alanları */}
      <Grid container spacing={3}>
        {/* Ödeme Tipi Dağılımı - Pie Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              💳 Ödeme Tipi Dağılımı
            </Typography>
            {satisOzeti && satisOzeti.odeme_tipi_bazinda.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                                 <PieChart>
                   <Pie
                     data={formatChartData(satisOzeti.odeme_tipi_bazinda, 'odeme_tipi')}
                     cx="50%"
                     cy="50%"
                     labelLine={false}
                     label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                     outerRadius={80}
                     innerRadius={40}
                     fill="#8884d8"
                     dataKey="value"
                   >
                     {formatChartData(satisOzeti.odeme_tipi_bazinda, 'odeme_tipi').map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                   <Legend />
                 </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="textSecondary">Henüz satış verisi bulunmuyor</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Ödeme Tipi Bar Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              📊 Ödeme Tipi Bazında Satışlar
            </Typography>
            {satisOzeti && satisOzeti.odeme_tipi_bazinda.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={formatChartData(satisOzeti.odeme_tipi_bazinda, 'odeme_tipi')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `₺${value.toLocaleString()}`} />
                  <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="value" fill="#607afb" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="textSecondary">Henüz satış verisi bulunmuyor</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Günlük Satış Trendi - Line Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              📈 Son {gunSayisi} Günün Satış Trendi
            </Typography>
            {gunlukSatis && gunlukSatis.gunluk_veriler.length > 0 ? (
                             <ResponsiveContainer width="100%" height={400}>
                 <AreaChart data={gunlukSatis.gunluk_veriler}>
                   <defs>
                     <linearGradient id="colorSatis" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#607afb" stopOpacity={0.8}/>
                       <stop offset="95%" stopColor="#607afb" stopOpacity={0.1}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" />
                   <XAxis 
                     dataKey="tarih_tr" 
                     angle={-45}
                     textAnchor="end"
                     height={80}
                   />
                   <YAxis tickFormatter={(value) => `₺${value.toLocaleString()}`} />
                   <RechartsTooltip 
                     formatter={(value) => formatCurrency(value)}
                     labelFormatter={(label) => `Tarih: ${label}`}
                   />
                   <Legend />
                   <Area 
                     type="monotone" 
                     dataKey="toplam_satis" 
                     stroke="#607afb" 
                     fillOpacity={1}
                     fill="url(#colorSatis)"
                     strokeWidth={3}
                     name="Günlük Satış"
                   />
                 </AreaChart>
               </ResponsiveContainer>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="textSecondary">Henüz günlük satış verisi bulunmuyor</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  // Gider Analizi Tab İçeriği
  const GiderAnaliziTab = () => (
    <Box>
      {/* Gider Özet Kartları */}
      {giderOzeti && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <OzetKart
              title="Toplam Gider"
              value={giderOzeti.toplam_gider}
              icon={<TrendingDownIcon sx={{ fontSize: 40 }} />}
              color="error"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <OzetKart
              title="Kategori Sayısı"
              value={giderOzeti.kategori_bazinda.length}
              icon={<AssessmentIcon sx={{ fontSize: 40 }} />}
              color="info"
            />
          </Grid>
        </Grid>
      )}

      {/* Gider Grafikleri */}
      <Grid container spacing={3}>
        {/* Kategori Bazında Gider Dağılımı - Pie Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              💸 Kategori Bazında Gider Dağılımı
            </Typography>
            {giderOzeti && giderOzeti.kategori_bazinda.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={formatChartData(giderOzeti.kategori_bazinda, 'kategori')}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {formatChartData(giderOzeti.kategori_bazinda, 'kategori').map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="textSecondary">Henüz gider verisi bulunmuyor</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Kategori Bazında Gider Bar Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              📊 Kategori Bazında Giderler
            </Typography>
            {giderOzeti && giderOzeti.kategori_bazinda.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={formatChartData(giderOzeti.kategori_bazinda, 'kategori')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `₺${value.toLocaleString()}`} />
                  <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="value" fill="#f44336" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="textSecondary">Henüz gider verisi bulunmuyor</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const KasaPerformansiTab = () => (
    <Box>
      {/* Kasa Performans Özeti */}
      {kasaOzeti && kasaOzeti.gunluk_ozetler.length > 0 && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <OzetKart
              title="Ortalama Günlük Satış"
              value={kasaOzeti.gunluk_ozetler.reduce((sum, item) => sum + item.toplam_satis, 0) / kasaOzeti.gunluk_ozetler.length}
              icon={<MonetizationOnIcon sx={{ fontSize: 40 }} />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <OzetKart
              title="Ortalama Günlük Gider"
              value={kasaOzeti.gunluk_ozetler.reduce((sum, item) => sum + item.toplam_gider, 0) / kasaOzeti.gunluk_ozetler.length}
              icon={<TrendingDownIcon sx={{ fontSize: 40 }} />}
              color="error"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <OzetKart
              title="Ortalama Net Kar"
              value={kasaOzeti.gunluk_ozetler.reduce((sum, item) => sum + item.net_kar, 0) / kasaOzeti.gunluk_ozetler.length}
              icon={<TrendingUpIcon sx={{ fontSize: 40 }} />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <OzetKart
              title="Analiz Edilen Gün"
              value={kasaOzeti.toplam_gun}
              icon={<AssessmentIcon sx={{ fontSize: 40 }} />}
              color="info"
            />
          </Grid>
        </Grid>
      )}

      {/* Kasa Performans Grafikleri */}
      <Grid container spacing={3}>
        {/* Günlük Satış vs Gider Karşılaştırması */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              💰 Günlük Satış vs Gider Karşılaştırması
            </Typography>
            {kasaOzeti && kasaOzeti.gunluk_ozetler.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={kasaOzeti.gunluk_ozetler.slice(-15)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="tarih_tr" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tickFormatter={(value) => `₺${value.toLocaleString()}`} />
                  <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="toplam_satis" fill="#4caf50" name="Günlük Satış" />
                  <Bar dataKey="toplam_gider" fill="#f44336" name="Günlük Gider" />
                  <Bar dataKey="net_kar" fill="#2196f3" name="Net Kar" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="textSecondary">Henüz kasa performans verisi bulunmuyor</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Net Kar Trendi */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              📈 Net Kar Trendi
            </Typography>
            {kasaOzeti && kasaOzeti.gunluk_ozetler.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={kasaOzeti.gunluk_ozetler}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="tarih_tr" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tickFormatter={(value) => `₺${value.toLocaleString()}`} />
                  <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="net_kar" 
                    stroke="#2196f3" 
                    strokeWidth={3}
                    dot={{ fill: '#2196f3', r: 4 }}
                    name="Net Kar"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="textSecondary">Henüz net kar verisi bulunmuyor</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const CariHesapAnaliziTab = () => (
    <Box>
      {/* Cari Hesap Özet Kartları */}
      {cariOzeti && (
        <Grid container spacing={3} mb={4}>
          {cariOzeti.tip_bazinda_dagilim.map((item, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <OzetKart
                title={`${item.tip} Sayısı`}
                value={item.adet}
                subtitle={`Bakiye: ${formatCurrency(item.toplam_bakiye)}`}
                icon={<PeopleIcon sx={{ fontSize: 40 }} />}
                color={item.tip === 'Müşteri' ? 'primary' : 'secondary'}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Cari Hesap Grafikleri */}
      <Grid container spacing={3}>
        {/* Müşteri/Tedarikçi Dağılımı */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              👥 Müşteri/Tedarikçi Dağılımı
            </Typography>
            {cariOzeti && cariOzeti.tip_bazinda_dagilim.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={cariOzeti.tip_bazinda_dagilim.map(item => ({
                      name: item.tip,
                      value: item.adet,
                      formattedValue: `${item.adet} hesap`
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {cariOzeti.tip_bazinda_dagilim.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => `${value} hesap`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="textSecondary">Henüz cari hesap verisi bulunmuyor</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Bakiye Dağılımı */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              💰 Tip Bazında Bakiye Dağılımı
            </Typography>
            {cariOzeti && cariOzeti.tip_bazinda_dagilim.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cariOzeti.tip_bazinda_dagilim}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tip" />
                  <YAxis tickFormatter={(value) => `₺${value.toLocaleString()}`} />
                  <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="toplam_bakiye" fill="#607afb" name="Toplam Bakiye" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="textSecondary">Henüz bakiye verisi bulunmuyor</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* En Yüksek Bakiyeli Hesaplar */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              🔝 En Yüksek Bakiyeli Hesaplar
            </Typography>
            {cariOzeti && cariOzeti.en_yuksek_bakiye.length > 0 ? (
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {cariOzeti.en_yuksek_bakiye.slice(0, 5).map((hesap, index) => (
                  <Box key={hesap.id} display="flex" justifyContent="space-between" alignItems="center" py={1} borderBottom="1px solid #eee">
                    <Box>
                      <Typography variant="body1" fontWeight="bold">
                        {hesap.hesap_adi}
                      </Typography>
                      <Chip size="small" label={hesap.tip} color={hesap.tip === 'Müşteri' ? 'primary' : 'secondary'} />
                    </Box>
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(hesap.bakiye)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="textSecondary">Henüz hesap verisi bulunmuyor</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* En Düşük Bakiyeli Hesaplar (Borçlular) */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              ⚠️ En Düşük Bakiyeli Hesaplar
            </Typography>
            {cariOzeti && cariOzeti.en_dusuk_bakiye.length > 0 ? (
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {cariOzeti.en_dusuk_bakiye.slice(0, 5).map((hesap, index) => (
                  <Box key={hesap.id} display="flex" justifyContent="space-between" alignItems="center" py={1} borderBottom="1px solid #eee">
                    <Box>
                      <Typography variant="body1" fontWeight="bold">
                        {hesap.hesap_adi}
                      </Typography>
                      <Chip size="small" label={hesap.tip} color={hesap.tip === 'Müşteri' ? 'primary' : 'secondary'} />
                    </Box>
                    <Typography variant="h6" color={hesap.bakiye < 0 ? 'error.main' : 'text.primary'}>
                      {formatCurrency(hesap.bakiye)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="textSecondary">Henüz hesap verisi bulunmuyor</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const GenelOzetTab = () => (
    <Box>
      {/* Ana KPI Kartları */}
      {genelKPI && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <OzetKart
              title="Toplam Satış"
              value={genelKPI.toplam_satis}
              icon={<TrendingUpIcon sx={{ fontSize: 40 }} />}
              color="success"
              subtitle="Gelirler"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <OzetKart
              title="Toplam Gider"
              value={genelKPI.toplam_gider}
              icon={<TrendingDownIcon sx={{ fontSize: 40 }} />}
              color="error"
              subtitle="Giderler"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <OzetKart
              title="Cari Ödemeler"
              value={genelKPI.cari_odemeler}
              icon={<MonetizationOnIcon sx={{ fontSize: 40 }} />}
              color="warning"
              subtitle="Ödemeler"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <OzetKart
              title="Net Kar/Zarar"
              value={genelKPI.net_kar}
              icon={<AssessmentIcon sx={{ fontSize: 40 }} />}
              color={genelKPI.net_kar >= 0 ? "success" : "error"}
              subtitle={genelKPI.net_kar >= 0 ? "Kar" : "Zarar"}
            />
          </Grid>
        </Grid>
      )}

      {/* Gelir-Gider-Ödeme Karşılaştırması */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          💰 Gelir - Gider - Ödeme Karşılaştırması
        </Typography>
        {genelKPI && (
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={[
              {
                kategori: 'Finansal Durum',
                satis: genelKPI.toplam_satis,
                gider: genelKPI.toplam_gider,
                cari_odemeler: genelKPI.cari_odemeler,
                net_kar: genelKPI.net_kar
              }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="kategori" />
              <YAxis tickFormatter={(value) => `₺${value.toLocaleString()}`} />
              <RechartsTooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="satis" fill="#4caf50" name="Satışlar (Gelir)" />
              <Bar dataKey="gider" fill="#f44336" name="Giderler" />
              <Bar dataKey="cari_odemeler" fill="#ff9800" name="Cari Ödemeler" />
              <Line 
                type="monotone" 
                dataKey="net_kar" 
                stroke="#2196f3" 
                strokeWidth={4}
                dot={{ fill: '#2196f3', r: 8 }}
                name="Net Kar/Zarar"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </Paper>

      {/* Detay Grafikleri */}
      <Grid container spacing={3} mb={3}>
        {/* Satış Detayları */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              💳 Satış Detayları
            </Typography>
            {genelKPI && genelKPI.satis_detay.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={genelKPI.satis_detay.map(item => ({
                      name: item.tip,
                      value: item.tutar
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {genelKPI.satis_detay.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="textSecondary">Satış verisi bulunmuyor</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Gider Detayları */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              📊 Gider Detayları
            </Typography>
            {genelKPI && genelKPI.gider_detay.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={genelKPI.gider_detay.map(item => ({
                      name: item.kategori,
                      value: item.tutar
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {genelKPI.gider_detay.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="textSecondary">Gider verisi bulunmuyor</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Cari Ödeme Detayları */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              🏦 Cari Ödeme Detayları
            </Typography>
            {genelKPI && genelKPI.cari_odeme_detay.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={genelKPI.cari_odeme_detay.map(item => ({
                      name: item.tip,
                      value: item.tutar
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {genelKPI.cari_odeme_detay.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="textSecondary">Cari ödeme verisi bulunmuyor</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Özet Tablo */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          📋 Finansal Özet
        </Typography>
        {genelKPI && (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box p={2} bgcolor="success.light" borderRadius={2} mb={2}>
                  <Typography variant="subtitle1" fontWeight="bold" color="success.dark">
                    ✅ GELİRLER
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="success.dark">
                    {formatCurrency(genelKPI.toplam_satis)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box p={2} bgcolor="error.light" borderRadius={2} mb={2}>
                  <Typography variant="subtitle1" fontWeight="bold" color="error.dark">
                    ❌ TOPLAM GİDER
                  </Typography>
                  <Typography variant="h6" color="error.dark">
                    Giderler: {formatCurrency(genelKPI.toplam_gider)}
                  </Typography>
                  <Typography variant="h6" color="error.dark">
                    Cari Ödemeler: {formatCurrency(genelKPI.cari_odemeler)}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="h5" fontWeight="bold" color="error.dark">
                    {formatCurrency(genelKPI.toplam_gider + genelKPI.cari_odemeler)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Box textAlign="center" p={3} bgcolor={genelKPI.net_kar >= 0 ? "success.light" : "error.light"} borderRadius={2}>
              <Typography variant="h4" fontWeight="bold" color={genelKPI.net_kar >= 0 ? "success.dark" : "error.dark"}>
                {genelKPI.net_kar >= 0 ? "🎉 NET KAR" : "⚠️ NET ZARAR"}
              </Typography>
              <Typography variant="h3" fontWeight="bold" color={genelKPI.net_kar >= 0 ? "success.dark" : "error.dark"}>
                {formatCurrency(Math.abs(genelKPI.net_kar))}
              </Typography>
              <Typography variant="body1" color={genelKPI.net_kar >= 0 ? "success.dark" : "error.dark"}>
                {genelKPI.tarih_araligi.baslangic} - {genelKPI.tarih_araligi.bitis}
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      {/* Başlık */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom color="primary" fontWeight="bold">
          📊 Analiz ve Raporlama
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          İşletme performansınızı detaylı analiz edin ve raporlarınızı görüntüleyin
        </Typography>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tab Navigation */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="analiz tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600
            }
          }}
        >
          <Tab label="📈 Satış Analizi" />
          <Tab label="💸 Gider Analizi" />
          <Tab label="💰 Kasa Performansı" />
          <Tab label="👥 Cari Hesap Analizi" />
          <Tab label="📋 Genel Özet" />
        </Tabs>

        {/* Tab Content */}
        <TabPanel value={tabValue} index={0}>
          <AdvancedDateFilter 
            onFilterChange={handleDateFilterChange}
            title="Satış Dönemi Seçimi"
            showComparison={true}
          />
          <SatisAnaliziTab />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <AdvancedDateFilter 
            onFilterChange={handleDateFilterChange}
            title="Gider Dönemi Seçimi"
            showComparison={true}
          />
          <GiderAnaliziTab />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <AdvancedDateFilter 
            onFilterChange={handleDateFilterChange}
            title="Kasa Performans Dönemi"
            showComparison={false}
          />
          <KasaPerformansiTab />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <AdvancedDateFilter 
            onFilterChange={handleDateFilterChange}
            title="Cari Hesap Analiz Dönemi"
            showComparison={false}
          />
          <CariHesapAnaliziTab />
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <AdvancedDateFilter 
            onFilterChange={handleDateFilterChange}
            title="Genel Performans Dönemi"
            showComparison={true}
          />
          <GenelOzetTab />
        </TabPanel>
      </Paper>
    </Box>
  );
}

export default AnalizRaporlama; 