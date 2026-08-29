import { useState, useMemo } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Button,
  Divider,
  Typography,
  Switch,
  FormControlLabel,
  Checkbox,
  ListItemText,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';

import { List } from '../../../stereotype/AbstractList';
import api from '../../../services/api';
import { useTheme } from '@mui/material/styles';
import DeleteConfirmDialog from '../../../components/DeleteConfirmDialog';

export default function ChargeTypeManagementPage() {
  const theme = useTheme();
  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useState([]);
  const [clearSelectionKey, setClearSelectionKey] = useState(0);

  // Modal & Form State
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'update'

  // Delete Confirmation State
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

  const initialFormState = {
    chargeTypeId: '',
    chargeName: '',
    chargeDescription: '',
    allowedDepartmentIds: [],
    allowedRoles: '',
    customerVisibility: true,
    accountingSide: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  // ---------------------------------------------------------------------------
  // Charge Types
  // ---------------------------------------------------------------------------

  const { data: chargeTypes = [] } = useQuery({
    queryKey: ['chargeTypes'],
    queryFn: async () => {
      const response = await api.get('/charge-types');
      return response.data?.data || response.data || [];
    },
    select: (data) =>
      data.map((ct, index) => ({
        ...ct,
        id: ct.chargeTypeId || `fallback-id-${index}`,
      })),
    staleTime: 1000 * 60 * 60,
  });

  // ---------------------------------------------------------------------------
  // Departments
  // ---------------------------------------------------------------------------

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/departments');
      return response.data?.data || response.data || [];
    },
    staleTime: 1000 * 60 * 60,
  });

  // ---------------------------------------------------------------------------
  // Create Modal
  // ---------------------------------------------------------------------------

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormData(initialFormState);
    setOpenModal(true);
  };

  // ---------------------------------------------------------------------------
  // Update Modal
  // ---------------------------------------------------------------------------

  const handleOpenUpdateModal = () => {
    if (selectedIds.length !== 1) return;

    const ctToUpdate = chargeTypes.find(
      (ct) => String(ct.id) === String(selectedIds[0])
    );

    if (ctToUpdate) {
      setModalMode('update');

      setFormData({
        chargeTypeId: ctToUpdate.chargeTypeId || '',
        chargeName: ctToUpdate.chargeName || '',
        chargeDescription: ctToUpdate.chargeDescription || '',

        allowedDepartmentIds: ctToUpdate.allowedDepartmentIds
          ? ctToUpdate.allowedDepartmentIds
              .split(',')
              .filter((v) => v.trim() !== '')
              .map((v) => Number(v.trim()))
          : [],

        allowedRoles: ctToUpdate.allowedRoles || '',

        customerVisibility:
          ctToUpdate.customerVisibility !== undefined
            ? Boolean(ctToUpdate.customerVisibility)
            : true,

        accountingSide: ctToUpdate.accountingSide || '',
      });

      setOpenModal(true);
    }
  };

  // ---------------------------------------------------------------------------
  // Close Modal
  // ---------------------------------------------------------------------------

  const handleCloseModal = () => {
    setOpenModal(false);
    setFormData(initialFormState);
  };

  // ---------------------------------------------------------------------------
  // Form Change
  // ---------------------------------------------------------------------------

  const handleFormChange = (e) => {
    const { name, value, checked, type } = e.target;

    let newValue = value;

    if (type === 'checkbox') {
      newValue = checked;
    } else if (name === 'allowedDepartmentIds') {
      // MUI Select can return a string when autofill is used.
      newValue = typeof value === 'string' ? value.split(',') : value;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  // ---------------------------------------------------------------------------
  // Create / Update Mutation
  // ---------------------------------------------------------------------------

  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      if (modalMode === 'create') {
        return api.post('/charge-types', payload);
      } else {
        return api.put(
          `/charge-types/${formData.chargeTypeId}`,
          payload
        );
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['chargeTypes'],
      });

      if (modalMode !== 'create') {
        setSelectedIds([]);
        setClearSelectionKey((prev) => prev + 1);
      }

      handleCloseModal();
    },

    onError: (error) => {
      console.error(
        `Failed to ${modalMode} charge type:`,
        error
      );
    },
  });

  // ---------------------------------------------------------------------------
  // Delete Mutation
  // ---------------------------------------------------------------------------

  const deleteMutation = useMutation({
    mutationFn: async (ctId) =>
      api.delete(`/charge-types/${ctId}`),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['chargeTypes'],
      });

      setOpenDeleteConfirm(false);
      setSelectedIds([]);
      setClearSelectionKey((prev) => prev + 1);
    },

    onError: (error) => {
      console.error(
        'Failed to delete charge type:',
        error
      );
    },
  });

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const handleSubmit = (e) => {
    e.preventDefault();

    submitMutation.mutate({
      chargeName: formData.chargeName,
      chargeDescription: formData.chargeDescription,

      allowedDepartmentIds:
        formData.allowedDepartmentIds.length > 0
          ? formData.allowedDepartmentIds.join(',')
          : null,

      allowedRoles:
        formData.allowedRoles?.trim()
          ? formData.allowedRoles.trim()
          : null,

      customerVisibility: formData.customerVisibility,

      accountingSide:
        formData.accountingSide?.trim()
          ? formData.accountingSide.trim()
          : null,
    });
  };

  // ---------------------------------------------------------------------------
  // Delete Confirm
  // ---------------------------------------------------------------------------

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(selectedIds[0]);
  };

  // ---------------------------------------------------------------------------
  // Locked Rows
  // ---------------------------------------------------------------------------

  const selectedRowsAreLocked = selectedIds.some((id) => {
    const row = chargeTypes.find(
      (ct) => String(ct.id) === String(id)
    );

    return row?.isLocked;
  });

  // ---------------------------------------------------------------------------
  // Table Configuration
  // ---------------------------------------------------------------------------

  const config = useMemo(
    () => ({
      title: 'Charge Type Management',

      subtitle: `${chargeTypes.length} charge types configured`,

      rows: chargeTypes,

      columns: [
        {
          field: 'id',
          headerName: 'Charge Type ID',
          width: 140,
        },

        {
          field: 'chargeName',
          headerName: 'Charge Name',
          flex: 1.5,
          renderType: 'link',
        },

        {
          field: 'chargeDescription',
          headerName: 'Description',
          flex: 2,
        },

        {
          field: 'allowedDepartmentIds',
          headerName: 'Allowed Departments',
          flex: 1.5,
        },

        {
          field: 'allowedRoles',
          headerName: 'Allowed Roles',
          flex: 1.2,
        },

        {
          field: 'customerVisibility',
          headerName: 'Customer Visibility',
          width: 160,

          renderCell: (params) => {
            const visible =
              params.value === true ||
              params.value === 'true' ||
              params.value === 1 ||
              params.value === '1';

            return (
              <Box
                sx={{
                  display: 'inline-flex',
                  px: 1,
                  py: 0.2,
                  borderRadius: 1,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  bgcolor: visible
                    ? `${theme.palette.success.main}1A`
                    : `${theme.palette.error.main}1A`,
                  color: visible
                    ? 'success.main'
                    : 'error.main',
                }}
              >
                {visible ? 'Visible' : 'Hidden'}
              </Box>
            );
          },
        },

        {
          field: 'accountingSide',
          headerName: 'Accounting Side',
          width: 140,
        },

        {
          field: 'insertDate',
          headerName: 'Created At',
          width: 130,
          type: 'date',
          valueGetter: (value) =>
            value ? new Date(value) : null,
        },

        {
          field: 'lastUpdateDate',
          headerName: 'Updated At',
          width: 130,
          type: 'date',
          valueGetter: (value) =>
            value ? new Date(value) : null,
        },
      ],

      checkboxSelection: true,

      searchable: true,

      searchPlaceholder: 'Search charge types…',

      pagination: {
        pageSize: 10,
        pageSizeOptions: [5, 10, 25],
      },

      height: 480,

      gridKey: clearSelectionKey,

      getRowClassName: (params) =>
        params.row?.isLocked ? 'locked-row' : '',

      headerActions: [
        {
          label: 'Update',
          icon: <EditOutlinedIcon />,
          variant: 'outlined',
          color: 'primary',
          disabled:
            selectedIds.length !== 1 ||
            selectedRowsAreLocked,
          onClick: handleOpenUpdateModal,
        },

        {
          label: 'Delete',
          icon: <DeleteOutlinedIcon />,
          variant: 'outlined',
          color: 'error',
          disabled:
            selectedIds.length === 0 ||
            selectedRowsAreLocked,
          onClick: () => setOpenDeleteConfirm(true),
        },
      ],

      actions: [
        {
          label: 'Add Charge Type',
          icon: <AddIcon />,
          variant: 'contained',
          color: 'primary',
          onClick: handleOpenCreateModal,
        },
      ],
    }),
    [
      chargeTypes,
      clearSelectionKey,
      theme,
      selectedIds,
      selectedRowsAreLocked,
    ]
  );

  // ---------------------------------------------------------------------------
  // Label Style
  // ---------------------------------------------------------------------------

  const lbl = {
    fontSize: '12px',
    fontWeight: 700,
    color: theme.palette.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    mb: 0.8,
    mt: 2,
  };

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------

  return (
    <Box>
      <List
        config={config}
        rowSelectionModel={selectedIds}
        onRowSelectionModelChange={setSelectedIds}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Create / Update Modal */}
      {/* ------------------------------------------------------------------ */}

      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '4px',
            border: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <DialogTitle
          sx={{
            fontSize: '18px',
            fontWeight: 600,
            py: 2,
            px: 3,
          }}
        >
          {modalMode === 'create'
            ? 'Add New Charge Type'
            : 'Update Charge Type'}
        </DialogTitle>

        <Divider />

        <DialogContent
          sx={{
            px: 3,
            py: 2.5,
          }}
        >
          <Box
            component="form"
            id="chargetype-form"
            onSubmit={handleSubmit}
          >
            <Typography
              sx={{
                fontSize: '13px',
                color: theme.palette.text.secondary,
                mb: 2.5,
              }}
            >
              {modalMode === 'create'
                ? 'Register a new charge type to the system.'
                : 'Update the details of the selected charge type.'}
            </Typography>

            {/* Charge Name */}

            <Typography
              sx={{
                ...lbl,
                mt: 0,
              }}
            >
              Charge Name
            </Typography>

            <TextField
              fullWidth
              size="small"
              placeholder="e.g. Labor Fee"
              name="chargeName"
              value={formData.chargeName}
              onChange={handleFormChange}
              required
              sx={{ mb: 2 }}
            />

            {/* Charge Description */}

            <Typography sx={{ ...lbl, mt: 1 }}>
              Charge Description
            </Typography>

            <TextField
              fullWidth
              size="small"
              placeholder="Enter charge description"
              name="chargeDescription"
              value={formData.chargeDescription}
              onChange={handleFormChange}
              required
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />

            {/* Allowed Departments */}

            <Typography sx={{ ...lbl, mt: 1 }}>
              Allowed Departments (Optional)
            </Typography>

            <FormControl
              fullWidth
              size="small"
              sx={{ mb: 2 }}
            >
              <Select
                multiple
                displayEmpty
                name="allowedDepartmentIds"
                value={
                  formData.allowedDepartmentIds || []
                }
                onChange={handleFormChange}
                renderValue={(selected) => {
                  if (!selected || selected.length === 0) {
                    return (
                      <Typography color="text.secondary">
                        None (Available to all)
                      </Typography>
                    );
                  }

                  return selected
                    .map((id) => {
                      const dept = departments.find(
                        (d) =>
                          Number(d.departmentId) ===
                          Number(id)
                      );

                      return dept
                        ? dept.departmentName
                        : id;
                    })
                    .join(', ');
                }}
              >
                {departments.map((dept) => (
                  <MenuItem
                    key={dept.departmentId}
                    value={dept.departmentId}
                  >
                    <Checkbox
                      checked={
                        (
                          formData.allowedDepartmentIds ||
                          []
                        ).indexOf(dept.departmentId) > -1
                      }
                    />

                    <ListItemText
                      primary={dept.departmentName}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Accounting Side */}

            <Typography sx={{ ...lbl, mt: 1 }}>
              Accounting Side
            </Typography>

            <TextField
              select
              fullWidth
              size="small"
              name="accountingSide"
              value={formData.accountingSide || ''}
              onChange={handleFormChange}
              required
              sx={{ mb: 2 }}
            >
              <MenuItem value="R">Receivable</MenuItem>
              <MenuItem value="P">Payable</MenuItem>
            </TextField>

            {/* Customer Visibility */}

            <Typography sx={{ ...lbl, mt: 1 }}>
              Customer Visibility
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={
                    formData.customerVisibility === true
                  }
                  onChange={handleFormChange}
                  name="customerVisibility"
                  color="primary"
                />
              }
              label={
                formData.customerVisibility
                  ? 'Visible to Customer'
                  : 'Hidden from Customer'
              }
              sx={{
                mb: 1,
                ml: 0,
              }}
            />
          </Box>
        </DialogContent>

        <Divider />

        <DialogActions
          sx={{
            px: 3,
            py: 2,
          }}
        >
          <Button
            onClick={handleCloseModal}
            variant="outlined"
            disabled={submitMutation.isPending}
            sx={{ px: 3 }}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="chargetype-form"
            variant="contained"
            disabled={submitMutation.isPending}
            sx={{
              px: 3,
              minWidth: 100,
            }}
          >
            {submitMutation.isPending ? (
              <CircularProgress
                size={24}
                color="inherit"
              />
            ) : modalMode === 'create' ? (
              'Save Charge Type'
            ) : (
              'Update Charge Type'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* Delete Confirmation */}
      {/* ------------------------------------------------------------------ */}

      <DeleteConfirmDialog
        open={openDeleteConfirm}
        onClose={() => setOpenDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        itemType="charge type"
        itemTypePlural="charge types"
        count={selectedIds.length}
        isLoading={deleteMutation.isPending}
      />
    </Box>
  );
}

