import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Typography,
  Collapse,
  Alert,
  Divider,
  Stack
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  CalendarToday,
  Compare,
  Save,
  Delete,
  Refresh
} from '@mui/icons-material';

const AdvancedDateFilter = ({ 
  onFilterChange, 
  title = "Tarih Filtresi",
  showComparison = false,
  defaultRange = "thisMonth"
}) => {
  // State management
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    quickOptions: false,
    customRange: false,
    comparison: false,
    savedRanges: false
  });
  
  // Date state
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
    quickOption: defaultRange
  });
  
  // Comparison state
  const [comparisonEnabled, setComparisonEnabled] = useState(false);
  const [comparisonType, setComparisonType] = useState('previousPeriod');
  
  // Saved ranges state
  const [savedRanges, setSavedRanges] = useState([]);
  const [newRangeName, setNewRangeName] = useState('');

  // Utility functions for date calculations
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getQuickDateRange = (option) => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    switch (option) {
      case 'today':
        return { start: startOfDay, end: endOfDay };
      
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { 
          start: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
          end: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59)
        };
      
      case 'last7Days':
        const last7Start = new Date(today);
        last7Start.setDate(last7Start.getDate() - 7);
        return { start: last7Start, end: endOfDay };
      
      case 'last30Days':
        const last30Start = new Date(today);
        last30Start.setDate(last30Start.getDate() - 30);
        return { start: last30Start, end: endOfDay };
      
      case 'last90Days':
        const last90Start = new Date(today);
        last90Start.setDate(last90Start.getDate() - 90);
        return { start: last90Start, end: endOfDay };
      
      case 'thisWeek':
        const thisWeekStart = new Date(today);
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // adjust when day is sunday
        thisWeekStart.setDate(diff);
        return { 
          start: new Date(thisWeekStart.getFullYear(), thisWeekStart.getMonth(), thisWeekStart.getDate()),
          end: endOfDay 
        };
      
      case 'lastWeek':
        const lastWeekEnd = new Date(today);
        const lastWeekDayOfWeek = today.getDay();
        const lastWeekDiff = today.getDate() - lastWeekDayOfWeek + (lastWeekDayOfWeek === 0 ? -6 : 1) - 7;
        lastWeekEnd.setDate(lastWeekDiff + 6);
        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekStart.getDate() - 6);
        return { 
          start: new Date(lastWeekStart.getFullYear(), lastWeekStart.getMonth(), lastWeekStart.getDate()),
          end: new Date(lastWeekEnd.getFullYear(), lastWeekEnd.getMonth(), lastWeekEnd.getDate(), 23, 59, 59)
        };
      
      case 'thisMonth':
        return { 
          start: new Date(today.getFullYear(), today.getMonth(), 1),
          end: endOfDay 
        };
      
      case 'lastMonth':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
        return { start: lastMonth, end: lastMonthEnd };
      
      case 'thisQuarter':
        const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
        return { start: quarterStart, end: endOfDay };
      
      case 'lastQuarter':
        const lastQuarterMonth = Math.floor(today.getMonth() / 3) * 3 - 3;
        const lastQuarterStart = new Date(today.getFullYear(), lastQuarterMonth, 1);
        const lastQuarterEnd = new Date(today.getFullYear(), lastQuarterMonth + 3, 0, 23, 59, 59);
        return { start: lastQuarterStart, end: lastQuarterEnd };
      
      case 'thisYear':
        return { 
          start: new Date(today.getFullYear(), 0, 1),
          end: endOfDay 
        };
      
      case 'lastYear':
        return { 
          start: new Date(today.getFullYear() - 1, 0, 1),
          end: new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59)
        };
      
      default:
        return { start: startOfDay, end: endOfDay };
    }
  };

  const getComparisonRange = (baseStart, baseEnd, type) => {
    const baseDuration = baseEnd.getTime() - baseStart.getTime();
    
    switch (type) {
      case 'previousPeriod':
        const prevEnd = new Date(baseStart.getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - baseDuration);
        return { start: prevStart, end: prevEnd };
      
      case 'previousMonth':
        const prevMonth = new Date(baseStart.getFullYear(), baseStart.getMonth() - 1, baseStart.getDate());
        const prevMonthEnd = new Date(baseEnd.getFullYear(), baseEnd.getMonth() - 1, baseEnd.getDate());
        return { start: prevMonth, end: prevMonthEnd };
      
      case 'previousYear':
        const prevYear = new Date(baseStart.getFullYear() - 1, baseStart.getMonth(), baseStart.getDate());
        const prevYearEnd = new Date(baseEnd.getFullYear() - 1, baseEnd.getMonth(), baseEnd.getDate());
        return { start: prevYear, end: prevYearEnd };
      
      case 'previousQuarter':
        const prevQuarterStart = new Date(baseStart.getFullYear(), baseStart.getMonth() - 3, baseStart.getDate());
        const prevQuarterEnd = new Date(baseEnd.getFullYear(), baseEnd.getMonth() - 3, baseEnd.getDate());
        return { start: prevQuarterStart, end: prevQuarterEnd };
      
      default:
        return { start: baseStart, end: baseEnd };
    }
  };

  // Quick options data
  const quickOptions = [
    { value: 'today', label: 'Bugün' },
    { value: 'yesterday', label: 'Dün' },
    { value: 'last7Days', label: 'Son 7 Gün' },
    { value: 'last30Days', label: 'Son 30 Gün' },
    { value: 'last90Days', label: 'Son 90 Gün' },
    { value: 'thisWeek', label: 'Bu Hafta' },
    { value: 'lastWeek', label: 'Geçen Hafta' },
    { value: 'thisMonth', label: 'Bu Ay' },
    { value: 'lastMonth', label: 'Geçen Ay' },
    { value: 'thisQuarter', label: 'Bu Çeyrek' },
    { value: 'lastQuarter', label: 'Geçen Çeyrek' },
    { value: 'thisYear', label: 'Bu Yıl' },
    { value: 'lastYear', label: 'Geçen Yıl' },
    { value: 'custom', label: 'Özel Tarih' }
  ];

  const comparisonOptions = [
    { value: 'previousPeriod', label: 'Önceki Dönem' },
    { value: 'previousMonth', label: 'Önceki Ay' },
    { value: 'previousYear', label: 'Önceki Yıl' },
    { value: 'previousQuarter', label: 'Önceki Çeyrek' }
  ];

  // Effect to handle initial load
  useEffect(() => {
    const savedRangesData = localStorage.getItem('advancedDateFilter_savedRanges');
    if (savedRangesData) {
      setSavedRanges(JSON.parse(savedRangesData));
    }
    
    // Set initial date range
    handleQuickOptionChange(defaultRange);
  }, []);

  // Effect to notify parent of changes
  useEffect(() => {
    const range = getActiveRange();
    if (range.start && range.end) {
      const filterData = {
        startDate: range.start,
        endDate: range.end,
        quickOption: dateRange.quickOption,
        comparison: comparisonEnabled ? {
          enabled: true,
          type: comparisonType,
          range: getComparisonRange(range.start, range.end, comparisonType)
        } : null
      };
      onFilterChange(filterData);
    }
  }, [dateRange, comparisonEnabled, comparisonType]);

  const getActiveRange = () => {
    if (dateRange.quickOption === 'custom' && dateRange.startDate && dateRange.endDate) {
      return {
        start: new Date(dateRange.startDate),
        end: new Date(dateRange.endDate + 'T23:59:59')
      };
    } else if (dateRange.quickOption !== 'custom') {
      return getQuickDateRange(dateRange.quickOption);
    }
    return { start: null, end: null };
  };

  const handleQuickOptionChange = (option) => {
    setDateRange(prev => ({
      ...prev,
      quickOption: option,
      startDate: option === 'custom' ? prev.startDate : '',
      endDate: option === 'custom' ? prev.endDate : ''
    }));
    
    if (option === 'custom') {
      setExpandedSections(prev => ({ ...prev, customRange: true }));
    }
  };

  const handleCustomDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const saveCurrentRange = () => {
    if (!newRangeName.trim()) return;
    
    const range = getActiveRange();
    if (!range.start || !range.end) return;

    const newRange = {
      id: Date.now(),
      name: newRangeName.trim(),
      startDate: formatDate(range.start),
      endDate: formatDate(range.end),
      quickOption: dateRange.quickOption
    };

    const updatedRanges = [...savedRanges, newRange];
    setSavedRanges(updatedRanges);
    localStorage.setItem('advancedDateFilter_savedRanges', JSON.stringify(updatedRanges));
    setNewRangeName('');
  };

  const loadSavedRange = (savedRange) => {
    setDateRange({
      startDate: savedRange.startDate,
      endDate: savedRange.endDate,
      quickOption: savedRange.quickOption
    });
  };

  const deleteSavedRange = (id) => {
    const updatedRanges = savedRanges.filter(range => range.id !== id);
    setSavedRanges(updatedRanges);
    localStorage.setItem('advancedDateFilter_savedRanges', JSON.stringify(updatedRanges));
  };

  const resetFilter = () => {
    setDateRange({
      startDate: '',
      endDate: '',
      quickOption: 'thisMonth'
    });
    setComparisonEnabled(false);
    setComparisonType('previousPeriod');
    handleQuickOptionChange('thisMonth');
  };

  const getCurrentRangeText = () => {
    const range = getActiveRange();
    if (!range.start || !range.end) return 'Tarih seçilmedi';
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return `${range.start.toLocaleDateString('tr-TR', options)} - ${range.end.toLocaleDateString('tr-TR', options)}`;
  };

  return (
    <Card elevation={2} sx={{ mb: 2 }}>
      <CardContent>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <CalendarToday color="primary" />
            <Typography variant="h6">{title}</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={isAdvanced}
                  onChange={(e) => setIsAdvanced(e.target.checked)}
                  size="small"
                />
              }
              label="Gelişmiş"
              sx={{ mr: 1 }}
            />
            <IconButton onClick={resetFilter} size="small" title="Sıfırla">
              <Refresh />
            </IconButton>
          </Box>
        </Box>

        {/* Current Range Display */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Seçilen Tarih Aralığı:</strong> {getCurrentRangeText()}
          </Typography>
        </Alert>

        {/* Quick Options */}
        <Box mb={2}>
          <Box 
            display="flex" 
            alignItems="center" 
            justifyContent="space-between"
            onClick={() => toggleSection('quickOptions')}
            sx={{ cursor: 'pointer', mb: 1 }}
          >
            <Typography variant="subtitle1" fontWeight="bold">
              Hızlı Seçenekler
            </Typography>
            {expandedSections.quickOptions ? <ExpandLess /> : <ExpandMore />}
          </Box>
          
          <Collapse in={expandedSections.quickOptions}>
            <Grid container spacing={1}>
              {quickOptions.map((option) => (
                <Grid item xs={6} sm={4} md={3} key={option.value}>
                  <Button
                    variant={dateRange.quickOption === option.value ? "contained" : "outlined"}
                    fullWidth
                    size="small"
                    onClick={() => handleQuickOptionChange(option.value)}
                  >
                    {option.label}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Collapse>
        </Box>

        {/* Custom Date Range */}
        {(dateRange.quickOption === 'custom' || isAdvanced) && (
          <Box mb={2}>
            <Box 
              display="flex" 
              alignItems="center" 
              justifyContent="space-between"
              onClick={() => toggleSection('customRange')}
              sx={{ cursor: 'pointer', mb: 1 }}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                Özel Tarih Aralığı
              </Typography>
              {expandedSections.customRange ? <ExpandLess /> : <ExpandMore />}
            </Box>
            
            <Collapse in={expandedSections.customRange}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Başlangıç Tarihi"
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Bitiş Tarihi"
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>
            </Collapse>
          </Box>
        )}

        {/* Comparison Section */}
        {(showComparison || isAdvanced) && (
          <Box mb={2}>
            <Box 
              display="flex" 
              alignItems="center" 
              justifyContent="space-between"
              onClick={() => toggleSection('comparison')}
              sx={{ cursor: 'pointer', mb: 1 }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <Compare color="primary" />
                <Typography variant="subtitle1" fontWeight="bold">
                  Karşılaştırma
                </Typography>
              </Box>
              {expandedSections.comparison ? <ExpandLess /> : <ExpandMore />}
            </Box>
            
            <Collapse in={expandedSections.comparison}>
              <Box mb={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={comparisonEnabled}
                      onChange={(e) => setComparisonEnabled(e.target.checked)}
                    />
                  }
                  label="Karşılaştırmayı Etkinleştir"
                />
              </Box>
              
              {comparisonEnabled && (
                <FormControl fullWidth size="small">
                  <InputLabel>Karşılaştırma Türü</InputLabel>
                  <Select
                    value={comparisonType}
                    onChange={(e) => setComparisonType(e.target.value)}
                    label="Karşılaştırma Türü"
                  >
                    {comparisonOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Collapse>
          </Box>
        )}

        {/* Saved Ranges */}
        {isAdvanced && (
          <Box>
            <Box 
              display="flex" 
              alignItems="center" 
              justifyContent="space-between"
              onClick={() => toggleSection('savedRanges')}
              sx={{ cursor: 'pointer', mb: 1 }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <Save color="primary" />
                <Typography variant="subtitle1" fontWeight="bold">
                  Kayıtlı Aralıklar
                </Typography>
              </Box>
              {expandedSections.savedRanges ? <ExpandLess /> : <ExpandMore />}
            </Box>
            
            <Collapse in={expandedSections.savedRanges}>
              <Stack spacing={2}>
                <Box display="flex" gap={1}>
                  <TextField
                    label="Aralık Adı"
                    value={newRangeName}
                    onChange={(e) => setNewRangeName(e.target.value)}
                    size="small"
                    sx={{ flexGrow: 1 }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<Save />}
                    onClick={saveCurrentRange}
                    disabled={!newRangeName.trim()}
                  >
                    Kaydet
                  </Button>
                </Box>
                
                {savedRanges.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      Kayıtlı Aralıklar:
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {savedRanges.map((range) => (
                        <Chip
                          key={range.id}
                          label={range.name}
                          onClick={() => loadSavedRange(range)}
                          onDelete={() => deleteSavedRange(range.id)}
                          deleteIcon={<Delete />}
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </Collapse>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedDateFilter; 