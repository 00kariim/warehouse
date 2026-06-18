import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/ProductsPage'
import WarehousesPage from './pages/WarehousesPage'
import MovementsPage from './pages/MovementsPage'
import LowStockPage from './pages/LowStockPage'
import AnomaliesPage from './pages/AnomaliesPage'
import AiChatPage from './pages/AiChatPage'
import UsersPage from './pages/UsersPage'

const App = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />

    {/* All authenticated users */}
    <Route element={<ProtectedRoute />}>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/warehouses" element={<WarehousesPage />} />
        <Route path="/movements" element={<MovementsPage />} />

        {/* ADMIN + MANAGER */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']} />}>
          <Route path="/low-stock" element={<LowStockPage />} />
          <Route path="/anomalies" element={<AnomaliesPage />} />
          <Route path="/ai-chat" element={<AiChatPage />} />
        </Route>

        {/* ADMIN only */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/users" element={<UsersPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Route>
  </Routes>
)

export default App
