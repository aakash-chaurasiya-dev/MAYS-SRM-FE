import { Box, Typography, Paper, Divider } from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import { useTheme } from '@mui/material/styles';

export default function UploadAttachments({ secHdr }) {
  const theme = useTheme();

  return (
    <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
      <Box sx={secHdr}><Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Upload Attachments</Typography></Box>
      <Divider />
      <Box sx={{ p: 2.5 }}>
        <Box sx={{
          border: `2px dashed ${theme.palette.divider}`, borderRadius: '3px', p: 4, textAlign: 'center',
          cursor: 'pointer', transition: 'border-color 0.2s', '&:hover': { borderColor: theme.palette.primary.main }
        }}>
          <CloudUploadOutlinedIcon sx={{ fontSize: 40, color: theme.palette.text.secondary, mb: 1 }} />
          <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>Drop device photos, warranty PDFs, or invoices here.</Typography>
          <Typography sx={{ fontSize: '11px', color: theme.palette.text.secondary, mt: 0.5 }}>JPG, PNG, PDF up to 10MB each</Typography>
        </Box>
      </Box>
    </Paper>
  );
}
