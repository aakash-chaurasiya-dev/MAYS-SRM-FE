import { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  Divider,
  Avatar,
  LinearProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import { useTheme } from '@mui/material/styles';

/**
 * ─────────────────────────────────────────────────────────────────
 *  AbstractList  –  A fully config-driven DataGrid wrapper
 * ─────────────────────────────────────────────────────────────────
 *
 *  Usage:
 *    <List config={config} />
 *
 *  Config shape:
 *  {
 *    title:         string                     — header title
 *    subtitle:      string                     — optional subtitle
 *    rows:          array                      — data rows (each must have `id`)
 *    columns:       array of ColumnDef         — column definitions (see below)
 *    actions:       array of ActionDef         — toolbar action buttons
 *    pagination:    { pageSize, pageSizeOptions }
 *    checkboxSelection: boolean
 *    density:       'compact' | 'standard' | 'comfortable'
 *    searchable:    boolean                    — show global search bar
 *    searchPlaceholder: string
 *    loading:       boolean
 *    getRowId:      (row) => id                — custom id accessor
 *    onRowClick:    (params, event) => void
 *    height:        number | string            — grid container height
 *    sx:            object                     — extra sx overrides for the DataGrid
 *    headerSlot:    ReactNode                  — slot rendered right side of header
 *    emptyMessage:  string                     — message when no rows
 *  }
 *
 *  ColumnDef extras (on top of standard MUI GridColDef):
 *    renderType:  'chip' | 'avatar' | 'progress' | 'actions' | 'link' | 'badge'
 *    chipColorMap:  { [value]: 'success' | 'error' | 'warning' | 'info' | 'primary' | 'secondary' }
 *
 *  ActionDef:
 *    { label, icon, onClick, variant, color, disabled }
 * ─────────────────────────────────────────────────────────────────
 */

/* ───────── built-in column renderers ───────── */
const builtInRenderers = {
  chip: (params, colDef) => {
    const colorMap = colDef.chipColorMap || {};
    return (
      <Chip
        label={params.value}
        size="small"
        color={colorMap[params.value] || 'default'}
        sx={{ fontWeight: 600, letterSpacing: '0.02em' }}
      />
    );
  },

  avatar: (params) => {
    const name = typeof params.value === 'string' ? params.value : '';
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    return (
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Avatar
          sx={{
            width: 32,
            height: 32,
            fontSize: '0.8rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
          }}
        >
          {initials}
        </Avatar>
        <Typography variant="body2" fontWeight={600} color="text.primary">
          {name}
        </Typography>
      </Stack>
    );
  },

  progress: (params) => {
    const value = Number(params.value) || 0;
    const getColor = (v) => {
      if (v >= 80) return 'success';
      if (v >= 50) return 'primary';
      if (v >= 30) return 'warning';
      return 'error';
    };
    return (
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: '100%' }}>
        <LinearProgress
          variant="determinate"
          value={value}
          color={getColor(value)}
          sx={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            bgcolor: 'rgba(0,0,0,0.06)',
          }}
        />
        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ minWidth: 34 }}>
          {value}%
        </Typography>
      </Stack>
    );
  },

  badge: (params) => {
    const val = params.value;
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          px: 1.2,
          py: 0.3,
          borderRadius: '6px',
          fontSize: '0.75rem',
          fontWeight: 600,
          bgcolor: 'primary.main',
          color: '#fff',
          letterSpacing: '0.03em',
        }}
      >
        {val}
      </Box>
    );
  },

  link: (params) => (
    <Typography
      variant="body2"
      sx={{
        color: 'primary.main',
        fontWeight: 600,
        cursor: 'pointer',
        '&:hover': { textDecoration: 'underline' },
      }}
    >
      {params.value}
    </Typography>
  ),
};

/* ───────── resolve columns ───────── */
function resolveColumns(columns) {
  return columns.map((col) => {
    const resolved = { ...col };

    // Apply built-in renderer if renderType is specified and no custom renderCell
    if (col.renderType && !col.renderCell && builtInRenderers[col.renderType]) {
      resolved.renderCell = (params) => builtInRenderers[col.renderType](params, col);
    }

    // Default flex if not specified
    if (resolved.flex === undefined && resolved.width === undefined) {
      resolved.flex = 1;
    }

    return resolved;
  });
}

