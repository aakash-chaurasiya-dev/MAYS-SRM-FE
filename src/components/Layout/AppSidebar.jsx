import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Drawer, List as MuiList, ListItemButton, ListItemIcon, ListItemText,
  Divider, Button, Collapse, Avatar, Typography
} from '@mui/material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import AddIcon from '@mui/icons-material/Add';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useTheme } from '@mui/material/styles';
import { useAppThemeContext } from '../../theme/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobalLoading } from '../../contexts/GlobalLoadingContext';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import Logo from '../Logo/Logo';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: <DashboardOutlinedIcon />, path: '/dashboard' },
];

const INVENTORY_SUBS = [
  { label: 'Inventory List', path: '/inventory' },
  { label: 'Order Parts', path: '/inventory/parts' },
];

const MAINTENANCE_SUBS = [
  { label: 'Overview', path: '/maintenance' },
  { label: 'Accessories', path: '/maintenance/accessories' },
  { label: 'Branch', path: '/maintenance/branch' },
  { label: 'Brand', path: '/maintenance/brands' },
  { label: 'Charge Type', path: '/maintenance/charge-type' },
  { label: 'Department', path: '/maintenance/department' },
  { label: 'Device Models', path: '/maintenance/device-models' },
  { label: 'Device Type', path: '/maintenance/device-type' },
  { label: 'Payment Mode', path: '/maintenance/payment-mode' },
  { label: 'Service Charges', path: '/maintenance/service-charges' },
  { label: 'Status', path: '/maintenance/status' },
  { label: 'Ticket Type', path: '/maintenance/ticket-type' },
];

const REPORTS_SUBS = [
  { label: 'Overview', path: '/reports' },
  { label: 'Device Management', path: '/reports/device' },
];

const SECTION2 = [
  { label: 'Employee Management', icon: <BadgeOutlinedIcon />, path: '/employees' },
  { label: 'User Details', icon: <BadgeOutlinedIcon />, path: '/users' },
];



