import { useState, useMemo } from 'react';
import { Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { List } from '../../stereotype/AbstractList';
import api from '../../services/api';
import DeleteConfirmDialog from '../../components/DeleteConfirmDialog';
import InventoryModal from './InventoryModal';

export default function InventoryPage() {
  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useState([]);
  const [clearSelectionKey, setClearSelectionKey] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingItem, setEditingItem] = useState(null);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const response = await api.get('/inventory');
      return response.data?.data || response.data || [];
    },
    select: (data) =>
      (data || []).map((inv, i) => ({
        ...inv,
        id: inv.productId || `fallback-id-${i}`,
      })),
    staleTime: 1000 * 60 * 5,
  });

  const deleteMutation = useMutation({
    mutationFn: (productId) => api.delete(`/inventory/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setOpenDeleteConfirm(false);
      setSelectedIds([]);
      setClearSelectionKey((prev) => prev + 1);
    },
    onError: (error) => {
      console.error('Failed to delete inventory item:', error);
      alert(error.response?.data?.message || error.message || 'Failed to delete inventory item');
    },
  });

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingItem(null);
    setOpenModal(true);
  };

  const handleOpenUpdateModal = () => {
    if (selectedIds.length !== 1) return;
    const invToUpdate = inventory.find((i) => String(i.id) === String(selectedIds[0]));
    if (!invToUpdate) return;
    setModalMode('update');
    setEditingItem(invToUpdate);
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
    title: 'Inventory Items',
    subtitle: `${inventory.length} products in stock`,
    rows: inventory,
    columns: [
      { field: 'id', headerName: 'ID', width: 70 },
      { field: 'productName', headerName: 'Product Name', width: 140, renderType: 'link' },
      { field: 'sku', headerName: 'SKU', width: 100 },
      { field: 'deviceTypeName', headerName: 'Device Type', width: 120 },
      {
        field: 'stock',
        headerName: 'Stock',
        width: 80,
        renderCell: (params) => {
          const min = params.row?.minStock;
          const isLow = min != null ? params.value < min : params.value < 10;
          return (
            <Box sx={{ color: isLow ? '#ba1a1a' : 'inherit', fontWeight: isLow ? 700 : 400 }}>
              {params.value}
            </Box>
          );
        },
      },
      { field: 'minStock', headerName: 'Min', width: 70 },
      { field: 'hsnCode', headerName: 'HSN', width: 90 },
      {
        field: 'buyingPrice',
        headerName: 'Buy Price',
        width: 100,
        renderCell: (params) => {
          if (params.value == null) return '-';
          return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(params.value);
        },
      },
      {
        field: 'sellingPrice',
        headerName: 'Sell Price',
        width: 100,
        renderCell: (params) => {
          if (params.value == null) return '-';
          return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(params.value);
        },
      },
      { field: 'branchName', headerName: 'Branch', width: 100 },
      {
        field: 'isActive',
        headerName: 'Active',
        width: 80,
        renderCell: (params) => (params.value === false ? 'No' : 'Yes'),
      },
      {
        field: 'lastUpdationDate',
        headerName: 'Last Updated',
        width: 140,
        renderCell: (params) => {
          if (!params.value) return '-';
          return new Date(params.value).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
        },
      },
    ],
    checkboxSelection: true,
    searchable: true,
    searchPlaceholder: 'Search inventory...',
    pagination: { pageSize: 10, pageSizeOptions: [5, 10, 25] },
    height: 480,
    gridKey: clearSelectionKey,
    actions: [
      { label: 'Add Item', icon: <AddIcon />, variant: 'contained', color: 'primary', onClick: handleOpenCreateModal },
    ],
  }), [inventory, clearSelectionKey]);

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

      <InventoryModal
        open={openModal}
        onClose={handleModalClose}
        mode={modalMode}
        item={editingItem}
      />

      <DeleteConfirmDialog
        open={openDeleteConfirm}
        onClose={() => setOpenDeleteConfirm(false)}
        onConfirm={() => deleteMutation.mutate(selectedIds[0])}
        itemType="inventory item"
        count={selectedIds.length}
        isLoading={deleteMutation.isPending}
      />
    </Box>
  );
}
