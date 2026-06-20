import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

function IconBag() {
  return <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
}

function IconUsers() {
  return <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
}

function IconBox() {
  return <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
}

function IconAlert() {
  return <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ products: 0, customers: 0, orders: 0, lowStock: 0, revenue: 0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [p, c, o] = await Promise.all([
          api.listProducts(),
          api.listCustomers(),
          api.listOrders()
        ])
        
        const lowStock = p.filter(product => product.stock < 10).length
        const rev = o.reduce((sum, order) => sum + Number(order.total_amount), 0)
        
        setStats({
          products: p.length,
          customers: c.length,
          orders: o.length,
          lowStock,
          revenue: rev
        })
        
        setCustomers(c)
        // Sort orders by ID descending (assuming larger ID is newer) to get recent 5
        const sortedOrders = [...o].sort((a, b) => b.id - a.id).slice(0, 5)
        setRecentOrders(sortedOrders)
      } catch (e) {
        console.error("Dashboard failed to load", e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const customerName = (id) => customers.find((c) => c.id === id)?.name || `#${id}`

  if (loading) {
    return (
      <div>
        <h2 className="mb-4">Dashboard</h2>
        <div className="grid-cols-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="kpi-card" style={{ height: 110 }}>
               <div style={{ background: 'var(--bg-surface-hover)', height: 20, width: '50%', borderRadius: 4, marginBottom: 8 }}></div>
               <div style={{ background: 'var(--bg-surface-hover)', height: 32, width: '30%', borderRadius: 4 }}></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-4">Overview</h2>
      
      <div className="grid-cols-4">
        <div className="kpi-card">
          <div className="kpi-title">
            <span style={{ color: 'var(--accent)' }}><IconBag /></span> Total Revenue
          </div>
          <div className="kpi-value">${stats.revenue.toFixed(2)}</div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-title">
            <span style={{ color: 'var(--primary)' }}><IconBox /></span> Total Products
          </div>
          <div className="kpi-value">{stats.products}</div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-title">
            <span style={{ color: 'var(--success-text)' }}><IconUsers /></span> Total Customers
          </div>
          <div className="kpi-value">{stats.customers}</div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-title">
            <span style={{ color: 'var(--warning-text)' }}><IconAlert /></span> Low Stock Items
          </div>
          <div className="kpi-value">{stats.lowStock}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Recent Orders</h3>
        </div>
        {recentOrders.length === 0 ? (
          <div className="empty-state">
            <IconBag className="empty-icon" />
            <p>No recent orders found.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.id}>
                    <td>
                      <span style={{ fontWeight: 500 }}>#{o.id}</span>
                    </td>
                    <td>
                      <div className="user-cell">
                        <div className="avatar">{customerName(o.customer_id).charAt(0).toUpperCase()}</div>
                        <span className="user-cell-name">{customerName(o.customer_id)}</span>
                      </div>
                    </td>
                    <td className="text-muted">{o.items.reduce((s, it) => s + it.quantity, 0)} units</td>
                    <td>
                      <span className={`badge ${o.status === 'Completed' ? 'success' : o.status === 'Pending' ? 'warning' : 'info'}`}>
                        {o.status || 'Processed'}
                      </span>
                    </td>
                    <td className="text-right font-medium">${Number(o.total_amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
