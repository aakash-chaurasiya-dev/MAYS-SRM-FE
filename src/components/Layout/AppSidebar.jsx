import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  List as MuiList,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Collapse,
  Avatar,
  Typography,
} from '@mui/material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import AddIcon from '@mui/icons-material/Add';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobalLoading } from '../../contexts/GlobalLoadingContext';
import RoleGuard, { getUserRole } from '../RoleGuard';
import Logo from '../Logo/Logo';

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
  { label: 'Referred Category', path: '/maintenance/referred-category' },
  { label: 'Warranty Type', path: '/maintenance/warranty-type' },
];

const REPORTS_SUBS = [
  { label: 'Overview', path: '/reports' },
  { label: 'Device Management', path: '/reports/device' },
  { label: 'User Entry Report', path: '/reports/user-entry' },
];

const MANAGER_ROLES = ['ROLE_MANAGER', 'ROLE_EXECUTIVE'];

function SubNavList({ items, isActive, onNav, theme }) {
  return (
    <MuiList disablePadding sx={{ pl: 2 }}>
      {items.map((sub) => {
        const active = isActive(sub.path);
        return (
          <ListItemButton
            key={sub.path}
            onClick={() => onNav(sub.path)}
            sx={{
              borderRadius: '6px',
              mb: 0.2,
              py: 0.4,
              px: 1.5,
              bgcolor: active ? `${theme.palette.secondary.main}14` : 'transparent',
              '&:hover': { bgcolor: `${theme.palette.primary.main}06` },
            }}
          >
            <ListItemText
              primary={sub.label}
              primaryTypographyProps={{
                fontSize: '12px',
                fontWeight: active ? 600 : 400,
                color: active ? theme.palette.secondary.main : theme.palette.text.secondary,
              }}
            />
          </ListItemButton>
        );
      })}
    </MuiList>
  );
}

function NavItem({ label, icon: Icon, path, active, desktopOpen, onNav, navBtnSx, iconSx, textSx, textProps }) {
  return (
    <ListItemButton onClick={() => onNav(path)} sx={navBtnSx(active)}>
      <ListItemIcon sx={iconSx(active)}>
        <Icon />
      </ListItemIcon>
      <ListItemText primary={label} sx={textSx} primaryTypographyProps={textProps(active)} />
    </ListItemButton>
  );
}

function CollapsibleNavSection({
  label,
  icon: Icon,
  sectionPath,
  overviewPath,
  subs,
  open,
  setOpen,
  desktopOpen,
  pathname,
  onNav,
  navBtnSx,
  iconSx,
  textSx,
  textProps,
  theme,
}) {
  const active = pathname.startsWith(sectionPath);
  const expandIconSx = { fontSize: 18, color: theme.palette.text.secondary };

  const handleToggle = () => {
    if (pathname.startsWith(sectionPath)) {
      setOpen(!open);
    } else {
      onNav(overviewPath);
      setOpen(true);
    }
  };

  return (
    <>
      <ListItemButton onClick={handleToggle} sx={navBtnSx(active)}>
        <ListItemIcon sx={iconSx(active)}>
          <Icon />
        </ListItemIcon>
        <ListItemText primary={label} sx={textSx} primaryTypographyProps={textProps(active)} />
        {desktopOpen && (open ? <ExpandLessIcon sx={expandIconSx} /> : <ExpandMoreIcon sx={expandIconSx} />)}
      </ListItemButton>
      <Collapse in={open && desktopOpen} timeout="auto" unmountOnExit>
        <SubNavList items={subs} isActive={(path) => pathname === path} onNav={onNav} theme={theme} />
      </Collapse>
    </>
  );
}

