import { useState, useCallback, useEffect } from 'react';
import { Box, useMediaQuery } from '@mui/material';
import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import TabBar from './TabBar';
import { useTheme } from '@mui/material/styles';

/**
 * AppLayout — Shared shell for all authenticated pages.
 * Renders the sidebar, top bar, and nested page content via <Outlet />.
 */
export default function AppLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);

  const handleDrawerToggle = () => {
    if (isDesktop) {
      setDesktopOpen(!desktopOpen);
    } else {
      setMobileOpen(!mobileOpen);
    }
  };

  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e) => {
    if (isResizing) {
      const newWidth = Math.min(Math.max(e.clientX, 200), 500);
      setSidebarWidth(newWidth);
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

  const drawerWidth = desktopOpen ? sidebarWidth : 64;

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
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: theme.palette.background.default,
          minHeight: '100vh',
          width: { md: `calc(100% - ${drawerWidth}px)` },
          transition: isResizing ? 'none' : theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <TabBar onMenuClick={handleDrawerToggle} />

        {/* ── Page content ── */}
        <Box
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3 }, // slightly smaller padding on mobile
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
