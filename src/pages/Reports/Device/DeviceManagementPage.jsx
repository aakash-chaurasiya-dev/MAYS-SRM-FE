import { useState, useMemo, useCallback } from 'react';
import { Box } from '@mui/material';
import { List } from '../../../stereotype/AbstractList';
import api from '../../../services/api';
import { useTheme } from '@mui/material/styles';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

export default function DeviceManagementPage() {
  const theme = useTheme();

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['devices', paginationModel],
    queryFn: async () => {
      const response = await api.get(`/devices/paginated?page=${paginationModel.page}&size=${paginationModel.pageSize}`);
      return response.data;
    },
    placeholderData: keepPreviousData,
  });

  const devices = data?.content || [];
  const totalElements = data?.totalElements || 0;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const mapDevices = useCallback((deviceList) => (
    deviceList.map((d, i) => ({
      ...d,
      id: d.serialNo || `fallback-id-${i}`,
      createdDate: formatDate(d.insertDate),
      modifyDate: formatDate(d.lastUpdateDate),
      deviceTypeName: d.deviceTypeName || 'N/A',
    }))
  ), []);

  const mappedDevices = useMemo(() => mapDevices(devices), [devices, mapDevices]);

  const filteredDevices = useMemo(() => {
    if (!searchQuery) return mappedDevices;
    const lowerQ = searchQuery.toLowerCase();
    return mappedDevices.filter((d) =>
      (d.serialNo && d.serialNo.toLowerCase().includes(lowerQ))
      || (d.modelName && d.modelName.toLowerCase().includes(lowerQ))
      || (d.brandName && d.brandName.toLowerCase().includes(lowerQ))
    );
  }, [mappedDevices, searchQuery]);

  const getExportRows = useCallback(async () => {
    const response = await api.get('/devices');
    return mapDevices(Array.isArray(response.data) ? response.data : []);
  }, [mapDevices]);

  const deviceConfig = useMemo(() => ({
    title: 'Device Management',
    subtitle: `${totalElements} devices registered in total`,
    rows: filteredDevices,
    columns: [
      { field: 'id', headerName: 'Serial No', flex: 1.5, renderType: 'link' },
      { field: 'deviceTypeName', headerName: 'Device Type', flex: 1 },
      { field: 'brandName', headerName: 'Brand Name', flex: 1.5 },
      { field: 'modelName', headerName: 'Model Name', flex: 2 },
      { field: 'createdDate', headerName: 'Created Date', flex: 1.5 },
      { field: 'modifyDate', headerName: 'Modify Date', flex: 1.5 },
    ],
    checkboxSelection: false,
    searchable: true,
    searchPlaceholder: 'Search devices locally...',
    onSearch: setSearchQuery,
    pagination: { pageSize: paginationModel.pageSize, pageSizeOptions: [5, 10, 25] },
    paginationMode: 'server',
    rowCount: totalElements,
    onPaginationChange: setPaginationModel,
    height: 480,
    actions: [],
    exportFilename: 'device_report',
    getExportRows,
  }), [filteredDevices, totalElements, paginationModel.pageSize, getExportRows]);

  return (
    <Box sx={{ p: 2 }}>
      <List
        config={deviceConfig}
        loading={isLoading}
      />
    </Box>
  );
}
