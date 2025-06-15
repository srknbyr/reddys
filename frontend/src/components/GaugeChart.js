import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Box, Typography } from '@mui/material';

const GaugeChart = ({ 
  value, 
  maxValue, 
  title, 
  color = '#607afb', 
  size = 200,
  suffix = '',
  showPercentage = false 
}) => {
  // Gauge verisi oluştur
  const percentage = Math.min((value / maxValue) * 100, 100);
  const remainingPercentage = 100 - percentage;

  const data = [
    { name: 'value', value: percentage, color: color },
    { name: 'remaining', value: remainingPercentage, color: '#f0f0f0' }
  ];

  // Gauge renkleri
  const getColor = (percentage) => {
    if (percentage >= 80) return '#4caf50'; // Yeşil
    if (percentage >= 60) return '#ff9800'; // Turuncu
    if (percentage >= 40) return '#ffc107'; // Sarı
    return '#f44336'; // Kırmızı
  };

  const gaugeColor = getColor(percentage);

  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      sx={{ 
        width: size, 
        height: size,
        position: 'relative'
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            startAngle={180}
            endAngle={0}
            innerRadius={size * 0.25}
            outerRadius={size * 0.35}
            dataKey="value"
          >
            <Cell fill={gaugeColor} />
            <Cell fill="#f0f0f0" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      {/* Değer Gösterimi */}
      <Box
        position="absolute"
        top="60%"
        left="50%"
        sx={{ transform: 'translate(-50%, -50%)' }}
        textAlign="center"
      >
        <Typography 
          variant="h4" 
          fontWeight="bold" 
          color={gaugeColor}
        >
          {showPercentage ? `${percentage.toFixed(1)}%` : `${value.toLocaleString()}${suffix}`}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {title}
        </Typography>
        {!showPercentage && (
          <Typography variant="caption" color="textSecondary">
            / {maxValue.toLocaleString()}{suffix}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default GaugeChart; 