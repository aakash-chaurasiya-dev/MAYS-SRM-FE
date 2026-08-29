import { Box, Typography, Paper, Divider } from '@mui/material';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import { useTheme } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';

const TicketDevice = ({
  ticket,
  isNormalUser,
  fullWidth = false,
  oneLine = false,
}) => {
  const theme = useTheme();

  const { data: deviceTypes = [] } = useQuery({
    queryKey: ['deviceTypes'],
    queryFn: async () => {
      const res = await api.get('/devicetypes');
      return res.data;
    },
    enabled: !isNormalUser,
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const res = await api.get('/brands');
      return res.data;
    },
    enabled: !isNormalUser,
  });

  const { data: models = [] } = useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      const res = await api.get('/devicemodels');
      return res.data;
    },
    enabled: !isNormalUser,
  });

  const { data: referredCategories = [] } = useQuery({
    queryKey: ['referredCategories'],
    queryFn: async () => {
      const res = await api.get('/referred-categories');
      return res.data?.data || res.data || [];
    },
    enabled: !isNormalUser,
  });

  const { data: warrantyTypes = [] } = useQuery({
    queryKey: ['warrantyTypes'],
    queryFn: async () => {
      const res = await api.get('/warranty-types');
      return res.data?.data || res.data || [];
    },
    enabled: !isNormalUser,
  });

  const valueOrNA = (value) => {
    if (value === undefined || value === null || value === '') {
      return 'Not available';
    }

    return String(value);
  };

  /*
   * Resolve names from IDs.
   * String() comparison prevents issues when API returns
   * IDs as numbers but ticket contains strings, or vice versa.
   */

  const resolvedDeviceTypeName =
    ticket?.deviceTypeName ||
    deviceTypes.find(
      (item) =>
        String(item.deviceTypeId) === String(ticket?.deviceTypeId)
    )?.deviceTypeName;

  const resolvedBrandName =
    ticket?.deviceBrandName ||
    brands.find(
      (item) =>
        String(item.brandId) === String(ticket?.deviceBrandId)
    )?.brandName;

  const resolvedModelName =
    ticket?.deviceModelName ||
    ticket?.customModelName ||
    models.find(
      (item) =>
        String(item.modelId) === String(ticket?.deviceModelId)
    )?.modelName;

  const resolvedWarrantyName =
    ticket?.warrantyTypeName ||
    warrantyTypes.find(
      (item) =>
        String(item.warrantyTypeId) === String(ticket?.warrantyTypeId)
    )?.warrantyTypeName;

  const resolvedReferredCategoryName =
    ticket?.referredCategoryName ||
    referredCategories.find(
      (item) =>
        String(item.referredCategoryId) ===
        String(ticket?.referredCategoryId)
    )?.referredCategoryName;

  const deviceType = valueOrNA(resolvedDeviceTypeName);

  const brand = valueOrNA(resolvedBrandName);

  const model = valueOrNA(resolvedModelName);

  const serialNo = valueOrNA(
    ticket?.deviceSerialNo || ticket?.serialNo
  );

  const warranty = valueOrNA(resolvedWarrantyName);

  const referredCategory = valueOrNA(
    resolvedReferredCategoryName
  );

  const referredCategoryDescription = valueOrNA(
    ticket?.referredCategoryDecriptionTicket
  );

  const ticketType = valueOrNA(ticket?.ticketTypeName);

  const fields = [
    {
      label: 'Device Type',
      shortLabel: 'Device Type',
      value: deviceType,
      mono: false,
      minW: 120,
    },
    {
      label: 'Brand',
      shortLabel: 'Brand',
      value: brand,
      mono: false,
      minW: 90,
    },
    {
      label: 'Model',
      shortLabel: 'Model',
      value: model,
      mono: false,
      minW: 90,
    },
    {
      label: 'Serial No.',
      shortLabel: 'Serial No.',
      value: serialNo,
      mono: true,
      minW: 120,
    },
    {
      label: 'Warranty',
      shortLabel: 'Warranty',
      value: warranty,
      mono: false,
      minW: 130,
    },
    {
      label: 'Referred Category',
      shortLabel: 'Ref Cat',
      value: referredCategory,
      mono: false,
      minW: 110,
    },
    {
      label: 'Referred Desc / Note',
      shortLabel: 'Ref Desc',
      value: referredCategoryDescription,
      mono: false,
      minW: 110,
    },
    {
      label: 'Type',
      shortLabel: 'Type',
      value: ticketType,
      mono: false,
      minW: 80,
    },
  ];

  const labelStyle = {
    fontSize: '12px',
    fontWeight: 700,
    color: theme.palette.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    mb: oneLine ? 0.3 : 0.5,
  };

  return (
    <Paper
      elevation={1}
      sx={{
        borderRadius: '3px',
        overflow: 'hidden',
        mb: 2.5,
        width: fullWidth
          ? '100%'
          : {
              xs: '100%',
              md: 'calc(50% - 10px)',
            },
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 1.8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <LaptopMacIcon
            sx={{
              fontSize: 18,
              color: theme.palette.text.secondary,
            }}
          />

          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Device Details
          </Typography>
        </Box>
      </Box>

      <Divider />

      <Box sx={{ p: 2.5 }}>
        <Box
          sx={{
            display: oneLine ? 'flex' : 'grid',
            flexDirection: oneLine ? 'row' : undefined,
            flexWrap: oneLine ? 'nowrap' : undefined,
            alignItems: oneLine ? 'flex-start' : undefined,
            columnGap: oneLine ? 3 : 2,
            rowGap: 2,
            overflowX: oneLine ? 'auto' : undefined,
            pb: oneLine ? 0.5 : 0,
            gridTemplateColumns: oneLine
              ? undefined
              : fullWidth
                ? 'repeat(4, 1fr)'
                : 'repeat(3, 1fr)',
          }}
        >
          {fields.map(
            (
              {
                label,
                shortLabel,
                value,
                mono,
                minW,
              },
              index
            ) => (
              <Box
                key={label}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',

                  ...(oneLine
                    ? {
                        flex: '0 0 auto',
                        flexShrink: 0,
                        width: minW,
                        minWidth: minW,
                        px: 1.5,
                        borderRight:
                          index < fields.length - 1
                            ? `1px solid ${theme.palette.divider}`
                            : 'none',
                        boxSizing: 'content-box',
                      }
                    : {
                        minWidth: 0,
                      }),
                }}
              >
                <Typography
                  sx={{
                    ...labelStyle,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                  }}
                  title={label}
                >
                  {oneLine ? shortLabel : label}
                </Typography>

                <Typography
                  sx={{
                    fontSize: '13px',
                    fontFamily: mono
                      ? '"JetBrains Mono", monospace'
                      : 'inherit',
                    color:
                      value === 'Not available'
                        ? theme.palette.text.disabled
                        : theme.palette.text.primary,
                    fontWeight:
                      value !== 'Not available' ? 500 : 400,
                    whiteSpace: oneLine ? 'nowrap' : 'normal',
                    overflow: oneLine ? 'hidden' : undefined,
                    textOverflow: oneLine ? 'ellipsis' : undefined,
                    width: '100%',
                  }}
                  title={String(value)}
                >
                  {value}
                </Typography>
              </Box>
            )
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default TicketDevice;
