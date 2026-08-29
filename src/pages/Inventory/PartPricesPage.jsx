import { useState, useMemo } from 'react';
import { Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { List } from '../../stereotype/AbstractList';
import api from '../../services/api';
import DeleteConfirmDialog from '../../components/DeleteConfirmDialog';
import PartPriceModal from './PartPriceModal';

const formatMoney = (value, currency = 'INR') => {
  if (value == null) return '-';
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR' }).format(value);
  } catch {
    return String(value);
  }
};

export default function PartPricesPage() {
  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useState([]);
  const [clearSelectionKey, setClearSelectionKey] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingItem, setEditingItem] = useState(null);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

  const { data: prices = [] } = useQuery({
    queryKey: ['inventory-prices'],
    queryFn: async () => {
      const response = await api.get('/inventory/prices');
      return response.data?.data || response.data || [];
    },
    select: (data) =>
      (data || []).map((row, i) => ({
        ...row,
        id: row.partCatId || `fallback-id-${i}`,
      })),
    staleTime: 1000 * 60 * 5,
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map((id) => api.delete(`/inventory/prices/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-prices'] });
      setOpenDeleteConfirm(false);
      setSelectedIds([]);
      setClearSelectionKey((prev) => prev + 1);
    },
    onError: (error) => {
      console.error('Failed to delete part prices:', error);
      alert(error.response?.data?.message || error.message || 'Failed to delete part prices');
    },
  });

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingItem(null);
    setOpenModal(true);
  };

  const handleOpenUpdateModal = () => {
    if (selectedIds.length !== 1) return;
    const item = prices.find((p) => String(p.id) === String(selectedIds[0]));
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
    title: 'Part Prices',
    subtitle: `${prices.length} price records`,
    rows: prices,
    columns: [
      { field: 'id', headerName: 'Part Cat ID', width: 100 },
      { field: 'partName', headerName: 'Part Name', width: 180, renderType: 'link' },
      { field: 'sku', headerName: 'SKU', width: 120 },
      {
        field: 'salesPrice',
        headerName: 'Sales Price',
        width: 120,
        renderCell: (params) => formatMoney(params.value, params.row?.currency),
      },
      {
        field: 'purchasePrice',
        headerName: 'Purchase Price',
        width: 130,
        renderCell: (params) => formatMoney(params.value, params.row?.currency),
      },
      { field: 'currency', headerName: 'Currency', width: 90 },
      { field: 'createdByName', headerName: 'Created By', width: 130 },
      { field: 'updatedByName', headerName: 'Updated By', width: 130 },
    ],
    checkboxSelection: true,
    searchable: true,
    searchPlaceholder: 'Search part prices...',
    pagination: { pageSize: 10, pageSizeOptions: [5, 10, 25] },
    height: 480,
    gridKey: clearSelectionKey,
    actions: [
      { label: 'Add Price', icon: <AddIcon />, variant: 'contained', color: 'primary', onClick: handleOpenCreateModal },
    ],
  }), [prices, clearSelectionKey]);

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

      <PartPriceModal
        open={openModal}
        onClose={handleModalClose}
        mode={modalMode}
        item={editingItem}
      />

      <DeleteConfirmDialog
        open={openDeleteConfirm}
        onClose={() => setOpenDeleteConfirm(false)}
        onConfirm={() => deleteMutation.mutate(selectedIds.map(Number))}
        itemType="part price"
        count={selectedIds.length}
        isLoading={deleteMutation.isPending}
      />
    </Box>
  );
}
