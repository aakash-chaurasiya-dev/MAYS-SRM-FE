import { useState, useMemo } from 'react';
import { Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { List } from '../../stereotype/AbstractList';
import api from '../../services/api';
import DeleteConfirmDialog from '../../components/DeleteConfirmDialog';
import InStockPartModal from './InStockPartModal';

const formatMoney = (value) => {
  if (value == null) return '-';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
};

export default function InStockPartsPage() {
  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useState([]);
  const [clearSelectionKey, setClearSelectionKey] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingItem, setEditingItem] = useState(null);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

  const { data: parts = [] } = useQuery({
    queryKey: ['inventory-in-stock'],
    queryFn: async () => {
      const response = await api.get('/inventory/in-stock');
      return response.data?.data || response.data || [];
    },
    select: (data) =>
      (data || []).map((row, i) => ({
        ...row,
        id: row.individualPartId || `fallback-id-${i}`,
      })),
    staleTime: 1000 * 60 * 5,
  });

  const deleteMutation = useMutation({
    mutationFn: (ids) => api.delete('/inventory/in-stock', { data: ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-in-stock'] });
      setOpenDeleteConfirm(false);
      setSelectedIds([]);
      setClearSelectionKey((prev) => prev + 1);
    },
    onError: (error) => {
      console.error('Failed to delete in-stock parts:', error);
      alert(error.response?.data?.message || error.message || 'Failed to delete in-stock parts');
    },
  });

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingItem(null);
    setOpenModal(true);
  };

  const handleOpenUpdateModal = () => {
    if (selectedIds.length !== 1) return;
    const item = parts.find((p) => String(p.id) === String(selectedIds[0]));
    if (!item) return;
    setModalMode('update');
    setEditingItem(item);
    setOpenModal(true);
  };

  const handleModalClose = (saved) => {
    setOpenModal(false);
    setEditingItem(null);
    if (saved && modalMode === 'update') {
      setSelectedIds([]);
      setClearSelectionKey((prev) => prev + 1);
    }
  };

  const config = useMemo(() => ({
    title: 'In-Stock Parts',
    subtitle: `${parts.length} individual parts`,
    rows: parts,
    columns: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'partName', headerName: 'Part Name', width: 160, renderType: 'link' },
      { field: 'partSrNo', headerName: 'Serial No', width: 130 },
      { field: 'barcode', headerName: 'Barcode', width: 120 },
      { field: 'source', headerName: 'Source', width: 100 },
      {
        field: 'received',
        headerName: 'Received',
        width: 90,
        renderCell: (params) => (params.value ? 'Yes' : 'No'),
      },
      {
        field: 'salesPrice',
        headerName: 'Sales Price',
        width: 110,
        renderCell: (params) => formatMoney(params.value),
      },
      {
        field: 'purchasePrice',
        headerName: 'Purchase Price',
        width: 120,
        renderCell: (params) => formatMoney(params.value),
      },
      { field: 'createdByName', headerName: 'Created By', width: 130 },
      { field: 'updatedByName', headerName: 'Updated By', width: 130 },
    ],
    checkboxSelection: true,
    searchable: true,
    searchPlaceholder: 'Search in-stock parts...',
    pagination: { pageSize: 10, pageSizeOptions: [5, 10, 25] },
    height: 480,
    gridKey: clearSelectionKey,
    actions: [
      { label: 'Add Part', icon: <AddIcon />, variant: 'contained', color: 'primary', onClick: handleOpenCreateModal },
    ],
  }), [parts, clearSelectionKey]);

  return (
    <Box sx={{ p: 2, pt: 3 }}>
      <List
        config={config}
        rowSelectionModel={selectedIds}
        onRowSelectionModelChange={setSelectedIds}
      />

      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<EditOutlinedIcon />}
          disabled={selectedIds.length !== 1}
          onClick={handleOpenUpdateModal}
        >
          Update
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteOutlinedIcon />}
          disabled={selectedIds.length === 0}
          onClick={() => setOpenDeleteConfirm(true)}
        >
          Delete
        </Button>
      </Box>

      <InStockPartModal
        open={openModal}
        onClose={handleModalClose}
        mode={modalMode}
        item={editingItem}
      />

      <DeleteConfirmDialog
        open={openDeleteConfirm}
        onClose={() => setOpenDeleteConfirm(false)}
        onConfirm={() => deleteMutation.mutate(selectedIds.map(Number))}
        itemType="in-stock part"
        count={selectedIds.length}
        isLoading={deleteMutation.isPending}
      />
    </Box>
  );
}
