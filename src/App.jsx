import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { TabNavigationProvider } from './contexts/TabNavigationContext';

// Layout
import AppLayout from './components/Layout/AppLayout'; 

// Pages
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import DiagnosisPage from './pages/EngineerDiagnosis/DiagnosisPage';
import InventoryPage from './pages/Inventory/InventoryPage';
import KanbanPage from './pages/KanbanBoard/KanbanPage';
import NewTicketPage from './pages/NewTicket/NewTicketPage';
import TicketDetailPage from './pages/TicketDetail/TicketDetailPage';
import MaintenancePage from './pages/Maintenance/MaintenancePage';
import BrandManagementPage from './pages/Maintenance/BrandManagementPage';
import InvoiceHistoryPage from './pages/InvoiceHistory/InvoiceHistoryPage';
import CreateInvoicePage from './pages/CreateInvoice/CreateInvoicePage';

function App() {
  return (
    <BrowserRouter>
      <TabNavigationProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Authenticated Routes with Sidebar & TopBar */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/diagnosis" element={<DiagnosisPage />} />
            <Route path="/kanban" element={<KanbanPage />} />
            <Route path="/inventory" element={<InventoryPage />} />

            {/* Ticket Routes */}
            <Route path="/tickets/new" element={<NewTicketPage />} />
            <Route path="/tickets/:id" element={<TicketDetailPage />} />

            {/* Maintenance Routes */}
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/maintenance/brands" element={<BrandManagementPage />} />

            {/* Billing Routes */}
            <Route path="/billing/invoice-history" element={<InvoiceHistoryPage />} />
            <Route path="/billing/create" element={<CreateInvoicePage />} />

            {/* Placeholder routes for navigation items */}
            <Route path="/maintenance/:section" element={<Box sx={{ p: 3 }}>Maintenance Section (WIP)</Box>} />
            <Route path="/reports" element={<Box sx={{ p: 3 }}>Reports Page (WIP)</Box>} />
            <Route path="/employees" element={<Box sx={{ p: 3 }}>Employee Management (WIP)</Box>} />
            <Route path="/customers" element={<Box sx={{ p: 3 }}>Customers Page (WIP)</Box>} />
            <Route path="/settings" element={<Box sx={{ p: 3 }}>Settings Page (WIP)</Box>} />
            <Route path="/support" element={<Box sx={{ p: 3 }}>Support Desk (WIP)</Box>} />
          </Route>
        </Routes>
      </TabNavigationProvider>
    </BrowserRouter>
  );
}

export default App;
