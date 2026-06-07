import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import AddIcon from '@mui/icons-material/Add';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';

/**
 * Centralized configuration for routes that can be opened as tabs.
 * - `title`: The text displayed on the tab. Can be a string or a function for dynamic titles.
 * - `icon`: The icon displayed on the tab.
 * - `isClosable`: Determines if the tab shows a close button.
 */
export const ROUTE_CONFIG = {
   '/dashboard': { title: 'Dashboard', icon: <DashboardOutlinedIcon fontSize="small" />, isClosable: false },
  '/inventory': { title: 'Inventory', icon: <Inventory2OutlinedIcon fontSize="small" />, isClosable: true },
  '/tickets/:id': { title: 'Tickets/:id', icon: <Inventory2OutlinedIcon fontSize="small" />, isClosable: true }
};