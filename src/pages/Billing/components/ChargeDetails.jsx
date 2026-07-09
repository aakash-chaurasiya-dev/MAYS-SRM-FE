import React, { useState } from 'react';
import { Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, TableContainer, IconButton, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import { useAuth } from '../../../contexts/AuthContext';
import ChargeEditModal from './ChargeEditModal';

export default function ChargeDetails({
  items,
  chargeTypes,
  products,
  services,
  statuses,
  paymentModes,
  getNewItemTemplate,
  addNewItem,
  removeItem,
  updateItemBatch,
  getChargeTypeInfo
}) {
  const theme = useTheme();
  const auth = useAuth();

  const [editingItem, setEditingItem] = useState(null);

  const isManager = () => {
    if (!auth || !auth.user) return false;

    const rolesData = auth.user.roles || auth.user.role || '';
    let rolesString = '';

    if (Array.isArray(rolesData)) {
      rolesString = rolesData[0]?.authority?.toLowerCase() || '';
    } else if (typeof rolesData === 'string') {
      rolesString = rolesData.toLowerCase();
    }

    return rolesString.includes('manager');
  };

  const isRowDisabled = (item) => {
    const s = statuses.find(st => st.statusId === item.originalStatusId);
    if (s && (s.statusName || '').toLowerCase() === 'paid') {
      return !isManager();
    }
    return false;
  };

  const handleSaveModal = (updatedItem) => {
    if (updatedItem.isNew) {
      const { isNew, ...itemToSave } = updatedItem;
      addNewItem(itemToSave);
    } else {
      updateItemBatch(updatedItem.id, updatedItem);
    }
    setEditingItem(null);
  };

  const handleAddClick = () => {
    const newItem = getNewItemTemplate();
    newItem.isNew = true;
    setEditingItem(newItem);
  };

  return (
    <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '12px', overflow: 'hidden' }}>
      <Box sx={{ px: 3, py: 2, bgcolor: theme.palette.action.hover, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em', color: 'primary.main' }}>
          Charge Details
        </Typography>
        <Button size="small" startIcon={<AddOutlinedIcon />} onClick={handleAddClick}>Add Row</Button>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: theme.palette.background.default }}>
              {['SR', 'Charge Type', 'Product', 'Service', 'Payment Mode', 'Status', 'Amount (₹)'].map((h, i) => (
                <TableCell key={h} align={i === 6 ? 'right' : 'left'}
                  sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.5, whiteSpace: 'nowrap' }}>
                  {h}
                </TableCell>
              ))}
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, idx) => {
              const disabled = isRowDisabled(item);
              const ct = chargeTypes.find(c => c.chargeTypeId === item.chargeTypeId);
              const p = products.find(p => p.productId === item.productId);
              const s = services.find(s => s.chargeId === item.serviceChargeId);
              const pm = paymentModes?.find(pm => pm.payModeId === item.paymentModeId);
              const st = statuses.find(st => st.statusId === item.statusId);
              
              return (
                <TableRow 
                  key={item.id} 
                  hover 
                  onClick={() => setEditingItem(item)}
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: theme.palette.action.selected } }}
                >
                  <TableCell sx={{ fontFamily: 'monospace', width: 40, color: 'text.secondary' }}>{String(idx + 1).padStart(2, '0')}</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>{ct ? ct.chargeName : '—'}</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>{p ? p.productName : '—'}</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>{s ? s.descr : '—'}</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>{pm ? pm.paymentMode : '—'}</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>{st ? st.statusName : '—'}</TableCell>
                  <TableCell align="right" sx={{ width: 110 }}>{item.amount || 0}</TableCell>
                  <TableCell sx={{ width: 40 }}>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); removeItem(item.id); }} disabled={disabled}
                      sx={{ color: disabled ? 'text.disabled' : 'text.secondary', '&:hover': { color: disabled ? 'text.disabled' : 'error.main' } }}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {editingItem && (
        <ChargeEditModal
          open={!!editingItem}
          onClose={() => setEditingItem(null)}
          item={editingItem}
          chargeTypes={chargeTypes}
          products={products}
          services={services}
          statuses={statuses}
          paymentModes={paymentModes}
          onSave={handleSaveModal}
          getChargeTypeInfo={getChargeTypeInfo}
          disabled={isRowDisabled(editingItem)}
        />
      )}
    </Paper>
  );
}
