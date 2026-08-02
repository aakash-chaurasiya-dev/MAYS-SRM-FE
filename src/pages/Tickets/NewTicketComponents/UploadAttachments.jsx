import { useRef, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Stack,
  IconButton,
  Button,
} from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
const ACCEPT_ATTR = 'image/jpeg,image/png,image/jpg,application/pdf,.jpg,.jpeg,.png,.pdf';

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file) {
  const isAcceptedType =
    ACCEPTED_TYPES.includes(file.type) ||
    /\.(jpe?g|png|pdf)$/i.test(file.name);

  if (!isAcceptedType) {
    return 'Only JPG, PNG, and PDF files are allowed.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'File must be 10MB or smaller.';
  }
  return null;
}

export default function UploadAttachments({ secHdr, files = [], onChange }) {
  const theme = useTheme();
  const fileInputRef = useRef(null);
  const [error, setError] = useState('');

  const addFiles = (incomingFiles) => {
    const next = [...files];
    const errors = [];

    incomingFiles.forEach((file) => {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
        return;
      }
      const duplicate = next.some(
        (existing) => existing.name === file.name && existing.size === file.size
      );
      if (!duplicate) {
        next.push(file);
      }
    });

    if (errors.length > 0) {
      setError(errors.join(' '));
    } else {
      setError('');
    }

    if (next.length !== files.length) {
      onChange?.(next);
    }
  };

  const handleFileSelect = (event) => {
    const selected = Array.from(event.target.files || []);
    if (selected.length > 0) {
      addFiles(selected);
    }
    event.target.value = '';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const dropped = Array.from(event.dataTransfer.files || []);
    if (dropped.length > 0) {
      addFiles(dropped);
    }
  };

  const handleRemove = (index) => {
    onChange?.(files.filter((_, i) => i !== index));
    setError('');
  };

  return (
    <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
      <Box sx={{ ...secHdr, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
          Upload Attachments{files.length > 0 ? ` (${files.length})` : ''}
        </Typography>
        <Button
          size="small"
          sx={{ fontSize: '12px' }}
          onClick={() => fileInputRef.current?.click()}
        >
          Browse
        </Button>
      </Box>
      <Divider />
      <Box sx={{ p: 2.5 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_ATTR}
          multiple
          hidden
          onChange={handleFileSelect}
        />
        <Box
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(event) => event.preventDefault()}
          sx={{
            border: `2px dashed ${theme.palette.divider}`,
            borderRadius: '3px',
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
            '&:hover': { borderColor: theme.palette.primary.main },
          }}
        >
          <CloudUploadOutlinedIcon sx={{ fontSize: 40, color: theme.palette.text.secondary, mb: 1 }} />
          <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>
            Drop device photos, warranty PDFs, or invoices here.
          </Typography>
          <Typography sx={{ fontSize: '11px', color: theme.palette.text.secondary, mt: 0.5 }}>
            JPG, PNG, PDF up to 10MB each
          </Typography>
        </Box>

        {error && (
          <Typography sx={{ fontSize: '12px', color: 'error.main', mt: 1.5 }}>
            {error}
          </Typography>
        )}

        {files.length > 0 && (
          <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', mt: 2 }} useFlexGap>
            {files.map((file, index) => {
              const isImage = /\.(jpe?g|png)$/i.test(file.name);
              const previewUrl = isImage ? URL.createObjectURL(file) : null;

              return (
                <Box
                  key={`${file.name}-${file.size}-${index}`}
                  sx={{
                    position: 'relative',
                    width: 150,
                    minHeight: 140,
                    borderRadius: '6px',
                    bgcolor: theme.palette.background.default,
                    border: `1.5px solid ${theme.palette.divider}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: 1.5,
                    py: 1.5,
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => handleRemove(index)}
                    sx={{
                      position: 'absolute',
                      top: 5,
                      right: 5,
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                      color: 'text.secondary',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                      width: 22,
                      height: 22,
                      p: 0,
                      '&:hover': { bgcolor: 'error.main', color: 'white' },
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 13 }} />
                  </IconButton>
                  {isImage && previewUrl ? (
                    <Box
                      component="img"
                      src={previewUrl}
                      alt={file.name}
                      sx={{
                        width: 90,
                        height: 90,
                        objectFit: 'cover',
                        borderRadius: '4px',
                        mb: 1,
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                    />
                  ) : (
                    <ImageOutlinedIcon sx={{ fontSize: 36, color: theme.palette.divider, mb: 1 }} />
                  )}
                  <Typography
                    sx={{
                      fontSize: '12px',
                      fontWeight: 600,
                      textAlign: 'center',
                      width: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {file.name}
                  </Typography>
                  <Typography sx={{ fontSize: '10px', color: theme.palette.text.secondary, mt: 0.5 }}>
                    {formatFileSize(file.size)}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>
    </Paper>
  );
}
