import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CariHesap from './pages/CariHesap';
import CariHesapDetay from './pages/CariHesapDetay';
import KasaTakibi from './pages/KasaTakibi';
import StokTakibi from './pages/StokTakibi';
import AnalizRaporlama from './pages/AnalizRaporlama';

// Tema oluşturma
const theme = createTheme({
  palette: {
    primary: {
      main: '#607afb',
    },
    background: {
      default: '#f8f9fc',
    },
    text: {
      primary: '#0d0f1c',
      secondary: '#47569e',
    },
  },
  typography: {
    fontFamily: '"Inter", "Noto Sans", "Roboto", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <Box component="main" sx={{ flexGrow: 1, width: 'calc(100% - 240px)' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/cari-hesap" element={<CariHesap />} />
              <Route path="/cari-hesap/:id" element={<CariHesapDetay />} />
              <Route path="/analiz-raporlama" element={<AnalizRaporlama />} />
              <Route path="/kasa-takibi" element={<KasaTakibi />} />
              <Route path="/stok-takibi" element={<StokTakibi />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App; 