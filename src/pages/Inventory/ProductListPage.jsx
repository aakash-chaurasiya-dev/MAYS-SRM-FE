import { useState, useMemo } from 'react';
import { Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { List } from '../../stereotype/AbstractList';
import api from '../../services/api';
import DeleteConfirmDialog from '../../components/DeleteConfirmDialog';
import ProductListModal from './ProductListModal';

export default function ProductListPage() {
  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useState([]);
  const [clearSelectionKey, setClearSelectionKey] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingItem, setEditingItem] = useState(null);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ['inventory-products'],
    queryFn: async () => {
      const response = await api.get('/inventory/products');
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
    mutationFn: (ids) => api.delete('/inventory/products', { data: ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      setOpenDeleteConfirm(false);
      setSelectedIds([]);
      setClearSelectionKey((prev) => prev + 1);
    },
    onError: (error) => {
      console.error('Failed to delete products:', error);
      alert(error.response?.data?.message || error.message || 'Failed to delete products');
    },
  });

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingItem(null);
    setOpenModal(true);
  };

  const handleOpenUpdateModal = () => {
    if (selectedIds.length !== 1) return;
    const item = products.find((p) => String(p.id) === String(selectedIds[0]));
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
    title: 'Product List',
    subtitle: `${products.length} products`,
    rows: products,
    columns: [
      { field: 'id', headerName: 'ID', width: 70 },
      { field: 'partName', headerName: 'Part Name', width: 160, renderType: 'link' },
      { field: 'sku', headerName: 'SKU', width: 110 },
      { field: 'deviceTypeName', headerName: 'Device Type', width: 120 },
      { field: 'brandName', headerName: 'Brand', width: 110 },
      {
        field: 'stocks',
        headerName: 'Stocks',
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
      { field: 'maxStock', headerName: 'Max', width: 70 },
      { field: 'hsnCode', headerName: 'HSN', width: 90 },
      {
        field: 'isActive',
        headerName: 'Active',
        width: 80,
        renderCell: (params) => (params.value === false ? 'No' : 'Yes'),
      },
      { field: 'createdByName', headerName: 'Created By', width: 130 },
      { field: 'updatedByName', headerName: 'Updated By', width: 130 },
    ],
    checkboxSelection: true,
    searchable: true,
    searchPlaceholder: 'Search products...',
    pagination: { pageSize: 10, pageSizeOptions: [5, 10, 25] },
    height: 480,
    gridKey: clearSelectionKey,
    actions: [
      { label: 'Add Product', icon: <AddIcon />, variant: 'contained', color: 'primary', onClick: handleOpenCreateModal },
    ],
  }), [products, clearSelectionKey]);

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

      <ProductListModal
        open={openModal}
        onClose={handleModalClose}
        mode={modalMode}
        item={editingItem}
      />

      <DeleteConfirmDialog
        open={openDeleteConfirm}
        onClose={() => setOpenDeleteConfirm(false)}
        onConfirm={() => deleteMutation.mutate(selectedIds.map(Number))}
        itemType="product"
        count={selectedIds.length}
        isLoading={deleteMutation.isPending}
      />
    </Box>
  );
}
