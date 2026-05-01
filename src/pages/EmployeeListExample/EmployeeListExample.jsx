import { useState, useCallback, useMemo } from 'react';
import { Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import { Tabs } from '../../stereotype/Tabs';
import { List } from '../../stereotype/AbstractList';

/* ════════════════════════════════════════════════════════════════
   MOCK DATA — one dataset per tab
   ════════════════════════════════════════════════════════════════ */

const employeeRows = [
  { id: 1, name: 'Aarav Sharma', email: 'aarav.sharma@mays.com', department: 'Engineering', role: 'Senior Developer', status: 'Active', performance: 92, joined: '2023-01-15' },
  { id: 2, name: 'Priya Patel', email: 'priya.patel@mays.com', department: 'Design', role: 'UI/UX Lead', status: 'Active', performance: 88, joined: '2023-03-22' },
  { id: 3, name: 'Rohan Gupta', email: 'rohan.gupta@mays.com', department: 'Marketing', role: 'Growth Manager', status: 'On Leave', performance: 74, joined: '2022-08-10' },
  { id: 4, name: 'Sneha Verma', email: 'sneha.verma@mays.com', department: 'Engineering', role: 'Backend Engineer', status: 'Active', performance: 85, joined: '2023-06-05' },
  { id: 5, name: 'Kiran Reddy', email: 'kiran.reddy@mays.com', department: 'Product', role: 'Product Manager', status: 'Active', performance: 96, joined: '2021-11-01' },
  { id: 6, name: 'Ananya Das', email: 'ananya.das@mays.com', department: 'HR', role: 'Recruiter', status: 'Inactive', performance: 42, joined: '2024-01-20' },
  { id: 7, name: 'Vikram Singh', email: 'vikram.singh@mays.com', department: 'Engineering', role: 'DevOps Lead', status: 'Active', performance: 91, joined: '2022-04-12' },
  { id: 8, name: 'Meera Iyer', email: 'meera.iyer@mays.com', department: 'Finance', role: 'Financial Analyst', status: 'Active', performance: 67, joined: '2023-09-18' },
  { id: 9, name: 'Arjun Nair', email: 'arjun.nair@mays.com', department: 'Engineering', role: 'Frontend Developer', status: 'Active', performance: 78, joined: '2024-02-01' },
  { id: 10, name: 'Divya Menon', email: 'divya.menon@mays.com', department: 'Design', role: 'Graphic Designer', status: 'On Leave', performance: 53, joined: '2023-07-14' },
  { id: 11, name: 'Rahul Joshi', email: 'rahul.joshi@mays.com', department: 'Sales', role: 'Account Executive', status: 'Active', performance: 81, joined: '2022-12-03' },
  { id: 12, name: 'Neha Kumar', email: 'neha.kumar@mays.com', department: 'Engineering', role: 'QA Engineer', status: 'Active', performance: 70, joined: '2023-05-25' },
];

const productRows = [
  { id: 1, product: 'MacBook Pro 16"', sku: 'MBP-16-M3', category: 'Laptops', supplier: 'Apple Inc.', stock: 142, price: '₹2,49,900', status: 'In Stock' },
  { id: 2, product: 'Dell UltraSharp 27"', sku: 'DU-27-4K', category: 'Monitors', supplier: 'Dell Technologies', stock: 87, price: '₹45,990', status: 'In Stock' },
  { id: 3, product: 'Logitech MX Master 3S', sku: 'LG-MXM-3S', category: 'Peripherals', supplier: 'Logitech', stock: 320, price: '₹8,995', status: 'In Stock' },
  { id: 4, product: 'Herman Miller Aeron', sku: 'HM-AERON-B', category: 'Furniture', supplier: 'Herman Miller', stock: 0, price: '₹1,34,500', status: 'Out of Stock' },
  { id: 5, product: 'Sony WH-1000XM5', sku: 'SN-WH-XM5', category: 'Audio', supplier: 'Sony India', stock: 56, price: '₹26,990', status: 'In Stock' },
  { id: 6, product: 'Samsung 990 Pro 2TB', sku: 'SS-990P-2T', category: 'Storage', supplier: 'Samsung', stock: 15, price: '₹17,499', status: 'Low Stock' },
  { id: 7, product: 'Cisco Meraki MR46', sku: 'CS-MR46-AP', category: 'Networking', supplier: 'Cisco Systems', stock: 23, price: '₹89,000', status: 'In Stock' },
  { id: 8, product: 'Keychron Q1 Pro', sku: 'KC-Q1P-BK', category: 'Peripherals', supplier: 'Keychron', stock: 0, price: '₹15,999', status: 'Out of Stock' },
];

const orderRows = [
  { id: 1, orderId: 'ORD-2024-001', customer: 'TCS Ltd.', items: 45, total: '₹11,24,550', date: '2024-12-01', status: 'Delivered', priority: 'Normal' },
  { id: 2, orderId: 'ORD-2024-002', customer: 'Infosys BPM', items: 120, total: '₹2,99,88,000', date: '2024-12-03', status: 'Processing', priority: 'High' },
  { id: 3, orderId: 'ORD-2024-003', customer: 'Wipro Digital', items: 8, total: '₹3,67,920', date: '2024-12-05', status: 'Shipped', priority: 'Normal' },
  { id: 4, orderId: 'ORD-2024-004', customer: 'HCL Tech', items: 200, total: '₹49,98,000', date: '2024-12-06', status: 'Pending', priority: 'Urgent' },
  { id: 5, orderId: 'ORD-2024-005', customer: 'Tech Mahindra', items: 15, total: '₹6,74,850', date: '2024-12-08', status: 'Delivered', priority: 'Low' },
  { id: 6, orderId: 'ORD-2024-006', customer: 'L&T Infotech', items: 60, total: '₹27,59,400', date: '2024-12-10', status: 'Processing', priority: 'High' },
  { id: 7, orderId: 'ORD-2024-007', customer: 'Mindtree', items: 30, total: '₹7,49,700', date: '2024-12-11', status: 'Cancelled', priority: 'Normal' },
];

/* ════════════════════════════════════════════════════════════════
   LIST CONFIGS — one per tab type
   ════════════════════════════════════════════════════════════════ */

const employeeConfig = {
  title: 'Team Members',
  subtitle: `${employeeRows.length} employees across all departments`,
  rows: employeeRows,
  columns: [
    { field: 'name', headerName: 'Employee', renderType: 'avatar', flex: 1.4, minWidth: 200 },
    { field: 'email', headerName: 'Email', renderType: 'link', flex: 1.3, minWidth: 200 },
    { field: 'department', headerName: 'Department', renderType: 'badge', flex: 1, minWidth: 130 },
    { field: 'role', headerName: 'Role', flex: 1.1, minWidth: 150 },
    { field: 'status', headerName: 'Status', renderType: 'chip', chipColorMap: { Active: 'success', Inactive: 'error', 'On Leave': 'warning' }, flex: 0.8, minWidth: 110 },
    { field: 'performance', headerName: 'Performance', renderType: 'progress', flex: 1, minWidth: 150 },
    { field: 'joined', headerName: 'Joined', flex: 0.8, minWidth: 110 },
  ],
  checkboxSelection: true,
  searchable: true,
  searchPlaceholder: 'Search employees by name, email, dept…',
  pagination: { pageSize: 10, pageSizeOptions: [5, 10, 25] },
  height: 480,
  actions: [
    { label: 'Add Employee', icon: <AddIcon />, variant: 'contained', color: 'primary', onClick: () => alert('Add Employee clicked!') },
  ],
};

const productConfig = {
  title: 'Product Inventory',
  subtitle: `${productRows.length} products tracked`,
  rows: productRows,
  columns: [
    { field: 'product', headerName: 'Product', renderType: 'avatar', flex: 1.4, minWidth: 200 },
    { field: 'sku', headerName: 'SKU', renderType: 'badge', flex: 0.9, minWidth: 130 },
    { field: 'category', headerName: 'Category', flex: 0.9, minWidth: 120 },
    { field: 'supplier', headerName: 'Supplier', renderType: 'link', flex: 1.1, minWidth: 160 },
    { field: 'stock', headerName: 'Stock Level', renderType: 'progress', flex: 1, minWidth: 140,
      // Normalize stock to a 0-100 scale for the progress renderer
      valueGetter: (value) => Math.min(Math.round((value / 350) * 100), 100),
    },
    { field: 'price', headerName: 'Price', flex: 0.8, minWidth: 110 },
    { field: 'status', headerName: 'Status', renderType: 'chip', chipColorMap: { 'In Stock': 'success', 'Out of Stock': 'error', 'Low Stock': 'warning' }, flex: 0.8, minWidth: 120 },
  ],
  searchable: true,
  searchPlaceholder: 'Search products, SKU, supplier…',
  pagination: { pageSize: 10, pageSizeOptions: [5, 10, 25] },
  height: 480,
  actions: [
    { label: 'Add Product', icon: <AddIcon />, variant: 'contained', color: 'primary', onClick: () => alert('Add Product clicked!') },
  ],
};

const orderConfig = {
  title: 'Purchase Orders',
  subtitle: `${orderRows.length} orders this quarter`,
  rows: orderRows,
  columns: [
    { field: 'orderId', headerName: 'Order ID', renderType: 'link', flex: 1, minWidth: 150 },
    { field: 'customer', headerName: 'Customer', renderType: 'avatar', flex: 1.3, minWidth: 180 },
    { field: 'items', headerName: 'Items', flex: 0.5, minWidth: 80 },
    { field: 'total', headerName: 'Total', flex: 0.9, minWidth: 130 },
    { field: 'date', headerName: 'Date', flex: 0.8, minWidth: 120 },
    { field: 'status', headerName: 'Status', renderType: 'chip', chipColorMap: { Delivered: 'success', Processing: 'info', Shipped: 'primary', Pending: 'warning', Cancelled: 'error' }, flex: 0.8, minWidth: 120 },
    { field: 'priority', headerName: 'Priority', renderType: 'chip', chipColorMap: { Urgent: 'error', High: 'warning', Normal: 'info', Low: 'success' }, flex: 0.7, minWidth: 100 },
  ],
  checkboxSelection: true,
  searchable: true,
  searchPlaceholder: 'Search orders, customers…',
  pagination: { pageSize: 10, pageSizeOptions: [5, 10, 25] },
  height: 480,
};

/* ─── Map tab IDs to configs ─── */
const CONFIG_MAP = {
  employees: employeeConfig,
  products: productConfig,
  orders: orderConfig,
};

/* ════════════════════════════════════════════════════════════════
   INITIAL TABS
   ════════════════════════════════════════════════════════════════ */

const INITIAL_TABS = [
  { id: 'employees', label: 'Employees', icon: <PeopleAltOutlinedIcon />, removable: false },
  { id: 'products',  label: 'Products',  icon: <InventoryOutlinedIcon />, removable: false },
  { id: 'orders',    label: 'Orders',    icon: <ShoppingCartOutlinedIcon />, removable: true },
];

/* Counter for dynamically added tabs */
let nextReportId = 1;

/* ════════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ════════════════════════════════════════════════════════════════ */

export default function EmployeeListExample() {
  const [tabs, setTabs] = useState(INITIAL_TABS);
  const [activeTab, setActiveTab] = useState('employees');

  /* ── Build a report-style list config for dynamic tabs ── */
  const buildReportConfig = useCallback((tabId, label) => ({
    title: label,
    subtitle: 'Auto-generated report view',
    rows: employeeRows.slice(0, 5).map((row, i) => ({
      ...row,
      id: `${tabId}-${i}`,
      performance: Math.round(Math.random() * 100),
    })),
    columns: [
      { field: 'name', headerName: 'Name', renderType: 'avatar', flex: 1.3, minWidth: 180 },
      { field: 'department', headerName: 'Department', renderType: 'badge', flex: 1, minWidth: 130 },
      { field: 'status', headerName: 'Status', renderType: 'chip', chipColorMap: { Active: 'success', Inactive: 'error', 'On Leave': 'warning' }, flex: 0.8, minWidth: 110 },
      { field: 'performance', headerName: 'Score', renderType: 'progress', flex: 1, minWidth: 140 },
    ],
    searchable: true,
    pagination: { pageSize: 5, pageSizeOptions: [5, 10] },
    height: 380,
  }), []);

  /* ── Dynamic configs for added tabs ── */
  const [dynamicConfigs, setDynamicConfigs] = useState({});

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  const handleTabClose = useCallback((tabId) => {
    setTabs((prev) => {
      const filtered = prev.filter((t) => t.id !== tabId);
      // If closing the active tab, switch to the previous one
      if (tabId === activeTab && filtered.length > 0) {
        const closedIndex = prev.findIndex((t) => t.id === tabId);
        const newIndex = Math.min(closedIndex, filtered.length - 1);
        setActiveTab(filtered[newIndex].id);
      }
      return filtered;
    });
    setDynamicConfigs((prev) => {
      const next = { ...prev };
      delete next[tabId];
      return next;
    });
  }, [activeTab]);

  const handleTabAdd = useCallback(() => {
    const id = `report-${nextReportId}`;
    const label = `Report ${nextReportId}`;
    nextReportId++;

    const newTab = {
      id,
      label,
      icon: <AssessmentOutlinedIcon />,
      removable: true,
    };

    setTabs((prev) => [...prev, newTab]);
    setDynamicConfigs((prev) => ({
      ...prev,
      [id]: buildReportConfig(id, label),
    }));
    setActiveTab(id);
  }, [buildReportConfig]);

  /* ── Resolve which config to render ── */
  const currentConfig = useMemo(() => {
    return CONFIG_MAP[activeTab] || dynamicConfigs[activeTab] || null;
  }, [activeTab, dynamicConfigs]);

  return (
    <Box>
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onTabClose={handleTabClose}
        onTabAdd={handleTabAdd}
        showAddButton
        addTooltip="Add report tab"
      />

      <Box sx={{ mt: 2.5 }}>
        {currentConfig ? (
          <List config={currentConfig} />
        ) : (
          <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
            No content for this tab.
          </Box>
        )}
      </Box>
    </Box>
  );
}
