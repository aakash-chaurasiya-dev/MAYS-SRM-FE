import React from 'react';
import { Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, TableContainer, IconButton, Button, Select, MenuItem, TextField } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';

export default function ChargeDetails({ 
  items, 
  chargeTypes, 
  products, 
  services, 
  statuses, 
  addItem, 
  removeItem, 
  updateItem, 
  updateChargeType, 
  handleProductChange, 
  handleServiceChange, 
  getChargeTypeInfo 
}) {
  const theme = useTheme();
  return (
    <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '12px', overflow: 'hidden' }}>
      <Box sx={{ px: 3, py: 2, bgcolor: theme.palette.action.hover, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em', color: 'primary.main' }}>
          Charge Details
        </Typography>
        <Button size="small" startIcon={<AddOutlinedIcon />} onClick={addItem}>Add Row</Button>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: theme.palette.background.default }}>
              {['SR', 'Charge Type', 'Product', 'Service', 'Status', 'Amount (₹)'].map((h, i) => (
                <TableCell key={h} align={i === 5 ? 'right' : 'left'}
                  sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.5, whiteSpace: 'nowrap' }}>
                  {h}
                </TableCell>
              ))}
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, idx) => {
              return (
                <TableRow key={item.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', width: 40, color: 'text.secondary' }}>{String(idx + 1).padStart(2, '0')}</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>
                    <Select variant="standard" fullWidth value={item.chargeTypeId || ''} size="small" disableUnderline
                      onChange={(e) => updateChargeType(item.id, e.target.value)}>
                      {chargeTypes.map(ct => <MenuItem key={ct.chargeTypeId} value={ct.chargeTypeId}>{ct.chargeName}</MenuItem>)}
                    </Select>
                  </TableCell>
                  <TableCell sx={{ minWidth: 150 }}>
                    <Select variant="standard" fullWidth value={item.productId || ''} size="small" disableUnderline
                      disabled={!getChargeTypeInfo(item.chargeTypeId).isProduct}
                      onChange={(e) => handleProductChange(item.id, e.target.value)}>
                      <MenuItem value=""><em>None</em></MenuItem>
                      {products.map(p => <MenuItem key={p.productId} value={p.productId}>{p.productName}</MenuItem>)}
                    </Select>
                  </TableCell>
                  <TableCell sx={{ minWidth: 150 }}>
                    <Select variant="standard" fullWidth value={item.serviceChargeId || ''} size="small" disableUnderline
                      disabled={!getChargeTypeInfo(item.chargeTypeId).isService}
                      onChange={(e) => handleServiceChange(item.id, e.target.value)}>
                      <MenuItem value=""><em>None</em></MenuItem>
                      {services.map(s => <MenuItem key={s.chargeId} value={s.chargeId}>{s.descr}</MenuItem>)}
                    </Select>
                  </TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    <Select variant="standard" fullWidth value={item.statusId || ''} size="small" disableUnderline
                      onChange={(e) => updateItem(item.id, 'statusId', e.target.value)}>
                      <MenuItem value=""><em>None</em></MenuItem>
                      {statuses.map(s => <MenuItem key={s.statusId} value={s.statusId}>{s.statusName}</MenuItem>)}
                    </Select>
                  </TableCell>
                  <TableCell align="right" sx={{ width: 110 }}>
                    <TextField variant="standard" type="number" value={item.amount} size="small"
                      onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                      InputProps={{ disableUnderline: true, inputProps: { style: { textAlign: 'right' } } }} sx={{ width: 100 }} />
                  </TableCell>
                  <TableCell sx={{ width: 40 }}>
                    <IconButton size="small" onClick={() => removeItem(item.id)}
                      sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
