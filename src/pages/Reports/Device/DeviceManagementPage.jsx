import { useState, useMemo } from 'react';
import { Box, Button, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { List } from '../../../stereotype/AbstractList';
import api from '../../../services/api';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

export default function DeviceManagementPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch paginated devices from the new Redis-cached backend endpoint
  const { data, isLoading } = useQuery({
    queryKey: ['devices', paginationModel],
    queryFn: async () => {
      const response = await api.get(`/devices/paginated?page=${paginationModel.page}&size=${paginationModel.pageSize}`);
      return response.data;
    },
    keepPreviousData: true,
  });

  const devices = data?.content || [];
  const totalElements = data?.totalElements || 0;

  // Format dates gracefully
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const mappedDevices = useMemo(() => {
    return devices.map((d, i) => ({
      ...d,
      id: d.serialNo || `fallback-id-${i}`,
      createdDate: formatDate(d.insertDate),
      modifyDate: formatDate(d.lastUpdateDate),
      deviceTypeName: d.deviceTypeName || 'N/A'
    }));
  }, [devices]);

  // Client-side filtering if search is used (since server search isn't requested yet)
  const filteredDevices = useMemo(() => {
    if (!searchQuery) return mappedDevices;
    const lowerQ = searchQuery.toLowerCase();
    return mappedDevices.filter(d => 
      (d.serialNo && d.serialNo.toLowerCase().includes(lowerQ)) ||
      (d.modelName && d.modelName.toLowerCase().includes(lowerQ)) ||
      (d.brandName && d.brandName.toLowerCase().includes(lowerQ))
    );
  }, [mappedDevices, searchQuery]);

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
    actions: [], // Removed standalone actions as per business rules
  }), [filteredDevices, totalElements, paginationModel.pageSize]);

  return (
    <Box sx={{ p: 2 }}>

      {/* Reused AbstractList component */}
      <List 
        config={deviceConfig} 
        loading={isLoading}
      />
    </Box>
  );
}
