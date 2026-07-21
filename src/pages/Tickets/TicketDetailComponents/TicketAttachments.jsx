import React, { useRef, useState } from 'react';
import { Box, Typography, Button, Paper, Divider, Stack, Dialog, DialogContent, IconButton } from '@mui/material';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import DeleteConfirmDialog from '../../../components/DeleteConfirmDialog';

/**
 * Helper to format date strings.
 * Extracted here since this is specifically needed by attachments.
 */
const formatTimestamp = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
};

/**
 * TicketAttachments
 * 
 * Displays the list of attachments for a ticket.
 * Manages the file upload process and the Lightbox modal for previewing images.
 */
export default function TicketAttachments({ ticketId, attachments = [] }) {
  const theme = useTheme();
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();
  
  const [uploadMessage, setUploadMessage] = useState('');
  const [error, setError] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState(null);

  const uploadMutation = useMutation({
    mutationFn: async (selectedFile) => {
      const formData = new FormData();
      formData.append('file', selectedFile);

      await api.post(`/tickets/${ticketId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return selectedFile;
    },
    onSuccess: (selectedFile) => {
      setUploadMessage(`Uploaded ${selectedFile.name}`);
      console.log('Attachment Uploaded:', selectedFile.name);
      
      // Invalidate to refresh attachment list seamlessly
      queryClient.invalidateQueries({ queryKey: ['ticket-attachments', ticketId] });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setTimeout(() => {
        setUploadMessage('');
        setError('');
      }, 5000);
    },
    onError: (err) => {
      console.error('Failed to upload attachment:', err);
      setError(err.message || 'Unable to upload attachment');
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setTimeout(() => {
        setUploadMessage('');
        setError('');
      }, 5000);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (attachmentId) => {
      await api.delete(`/tickets/${ticketId}/attachments/${attachmentId}`);
    },
    onSuccess: () => {
      setUploadMessage('Attachment removed successfully');
      queryClient.invalidateQueries({ queryKey: ['ticket-attachments', ticketId] });
      setOpenDeleteConfirm(false);
      setAttachmentToDelete(null);
      setTimeout(() => {
        setUploadMessage('');
      }, 5000);
    },
    onError: (err) => {
      console.error('Failed to delete attachment:', err);
      setError(err.message || 'Unable to remove attachment');
      setOpenDeleteConfirm(false);
      setAttachmentToDelete(null);
      setTimeout(() => {
        setError('');
      }, 5000);
    }
  });

  const handleDeleteConfirm = () => {
    if (attachmentToDelete) {
      deleteMutation.mutate(attachmentToDelete.attachmentId);
    }
  };

  const handleAttachmentUpload = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setUploadMessage('');
    setError('');
    
    uploadMutation.mutate(selectedFile);
  };

  return (
    <>
      <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
        <Box sx={{ px: 2.5, py: 1.8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Attachments ({attachments.length})</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              hidden
              onChange={handleAttachmentUpload}
            />
            <Button size="small" sx={{ fontSize: '12px' }} onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? 'Uploading…' : 'Upload'}
            </Button>
          </Box>
        </Box>
        <Divider />
        <Box sx={{ p: 2.5 }}>
          {uploadMessage && (
            <Typography sx={{ fontSize: '12px', color: 'success.main', mb: 1.5 }}>
              {uploadMessage}
            </Typography>
          )}
          {error && (
            <Typography sx={{ fontSize: '12px', color: 'error.main', mb: 1.5 }}>
              {error}
            </Typography>
          )}
          
          {attachments.length === 0 ? (
            <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary }}>
              No attachments available for this ticket.
            </Typography>
          ) : (
            <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }} useFlexGap>
              {attachments.map((attachment) => {
                const isImage = /\.(jpe?g|png|gif|bmp|webp)$/i.test(attachment.fileName || '');
                return (
                  <Box
                    key={attachment.attachmentId || attachment.fileName}
                    component={isImage && attachment.fileUrl ? 'div' : 'a'}
                    href={!isImage ? (attachment.fileUrl || '#') : undefined}
                    target={!isImage ? '_blank' : undefined}
                    rel={!isImage ? 'noreferrer' : undefined}
                    sx={{
                      position: 'relative',
                      width: 150, minHeight: 140, borderRadius: '6px',
                      bgcolor: theme.palette.background.default, border: `1.5px solid ${theme.palette.divider}`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      cursor: isImage && attachment.fileUrl ? 'zoom-in' : (attachment.fileUrl ? 'pointer' : 'default'),
                      textDecoration: 'none', px: 1.5, py: 1.5,
                      boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)', transition: 'box-shadow 0.18s, border-color 0.18s',
                      '&:hover': attachment.fileUrl ? { borderColor: theme.palette.primary.main, boxShadow: '0 4px 16px 0 rgba(0,82,204,0.10)' } : undefined,
                      '&:hover .delete-btn': {
                        opacity: 1,
                      },
                    }}
                    onClick={isImage && attachment.fileUrl ? () => { setLightboxImg({ url: attachment.fileUrl, name: attachment.fileName }); setLightboxOpen(true); } : undefined}
                  >
                    <IconButton
                      className="delete-btn"
                      size="small"
                      disabled={deleteMutation.isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setAttachmentToDelete(attachment);
                        setOpenDeleteConfirm(true);
                      }}
                      sx={{
                        position: 'absolute',
                        top: 5,
                        right: 5,
                        opacity: { xs: 1, md: 0 },
                        transition: 'opacity 0.2s',
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        color: 'text.secondary',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                        width: 22,
                        height: 22,
                        zIndex: 10,
                        p: 0,
                        '&:hover': {
                          bgcolor: 'error.main',
                          color: 'white',
                        },
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                    {isImage && attachment.fileUrl ? (
                      <Box component="img" src={attachment.fileUrl} alt={attachment.fileName || 'Attachment'}
                        sx={{ width: 90, height: 90, objectFit: 'cover', borderRadius: '4px', mb: 1, background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, boxShadow: '0 1px 6px 0 rgba(0,0,0,0.08)' }}
                      />
                    ) : (
                      <ImageOutlinedIcon sx={{ fontSize: 36, color: theme.palette.divider, mb: 1 }} />
                    )}
                    <Typography sx={{ fontSize: '12px', color: theme.palette.text.primary, textAlign: 'center', fontWeight: 600, width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {attachment.fileName || 'Attachment'}
                    </Typography>
                    <Typography sx={{ fontSize: '10px', color: theme.palette.text.secondary, textAlign: 'center', mt: 0.5 }}>
                      {formatTimestamp(attachment.uploadedAt)}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>
      </Paper>

      {/* Lightbox Modal */}
      <Dialog open={lightboxOpen} onClose={() => setLightboxOpen(false)} maxWidth="md" fullWidth>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
          {lightboxImg && (
            <>
              <Box component="img" src={lightboxImg.url} alt={lightboxImg.name || 'Preview'}
                sx={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px', boxShadow: '0 2px 16px 0 rgba(0,0,0,0.18)', mb: 2 }}
              />
              <Typography sx={{ fontSize: '14px', fontWeight: 600, color: theme.palette.text.primary, textAlign: 'center', mb: 1 }}>
                {lightboxImg.name}
              </Typography>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={openDeleteConfirm}
        onClose={() => {
          setOpenDeleteConfirm(false);
          setAttachmentToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Remove Attachment"
        message={attachmentToDelete ? `Are you sure you want to remove "${attachmentToDelete.fileName || 'this attachment'}"? This action cannot be undone.` : ''}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