/* ───────── Component ───────── */
export default function List({ config }) {
  const theme = useTheme();
  const {
    title = 'Records',
    subtitle,
    rows = [],
    columns = [],
    actions = [],
    pagination = {},
    checkboxSelection = false,
    density = 'standard',
    searchable = true,
    searchPlaceholder = 'Search records…',
    loading = false,
    getRowId,
    onRowClick,
    height = 520,
    sx: sxOverrides = {},
    headerSlot,
    emptyMessage = 'No records to display',
  } = config;

  const [search, setSearch] = useState('');
  const [paginationModel, setPaginationModel] = useState({
    pageSize: pagination.pageSize || 10,
    page: 0,
  });

  const resolvedColumns = useMemo(() => resolveColumns(columns), [columns]);

  /* ── global search filter ── */
  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((row) =>
      Object.values(row).some((val) =>
        String(val ?? '')
          .toLowerCase()
          .includes(q)
      )
    );
  }, [rows, search]);

  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value);
  }, []);

  /* ── DataGrid sx ── */
  const dataGridSx = useMemo(
    () => ({
      border: 'none',
      '& .MuiDataGrid-columnHeaders': {
        backgroundColor: theme.palette.background.default,
        borderBottom: `1.5px solid ${theme.palette.divider}`,
      },
      '& .MuiDataGrid-columnHeaderTitle': {
        fontWeight: 700,
        fontSize: '0.78rem',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: theme.palette.text.secondary,
      },
      '& .MuiDataGrid-cell': {
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        alignItems: 'center',
        py: 1,
      },
      '& .MuiDataGrid-row': {
        transition: 'background-color 0.15s ease',
        '&:hover': {
          backgroundColor: `${theme.palette.primary.main}08`,
        },
      },
      '& .MuiDataGrid-row.Mui-selected': {
        backgroundColor: `${theme.palette.primary.main}12`,
        '&:hover': {
          backgroundColor: `${theme.palette.primary.main}18`,
        },
      },
      '& .MuiDataGrid-footerContainer': {
        borderTop: `1.5px solid ${theme.palette.divider}`,
      },
      '& .MuiDataGrid-overlay': {
        backgroundColor: 'transparent',
      },
      '& .MuiCheckbox-root': {
        color: theme.palette.divider,
        '&.Mui-checked': {
          color: theme.palette.primary.main,
        },
      },
      ...sxOverrides,
    }),
    [theme, sxOverrides]
  );

  return (
    <Paper
      elevation={2}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          px: 3,
          pt: 2.5,
          pb: 2,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}06 0%, ${theme.palette.secondary.main}06 100%)`,
        }}
      >
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Box>
            <Typography variant="h5" color="text.primary">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {headerSlot && <Box>{headerSlot}</Box>}
        </Stack>
      </Box>

      <Divider />

      {/* ── Toolbar ── */}
      <Box sx={{ px: 3, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        {searchable && (
          <TextField
            size="small"
            placeholder={searchPlaceholder}
            value={search}
            onChange={handleSearchChange}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ minWidth: 260, flex: '0 1 320px' }}
          />
        )}

        <Box sx={{ flex: 1 }} />

        {/* Built-in toolbar icons */}
        <Tooltip title="Filter">
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <FilterListIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Columns">
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <ViewColumnIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Export">
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <FileDownloadOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Refresh">
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Custom actions */}
        {actions.map((action, idx) => (
          <Button
            key={idx}
            variant={action.variant || 'contained'}
            color={action.color || 'primary'}
            size="small"
            startIcon={action.icon}
            onClick={action.onClick}
            disabled={action.disabled}
            sx={{ ml: idx === 0 ? 1 : 0 }}
          >
            {action.label}
          </Button>
        ))}
      </Box>

      <Divider />

      {/* ── DataGrid ── */}
      <Box sx={{ height, width: '100%' }}>
        <DataGrid
          rows={filteredRows}
          columns={resolvedColumns}
          loading={loading}
          density={density}
          checkboxSelection={checkboxSelection}
          disableRowSelectionOnClick
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={pagination.pageSizeOptions || [5, 10, 25, 50]}
          getRowId={getRowId}
          onRowClick={onRowClick}
          sx={dataGridSx}
          localeText={{
            noRowsLabel: emptyMessage,
          }}
          slotProps={{
            loadingOverlay: {
              variant: 'linear-progress',
              noRowsVariant: 'linear-progress',
            },
          }}
        />
      </Box>
    </Paper>
  );
}
