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
  '/diagnosis': { title: 'Diagnosis', icon: <BuildOutlinedIcon fontSize="small" />, isClosable: true },
  '/inventory': { title: 'Inventory', icon: <Inventory2OutlinedIcon fontSize="small" />, isClosable: true },
  '/inventory/parts': { title: 'Order Parts', icon: <Inventory2OutlinedIcon fontSize="small" />, isClosable: true },
  '/tickets/new': { title: 'New Ticket', icon: <AddIcon fontSize="small" />, isClosable: true },
  '/tickets/:id': { title: (params) => `Ticket #${params.id}`, icon: <ConfirmationNumberOutlinedIcon fontSize="small" />, isClosable: true },
  '/maintenance/:section': { title: (params) => `Maintenance: ${params.section}`, icon: <BuildOutlinedIcon fontSize="small" />, isClosable: true },
  '/reports': { title: 'Reports', icon: <AnalyticsOutlinedIcon fontSize="small" />, isClosable: true },
  '/reports/:section': { title: (params) => `Reports: ${params.section}`, icon: <AnalyticsOutlinedIcon fontSize="small" />, isClosable: true },
  '/employees': { title: 'Employees', icon: <BadgeOutlinedIcon fontSize="small" />, isClosable: true },
  '/customers': { title: 'Customers', icon: <SupportAgentOutlinedIcon fontSize="small" />, isClosable: true },
  '/settings': { title: 'Settings', icon: <SettingsOutlinedIcon fontSize="small" />, isClosable: true },
  '/support': { title: 'Support Desk', icon: <SupportAgentOutlinedIcon fontSize="small" />, isClosable: true },
  '/billing/create': { title: (params) => params.ticketId ? `Create Invoice #${params.ticketId}` : 'Create Invoice', icon: <ReceiptLongOutlinedIcon fontSize="small" />, isClosable: true },
  '/billing/:id': { title: (params) => `Billing #${params.id}`, icon: <ReceiptLongOutlinedIcon fontSize="small" />, isClosable: true },
  '/users': { title: 'Users', icon: <BadgeOutlinedIcon fontSize="small" />, isClosable: true },
};