import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

/**
 * SectionCard wrapper
 */
export default function SectionCard({ icon, title, children, sx }) {
  const theme = useTheme();
  return (
    <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '12px', p: 3, ...sx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, color: 'primary.main' }}>
        {icon}
        <Typography sx={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</Typography>
      </Box>
      {children}
    </Paper>
  );
}
