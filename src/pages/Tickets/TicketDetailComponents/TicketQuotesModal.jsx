import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Box, Typography, CircularProgress, Stack,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';

const emptyForm = {
  salesPrice: '',
  description: '',
  subject: '',
  body: '',
  validUntil: '',
};

export default function TicketQuotesModal({ open, onClose, ticketPart }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [quoteId, setQuoteId] = useState(null);

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ['quotes-ticket-part', ticketPart?.ticketPartId],
    queryFn: async () => {
      const res = await api.get(`/quotes/ticket-part/${ticketPart.ticketPartId}`);
      return res.data?.data || res.data || [];
    },
    enabled: open && !!ticketPart?.ticketPartId,
  });

  const { data: catalogPrices } = useQuery({
    queryKey: ['inventory-prices', ticketPart?.partCatId],
    queryFn: async () => {
      const res = await api.get(`/inventory/prices/${ticketPart.partCatId}`);
      return res.data?.data || res.data || null;
    },
    enabled: open && !!ticketPart?.partCatId,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!open) return;
    const latest = quotes[0];
    const defaultSales = catalogPrices?.salesPrice ?? '';
    if (latest) {
      setQuoteId(latest.quoteId);
      setForm({
        salesPrice: latest.salesPrice ?? defaultSales,
        description: latest.description ?? '',
        subject: latest.subject ?? '',
        body: latest.body ?? '',
        validUntil: latest.validUntil ?? '',
      });
    } else {
      setQuoteId(null);
      setForm({
        ...emptyForm,
        salesPrice: defaultSales,
      });
    }
  }, [open, quotes, ticketPart, catalogPrices]);

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (quoteId) {
        return api.put(`/quotes/${quoteId}`, payload);
      }
      return api.post('/quotes', payload);
    },
    onSuccess: (res) => {
      const saved = res.data?.data || res.data;
      if (saved?.quoteId) setQuoteId(saved.quoteId);
      queryClient.invalidateQueries({ queryKey: ['quotes-ticket-part', ticketPart.ticketPartId] });
      queryClient.invalidateQueries({ queryKey: ['ticket-parts', ticketPart.ticketId] });
    },
  });

  const sendMutation = useMutation({
    mutationFn: (id) => api.patch(`/quotes/${id}/send`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes-ticket-part', ticketPart.ticketPartId] });
      queryClient.invalidateQueries({ queryKey: ['ticket-parts', ticketPart.ticketId] });
      onClose();
    },
  });

  const buildPayload = () => ({
    ticketId: ticketPart.ticketId,
    partCatId: ticketPart.partCatId,
    ticketPartId: ticketPart.ticketPartId,
    salesPrice: form.salesPrice !== '' ? Number(form.salesPrice) : null,
    description: form.description || null,
    subject: form.subject || null,
    body: form.body || null,
    validUntil: form.validUntil || null,
  });

  const handleSave = () => saveMutation.mutate(buildPayload());

  const handleSaveAndSend = async () => {
    const res = await saveMutation.mutateAsync(buildPayload());
    const id = res.data?.data?.quoteId || res.data?.quoteId || quoteId;
    if (id) await sendMutation.mutateAsync(id);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Quote — {ticketPart?.partName}
      </DialogTitle>
      <DialogContent>
        {isLoading ? (
          <CircularProgress size={24} />
        ) : (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Status: {quotes[0]?.status || 'DRAFT'}
            </Typography>
            <TextField
              label="Sales Price"
              type="number"
              value={form.salesPrice}
              onChange={(e) => setForm((f) => ({ ...f, salesPrice: e.target.value }))}
              inputProps={{ min: 0, step: '0.01' }}
            />
            <TextField
              label="Subject"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            />
            <TextField
              label="Description"
              multiline
              minRows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <TextField
              label="Body"
              multiline
              minRows={4}
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            />
            <TextField
              label="Valid Until"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.validUntil}
              onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
            />
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          Save Draft
        </Button>
        <Button
          variant="contained"
          onClick={handleSaveAndSend}
          disabled={saveMutation.isPending || sendMutation.isPending}
        >
          Save &amp; Send
        </Button>
      </DialogActions>
    </Dialog>
  );
}
