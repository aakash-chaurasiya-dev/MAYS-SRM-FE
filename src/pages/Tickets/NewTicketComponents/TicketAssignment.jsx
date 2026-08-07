import { useMemo } from 'react';
import { Box, Paper, Typography, TextField, MenuItem, Divider, Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { getUserRole } from '../../../access/featureAccess';

export default function TicketAssignment({ form, setForm, handleChange, lbl, secHdr }) {
  const { user } = useAuth();
  const userRole = getUserRole(user);

  // Lookups
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/departments');
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const { data: allStatuses = [] } = useQuery({
    queryKey: ['statuses'],
    queryFn: async () => {
      const res = await api.get('/statuses');
      return res.data?.data || res.data || [];
    },
    staleTime: 1000 * 60 * 60,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees', form.departmentId],
    queryFn: async () => {
      const res = await api.get(`/employees/department/${form.departmentId}`);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!form.departmentId,
  });

  // Same status filtering as TicketOperations: ticket type + role for current user
  const statusOptions = useMemo(() => {
    return allStatuses.filter((s) => {
      if (s.statusType && s.statusType.toLowerCase() !== 'ticket') return false;
      if (s.allowedRoles && String(s.allowedRoles).trim() !== '') {
        if (!userRole) return true;
        const roles = String(s.allowedRoles).split(',').map((r) => r.trim()).filter(Boolean);
        if (roles.length > 0 && !roles.includes(userRole)) return false;
      }
      return true;
    });
  }, [allStatuses, userRole]);

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
              {departments.map(dep => {
                const id = String(dep.departmentId || dep.id);
                return (
                  <MenuItem key={id} value={id}>
                    {dep.departmentName || dep.name}
                  </MenuItem>
                );
              })}
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
              {employees.map(emp => {
                const id = String(emp.employeeId || emp.id);
                return (
                  <MenuItem key={id} value={id}>
                    {emp.employeeName || emp.name}
                  </MenuItem>
                );
              })}
            </TextField>
          </Box>
          <Box>
            <Typography sx={lbl}>Status</Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={form.ticketStatusId ? String(form.ticketStatusId) : ''}
              onChange={handleChange('ticketStatusId')}
              sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
            >
              <MenuItem value="">— Select Status —</MenuItem>
              {statusOptions.map((s) => {
                const id = String(s.statusId || s.id);
                return (
                  <MenuItem key={id} value={id}>
                    {s.statusName || s.name}
                  </MenuItem>
                );
              })}
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