export default function AppSidebar({
  mobileOpen,
  desktopOpen,
  onMobileClose,
  drawerWidth,
  onStartResizing,
  isResizing,
}) {
  const theme = useTheme();
  const { user } = useAuth();
  const { showLoading, hideLoading } = useGlobalLoading();
  const location = useLocation();
  const navigate = useNavigate();

  const [inventoryOpen, setInventoryOpen] = useState(location.pathname.startsWith('/inventory'));
  const [maintOpen, setMaintOpen] = useState(location.pathname.startsWith('/maintenance'));
  const [reportsOpen, setReportsOpen] = useState(location.pathname.startsWith('/reports'));

  const rawRole = getUserRole(user);
  const isEngineer = rawRole === 'ROLE_ENGINEER';
  const isPurchase = rawRole === 'ROLE_PURCHASE';
  const isNormalUser = rawRole === 'ROLE_USER';

  const dashboardLabel = isNormalUser || isEngineer || isPurchase ? 'My Tickets' : 'Dashboard';
  const enquiryLabel = isNormalUser ? 'My Enquiries' : 'Enquiry Management';

  const isActive = (path) => location.pathname === path;

  const navBtnSx = (active) => ({
    borderRadius: '6px',
    mb: 0.3,
    py: 0.8,
    px: desktopOpen ? 1.5 : 1,
    justifyContent: desktopOpen ? 'initial' : 'center',
    bgcolor: active ? `${theme.palette.secondary.main}14` : 'transparent',
    '&:hover': {
      bgcolor: active ? `${theme.palette.secondary.main}1A` : `${theme.palette.primary.main}06`,
    },
  });

  const iconSx = (active) => ({
    minWidth: desktopOpen ? 34 : 0,
    mr: desktopOpen ? 0 : 'auto',
    ml: desktopOpen ? 0 : 'auto',
    justifyContent: 'center',
    color: active ? theme.palette.secondary.main : theme.palette.text.secondary,
  });

  const textSx = {
    opacity: { xs: 1, md: desktopOpen ? 1 : 0 },
    display: { xs: 'block', md: desktopOpen ? 'block' : 'none' },
    whiteSpace: 'nowrap',
  };

  const textProps = (active) => ({
    fontSize: '13px',
    fontWeight: active ? 600 : 500,
    color: active ? theme.palette.secondary.main : theme.palette.text.primary,
  });

  const handleNav = (path) => {
    navigate(path);
    onMobileClose?.();
  };

  const handleNewTicketClick = () => {
    showLoading('Loading New Ticket...');
    setTimeout(() => {
      hideLoading();
      handleNav('/tickets/new');
    }, 800);
  };

  const widthTransition = theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  });

  const drawerContent = (
    <Box
      sx={{
        width: { xs: 240, md: drawerWidth },
        height: '100%',
        bgcolor: theme.palette.background.paper,
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
        transition: isResizing ? 'none' : widthTransition,
        position: 'relative',
      }}
    >
      <Box sx={{ px: 2, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 68 }}>
        <Logo width={desktopOpen ? 128 : 40} height={desktopOpen ? 64 : 40} />
      </Box>
      <Divider />

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

      <MuiList
        sx={{
          px: 1,
          pt: 1,
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: 'transparent', borderRadius: '4px' },
          '&:hover::-webkit-scrollbar-thumb': { background: theme.palette.divider },
        }}
      >
        <NavItem
          label={dashboardLabel}
          icon={DashboardOutlinedIcon}
          path="/dashboard"
          active={isActive('/dashboard')}
          desktopOpen={desktopOpen}
          onNav={handleNav}
          navBtnSx={navBtnSx}
          iconSx={iconSx}
          textSx={textSx}
          textProps={textProps}
        />

        <RoleGuard allowedRoles={[...MANAGER_ROLES, 'ROLE_ADMIN', 'ROLE_USER']}>
          <NavItem
            label={enquiryLabel}
            icon={SupportAgentOutlinedIcon}
            path="/enquiries"
            active={isActive('/enquiries')}
            desktopOpen={desktopOpen}
            onNav={handleNav}
            navBtnSx={navBtnSx}
            iconSx={iconSx}
            textSx={textSx}
            textProps={textProps}
          />
        </RoleGuard>

        <RoleGuard allowedRoles={[...MANAGER_ROLES, 'ROLE_PURCHASE']}>
          <CollapsibleNavSection
            label="Inventory"
            icon={Inventory2OutlinedIcon}
            sectionPath="/inventory"
            overviewPath="/inventory"
            subs={INVENTORY_SUBS}
            open={inventoryOpen}
            setOpen={setInventoryOpen}
            desktopOpen={desktopOpen}
            pathname={location.pathname}
            onNav={handleNav}
            navBtnSx={navBtnSx}
            iconSx={iconSx}
            textSx={textSx}
            textProps={textProps}
            theme={theme}
          />
        </RoleGuard>

        <RoleGuard allowedRoles={MANAGER_ROLES}>
          <CollapsibleNavSection
            label="Maintenance"
            icon={BuildOutlinedIcon}
            sectionPath="/maintenance"
            overviewPath="/maintenance"
            subs={MAINTENANCE_SUBS}
            open={maintOpen}
            setOpen={setMaintOpen}
            desktopOpen={desktopOpen}
            pathname={location.pathname}
            onNav={handleNav}
            navBtnSx={navBtnSx}
            iconSx={iconSx}
            textSx={textSx}
            textProps={textProps}
            theme={theme}
          />
        </RoleGuard>

        <RoleGuard allowedRoles={MANAGER_ROLES}>
          <NavItem
            label="Billing"
            icon={ReceiptLongOutlinedIcon}
            path="/billing/billing-details"
            active={location.pathname.startsWith('/billing')}
            desktopOpen={desktopOpen}
            onNav={handleNav}
            navBtnSx={navBtnSx}
            iconSx={iconSx}
            textSx={textSx}
            textProps={textProps}
          />
        </RoleGuard>

        <RoleGuard allowedRoles={MANAGER_ROLES}>
          <CollapsibleNavSection
            label="Reports"
            icon={AnalyticsOutlinedIcon}
            sectionPath="/reports"
            overviewPath="/reports"
            subs={REPORTS_SUBS}
            open={reportsOpen}
            setOpen={setReportsOpen}
            desktopOpen={desktopOpen}
            pathname={location.pathname}
            onNav={handleNav}
            navBtnSx={navBtnSx}
            iconSx={iconSx}
            textSx={textSx}
            textProps={textProps}
            theme={theme}
          />
        </RoleGuard>

        <RoleGuard allowedRoles={MANAGER_ROLES}>
          <NavItem
            label="Employee Management"
            icon={BadgeOutlinedIcon}
            path="/employees"
            active={isActive('/employees')}
            desktopOpen={desktopOpen}
            onNav={handleNav}
            navBtnSx={navBtnSx}
            iconSx={iconSx}
            textSx={textSx}
            textProps={textProps}
          />
        </RoleGuard>

        <RoleGuard allowedRoles={MANAGER_ROLES}>
          <NavItem
            label="User Details"
            icon={BadgeOutlinedIcon}
            path="/users"
            active={isActive('/users')}
            desktopOpen={desktopOpen}
            onNav={handleNav}
            navBtnSx={navBtnSx}
            iconSx={iconSx}
            textSx={textSx}
            textProps={textProps}
          />
        </RoleGuard>

        <RoleGuard allowedRoles={MANAGER_ROLES}>
          <NavItem
            label="Vendor Details"
            icon={BadgeOutlinedIcon}
            path="/vendors"
            active={isActive('/vendors')}
            desktopOpen={desktopOpen}
            onNav={handleNav}
            navBtnSx={navBtnSx}
            iconSx={iconSx}
            textSx={textSx}
            textProps={textProps}
          />
        </RoleGuard>

        <RoleGuard allowedRoles={[...MANAGER_ROLES, 'ROLE_ADMIN', 'ROLE_USER']}>
          <Box sx={{ px: desktopOpen ? 0.5 : 0, mt: 1.5 }}>
            <Button
              variant="contained"
              fullWidth
              startIcon={desktopOpen ? <AddIcon /> : undefined}
              onClick={handleNewTicketClick}
              sx={{
                borderRadius: '6px',
                py: 0.9,
                fontSize: '13px',
                fontWeight: 600,
                textTransform: 'none',
                minWidth: desktopOpen ? 'auto' : 40,
                px: desktopOpen ? 2 : 0,
                justifyContent: 'center',
              }}
            >
              {desktopOpen ? 'New Ticket' : <AddIcon fontSize="small" />}
            </Button>
          </Box>
        </RoleGuard>
      </MuiList>

      <Box sx={{ mt: 'auto', p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Box
          onClick={() => handleNav('/profile')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            p: 1,
            borderRadius: 1,
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: theme.palette.primary.main,
              mr: desktopOpen ? 1.5 : 0,
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

  const drawerPaperSx = {
    boxSizing: 'border-box',
    overflow: 'hidden',
    transition: isResizing ? 'none' : widthTransition,
  };

  return (
    <Box
      component="nav"
      sx={{
        width: { md: drawerWidth },
        flexShrink: { md: 0 },
        transition: isResizing ? 'none' : widthTransition,
      }}
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { ...drawerPaperSx, width: 240 },
        }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { ...drawerPaperSx, width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
