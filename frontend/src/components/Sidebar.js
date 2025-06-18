import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { AttachMoney, Inventory, People, Assessment } from '@mui/icons-material';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: 'Kasa Takibi', icon: <AttachMoney />, path: '/kasa-takibi' },
    { label: 'Stok Takibi', icon: <Inventory />, path: '/stok-takibi' },
    { label: 'Cari Hesap', icon: <People />, path: '/cari-hesap' },
    { label: 'Analiz ve Raporlama', icon: <Assessment />, path: '/analiz-raporlama' },
  ];

  return (
    <Box sx={{ width: 280, bgcolor: '#f8f9fc', height: '100vh', p: 2 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
        Reddys Cafe Takip Yazılımı
      </Typography>
      <List>
        {menuItems.map((item) => (
          <ListItem
            key={item.path}
            button
            onClick={() => navigate(item.path)}
            sx={{
              bgcolor: location.pathname === item.path ? '#e6e9f4' : 'transparent',
              borderRadius: 2,
              mb: 1,
              '&:hover': {
                bgcolor: '#e6e9f4',
              },
            }}
          >
            <ListItemIcon sx={{ color: '#0d0f1c' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.label} 
              sx={{ color: '#0d0f1c' }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Sidebar; 