export default function AppSidebar({ mobileOpen, desktopOpen, onMobileClose, drawerWidth, onStartResizing, isResizing }) {
  const theme = useTheme();
  const { mode, toggleTheme } = useAppThemeContext();
  const { logout, user } = useAuth();
  const { showLoading, hideLoading } = useGlobalLoading();
  const location = useLocation();
  const navigate = useNavigate();
  const [inventoryOpen, setInventoryOpen] = useState(location.pathname.startsWith('/inventory'));
  const [maintOpen, setMaintOpen] = useState(location.pathname.startsWith('/maintenance'));
  const [reportsOpen, setReportsOpen] = useState(location.pathname.startsWith('/reports'));
  const [billingOpen, setBillingOpen] = useState(location.pathname.startsWith('/billing'));

  const rawRole = user?.roles?.[0]?.authority || user?.role || 'ROLE_USER';
  const isNormalUser = rawRole === 'ROLE_USER';

  const isActive = (path) => location.pathname === path;
  const isMaintActive = location.pathname.startsWith('/maintenance');
  const isReportsActive = location.pathname.startsWith('/reports');

  const navBtnSx = (active) => ({
    borderRadius: '6px', mb: 0.3, py: 0.8,
    px: desktopOpen ? 1.5 : 1,
    justifyContent: desktopOpen ? 'initial' : 'center',
    bgcolor: active ? `${theme.palette.secondary.main}14` : 'transparent',
    '&:hover': { bgcolor: active ? `${theme.palette.secondary.main}1A` : `${theme.palette.primary.main}06` },
  });

  const iconSx = (active) => ({
    minWidth: desktopOpen ? 34 : 0,
    mr: desktopOpen ? 0 : 'auto', ml: desktopOpen ? 0 : 'auto',
    justifyContent: 'center',
    color: active ? theme.palette.secondary.main : theme.palette.text.secondary,
  });

  const textSx = { opacity: { xs: 1, md: desktopOpen ? 1 : 0 }, display: { xs: 'block', md: desktopOpen ? 'block' : 'none' }, whiteSpace: 'nowrap' };

  const textProps = (active) => ({
    fontSize: '13px', fontWeight: active ? 600 : 500,
    color: active ? theme.palette.secondary.main : theme.palette.text.primary,
  });

  const handleNav = (path) => {
    navigate(path);
    if (onMobileClose) onMobileClose();
  };

  const handleNewTicketClick = () => {
    showLoading('Loading New Ticket...');
    setTimeout(() => {
      hideLoading();
      handleNav('/tickets/new');
    }, 800);
  };

  const drawerContent = (
    <Box sx={{
      width: { xs: 240, md: drawerWidth }, height: '100%',
      bgcolor: theme.palette.background.paper,
      display: 'flex', flexDirection: 'column', overflowX: 'hidden',
      transition: isResizing ? 'none' : theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      position: 'relative'
    }}>
      {/* ── Logo / Brand ── */}
      <Box sx={{ px: 2, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 68 }}>
        <Logo width={desktopOpen ? 128 : 40} height={desktopOpen ? 64 : 40} />
      </Box>
      <Divider />
      {/* ── Resizer ── */}
      {desktopOpen && (
        <Box
          onMouseDown={onStartResizing}
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '8px',
            height: '100%',
            cursor: 'ew-resize',
            bgcolor: isResizing ? theme.palette.primary.main : 'transparent',
            '&:hover': { bgcolor: theme.palette.primary.main },
            zIndex: 1200,
          }}
        />
      )}

      {/* ── Main nav ── */}
      <MuiList sx={{ 
        px: 1, 
        pt: 1, 
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        '&::-webkit-scrollbar': { width: '4px' },
        '&::-webkit-scrollbar-track': { background: 'transparent' },
        '&::-webkit-scrollbar-thumb': { background: 'transparent', borderRadius: '4px' },
        '&:hover::-webkit-scrollbar-thumb': { background: theme.palette.divider }
      }}>
        {/* Dashboard / My Tickets */}
        <ListItemButton onClick={() => handleNav('/dashboard')} sx={navBtnSx(isActive('/dashboard'))}>
          <ListItemIcon sx={iconSx(isActive('/dashboard'))}><DashboardOutlinedIcon /></ListItemIcon>
          <ListItemText primary={isNormalUser ? "My Tickets" : "Dashboard"} sx={textSx} primaryTypographyProps={textProps(isActive('/dashboard'))} />
        </ListItemButton>

        {/* Enquiry Link */}
        <ListItemButton onClick={() => handleNav('/enquiries')} sx={navBtnSx(isActive('/enquiries'))}>
          <ListItemIcon sx={iconSx(isActive('/enquiries'))}><SupportAgentOutlinedIcon /></ListItemIcon>
          <ListItemText primary={isNormalUser ? "My Enquiries" : "Enquiry Management"} sx={textSx} primaryTypographyProps={textProps(isActive('/enquiries'))} />
        </ListItemButton>

        {/* Render other employee/admin items ONLY if NOT a normal user */}
        {!isNormalUser && (
          <>
            {/* ── Inventory (collapsible) ── */}
            {(() => {
              const isInventoryActive = location.pathname.startsWith('/inventory');
              return (
                <>
                  <ListItemButton
                    onClick={() => { setInventoryOpen(!inventoryOpen); if (!isInventoryActive) handleNav('/inventory'); }}
                    sx={navBtnSx(isInventoryActive)}
                  >
                    <ListItemIcon sx={iconSx(isInventoryActive)}><Inventory2OutlinedIcon /></ListItemIcon>
                    <ListItemText primary="Inventory" sx={textSx} primaryTypographyProps={textProps(isInventoryActive)} />
                    {desktopOpen && (inventoryOpen ? <ExpandLessIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} /> : <ExpandMoreIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />)}
                  </ListItemButton>
                  <Collapse in={inventoryOpen && desktopOpen} timeout="auto" unmountOnExit>
                    <MuiList disablePadding sx={{ pl: 2 }}>
                      {INVENTORY_SUBS.map((sub) => (
                        <ListItemButton key={sub.path} onClick={() => handleNav(sub.path)}
                          sx={{
                            borderRadius: '6px', mb: 0.2, py: 0.4, px: 1.5,
                            bgcolor: isActive(sub.path) ? `${theme.palette.secondary.main}14` : 'transparent',
                            '&:hover': { bgcolor: `${theme.palette.primary.main}06` },
                          }}>
                          <ListItemText primary={sub.label}
                            primaryTypographyProps={{
                              fontSize: '12px', fontWeight: isActive(sub.path) ? 600 : 400,
                              color: isActive(sub.path) ? theme.palette.secondary.main : theme.palette.text.secondary
                            }} />
                        </ListItemButton>
                      ))}
                    </MuiList>
                  </Collapse>
                </>
              );
            })()}

            {/* ── Maintenance (collapsible) ── */}
            <ListItemButton
              onClick={() => {
                if (location.pathname !== '/maintenance') {
                  handleNav('/maintenance');
                  setMaintOpen(true);
                } else {
                  setMaintOpen(!maintOpen);
                }
              }}
              sx={navBtnSx(isMaintActive)}
            >
              <ListItemIcon sx={iconSx(isMaintActive)}><BuildOutlinedIcon /></ListItemIcon>
              <ListItemText primary="Maintenance" sx={textSx} primaryTypographyProps={textProps(isMaintActive)} />
              {desktopOpen && (maintOpen ? <ExpandLessIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} /> : <ExpandMoreIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />)}
            </ListItemButton>

            <Collapse in={maintOpen && desktopOpen} timeout="auto" unmountOnExit>
              <MuiList disablePadding sx={{ pl: 2 }}>
                {MAINTENANCE_SUBS.map((sub) => (
                  <ListItemButton key={sub.path} onClick={() => handleNav(sub.path)}
                    sx={{
                      borderRadius: '6px', mb: 0.2, py: 0.4, px: 1.5,
                      bgcolor: isActive(sub.path) ? `${theme.palette.secondary.main}14` : 'transparent',
                      '&:hover': { bgcolor: `${theme.palette.primary.main}06` },
                    }}>
                    <ListItemText primary={sub.label}
                      primaryTypographyProps={{
                        fontSize: '12px', fontWeight: isActive(sub.path) ? 600 : 400,
                        color: isActive(sub.path) ? theme.palette.secondary.main : theme.palette.text.secondary
                      }} />
                  </ListItemButton>
                ))}
              </MuiList>
            </Collapse>

            {/* ── Billing ── */}
            {(() => {
              const isBillingActive = location.pathname.startsWith('/billing');
              return (
                <ListItemButton
                  onClick={() => handleNav('/billing/billing-details')}
                  sx={navBtnSx(isBillingActive)}
                >
                  <ListItemIcon sx={iconSx(isBillingActive)}><ReceiptLongOutlinedIcon /></ListItemIcon>
                  <ListItemText primary="Billing" sx={textSx} primaryTypographyProps={textProps(isBillingActive)} />
                </ListItemButton>
              );
            })()}

            {/* ── Reports (collapsible) ── */}
            <ListItemButton
              onClick={() => {
                if (location.pathname !== '/reports') {
                  handleNav('/reports');
                  setReportsOpen(true);
                } else {
                  setReportsOpen(!reportsOpen);
                }
              }}
              sx={navBtnSx(isReportsActive)}
            >
              <ListItemIcon sx={iconSx(isReportsActive)}><AnalyticsOutlinedIcon /></ListItemIcon>
              <ListItemText primary="Reports" sx={textSx} primaryTypographyProps={textProps(isReportsActive)} />
              {desktopOpen && (reportsOpen ? <ExpandLessIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} /> : <ExpandMoreIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />)}
            </ListItemButton>

            <Collapse in={reportsOpen && desktopOpen} timeout="auto" unmountOnExit>
              <MuiList disablePadding sx={{ pl: 2 }}>
                {REPORTS_SUBS.map((sub) => (
                  <ListItemButton key={sub.path} onClick={() => handleNav(sub.path)}
                    sx={{
                      borderRadius: '6px', mb: 0.2, py: 0.4, px: 1.5,
                      bgcolor: isActive(sub.path) ? `${theme.palette.secondary.main}14` : 'transparent',
                      '&:hover': { bgcolor: `${theme.palette.primary.main}06` },
                    }}>
                    <ListItemText primary={sub.label}
                      primaryTypographyProps={{
                        fontSize: '12px', fontWeight: isActive(sub.path) ? 600 : 400,
                        color: isActive(sub.path) ? theme.palette.secondary.main : theme.palette.text.secondary
                      }} />
                  </ListItemButton>
                ))}
              </MuiList>
            </Collapse>

            {/* ── Section 2: Employee Mgmt, Users ── */}
            {SECTION2.map((item) => (
              <ListItemButton key={item.path} onClick={() => handleNav(item.path)} sx={navBtnSx(isActive(item.path))}>
                <ListItemIcon sx={iconSx(isActive(item.path))}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} sx={textSx} primaryTypographyProps={textProps(isActive(item.path))} />
              </ListItemButton>
            ))}


          </>
        )}

        {/* ── + New Ticket Button ── */}
        {!isNormalUser && (
          <Box sx={{ px: desktopOpen ? 0.5 : 0, mt: 1.5 }}>
            <Button variant="contained" fullWidth
              startIcon={desktopOpen ? <AddIcon /> : undefined}
              onClick={handleNewTicketClick}
              sx={{
                borderRadius: '6px', py: 0.9, fontSize: '13px', fontWeight: 600,
                textTransform: 'none', minWidth: desktopOpen ? 'auto' : 40,
                px: desktopOpen ? 2 : 0, justifyContent: 'center'
              }}>
              {desktopOpen ? 'New Ticket' : <AddIcon fontSize="small" />}
            </Button>
          </Box>
        )}
      </MuiList>


      {/* ── Profile Section ── */}
      <Box sx={{ mt: 'auto', p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Box
          onClick={() => handleNav('/profile')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            p: 1,
            borderRadius: 1,
            '&:hover': { bgcolor: 'action.hover' }
          }}
        >
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: theme.palette.primary.main,
              mr: desktopOpen ? 1.5 : 0
            }}
          >
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </Avatar>
          {desktopOpen && (
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                {user?.name || 'User Profile'}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {rawRole.replace('ROLE_', '')}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 }, transition: isResizing ? 'none' : theme.transitions.create('width', { easing: theme.transitions.easing.sharp, duration: theme.transitions.duration.enteringScreen }) }}>
      <Drawer variant="temporary" open={mobileOpen} onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240, overflow: 'hidden' } }}>
        {drawerContent}
      </Drawer>
      <Drawer variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box', width: drawerWidth, overflow: 'hidden',
            transition: isResizing ? 'none' : theme.transitions.create('width', { easing: theme.transitions.easing.sharp, duration: theme.transitions.duration.enteringScreen })
          }
        }}
        open>
        {drawerContent}
      </Drawer>
    </Box>
  );
}
