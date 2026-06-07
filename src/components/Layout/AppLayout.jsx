import { useState } from 'react';
import { Box, useMediaQuery } from '@mui/material';
import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import TopBar from './TopBar';
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

  const drawerWidth = desktopOpen ? 240 : 64;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* ── Sidebar ── */}
      <AppSidebar 
        mobileOpen={mobileOpen} 
        desktopOpen={desktopOpen}
        onMobileClose={() => setMobileOpen(false)} 
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
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <TabBar />

        <TopBar onMenuClick={handleDrawerToggle} />

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
