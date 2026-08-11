import { useState } from 'react'
import { AuthProvider } from '../lib/auth/useAuth.jsx'
import JuraganDashboardLayout from '../components/dashboard/JuraganDashboardLayout.jsx'

// Active Juragan Admin Modules
import InventoryManagement from './admin/InventoryManagement.jsx'
import SalesOrders from './admin/SalesOrders.jsx'
import WarehousePackingView from './admin/WarehousePackingView.jsx'
import B2BProspects from './admin/B2BProspects.jsx'
import ExpensesPayroll from './admin/ExpensesPayroll.jsx'
import ProductPricing from './admin/ProductPricing.jsx'
import InvoicePrinter from './admin/InvoicePrinter.jsx'
import Packing3DSimulator from './admin/Packing3DSimulator.jsx'
import DocumentHub from './admin/DocumentHub.jsx'

function AdminDashboardContent({ onLogout }) {
  const [activeTab, setActiveTab] = useState('inventory_batches')

  return (
    <JuraganDashboardLayout
      activeTab={activeTab}
      onNavigate={setActiveTab}
      onLogout={onLogout}
    >
      {activeTab === 'inventory_batches' && <InventoryManagement />}
      {activeTab === 'sales_orders'      && <SalesOrders />}
      {activeTab === 'warehouse_packing' && <WarehousePackingView />}
      {activeTab === 'b2b_prospects'     && <B2BProspects />}
      {activeTab === 'expenses_payroll'  && <ExpensesPayroll />}
      {activeTab === 'product_pricing'   && <ProductPricing />}
      {activeTab === 'invoice_printer'   && <InvoicePrinter />}
      {activeTab === 'packing_3d'        && <Packing3DSimulator />}
      {activeTab === 'document_hub'      && <DocumentHub />}
    </JuraganDashboardLayout>
  )
}

export default function AdminDashboard({ onLogout }) {
  return (
    <AuthProvider>
      <AdminDashboardContent onLogout={onLogout} />
    </AuthProvider>
  )
}
