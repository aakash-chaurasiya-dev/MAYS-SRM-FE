import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { TabNavigationProvider } from './contexts/TabNavigationContext';
import { GlobalLoadingProvider } from './contexts/GlobalLoadingContext';

// Layout
import AppLayout from './components/Layout/AppLayout';

// Pages
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
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
import DeviceManagementPage from './pages/Reports/Device/DeviceManagementPage';
import DeviceModelManagementPage from './pages/Maintenance/DeviceModels/DeviceModelManagementPage';
import DeviceTypeManagementPage from './pages/Maintenance/DeviceType/DeviceTypeManagementPage';
import PaymentModeManagementPage from './pages/Maintenance/PaymentMode/PaymentModeManagementPage';
import ServiceChargesManagementPage from './pages/Maintenance/ServiceCharges/ServiceChargesManagementPage';
import StatusManagementPage from './pages/Maintenance/Status/StatusManagementPage';
import TicketTypeManagementPage from './pages/Maintenance/TicketType/TicketTypeManagementPage';
import AccessoryManagementPage from './pages/Maintenance/Accessory/AccessoryManagementPage';
import BillingDetailsPage from './pages/Billing/BillingDetailsPage';
import CreateInvoicePage from './pages/Billing/CreateInvoicePage';
import ReportsPage from './pages/Reports/ReportsPage';
import UserEntryReportPage from './pages/Reports/UserEntryReportPage';
import OrderPartsPage from './pages/Inventory/OrderPartsPage';
import EmployeeDetailsPage from './pages/EmployeeDetails/EmployeeDetails';
import EmployeeProfilePage from './pages/EmployeeDetails/EmployeeProfilePage';
import UserDetailsPage from './pages/UserDetails/UserDetailsPage';
import UserProfilePage from './pages/UserDetails/UserProfilePage';
import ProfilePage from './pages/Profile/ProfilePage';
import EnquiriesPage from './pages/Enquiries/EnquiriesPage';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import GlobalNotificationPopup from './components/GlobalNotificationPopup';
import GlobalLoading from './components/GlobalLoading';

function App() {
  return (
    <GlobalLoadingProvider>
      <BrowserRouter>
        <TabNavigationProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Authenticated Routes with Sidebar & TabBar */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />

                {/* Ticket Routes (Accessible by both customers and employees) */}
                <Route path="/tickets/new" element={<NewTicketPage />} />
                <Route path="/tickets/:id" element={<TicketDetailPage />} />

                {/* Enquiry Routes */}
                <Route path="/enquiries" element={<EnquiriesPage />} />

                {/* Restricted Employee/Admin Routes */}
                <Route element={<ProtectedRoute allowedRoles={['ROLE_MANAGER', 'ROLE_PURCHASE', 'ROLE_ENGINEER', 'ROLE_ADMIN']} />}>
                  <Route path="/diagnosis" element={<DiagnosisPage />} />
                  <Route path="/inventory" element={<InventoryPage />} />
                  <Route path="/inventory/parts" element={<OrderPartsPage />} />

                  {/* Maintenance Routes */}
                  <Route path="/maintenance" element={<MaintenancePage />} />
                  <Route path="/maintenance/brands" element={<BrandManagementPage />} />
                  <Route path="/maintenance/branch" element={<BranchManagementPage />} />
                  <Route path="/maintenance/charge-type" element={<ChargeTypeManagementPage />} />
                  <Route path="/maintenance/department" element={<DepartmentManagementPage />} />
                  <Route path="/maintenance/device-models" element={<DeviceModelManagementPage />} />
                  <Route path="/maintenance/device-type" element={<DeviceTypeManagementPage />} />
                  <Route path="/maintenance/payment-mode" element={<PaymentModeManagementPage />} />
                  <Route path="/maintenance/service-charges" element={<ServiceChargesManagementPage />} />
                  <Route path="/maintenance/status" element={<StatusManagementPage />} />
                  <Route path="/maintenance/ticket-type" element={<TicketTypeManagementPage />} />
                  <Route path="/maintenance/accessories" element={<AccessoryManagementPage />} />

                  {/* Billing Routes */}
                  <Route path="/billing" element={<Navigate to="/billing/billing-details" replace />} />
                  <Route path="/billing/billing-details" element={<BillingDetailsPage />} />
                  <Route path="/billing/create" element={<CreateInvoicePage />} />

                  <Route path="/maintenance/:section" element={<Box sx={{ p: 3 }}>Maintenance Section (WIP)</Box>} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/reports/user-entry" element={<UserEntryReportPage />} />
                  <Route path="/reports/device" element={<DeviceManagementPage />} />
                  <Route path="/employees" element={<EmployeeDetailsPage />} />
                  <Route path="/employees/:id" element={<EmployeeProfilePage />} />
                  <Route path="/users" element={<UserDetailsPage />} />
                  <Route path="/users/:id" element={<UserProfilePage />} />
                  <Route path="/customers" element={<Box sx={{ p: 3 }}>Customers Page (WIP)</Box>} />
                  <Route path="/settings" element={<Box sx={{ p: 3 }}>Settings Page (WIP)</Box>} />
                  <Route path="/support" element={<Box sx={{ p: 3 }}>Support Desk (WIP)</Box>} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </TabNavigationProvider>
      </BrowserRouter>
      <GlobalNotificationPopup />
      <GlobalLoading />
    </GlobalLoadingProvider>
  );
}

export default App;
