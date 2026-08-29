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
import ProductListPage from './pages/Inventory/ProductListPage';
import PartPricesPage from './pages/Inventory/PartPricesPage';
import InStockPartsPage from './pages/Inventory/InStockPartsPage';
import TicketPartsListPage from './pages/Inventory/TicketPartsListPage';
import PartsOrdersPage from './pages/Inventory/PartsOrdersPage';
import PartsOrderDetailPage from './pages/Inventory/PartsOrderDetailPage';
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
import SlaPolicyManagementPage from './pages/Maintenance/SlaPolicy/SlaPolicyManagementPage';
import TicketTypeManagementPage from './pages/Maintenance/TicketType/TicketTypeManagementPage';
import ReferredCategoryManagementPage from './pages/Maintenance/ReferredCategory/ReferredCategoryManagementPage';
import WarrantyTypeManagementPage from './pages/Maintenance/WarrantyType/WarrantyTypeManagementPage';
import AccessoryManagementPage from './pages/Maintenance/Accessory/AccessoryManagementPage';
import BillingDetailsPage from './pages/Billing/BillingDetailsPage';
import CreateInvoicePage from './pages/Billing/CreateInvoicePage';
import ReportsPage from './pages/Reports/ReportsPage';
import UserEntryReportPage from './pages/Reports/UserEntryReportPage';
import EmployeeDetailsPage from './pages/EmployeeDetails/EmployeeDetails';
import EmployeeProfilePage from './pages/EmployeeDetails/EmployeeProfilePage';
import UserDetailsPage from './pages/UserDetails/UserDetailsPage';
import UserProfilePage from './pages/UserDetails/UserProfilePage';
import VendorDetailsPage from './pages/VendorDetails/VendorDetailsPage';
import VendorProfilePage from './pages/VendorDetails/VendorProfilePage';
import ProfilePage from './pages/Profile/ProfilePage';
import EnquiriesPage from './pages/Enquiries/EnquiriesPage';

//auth context
import { useAuth } from './contexts/AuthContext';

// Access
import Can from './access/Can';
import GlobalNotificationPopup from './components/GlobalNotificationPopup';
import GlobalLoading from './components/GlobalLoading';

function App() {
  const { isAuthenticated, user, logout } = useAuth();
  return (
    <GlobalLoadingProvider>
      <BrowserRouter>
        <TabNavigationProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
            <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
            <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />} />

            {/* Authenticated Routes with Sidebar & TabBar */}
            <Route element={<Can  mode="redirect" />}>
            
              <Route element={<AppLayout />}>

                {/* Common Authenticated Routes (Accessible by all roles) */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />

                {/* Ticket detail — any authenticated user */}
                <Route path="/tickets/:id" element={<TicketDetailPage />} />

                {/* Feature-gated routes — roles from FEATURES in access/featureAccess.js */}
                <Route element={<Can feature="enquiries" mode="redirect" />}>
                  <Route path="/tickets/new" element={<NewTicketPage />} />
                  <Route path="/enquiries" element={<EnquiriesPage />} />
                </Route>

                <Route element={<Can feature="inventory" mode="redirect" />}>
                  <Route path="/inventory" element={<Navigate to="/inventory/products" replace />} />
                  <Route path="/inventory/products" element={<ProductListPage />} />
                  <Route path="/inventory/prices" element={<PartPricesPage />} />
                  <Route path="/inventory/in-stock" element={<InStockPartsPage />} />
                  <Route path="/inventory/ticket-parts" element={<TicketPartsListPage />} />
                  <Route path="/inventory/orders" element={<PartsOrdersPage />} />
                  <Route path="/inventory/orders/:orderId" element={<PartsOrderDetailPage />} />
                </Route>

                <Route element={<Can feature="diagnosis" mode="redirect" />}>
                  <Route path="/diagnosis" element={<DiagnosisPage />} />
                </Route>

                <Route element={<Can feature="billing" mode="redirect" />}>
                  <Route path="/billing" element={<Navigate to="/billing/billing-details" replace />} />
                  <Route path="/billing/billing-details" element={<BillingDetailsPage />} />
                  <Route path="/billing/create" element={<CreateInvoicePage />} />
                </Route>
                 
                <Route element={<Can feature="maintenance" mode="redirect" />}>
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
                  <Route path="/maintenance/sla-policy" element={<SlaPolicyManagementPage />} />
                  <Route path="/maintenance/ticket-type" element={<TicketTypeManagementPage />} />
                  <Route path="/maintenance/referred-category" element={<ReferredCategoryManagementPage />} />
                  <Route path="/maintenance/warranty-type" element={<WarrantyTypeManagementPage />} />
                  <Route path="/maintenance/accessories" element={<AccessoryManagementPage />} />

                  <Route path="/maintenance/:section" element={<Box sx={{ p: 3 }}>Maintenance Section (WIP)</Box>} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/reports/user-entry" element={<UserEntryReportPage />} />
                  <Route path="/reports/device" element={<DeviceManagementPage />} />
                  <Route path="/employees" element={<EmployeeDetailsPage />} />
                  <Route path="/employees/:id" element={<EmployeeProfilePage />} />
                  <Route path="/users" element={<UserDetailsPage />} />
                  <Route path="/users/:id" element={<UserProfilePage />} />
                  <Route path="/vendors" element={<VendorDetailsPage />} />
                  <Route path="/vendors/:id" element={<VendorProfilePage />} />
                  <Route path="/customers" element={<Box sx={{ p: 3 }}>Customers Page (WIP)</Box>} />
                  <Route path="/settings" element={<Box sx={{ p: 3 }}>Settings Page (WIP)</Box>} />
                  <Route path="/support" element={<Box sx={{ p: 3 }}>Support Desk (WIP)</Box>} />
                </Route>

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
