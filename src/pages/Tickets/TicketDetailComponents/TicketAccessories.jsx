import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Box, Typography, Paper, Divider, Chip, CircularProgress, FormGroup, FormControlLabel, Checkbox } from '@mui/material';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';
import { useTheme } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';

const TicketAccessories = forwardRef(({ ticketId, ticket, isEditMode }, ref) => {
  const theme = useTheme();

  // Fetch ticket accessories
  const { data: ticketAccessories = [], isLoading: isLoadingTicketAcc } = useQuery({
    queryKey: ['ticket-accessories', ticketId],
    queryFn: async () => {
      const res = await api.get(`/ticket-accessories/ticket/${ticketId}`);
      return res.data || [];
    },
    enabled: !!ticketId,
  });

  // Fetch all available accessories
  const { data: allAccessories = [], isLoading: isLoadingAllAcc } = useQuery({
    queryKey: ['accessories'],
    queryFn: async () => {
      const res = await api.get('/device-accessories');
      return res.data || [];
    },
  });

  const [selectedIds, setSelectedIds] = useState([]);
  const [activeDeviceTypeName, setActiveDeviceTypeName] = useState(ticket?.deviceTypeName || '');

  useEffect(() => {
    const handleDeviceTypeChanged = (e) => {
      setActiveDeviceTypeName(e.detail || '');
    };
    window.addEventListener('ticketDeviceTypeChanged', handleDeviceTypeChanged);
    return () => window.removeEventListener('ticketDeviceTypeChanged', handleDeviceTypeChanged);
  }, []);

  useEffect(() => {
    if (isEditMode) {
      // Map initial accessories when entering edit mode
      setSelectedIds(ticketAccessories.map(acc => acc.accessoryId));
    }
  }, [isEditMode, ticketAccessories]);

  useImperativeHandle(ref, () => ({
    getFormData: () => {
      return { accessoryIds: selectedIds };
    }
  }));

  const lbl = {
    fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary,
    textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5,
  };

  // Filter available accessories by the currently active device type (from the event or ticket)
  const availableAccessories = allAccessories.filter(a => a.deviceTypeName === activeDeviceTypeName);
  
  // Also make sure any already selected accessories are included even if device type doesn't match perfectly
  const selectedOptions = allAccessories.filter(a => selectedIds.includes(a.accessoryId));
  
  // Merge selected options that might not be in availableAccessories
  const optionsToDisplay = [
    ...availableAccessories,
    ...selectedOptions.filter(so => !availableAccessories.find(aa => aa.accessoryId === so.accessoryId))
  ];

  const handleToggle = (accessoryId) => {
    setSelectedIds(prev => 
      prev.includes(accessoryId) 
        ? prev.filter(id => id !== accessoryId)
        : [...prev, accessoryId]
    );
  };

  return (
    <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5, width: '100%' }}>
      <Box sx={{ px: 2.5, py: 1.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HeadsetMicIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
          <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Accessories</Typography>
        </Box>
      </Box>
      <Divider />
      <Box sx={{ p: 2.5 }}>
        {(isLoadingTicketAcc || isLoadingAllAcc) ? (
          <CircularProgress size={24} />
        ) : isEditMode ? (
          <Box>
            <Typography sx={lbl}>Select Accessories</Typography>
            {optionsToDisplay.length > 0 ? (
              <FormGroup row>
                {optionsToDisplay.map((option) => (
                  <FormControlLabel
                    key={option.accessoryId}
                    control={
                      <Checkbox 
                        size="small"
                        checked={selectedIds.includes(option.accessoryId)}
                        onChange={() => handleToggle(option.accessoryId)}
                      />
                    }
                    label={<Typography sx={{ fontSize: '13px' }}>{option.accessoryName}</Typography>}
                  />
                ))}
              </FormGroup>
            ) : (
              <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary }}>
                No accessories found for this device type.
              </Typography>
            )}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {ticketAccessories.length > 0 ? (
              ticketAccessories.map(acc => (
                <Chip 
                  key={acc.ticketAccessoriesId || acc.accessoryId} 
                  label={acc.accessoryName} 
                  size="small" 
                  variant="outlined"
                  sx={{ borderRadius: '4px', bgcolor: theme.palette.grey[50] }}
                />
              ))
            ) : (
              <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary }}>
                No accessories linked.
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
});

export default TicketAccessories;
