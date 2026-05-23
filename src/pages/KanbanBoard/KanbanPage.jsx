import {
  Box, Paper, Typography, Chip, Avatar, Stack, Divider, Button,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import RemoveIcon from '@mui/icons-material/Remove';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useTheme } from '@mui/material/styles';

const PRIORITY = {
  Critical: { icon: <PriorityHighIcon sx={{ fontSize: 14 }} />, color: '#ba1a1a' },
  High:     { icon: <ArrowUpwardIcon sx={{ fontSize: 14 }} />,  color: '#B95000' },
  Normal:   { icon: <RemoveIcon sx={{ fontSize: 14 }} />,       color: '#0052cc' },
  Low:      { icon: <ArrowDownwardIcon sx={{ fontSize: 14 }} />, color: '#006c47' },
};

const COLUMNS = [
  {
    title: 'Intake', color: '#737685', count: 2,
    tickets: [
      { id: 'TK-4521', device: 'Surface Pro 7', issue: 'Cracked Digitizer', detail: 'Customer reports touch ghosting and horizontal dead zone in center of screen. Needs teardown.', priority: 'High', tech: 'Alex R.', days: 1 },
      { id: 'TK-4522', device: 'Gaming PC', issue: 'No POST', detail: 'Custom loop build. Fans spin but no display output. Possible GPU or RAM failure.', priority: 'Critical', tech: null, days: 0 },
    ],
  },
  {
    title: 'In Repair', color: '#0052cc', count: 3,
    tickets: [
      { id: 'TK-4515', device: 'MacBook Air M2', issue: 'Liquid Damage', detail: 'Logic board cleaning in progress. LDO regulator replacement needed.', priority: 'High', tech: 'Jordan S.', days: 4 },
      { id: 'TK-4518', device: 'Dell Precision 5550', issue: 'Liquid damage on motherboard', detail: 'Component-level repair on VRM circuit.', priority: 'Normal', tech: 'Sarah C.', days: 3 },
      { id: 'TK-4520', device: 'Razer Blade 15', issue: 'Battery Replacement', detail: 'OEM battery sourced. Awaiting installation slot.', priority: 'Low', tech: 'Kevin Z.', days: 2 },
    ],
  },
  {
    title: 'Waiting for Parts', color: '#B95000', count: 2,
    tickets: [
      { id: 'TK-4516', device: 'iPhone 13', issue: 'Data Recovery', detail: 'Storage chip transplant required. Beyond in-house microsoldering capability.', priority: 'Critical', tech: 'Alex R.', days: 6 },
      { id: 'TK-4517', device: 'ThinkPad T14s', issue: 'Keyboard Replacement', detail: 'Awaiting US-layout keyboard from Lenovo parts.', priority: 'Normal', tech: 'Jordan S.', days: 5 },
    ],
  },
  {
    title: 'Outsourced', color: '#7b2600', count: 1,
    tickets: [
      { id: 'TK-4512', device: 'iMac 27"', issue: 'GPU Reballing', detail: 'Sent to board-level specialist. ETA 5 business days.', priority: 'High', tech: null, days: 8 },
    ],
  },
  {
    title: 'Ready for Pickup', color: '#006c47', count: 2,
    tickets: [
      { id: 'TK-4510', device: 'Dell XPS 15', issue: 'SSD Upgrade', detail: 'Samsung 990 Pro installed. Cloned and verified.', priority: 'Normal', tech: 'Kevin Z.', days: 1 },
      { id: 'TK-4509', device: 'HP Pavilion', issue: 'OS Reinstall', detail: 'Windows 11 Pro clean install. Drivers updated.', priority: 'Low', tech: 'Sarah C.', days: 0 },
    ],
  },
];

function TicketCard({ ticket }) {
  const theme = useTheme();
  const pri = PRIORITY[ticket.priority] || PRIORITY.Normal;
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.8,
        borderRadius: '3px',
        border: `1px solid ${theme.palette.divider}`,
        mb: 1,
        cursor: 'grab',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        '&:hover': {
          boxShadow: '0px 4px 8px rgba(9, 30, 66, 0.08)',
          borderColor: theme.palette.outline,
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
        <Typography sx={{ fontSize: '12px', fontWeight: 700, color: theme.palette.primary.main, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
          {ticket.id}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, color: pri.color }}>
          {pri.icon}
        </Box>
      </Box>
      <Typography sx={{ fontSize: '13px', fontWeight: 600, mb: 0.3 }}>
        {ticket.device} — {ticket.issue}
      </Typography>
      <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary, mb: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {ticket.detail}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {ticket.tech ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <Avatar sx={{ width: 22, height: 22, fontSize: '0.6rem', fontWeight: 700, bgcolor: theme.palette.primary.main }}>
              {ticket.tech.split(' ').map(n => n[0]).join('')}
            </Avatar>
            <Typography sx={{ fontSize: '11px', color: theme.palette.text.secondary }}>{ticket.tech}</Typography>
          </Box>
        ) : (
          <Chip label="Unassigned" size="small" sx={{ fontSize: '10px', height: 20, borderRadius: '2px', bgcolor: `${theme.palette.text.secondary}14`, color: theme.palette.text.secondary }} />
        )}
        <Chip
          label={`${ticket.days}d`}
          size="small"
          sx={{ fontSize: '10px', fontWeight: 700, height: 20, borderRadius: '2px', bgcolor: ticket.days > 5 ? '#ba1a1a14' : `${theme.palette.text.secondary}14`, color: ticket.days > 5 ? '#ba1a1a' : theme.palette.text.secondary }}
        />
      </Box>
    </Paper>
  );
}

export default function KanbanPage() {
  const theme = useTheme();
  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em' }}>Manager's Task Board</Typography>
          <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>Drag tickets between columns to update status</Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddOutlinedIcon />}>New Ticket</Button>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, overflowX: { xs: 'visible', md: 'auto' }, pb: 2 }}>
        {COLUMNS.map((col) => (
          <Box key={col.title} sx={{ minWidth: 280, flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: col.color }} />
              <Typography sx={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: theme.palette.text.secondary }}>
                {col.title}
              </Typography>
              <Chip label={col.count} size="small" sx={{ fontSize: '11px', fontWeight: 700, height: 20, borderRadius: '10px', bgcolor: `${col.color}14`, color: col.color, minWidth: 24 }} />
            </Box>
            <Box sx={{ bgcolor: theme.palette.background.default, borderRadius: '3px', border: `1px solid ${theme.palette.divider}`, p: 1, minHeight: 300 }}>
              {col.tickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
