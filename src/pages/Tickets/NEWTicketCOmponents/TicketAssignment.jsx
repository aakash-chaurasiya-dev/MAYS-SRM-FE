import React from 'react';
import { Box, Paper, Typography, TextField, MenuItem, Divider, Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';

export default function TicketAssignment({ form, setForm, handleChange, lbl, secHdr }) {

  // Lookups
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/departments');
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const { data: statuses = [] } = useQuery({
    queryKey: ['statuses'],
    queryFn: async () => {
      const res = await api.get('/statuses');
      return res.data?.data || res.data || [];
    },
    select: (data) => data.filter(s => s.statusType === 'Ticket' || s.statusType === 'TICKET')
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees', form.departmentId],
    queryFn: async () => {
      const res = await api.get(`/employees/department/${form.departmentId}`);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!form.departmentId,
  });

  // Find the "Open" status and lock it
  const openStatus = statuses.find(s => (s.statusName || s.name)?.toLowerCase() === 'open');

  React.useEffect(() => {
    if (openStatus && form.ticketStatusId !== openStatus.statusId) {
      setForm(prev => ({ ...prev, ticketStatusId: openStatus.statusId }));
    }
  }, [openStatus, form.ticketStatusId, setForm]);

  return (
    <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
      <Box sx={secHdr}>
        <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Assignment & Status</Typography>
      </Box>
      <Divider />
      <Box sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Box>
            <Typography sx={lbl}>Department</Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={form.departmentId || ''}
              onChange={(e) => setForm(prev => ({ ...prev, departmentId: e.target.value, employeeId: '' }))}
              sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
            >
              <MenuItem value="">Unassigned</MenuItem>
              {departments.map(dep => (
                <MenuItem key={dep.departmentId || dep.id} value={dep.departmentId || dep.id}>
                  {dep.departmentName || dep.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <Box>
            <Typography sx={lbl}>Assigned To</Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={form.employeeId || ''}
              onChange={handleChange('employeeId')}
              sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
              disabled={!form.departmentId}
            >
              <MenuItem value="">Unassigned</MenuItem>
              {employees.map(emp => (
                <MenuItem key={emp.employeeId || emp.id} value={emp.employeeId || emp.id}>
                  {emp.employeeName || emp.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <Box>
            <Typography sx={lbl}>Status</Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={form.ticketStatusId || ''}
              onChange={handleChange('ticketStatusId')}
              sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
              disabled={true} // Unconditionally locked
            >
              {statuses.map(s => (
                <MenuItem key={s.statusId || s.id} value={s.statusId || s.id}>
                  {s.statusName || s.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <Box>
            <Typography sx={lbl}>Target Date</Typography>
            <TextField
              type="datetime-local"
              fullWidth
              size="small"
              value={form.targetDate || ''}
              onChange={handleChange('targetDate')}
              sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>
        </Stack>
      </Box>
    </Paper>
  );
}
