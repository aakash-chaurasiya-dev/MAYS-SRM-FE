import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, TextField, MenuItem, CircularProgress, Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { useTheme } from '@mui/material/styles';
import { List } from '../../stereotype/AbstractList';
import api from '../../services/api';

export default function InventoryPage() {
  const theme = useTheme();

  const [inventory, setInventory] = useState([]);
  const [brands, setBrands] = useState([]);
  const [branches, setBranches] = useState([]);

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);
  const [clearSelectionKey, setClearSelectionKey] = useState(0);

  // Form State
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Delete Confirmation State
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const initialFormData = {
    productId: '',
    productName: '',
    brandId: '',
    specification: '',
    descr: '',
    sellingPrice: '',
    buyingPrice: '',
    stock: 0,
    branchId: '',
  };
  const [formData, setFormData] = useState(initialFormData);

  const fetchInventory = useCallback(async () => {
    try {
      const response = await api.get('/inventory');
      const data = response.data?.data || response.data || [];
      setInventory(data.map((inv, i) => ({
        ...inv,
        id: inv.productId || `fallback-id-${i}`,
      })));
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    }
  }, []);

  useEffect(() => {
    fetchInventory();

    const fetchBrands = async () => {
      try {
        const response = await api.get('/brands');
        setBrands(response.data?.data || response.data || []);
      } catch (error) {}
    };
    fetchBrands();

    const fetchBranches = async () => {
      try {
        const response = await api.get('/branches');
        setBranches(response.data?.data || response.data || []);
      } catch (error) {}
    };
    fetchBranches();
  }, [fetchInventory]);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormData(initialFormData);
    setOpenModal(true);
  };

  const handleOpenUpdateModal = () => {
    if (selectedIds.length !== 1) return;
    const invToUpdate = inventory.find(i => String(i.id) === String(selectedIds[0]));
    if (invToUpdate) {
      setModalMode('update');
      
      let matchedBrandId = invToUpdate.brandId || '';
      if (!matchedBrandId && invToUpdate.brandName) {
        const match = brands.find(b => b.brandName === invToUpdate.brandName);
        if (match) matchedBrandId = match.brandId || match.id;
      }
      
      let matchedBranchId = invToUpdate.branchId || '';
      if (!matchedBranchId && invToUpdate.branchName) {
        const match = branches.find(b => b.branchName === invToUpdate.branchName);
        if (match) matchedBranchId = match.branchId || match.id;
      }

      setFormData({
        productId: invToUpdate.productId || '',
        productName: invToUpdate.productName || '',
        brandId: matchedBrandId,
        specification: invToUpdate.specification || '',
        descr: invToUpdate.descr || '',
        sellingPrice: invToUpdate.sellingPrice || '',
        buyingPrice: invToUpdate.buyingPrice || '',
        stock: invToUpdate.stock || 0,
        branchId: matchedBranchId,
      });
      setOpenModal(true);
    }
  };
  
  const handleCloseModal = () => setOpenModal(false);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const payload = {
        productName: formData.productName,
        brandId: formData.brandId,
        specification: formData.specification,
        descr: formData.descr,
        sellingPrice: formData.sellingPrice,
        buyingPrice: formData.buyingPrice,
        stock: formData.stock,
        branchId: formData.branchId,
      };

      if (modalMode === 'create') {
        await api.post('/inventory', payload);
      } else {
        await api.put(`/inventory/${formData.productId}`, payload);
        setSelectedIds([]);
        setClearSelectionKey(prev => prev + 1);
      }
      handleCloseModal();
      fetchInventory();
    } catch (error) {
      console.error(`Failed to ${modalMode} inventory item:`, error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      const pId = selectedIds[0];
      await api.delete(`/inventory/${pId}`);
      setOpenDeleteConfirm(false);
      setSelectedIds([]);
      setClearSelectionKey(prev => prev + 1);
      fetchInventory();
    } catch (error) {
      console.error('Failed to delete inventory item:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const config = useMemo(() => ({
    title: 'Inventory Items',
    subtitle: `${inventory.length} products in stock`,
    rows: inventory,
    columns: [
      { field: 'id', headerName: 'ID', width: 70 },
      { field: 'productName', headerName: 'Product Name', width: 140, renderType: 'link' },
      { field: 'brandName', headerName: 'Brand', width: 100 },
      { field: 'deviceTypeName', headerName: 'Device Type', width: 120 },
      { field: 'specification', headerName: 'Spec', width: 100 },
      { field: 'descr', headerName: 'Desc', width: 120 },
      { 
        field: 'stock', 
        headerName: 'Stock', 
        width: 80,
        renderCell: (params) => {
          const isLow = params.value < 10;
          return (
            <Box sx={{ color: isLow ? '#ba1a1a' : 'inherit', fontWeight: isLow ? 700 : 400 }}>
              {params.value}
            </Box>
          );
        }
      },
      { 
        field: 'buyingPrice', 
        headerName: 'Buy Price', 
        width: 100,
        renderCell: (params) => {
          if (params.value == null) return '-';
          return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(params.value);
        }
      },
      { 
        field: 'sellingPrice', 
        headerName: 'Sell Price', 
        width: 100,
        renderCell: (params) => {
          if (params.value == null) return '-';
          return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(params.value);
        }
      },
      { field: 'branchName', headerName: 'Branch', width: 100 },
      { 
        field: 'lastUpdationDate', 
        headerName: 'Last Updated', 
        width: 140,
        renderCell: (params) => {
          if (!params.value) return '-';
          return new Date(params.value).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
        }
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

  const lbl = {
    fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary,
    textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.8, mt: 2,
  };

  return (
    <Box sx={{ p: 2, pt: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.01em', color: theme.palette.text.primary }}>Purchase & Inventory</Typography>
          <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>Manage workshop inventory levels</Typography>
        </Box>
      </Box>

      <List 
        config={config} 
        rowSelectionModel={selectedIds}
        onRowSelectionModelChange={setSelectedIds}
      />

      {/* Action Buttons for Update and Delete */}
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

      {/* ── Modal (Create/Update) ── */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, py: 2, px: 3 }}>
          {modalMode === 'create' ? 'Add Inventory Item' : 'Update Inventory Item'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Box component="form" id="inventory-form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            
            <Box>
              <Typography sx={{ ...lbl, mt: 0 }}>Product Name</Typography>
              <TextField 
                name="productName" required 
                value={formData.productName} onChange={handleFormChange} 
                fullWidth size="small" 
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography sx={{ ...lbl, mt: 0 }}>Brand</Typography>
                <TextField 
                  select
                  name="brandId" required 
                  value={formData.brandId} onChange={handleFormChange} 
                  fullWidth size="small" 
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {brands.map((b) => (
                    <MenuItem key={b.brandId || b.id} value={b.brandId || b.id}>
                      {b.brandName || b.name}
                    </MenuItem>
                  ))}
                  {brands.length === 0 && formData.brandId && (
                    <MenuItem value={formData.brandId}>{formData.brandId}</MenuItem>
                  )}
                </TextField>
              </Box>

              <Box>
                <Typography sx={{ ...lbl, mt: 0 }}>Branch</Typography>
                <TextField 
                  select
                  name="branchId" required 
                  value={formData.branchId} onChange={handleFormChange} 
                  fullWidth size="small" 
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {branches.map((b) => (
                    <MenuItem key={b.branchId || b.id} value={b.branchId || b.id}>
                      {b.branchName || b.name}
                    </MenuItem>
                  ))}
                  {branches.length === 0 && formData.branchId && (
                    <MenuItem value={formData.branchId}>{formData.branchId}</MenuItem>
                  )}
                </TextField>
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
              <Box>
                <Typography sx={{ ...lbl, mt: 0 }}>Buying Price</Typography>
                <TextField 
                  name="buyingPrice" type="number" required 
                  value={formData.buyingPrice} onChange={handleFormChange} 
                  fullWidth size="small" inputProps={{ min: 0, step: '0.01' }}
                />
              </Box>
              <Box>
                <Typography sx={{ ...lbl, mt: 0 }}>Selling Price</Typography>
                <TextField 
                  name="sellingPrice" type="number" required 
                  value={formData.sellingPrice} onChange={handleFormChange} 
                  fullWidth size="small" inputProps={{ min: 0, step: '0.01' }}
                />
              </Box>
              <Box>
                <Typography sx={{ ...lbl, mt: 0 }}>Stock</Typography>
                <TextField 
                  name="stock" type="number" required 
                  value={formData.stock} onChange={handleFormChange} 
                  fullWidth size="small" inputProps={{ min: 0 }}
                />
              </Box>
            </Box>

            <Box>
              <Typography sx={{ ...lbl, mt: 0 }}>Specification</Typography>
              <TextField 
                name="specification" 
                value={formData.specification} onChange={handleFormChange} 
                fullWidth size="small" 
              />
            </Box>

            <Box>
              <Typography sx={{ ...lbl, mt: 0 }}>Description</Typography>
              <TextField 
                name="descr" 
                value={formData.descr} onChange={handleFormChange} 
                fullWidth size="small" multiline rows={2}
              />
            </Box>

          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseModal} color="inherit" disabled={submitLoading} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button 
            type="submit" form="inventory-form" 
            variant="contained" 
            disabled={submitLoading}
            sx={{ textTransform: 'none', minWidth: 100 }}
          >
            {submitLoading ? <CircularProgress size={24} color="inherit" /> : (modalMode === 'create' ? 'Save Item' : 'Update Item')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: 'error.main' }}>Confirm Deletion</DialogTitle>
        <Divider />
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedIds.length === 1 ? 'this inventory item' : `these ${selectedIds.length} inventory items`}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDeleteConfirm(false)} color="inherit" disabled={deleteLoading}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleteLoading} sx={{ minWidth: 90 }}>
             {deleteLoading ? <CircularProgress size={24} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
