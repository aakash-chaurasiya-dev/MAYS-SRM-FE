import { useState, useEffect, useImperativeHandle, forwardRef, useMemo } from 'react';
import { Box, Typography, Paper, Divider, Stack, TextField, MenuItem } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { getUserRole } from '../../../access/featureAccess';

/**
 * TicketOperations
 * 
 * Specifically for staff users. Manages the assignment (Department, Employee) 
 * and Status of the ticket.
 */
const TicketOperations = forwardRef(({ ticket, isEditMode }, ref) => {
  const theme = useTheme();
  const { user } = useAuth();
  const userRole = getUserRole(user);

  const [initialLoad, setInitialLoad] = useState(false);

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

  const { data: allStatuses = [] } = useQuery({
    queryKey: ['statuses'],
    queryFn: async () => {
      const res = await api.get('/statuses');
      return res.data?.data || res.data || [];
    },
  });

  // Ticket statuses: case-insensitive type, optional role + department filters (aligned with create flow)
  const statuses = useMemo(() => {
    const ticketStatuses = allStatuses.filter((s) => {
      if (s.statusType && s.statusType.toLowerCase() !== 'ticket') return false;
      if (s.allowedRoles && String(s.allowedRoles).trim() !== '') {
        if (!userRole) return true; // don't hide options if role can't be resolved
        const roles = String(s.allowedRoles).split(',').map((r) => r.trim()).filter(Boolean);
        if (roles.length > 0 && !roles.includes(userRole)) return false;
      }
      return true;
    });

    const deptId = editForm.departmentId || ticket?.departmentId;
    if (!deptId) return ticketStatuses;

    const deptIdStr = String(deptId);
    return ticketStatuses.filter((s) => {
      const allowed = s.allowedDepartmentIds;
      if (!allowed || String(allowed).trim() === '') return true;
      return String(allowed).split(',').map((d) => d.trim()).includes(deptIdStr);
    });
  }, [allStatuses, userRole, editForm.departmentId, ticket?.departmentId]);

  // Ensure current ticket status remains selectable/visible even if filters exclude it
  const statusOptions = useMemo(() => {
    const currentId = editForm.ticketStatusId || ticket?.ticketStatusId;
    if (!currentId) return statuses;
    const currentIdStr = String(currentId);
    const alreadyListed = statuses.some((s) => String(s.statusId || s.id) === currentIdStr);
    if (alreadyListed) return statuses;

    const current = allStatuses.find((s) => String(s.statusId || s.id) === currentIdStr);
    if (current) return [current, ...statuses];
    if (ticket?.ticketStatusName) {
      return [
        { statusId: currentId, statusName: ticket.ticketStatusName },
        ...statuses,
      ];
    }
    return statuses;
  }, [statuses, allStatuses, editForm.ticketStatusId, ticket?.ticketStatusId, ticket?.ticketStatusName]);

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
      const statId = ticket?.ticketStatusId ?? '';

      setEditForm(prev => ({
        ...prev,
        departmentId: deptId !== undefined && deptId !== null ? String(deptId) : '',
        ticketStatusId: statId !== '' && statId !== null && statId !== undefined ? String(statId) : '',
      }));
    }
  }, [isEditMode, ticket]);

  // Set initial employee when the dependent employees array finishes loading
  useEffect(() => {
    if (initialLoad && employees.length > 0) {
      const empId = ticket?.employeeId || ticket?.assigneeEmployeeId || ticket?.employee?.employeeId || '';
      setEditForm(prev => ({
        ...prev,
        employeeId: empId !== '' && empId !== null && empId !== undefined ? String(empId) : '',
      }));
      setInitialLoad(false);
    }
  }, [employees, initialLoad, ticket]);

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
                value={editForm.departmentId || ''} 
                onChange={(e) => setEditForm({...editForm, departmentId: e.target.value, employeeId: ''})} 
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
              >
                <MenuItem value="">Unassigned</MenuItem>
                {departments.map(dep => {
                  const id = String(dep.departmentId || dep.id);
                  return (
                    <MenuItem key={id} value={id}>{dep.departmentName || dep.name}</MenuItem>
                  );
                })}
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
                value={editForm.employeeId || ''} 
                onChange={(e) => setEditForm({...editForm, employeeId: e.target.value})} 
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
                disabled={!editForm.departmentId}
              >
                <MenuItem value="">Unassigned</MenuItem>
                {employees.map(emp => {
                  const id = String(emp.employeeId || emp.id);
                  return (
                    <MenuItem key={id} value={id}>{emp.employeeName || emp.name}</MenuItem>
                  );
                })}
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
                value={editForm.ticketStatusId || ''} 
                onChange={(e) => setEditForm({...editForm, ticketStatusId: e.target.value})} 
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
              >
                {statusOptions.map((s) => {
                  const id = String(s.statusId || s.id);
                  return (
                    <MenuItem key={id} value={id}>
                      {s.statusName || s.name}
                    </MenuItem>
                  );
                })}
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
