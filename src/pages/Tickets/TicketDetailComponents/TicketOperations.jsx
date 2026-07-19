import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Box, Typography, Paper, Divider, Stack, TextField, MenuItem } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

/**
 * TicketOperations
 * 
 * Specifically for staff users. Manages the assignment (Department, Employee) 
 * and Status of the ticket.
 */
const TicketOperations = forwardRef(({ ticket, isEditMode }, ref) => {
  const theme = useTheme();
  const { user } = useAuth();
  const userRole = user?.roles?.[0]?.authority || user?.role?.[0]?.authority;

  const [initialLoad, setInitialLoad] = useState(false);
  const [originalEmployeeId, setOriginalEmployeeId] = useState('');

  // Form
  const [editForm, setEditForm] = useState({
    employeeId: '',
    departmentId: '',
    ticketStatusId: '',
  });

  // 1. Global Lookups
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
    select: (data) => data.filter(s => {
      if (s.statusType !== 'Ticket' && s.statusType !== 'TICKET') return false;
      if (s.allowedRoles && !s.allowedRoles.includes(userRole)) return false;
      return true;
    })
  });

  // 2. Dependent Query: Only fetch employees when departmentId is set
  const { data: employees = [] } = useQuery({
    queryKey: ['employees', editForm.departmentId],
    queryFn: async () => {
      const res = await api.get(`/employees/department/${editForm.departmentId}`);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!editForm.departmentId, // Wait until department is selected
  });

  const assignedTo = ticket?.employeeName || 'Not available';
  const department = ticket?.departmentName || 'Not available';
  const statusDisplay = ticket?.ticketStatusName || ticket?.status || 'Open';

  // Initialize form when Edit mode starts
  useEffect(() => {
    if (isEditMode) {
      setInitialLoad(true);

      const deptId = ticket?.departmentId || ticket?.department?.departmentId || '';
      const statId = ticket?.ticketStatusId || '';

      setEditForm(prev => ({
        ...prev,
        departmentId: deptId || '',
        ticketStatusId: statId || '',
      }));
    }
  }, [isEditMode, ticket]);

  // Set initial employee when the dependent employees array finishes loading
  useEffect(() => {
    if (initialLoad && employees.length > 0) {
      const empId = ticket?.employeeId || ticket?.assigneeEmployeeId || ticket?.employee?.employeeId || '';
      
      setOriginalEmployeeId(String(empId));
      setEditForm(prev => ({ ...prev, employeeId: empId }));
      setInitialLoad(false);
    }
  }, [employees, initialLoad, ticket]);

  // Auto-set status to Open if assigned to someone else
  const isReassigned = editForm.employeeId && String(editForm.employeeId) !== String(originalEmployeeId);
  const openStatus = statuses.find(s => (s.statusName || s.name)?.toLowerCase() === 'open');

  useEffect(() => {
    if (isReassigned && openStatus) {
      setEditForm(prev => ({ ...prev, ticketStatusId: openStatus.statusId }));
    }
  }, [isReassigned, openStatus]);

  useImperativeHandle(ref, () => ({
    getFormData: () => {
      return {
        employeeId: editForm.employeeId || null,
        departmentId: editForm.departmentId || null,
        ticketStatusId: editForm.ticketStatusId || null,
      };
    }
  }));

  const lbl = {
    fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary,
    textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5,
  };

  return (
    <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
      <Box sx={{ px: 2.5, py: 1.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Operations</Typography>
      </Box>
      <Divider />
      <Box sx={{ p: 2.5 }}>
        <Stack spacing={2} sx={{ mb: 2.5 }}>
          <Box>
            <Typography sx={lbl}>Department</Typography>
            {isEditMode ? (
              <TextField 
                select 
                fullWidth 
                size="small" 
                value={editForm.departmentId} 
                onChange={(e) => setEditForm({...editForm, departmentId: e.target.value, employeeId: ''})} 
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
              >
                <MenuItem value="">Unassigned</MenuItem>
                {departments.map(dep => <MenuItem key={dep.departmentId || dep.id} value={dep.departmentId || dep.id}>{dep.departmentName || dep.name}</MenuItem>)}
              </TextField>
            ) : (
              <Typography sx={{ fontSize: '13px' }}>{department}</Typography>
            )}
          </Box>
          <Box>
            <Typography sx={lbl}>Assigned To</Typography>
            {isEditMode ? (
              <TextField 
                select 
                fullWidth 
                size="small" 
                value={editForm.employeeId} 
                onChange={(e) => setEditForm({...editForm, employeeId: e.target.value})} 
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
                disabled={!editForm.departmentId}
              >
                <MenuItem value="">Unassigned</MenuItem>
                {employees.map(emp => <MenuItem key={emp.employeeId || emp.id} value={emp.employeeId || emp.id}>{emp.employeeName || emp.name}</MenuItem>)}
              </TextField>
            ) : (
              <Typography sx={{ fontSize: '13px' }}>{assignedTo}</Typography>
            )}
          </Box>
          <Box>
            <Typography sx={lbl}>Status</Typography>
            {isEditMode ? (
              <TextField 
                select 
                fullWidth 
                size="small" 
                value={editForm.ticketStatusId} 
                onChange={(e) => setEditForm({...editForm, ticketStatusId: e.target.value})} 
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
                disabled={isReassigned}
              >
                {statuses.map(s => <MenuItem key={s.statusId || s.id} value={s.statusId || s.id}>{s.statusName || s.name}</MenuItem>)}
              </TextField>
            ) : (
              <Typography sx={{ fontSize: '13px' }}>{statusDisplay}</Typography>
            )}
          </Box>
        </Stack>
      </Box>
    </Paper>
  );
});

export default TicketOperations;
