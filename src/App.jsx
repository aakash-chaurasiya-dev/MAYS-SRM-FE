import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import { TabNavigationProvider } from './contexts/TabNavigationContext';

// Layout
import AppLayout from './components/Layout/AppLayout';

// Pages
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import DiagnosisPage from './pages/EngineerDiagnosis/DiagnosisPage';
import InventoryPage from './pages/Inventory/InventoryPage';
import NewTicketPage from './pages/Tickets/NewTicketPage';
import TicketDetailPage from './pages/Tickets/TicketDetailPage';
import MaintenancePage from './pages/Maintenance/MaintenancePage';
import BrandManagementPage from './pages/Maintenance/Brand/BrandManagementPage';
import BranchManagementPage from './pages/Maintenance/Branch/BranchManagementPage';
import ChargeTypeManagementPage from './pages/Maintenance/ChargeType/ChargeTypeManagementPage';
import DepartmentManagementPage from './pages/Maintenance/Department/DepartmentManagementPage';
import DeviceManagementPage from './pages/Maintenance/Device/DeviceManagementPage';
import DeviceModelManagementPage from './pages/Maintenance/DeviceModels/DeviceModelManagementPage';
import DeviceTypeManagementPage from './pages/Maintenance/DeviceType/DeviceTypeManagementPage';
import PaymentModeManagementPage from './pages/Maintenance/PaymentMode/PaymentModeManagementPage';
import ServiceChargesManagementPage from './pages/Maintenance/ServiceCharges/ServiceChargesManagementPage';
import StatusManagementPage from './pages/Maintenance/Status/StatusManagementPage';
import TicketTypeManagementPage from './pages/Maintenance/TicketType/TicketTypeManagementPage';
import InvoiceHistoryPage from './pages/Billing/InvoiceHistoryPage';
import CreateInvoicePage from './pages/Billing/CreateInvoicePage';
import OrderPartsPage from './pages/Inventory/OrderPartsPage';
import EmployeeDetailsPage from './pages/EmployeeDetails/EmployeeDetails';
import UserDetailsPage from './pages/UserDetails/UserDetailsPage';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import GlobalNotificationPopup from './components/GlobalNotificationPopup';

function App() {
  return (
    <>
      <BrowserRouter>
        <TabNavigationProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Authenticated Routes with Sidebar & TopBar & Tabbar*/}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/diagnosis" element={<DiagnosisPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/inventory/parts" element={<OrderPartsPage />} />

                {/* Ticket Routes */}
                <Route path="/tickets/new" element={<NewTicketPage />} />
                <Route path="/tickets/:id" element={<TicketDetailPage />} />

                {/* Maintenance Routes */}
                <Route path="/maintenance" element={<MaintenancePage />} />
                <Route path="/maintenance/brands" element={<BrandManagementPage />} />
                <Route path="/maintenance/branch" element={<BranchManagementPage />} />
                <Route path="/maintenance/charge-type" element={<ChargeTypeManagementPage />} />
                <Route path="/maintenance/department" element={<DepartmentManagementPage />} />
                <Route path="/maintenance/device" element={<DeviceManagementPage />} />
                <Route path="/maintenance/device-models" element={<DeviceModelManagementPage />} />
                <Route path="/maintenance/device-type" element={<DeviceTypeManagementPage />} />
                <Route path="/maintenance/payment-mode" element={<PaymentModeManagementPage />} />
                <Route path="/maintenance/service-charges" element={<ServiceChargesManagementPage />} />
                <Route path="/maintenance/status" element={<StatusManagementPage />} />
                <Route path="/maintenance/ticket-type" element={<TicketTypeManagementPage />} />

                {/* Billing Routes */}
                <Route path="/billing" element={<InvoiceHistoryPage />} />
                <Route path="/billing/invoice-history" element={<InvoiceHistoryPage />} />
                <Route path="/billing/create" element={<CreateInvoicePage />} />

                {/* Placeholder routes for navigation items */}
                <Route path="/maintenance/:section" element={<Box sx={{ p: 3 }}>Maintenance Section (WIP)</Box>} />
                <Route path="/reports" element={<Box sx={{ p: 3 }}>Reports Page (WIP)</Box>} />
                <Route path="/employees" element={<EmployeeDetailsPage />} />
                <Route path="/users" element={<UserDetailsPage />} />
                <Route path="/customers" element={<Box sx={{ p: 3 }}>Customers Page (WIP)</Box>} />
                <Route path="/settings" element={<Box sx={{ p: 3 }}>Settings Page (WIP)</Box>} />
                <Route path="/support" element={<Box sx={{ p: 3 }}>Support Desk (WIP)</Box>} />
              </Route>
            </Route>
          </Routes>
        </TabNavigationProvider>
      </BrowserRouter>
      <GlobalNotificationPopup />
    </>
  );
}

export default App;
