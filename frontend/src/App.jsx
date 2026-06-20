import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import DashboardPage from './components/DashboardPage.jsx'
import ProductsPage from './components/ProductsPage.jsx'
import CustomersPage from './components/CustomersPage.jsx'
import OrdersPage from './components/OrdersPage.jsx'
import AnalyticsPage from './components/AnalyticsPage.jsx'

function Icon({ name }) {
  if (name === 'dashboard') return <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
  if (name === 'products') return <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
  if (name === 'customers') return <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
  if (name === 'orders') return <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
  if (name === 'analytics') return <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
  return null;
}

export default function App() {
  const linkClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')
  
  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <div className="app-sidebar-header">
          <h1>
            <svg style={{ width: 24, height: 24, color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            InventoryOS
          </h1>
        </div>
        <nav className="app-sidebar-nav">
          <NavLink to="/dashboard" className={linkClass}><Icon name="dashboard" /> Dashboard</NavLink>
          <NavLink to="/products" className={linkClass}><Icon name="products" /> Products</NavLink>
          <NavLink to="/customers" className={linkClass}><Icon name="customers" /> Customers</NavLink>
          <NavLink to="/orders" className={linkClass}><Icon name="orders" /> Orders</NavLink>
          <NavLink to="/analytics" className={linkClass}><Icon name="analytics" /> Analytics</NavLink>
        </nav>
      </aside>

      <main className="app-main">
        <header className="app-header">
          <div style={{ flex: 1 }}></div>
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ fontWeight: 500 }}>Admin User</span>
            <div className="avatar" style={{ background: 'var(--accent)', color: 'white', border: 'none' }}>A</div>
          </div>
        </header>
        
        <div className="app-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
