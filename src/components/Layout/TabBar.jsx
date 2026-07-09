import { Box, Tabs, Tab, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTabNavigation } from '../../contexts/TabNavigationContext';

export default function TabBar({ onMenuClick }) {
  const { tabs, removeTab } = useTabNavigation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabClick = (path) => {
    navigate(path);
  };

  const handleTabClose = (e, tabId) => {
    e.stopPropagation(); // Prevent the tab click event from firing
    removeTab(tabId);
  };

  // Use location.pathname as the source of truth for the active tab
  const currentActiveTab = location.pathname;

  // If the current path doesn't match any open tab (e.g., during navigation before the new tab mounts),
  // pass false to MUI Tabs to prevent the "invalid value" warning.
  const isTabValid = tabs.some(tab => tab.id === currentActiveTab);
  const tabsValue = isTabValid ? currentActiveTab : false;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
      <IconButton
        onClick={onMenuClick}
        sx={{ ml: 1, mr: 1, color: 'text.secondary' }}
      >
        <MenuIcon />
      </IconButton>
      <Tabs
        value={tabsValue}
        onChange={(e, newValue) => handleTabClick(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="open pages tabs"
        sx={{
          minHeight: '40px',
          '& .MuiTabs-indicator': {
            display: 'none', // We use custom styling for the active tab instead
          },
        }}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            value={tab.id}
            component="div" // Use a div to allow for custom layout within the tab
            onClick={() => handleTabClick(tab.path)}
            sx={{
              p: 0,
              minHeight: '40px',
              opacity: 1,
              mr: 0.5,
              border: '1px solid',
              borderBottom: 'none',
              borderColor: 'divider',
              borderTopLeftRadius: '6px',
              borderTopRightRadius: '6px',
              textTransform: 'none',
              bgcolor: currentActiveTab === tab.id ? 'background.paper' : 'transparent',
              fontWeight: currentActiveTab === tab.id ? 600 : 500,
              '&.Mui-selected': {
                color: 'text.primary',
              },
              '&:hover': {
                bgcolor: currentActiveTab === tab.id ? 'background.paper' : 'action.hover',
              },
            }}
            label={(
              <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5, py: 0.75, gap: 1 }}>
                {tab.icon}
                <span style={{ whiteSpace: 'nowrap' }}>{tab.title}</span>
                {tab.isClosable && (
                  <IconButton size="small" onClick={(e) => handleTabClose(e, tab.id)} sx={{ ml: 1, p: '2px' }}>
                    <CloseIcon sx={{ fontSize: '16px' }} />
                  </IconButton>
                )}
              </Box>
            )}
          />
        ))}
      </Tabs>
    </Box>
  );
}