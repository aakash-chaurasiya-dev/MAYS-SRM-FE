import { useState, useCallback, useEffect } from 'react';
import { Box, useMediaQuery } from '@mui/material';
import KeepAliveOutlet from './KeepAliveOutlet';
import AppSidebar from './AppSidebar';
import TabBar from './TabBar';
import UserEntryModal from '../UserEntryModal';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import { getUserRole } from '../../access/featureAccess';

/**
 * AppLayout — Shared shell for all authenticated pages.
 * Renders the sidebar, top bar, and nested page content via <Outlet />.
 */
export default function AppLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const handleOpenEntryModal = () => setShowEntryModal(true);
    window.addEventListener('open-user-entry-modal', handleOpenEntryModal);
    return () => {
      window.removeEventListener('open-user-entry-modal', handleOpenEntryModal);
    };
  }, []);


  const handleDrawerToggle = () => {
    if (isDesktop) {
      setDesktopOpen(!desktopOpen);
    } else {
      setMobileOpen(!mobileOpen);
    }
  };

  const [sidebarWidth, setSidebarWidth] = useState(15);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e) => {
    if (isResizing) {
      const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const newWidthPx = Math.min(Math.max(e.clientX, 200), 500);
      const newWidthRem = newWidthPx / rootFontSize;
      setSidebarWidth(Math.min(Math.max(newWidthRem, 12), 30)); // clamp between 12rem and 30rem
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  const drawerWidth = desktopOpen ? sidebarWidth : 4;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', cursor: isResizing ? 'ew-resize' : 'auto', userSelect: isResizing ? 'none' : 'auto' }}>
      {/* ── Sidebar ── */}
      <AppSidebar 
        mobileOpen={mobileOpen} 
        desktopOpen={desktopOpen}
        onMobileClose={() => setMobileOpen(false)} 
        drawerWidth={drawerWidth}
        onStartResizing={startResizing}
        isResizing={isResizing}
      />

      

      {/* ── Main area ── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,           // was already there
          flex: 1,               // add this
          minWidth: 0,           // add this – prevents overflow
          display: 'flex',
          flexDirection: 'column',
          bgcolor: theme.palette.background.default,
          minHeight: '100vh',
          overflow: 'hidden',    // add this
          // remove the 'width' line entirely
        }}
      >
        <TabBar onMenuClick={handleDrawerToggle} />

        {/* ── Page content ── */}
        <Box
          sx={{
            flex: 1,
            p: { xs: 1, sm: 1.5 },
            overflow: 'auto',
          }}
        >
          <KeepAliveOutlet />
        </Box>
      </Box>
      
      <UserEntryModal 
        open={showEntryModal} 
        onClose={() => setShowEntryModal(false)} 
      />
    </Box>
  );
}
