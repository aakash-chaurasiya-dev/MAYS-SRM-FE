import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress, Button, Divider, Typography, MenuItem, FormControlLabel, Switch,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { List } from '../../../stereotype/AbstractList';
import api from '../../../services/api';
import { useTheme } from '@mui/material/styles';
import DeleteConfirmDialog from '../../../components/DeleteConfirmDialog';
import { KNOWN_ROLES } from '../../../access/featureAccess';

const SLA_TIMER_ACTIONS = ['NONE', 'CREATE_HOLD_REQUEST', 'PAUSE_TIMER', 'RESUME_TIMER', 'STOP_TIMER'];

export default function SlaPolicyManagementPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useState([]);
  const [clearSelectionKey, setClearSelectionKey] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

  const initialFormState = {
    id: '', departmentId: '', role: '', targetMinutes: 120, isTimerTracked: true, isActive: true,
  };
  const [formData, setFormData] = useState(initialFormState);

  const { data: policies = [] } = useQuery({
    queryKey: ['sla-policies'],
    queryFn: async () => {
      const res = await api.get('/sla-policies');
      return (res.data || []).map((p, i) => ({ ...p, id: p.id || `fallback-${i}` }));
    },
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/departments');
      return res.data?.data || res.data || [];
    },
  });

  const submitMutation = useMutation({
    mutationFn: (payload) => modalMode === 'create'
      ? api.post('/sla-policies', payload)
      : api.put(`/sla-policies/${formData.id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-policies'] });
      setOpenModal(false);
      setSelectedIds([]);
      setClearSelectionKey((k) => k + 1);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/sla-policies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-policies'] });
      setOpenDeleteConfirm(false);
      setSelectedIds([]);
      setClearSelectionKey((k) => k + 1);
    },
  });

  const listConfig = {
    title: 'SLA Policies',
    rows: policies,
    columns: [
      { field: 'departmentName', headerName: 'Department', flex: 1 },
      { field: 'role', headerName: 'Role', width: 140 },
      { field: 'targetMinutes', headerName: 'Target (min)', width: 120 },
      {
        field: 'isTimerTracked', headerName: 'Timer Tracked', width: 130,
        renderType: 'chip', chipColorMap: { true: 'success', false: 'default' },
      },
      {
        field: 'isActive', headerName: 'Active', width: 100,
        renderType: 'chip', chipColorMap: { true: 'success', false: 'default' },
      },
    ],
    actions: [
      { label: 'Add Policy', icon: <AddIcon />, onClick: () => { setModalMode('create'); setFormData(initialFormState); setOpenModal(true); } },
      { label: 'Edit', icon: <EditOutlinedIcon />, onClick: () => {
        const p = policies.find((x) => String(x.id) === String(selectedIds[0]));
        if (p) {
          setModalMode('update');
          setFormData({
            id: p.id, departmentId: p.departmentId || '', role: p.role || '',
            targetMinutes: p.targetMinutes ?? 120, isTimerTracked: p.isTimerTracked !== false, isActive: p.isActive !== false,
          });
          setOpenModal(true);
        }
      }, disabled: selectedIds.length !== 1 },
      { label: 'Delete', icon: <DeleteOutlinedIcon />, onClick: () => setOpenDeleteConfirm(true), disabled: selectedIds.length !== 1 },
    ],
    onSelectionChange: setSelectedIds,
    clearSelectionKey,
    getRowId: (row) => row.id,
    height: 480,
  };

  const lbl = { fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5 };

  return (
    <Box>
      <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate('/maintenance')} sx={{ mb: 2 }}>Back</Button>
      <List config={listConfig} />

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{modalMode === 'create' ? 'Add SLA Policy' : 'Update SLA Policy'}</DialogTitle>
        <Divider />
        <DialogContent>
          <Typography sx={lbl}>Department</Typography>
          <TextField select fullWidth size="small" name="departmentId" value={formData.departmentId}
            onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })} sx={{ mb: 2 }} required>
            {departments.map((d) => (
              <MenuItem key={d.departmentId} value={d.departmentId}>{d.departmentName}</MenuItem>
            ))}
          </TextField>
          <Typography sx={lbl}>Role (optional)</Typography>
          <TextField select fullWidth size="small" name="role" value={formData.role || ''}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })} sx={{ mb: 2 }}>
            <MenuItem value="">Department default</MenuItem>
            {KNOWN_ROLES.filter((r) => r.startsWith('ROLE_')).map((r) => (
              <MenuItem key={r} value={r}>{r}</MenuItem>
            ))}
          </TextField>
          <Typography sx={lbl}>Target Minutes</Typography>
          <TextField fullWidth size="small" type="number" name="targetMinutes" value={formData.targetMinutes}
            onChange={(e) => setFormData({ ...formData, targetMinutes: Number(e.target.value) })} sx={{ mb: 2 }} />
          <FormControlLabel control={<Switch checked={formData.isTimerTracked} onChange={(e) => setFormData({ ...formData, isTimerTracked: e.target.checked })} />}
            label="Track SLA timer for this department/role" />
          <FormControlLabel control={<Switch checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />}
            label="Active" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button variant="contained" disabled={submitMutation.isPending} onClick={() => submitMutation.mutate({
            departmentId: Number(formData.departmentId),
            role: formData.role || null,
            targetMinutes: formData.targetMinutes,
            isTimerTracked: formData.isTimerTracked,
            isActive: formData.isActive,
          })}>
            {submitMutation.isPending ? <CircularProgress size={22} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteConfirmDialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)}
        onConfirm={() => deleteMutation.mutate(selectedIds[0])} itemType="SLA policy" itemTypePlural="SLA policies"
        count={1} isLoading={deleteMutation.isPending} />
    </Box>
  );
}
