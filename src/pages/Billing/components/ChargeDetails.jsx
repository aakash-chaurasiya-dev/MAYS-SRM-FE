import { useState } from 'react';

import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  IconButton,
  Button,
} from '@mui/material';

import { useTheme } from '@mui/material/styles';

import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import { useAuth } from '../../../contexts/AuthContext';
import { hasAnyRole } from '../../../access/featureAccess';

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
  getChargeTypeInfo,
  showFullDetails,
  onToggleFullDetails,
}) {
  const theme = useTheme();
  const auth = useAuth();

  const [editingItem, setEditingItem] = useState(null);

  const isManager = () =>
    hasAnyRole(auth?.user, ['ROLE_MANAGER', 'ROLE_EXECUTIVE']);

  /*
   * Check whether current user is allowed to see a charge type.
   *
   * allowedRoles:
   *   null / empty -> available to everyone
   *   "ROLE_MANAGER,ROLE_EXECUTIVE" -> only those roles
   */
  const canUserSeeChargeType = (chargeType) => {
    if (!chargeType) return false;

    if (!chargeType.allowedRoles?.trim()) {
      return true;
    }

    const allowedRoles = chargeType.allowedRoles
      .split(',')
      .map((role) => role.trim())
      .filter(Boolean);

    return hasAnyRole(auth?.user, allowedRoles);
  };

  /*
   * Default:
   *   only permitted Receivable rows
   *
   * Full Details:
   *   permitted Receivable + Payable rows
   */
  const visibleItems = items.filter((item) => {
    const ct = chargeTypes.find(
      (c) => c.chargeTypeId === item.chargeTypeId
    );

    // First check role permission
    if (!canUserSeeChargeType(ct)) {
      return false;
    }

    // Default view = Receivable only
    if (!showFullDetails) {
      return ct?.accountingSide === 'R';
    }

    // Full details = both Receivable + Payable
    return true;
  });

  const isRowDisabled = (item) => {
    const s = statuses.find(
      (st) => st.statusId === item.originalStatusId
    );

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
    <Paper
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          bgcolor: theme.palette.action.hover,
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography
          sx={{
            fontSize: '20px',
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: 'primary.main',
          }}
        >
          Charge Details
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Toggle Payables */}
          <Button
            size="small"
            variant="outlined"
            startIcon={<VisibilityOutlinedIcon />}
            onClick={onToggleFullDetails}
          >
            {showFullDetails ? 'Hide Payables' : 'See Full Details'}
          </Button>

          {/* Add Row */}
          <Button
            size="small"
            startIcon={<AddOutlinedIcon />}
            onClick={handleAddClick}
          >
            Add Row
          </Button>
        </Box>
      </Box>

      {/* Table */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow
              sx={{
                bgcolor: theme.palette.background.default,
              }}
            >
              {[
                'SR',
                'Charge Type',
                'Product',
                'Service',
                'Payment Mode',
                'Status',
                'Amount (₹)',
              ].map((h, i) => (
                <TableCell
                  key={h}
                  align={i === 6 ? 'right' : 'left'}
                  sx={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'text.secondary',
                    py: 1.5,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </TableCell>
              ))}

              <TableCell />
            </TableRow>
          </TableHead>

          <TableBody>
            {visibleItems.map((item, idx) => {
              const disabled = isRowDisabled(item);

              const ct = chargeTypes.find(
                (c) => c.chargeTypeId === item.chargeTypeId
              );

              const p = products.find(
                (p) => p.productId === item.productId
              );

              const s = services.find(
                (s) => s.chargeId === item.serviceChargeId
              );

              const pm = paymentModes?.find(
                (pm) => pm.payModeId === item.paymentModeId
              );

              const st = statuses.find(
                (st) => st.statusId === item.statusId
              );

              const isPayable =
                ct?.accountingSide === 'P';

              /*
               * Display Payable as negative.
               *
               * Important:
               * item.amount itself is NOT changed.
               * Only the displayed amount gets the minus sign.
               */
              const displayAmount = isPayable
                ? -Math.abs(Number(item.amount || 0))
                : Math.abs(Number(item.amount || 0));

              return (
                <TableRow
                  key={item.id}
                  hover
                  onClick={() => setEditingItem(item)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: theme.palette.action.selected,
                    },
                  }}
                >
                  <TableCell
                    sx={{
                      fontFamily: 'monospace',
                      width: 40,
                      color: 'text.secondary',
                    }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </TableCell>

                  <TableCell sx={{ minWidth: 120 }}>
                    {ct ? ct.chargeName : '—'}
                  </TableCell>

                  <TableCell sx={{ minWidth: 120 }}>
                    {p ? p.productName : '—'}
                  </TableCell>

                  <TableCell sx={{ minWidth: 120 }}>
                    {s ? s.descr : '—'}
                  </TableCell>

                  <TableCell sx={{ minWidth: 120 }}>
                    {pm ? pm.paymentMode : '—'}
                  </TableCell>

                  <TableCell sx={{ minWidth: 120 }}>
                    {st ? st.statusName : '—'}
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{
                      width: 110,
                      fontWeight: isPayable ? 600 : 400,
                      color: isPayable
                        ? 'error.main'
                        : 'text.primary',
                    }}
                  >
                    {displayAmount.toLocaleString('en-IN')}
                  </TableCell>

                  <TableCell sx={{ width: 40 }}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(item.id);
                      }}
                      disabled={disabled}
                      sx={{
                        color: disabled
                          ? 'text.disabled'
                          : 'text.secondary',
                        '&:hover': {
                          color: disabled
                            ? 'text.disabled'
                            : 'error.main',
                        },
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}

            {visibleItems.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  align="center"
                  sx={{
                    py: 4,
                    color: 'text.secondary',
                  }}
                >
                  No charge details available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Modal */}
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