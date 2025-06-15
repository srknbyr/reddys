import React from 'react';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8f9fc' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, bgcolor: '#ffffff', overflow: 'auto' }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 