import { Box, Typography, Checkbox, FormControlLabel, FormGroup, CircularProgress } from '@mui/material';
import api from '../../../services/api';
import { useQuery } from '@tanstack/react-query';

export default function TicketAccessoriesChecklist({ deviceTypeId, selectedAccessories, onChange }) {
  const { data: accessoriesList = [], isLoading: loading } = useQuery({
    queryKey: ['deviceAccessories', deviceTypeId],
    queryFn: async () => {
      const res = await api.get(`/device-accessories/device-type/${deviceTypeId}`);
      return res.data || [];
    },
    enabled: !!deviceTypeId,
    staleTime: 5 * 60 * 1000,
  });

  const handleToggle = (accessoryId) => {
    const currentIndex = selectedAccessories.indexOf(accessoryId);
    const newSelected = [...selectedAccessories];

    if (currentIndex === -1) {
      newSelected.push(accessoryId);
    } else {
      newSelected.splice(currentIndex, 1);
    }
    onChange(newSelected);
  };

  if (!deviceTypeId) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography sx={{ fontSize: '13px', color: 'text.secondary' }}>
          Select a Device Type first to view available accessories.
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={16} />
        <Typography sx={{ fontSize: '13px', color: 'text.secondary' }}>Loading accessories...</Typography>
      </Box>
    );
  }

  if (accessoriesList.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography sx={{ fontSize: '13px', color: 'text.secondary' }}>
          No accessories configured for this device type.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <FormGroup row sx={{ gap: 2 }}>
        {accessoriesList.map((acc) => (
          <FormControlLabel
            key={acc.accessoryId}
            control={
              <Checkbox
                checked={selectedAccessories.includes(acc.accessoryId)}
                onChange={() => handleToggle(acc.accessoryId)}
                size="small"
                sx={{ py: 0.5 }}
              />
            }
            label={
              <Box>
                <Typography sx={{ fontSize: '13px', fontWeight: 500 }}>{acc.accessoryName}</Typography>
                {acc.description && (
                  <Typography sx={{ fontSize: '11px', color: 'text.secondary', lineHeight: 1.2 }}>
                    {acc.description}
                  </Typography>
                )}
              </Box>
            }
            sx={{ m: 0, alignItems: 'flex-start' }}
          />
        ))}
      </FormGroup>
    </Box>
  );
}
