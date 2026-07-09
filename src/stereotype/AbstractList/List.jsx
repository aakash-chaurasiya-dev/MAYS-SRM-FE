import { useState, useMemo, useCallback, useEffect } from 'react';
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
  Menu,
  MenuItem,
  Checkbox,
  ListItemText,
  Select,
  FormControl,
  InputLabel,
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
            background: 'linear-gradient(135deg, #003d9b 0%, #0c56d0 100%)',
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

/* ───────── constants to prevent re-renders ───────── */
const EMPTY_OBJECT = {};
const EMPTY_ARRAY = [];
const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 25, 50];
const DEFAULT_SLOT_PROPS = {
  loadingOverlay: {
    variant: 'linear-progress',
    noRowsVariant: 'linear-progress',
  },
};

/* ───────── Component ───────── */
export default function List({ config, rowSelectionModel: directRowSelectionModel, onRowSelectionModelChange: directOnRowSelectionModelChange }) {
  const theme = useTheme();
  const {
    title = 'Records',
    subtitle,
    rows = EMPTY_ARRAY,
    columns = EMPTY_ARRAY,
    actions = EMPTY_ARRAY,
    pagination = EMPTY_OBJECT,
    checkboxSelection = false,
    density = 'standard',
    searchable = true,
    searchPlaceholder = 'Search records…',
    loading = false,
    getRowId,
    onRowClick,
    rowSelectionModel: configRowSelectionModel,
    onRowSelectionModelChange: configOnRowSelectionModelChange,
    height = 520,
    sx: sxOverrides = EMPTY_OBJECT,
    headerSlot,
    emptyMessage = 'No records to display',
  } = config;

  const actualRowSelectionModel = directRowSelectionModel !== undefined ? directRowSelectionModel : configRowSelectionModel;
  const actualOnRowSelectionModelChange = directOnRowSelectionModelChange || configOnRowSelectionModelChange;

  const [search, setSearch] = useState('');
  const [columnMenuAnchorEl, setColumnMenuAnchorEl] = useState(null);
  const [filterMenuAnchorEl, setFilterMenuAnchorEl] = useState(null);
  const [visibleColumnFields, setVisibleColumnFields] = useState(() => columns.map((col) => col.field));
  const [selectedColumnForFilter, setSelectedColumnForFilter] = useState('');
  const [selectedFilterValues, setSelectedFilterValues] = useState([]);
  const [activeFilters, setActiveFilters] = useState([]);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: pagination.pageSize || 10,
    page: 0,
  });

  // MUI v9 uses an object { type: 'include', ids: Set() } instead of an array.
  // We wrap it here so the rest of the application can safely just use arrays.
  const formattedSelectionModel = useMemo(() => {
    if (actualRowSelectionModel === undefined) return undefined;
    if (Array.isArray(actualRowSelectionModel)) {
      return { type: 'include', ids: new Set(actualRowSelectionModel) };
    }
    return actualRowSelectionModel;
  }, [actualRowSelectionModel]);



  useEffect(() => {
    setVisibleColumnFields(columns.map((col) => col.field));
  }, [columns]);

  const visibleColumns = useMemo(() =>
    resolveColumns(columns.filter((col) => visibleColumnFields.includes(col.field))),
  [columns, visibleColumnFields]);

  const columnFilterOptions = useMemo(() => {
    const options = {};

    columns.forEach((col) => {
      if (!col.field) return;
      const values = rows
        .map((row) => row[col.field])
        .filter((value) => value !== undefined && value !== null && value !== '')
        .map((value) => String(value));

      options[col.field] = [...new Set(values)].sort((left, right) => left.localeCompare(right));
    });

    return options;
  }, [columns, rows]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesFilters = activeFilters.every((filter) => {
        const rowValue = row[filter.field];

        if (rowValue === undefined || rowValue === null || rowValue === '') {
          return false;
        }

        const normalizedRowValue = String(rowValue).trim().toLowerCase();
        return filter.values.some((value) => normalizedRowValue === String(value).trim().toLowerCase());
      });

      if (!matchesFilters) {
        return false;
      }

      if (!query) {
        return true;
      }

      return Object.values(row).some((val) =>
        String(val ?? '')
          .toLowerCase()
          .includes(query)
      );
    });
  }, [rows, search, activeFilters]);

  const handleRowSelectionModelChange = useCallback((newSelectionModel) => {
    if (!actualOnRowSelectionModelChange) return;
    
    let arr = [];
    if (newSelectionModel && newSelectionModel.type === 'exclude') {
      const excludeIds = newSelectionModel.ids instanceof Set ? newSelectionModel.ids : new Set();
      arr = filteredRows.map(r => getRowId ? getRowId(r) : r.id).filter(id => !excludeIds.has(id));
    } else if (newSelectionModel && newSelectionModel.ids instanceof Set) {
      arr = Array.from(newSelectionModel.ids);
    } else if (Array.isArray(newSelectionModel)) {
      arr = newSelectionModel;
    }
    
    actualOnRowSelectionModelChange(arr);
  }, [actualOnRowSelectionModelChange, filteredRows, getRowId]);

  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value);
  }, []);

  const handleColumnMenuOpen = useCallback((event) => {
    setColumnMenuAnchorEl(event.currentTarget);
  }, []);

  const handleColumnMenuClose = useCallback(() => {
    setColumnMenuAnchorEl(null);
  }, []);

  const handleFilterMenuOpen = useCallback((event) => {
    setFilterMenuAnchorEl(event.currentTarget);
  }, []);

  const handleFilterMenuClose = useCallback(() => {
    setFilterMenuAnchorEl(null);
    setSelectedColumnForFilter('');
    setSelectedFilterValues([]);
  }, []);

  const handleColumnVisibilityToggle = useCallback((field) => {
    setVisibleColumnFields((current) => {
      const isVisible = current.includes(field);
      const next = isVisible
        ? current.filter((item) => item !== field)
        : [...current, field];

      return next.length > 0 ? next : current;
    });
  }, []);

  const handleColumnSelectionChange = useCallback((event) => {
    setSelectedColumnForFilter(event.target.value);
    setSelectedFilterValues([]);
  }, [setSelectedColumnForFilter, setSelectedFilterValues]);

  const handleFilterValueChange = useCallback((event) => {
    setSelectedFilterValues(event.target.value);
  }, [setSelectedFilterValues]);

  const handleAddFilter = useCallback(() => {
    if (!selectedColumnForFilter || selectedFilterValues.length === 0) {
      return;
    }

    setActiveFilters((current) =>
      current.filter((filter) => filter.field !== selectedColumnForFilter)
        .concat({
          field: selectedColumnForFilter,
          values: selectedFilterValues,
        })
    );

    setSelectedColumnForFilter('');
    setSelectedFilterValues([]);
    setFilterMenuAnchorEl(null);
  }, [selectedColumnForFilter, selectedFilterValues]);

  const handleRemoveFilter = useCallback((field) => {
    setActiveFilters((current) => current.filter((filter) => filter.field !== field));
  }, []);

  const handleClearFilters = useCallback(() => {
    setActiveFilters([]);
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
      ...(sxOverrides || EMPTY_OBJECT),
    }),
    [theme, sxOverrides]
  );

  const localeText = useMemo(() => ({
    noRowsLabel: emptyMessage,
  }), [emptyMessage]);

  return (
    <Paper
      elevation={2}
      sx={{
        borderRadius: '3px',
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
          <IconButton
            size="small"
            sx={{ color: activeFilters.length > 0 ? 'primary.main' : 'text.secondary' }}
            onClick={handleFilterMenuOpen}
          >
            <FilterListIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={filterMenuAnchorEl}
          open={Boolean(filterMenuAnchorEl)}
          onClose={handleFilterMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Box sx={{ width: 320, px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Add filter
            </Typography>
            <FormControl size="small" fullWidth sx={{ mb: 1.5 }}>
              <InputLabel id="column-filter-label">Column</InputLabel>
              <Select
                labelId="column-filter-label"
                value={selectedColumnForFilter}
                label="Column"
                onChange={handleColumnSelectionChange}
              >
                {columns.map((col) => (
                  <MenuItem key={col.field} value={col.field}>
                    {col.headerName || col.field}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth disabled={!selectedColumnForFilter} sx={{ mb: 1.5 }}>
              <InputLabel id="filter-value-label">Value</InputLabel>
              <Select
                labelId="filter-value-label"
                multiple
                value={selectedFilterValues}
                label="Value"
                onChange={handleFilterValueChange}
                renderValue={(selected) => selected.join(', ')}
              >
                {(selectedColumnForFilter ? columnFilterOptions[selectedColumnForFilter] : []).map((option) => (
                  <MenuItem key={option} value={option}>
                    <Checkbox checked={selectedFilterValues.includes(option)} />
                    <ListItemText primary={option} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button size="small" onClick={handleFilterMenuClose}>
                Cancel
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={handleAddFilter}
                disabled={!selectedColumnForFilter || selectedFilterValues.length === 0}
              >
                Add
              </Button>
            </Stack>
          </Box>
        </Menu>
        <Tooltip title="Columns">
          <IconButton size="small" sx={{ color: 'text.secondary' }} onClick={handleColumnMenuOpen}>
            <ViewColumnIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={columnMenuAnchorEl}
          open={Boolean(columnMenuAnchorEl)}
          onClose={handleColumnMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Box sx={{ minWidth: 220, px: 1.5, py: 1 }}>
            <Typography variant="subtitle2" sx={{ px: 1, mb: 1, fontWeight: 700 }}>
              Visible columns
            </Typography>
            {columns.map((col) => (
              <MenuItem key={col.field} onClick={() => handleColumnVisibilityToggle(col.field)} dense>
                <Checkbox checked={visibleColumnFields.includes(col.field)} />
                <ListItemText primary={col.headerName || col.field} />
              </MenuItem>
            ))}
          </Box>
        </Menu>
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

      {activeFilters.length > 0 && (
        <Box sx={{ px: 3, pb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
            Active filters:
          </Typography>
          {activeFilters.map((filter) => (
            <Chip
              key={filter.field}
              label={`${columns.find((col) => col.field === filter.field)?.headerName || filter.field}: ${filter.values.join(', ')}`}
              onDelete={() => handleRemoveFilter(filter.field)}
              color="primary"
              variant="outlined"
              size="small"
            />
          ))}
          <Button size="small" onClick={handleClearFilters}>
            Clear all
          </Button>
        </Box>
      )}

      <Divider />

      {/* ── DataGrid ── */}
      <Box sx={{ height, width: '100%' }}>
        <DataGrid
          key={config.gridKey || 'default-grid'}
          rows={filteredRows}
          columns={visibleColumns}
          loading={loading}
          density={density}
          checkboxSelection={checkboxSelection}
          disableRowSelectionOnClick
          paginationMode={config.paginationMode || 'client'}
          rowCount={config.rowCount}
          paginationModel={paginationModel}
          onPaginationModelChange={(newModel) => {
            setPaginationModel(newModel);
            if (config.onPaginationChange) {
              config.onPaginationChange(newModel);
            }
          }}
          pageSizeOptions={pagination.pageSizeOptions || DEFAULT_PAGE_SIZE_OPTIONS}
          getRowId={getRowId}
          onRowClick={onRowClick}
          {...(actualOnRowSelectionModelChange ? { onRowSelectionModelChange: handleRowSelectionModelChange } : {})}
          {...(formattedSelectionModel !== undefined ? { rowSelectionModel: formattedSelectionModel } : {})}
          sx={dataGridSx}
          localeText={localeText}
          slotProps={DEFAULT_SLOT_PROPS}
        />
      </Box>
    </Paper>
  );
}
