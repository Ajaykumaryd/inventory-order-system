import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import Alert from './Alert.jsx'

function IconPlus() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [customerId, setCustomerId] = useState('')
  const [lines, setLines] = useState([{ product_id: '', quantity: 1 }])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  const load = async () => {
    try {
      const [o, p, c] = await Promise.all([
        api.listOrders(), api.listProducts(), api.listCustomers(),
      ])
      // Sort orders descending by ID
      setOrders(o.sort((a,b) => b.id - a.id))
      setProducts(p)
      setCustomers(c)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const productById = (id) => products.find((p) => String(p.id) === String(id))
  const customerById = (id) => customers.find((c) => String(c.id) === String(id))

  const setLine = (i, field, value) => {
    const next = [...lines]
    next[i] = { ...next[i], [field]: value }
    setLines(next)
  }
  const addLine = () => setLines([...lines, { product_id: '', quantity: 1 }])
  const removeLine = (i) => setLines(lines.filter((_, idx) => idx !== i))

  const estimatedTotal = lines.reduce((sum, l) => {
    const p = productById(l.product_id)
    return sum + (p ? Number(p.price) * Number(l.quantity || 0) : 0)
  }, 0)

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    const items = lines
      .filter((l) => l.product_id && Number(l.quantity) > 0)
      .map((l) => ({ product_id: Number(l.product_id), quantity: Number(l.quantity) }))
    if (!customerId) return setError('Please select a customer')
    if (items.length === 0) return setError('Add at least one product line')

    try {
      const order = await api.createOrder({ customer_id: Number(customerId), items })
      setSuccess(`Order #${order.id} placed successfully — Total $${Number(order.total_amount).toFixed(2)}`)
      setCustomerId('')
      setLines([{ product_id: '', quantity: 1 }])
      setIsCreating(false)
      load() 
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 style={{ marginBottom: 0 }}>Orders</h2>
        {!isCreating && (
          <button className="btn btn-primary" onClick={() => setIsCreating(true)}>
            <IconPlus /> Create Order
          </button>
        )}
      </div>

      <Alert error={error} success={success} />

      {isCreating && (
        <div className="card">
          <div className="card-header">
            <h3>New Order</h3>
          </div>
          <form onSubmit={submit}>
            <div className="form-group mb-4">
              <label>Select Customer <span className="text-muted">*</span></label>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
                <option value="" disabled>Search or select a customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label>Order Items <span className="text-muted">*</span></label>
              <div style={{ background: 'var(--bg-surface-hover)', padding: '16px', borderRadius: '8px', marginTop: '8px' }}>
                {lines.map((line, i) => {
                  const p = productById(line.product_id)
                  const lineTotal = p ? Number(p.price) * Number(line.quantity || 0) : 0
                  return (
                    <div className="order-line" key={i}>
                      <div className="form-group">
                        <select value={line.product_id} onChange={(e) => setLine(i, 'product_id', e.target.value)} style={{ marginBottom: 0 }}>
                          <option value="" disabled>Select a product...</option>
                          {products.map((pr) => (
                            <option key={pr.id} value={pr.id} disabled={pr.stock <= 0}>
                              {pr.name} — ${Number(pr.price).toFixed(2)} ({pr.stock} in stock)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input type="number" min="1" value={line.quantity} onChange={(e) => setLine(i, 'quantity', e.target.value)} style={{ marginBottom: 0 }} />
                        </div>
                      </div>
                      <div className="form-group" style={{ alignItems: 'flex-end' }}>
                        <button type="button" className="btn btn-ghost" style={{ padding: 8, color: 'var(--text-muted)' }} onClick={() => removeLine(i)} disabled={lines.length === 1}>
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      
                      {p && Number(line.quantity) > p.stock && (
                        <div className="text-sm" style={{ gridColumn: '1 / -1', color: 'var(--error-text)', marginTop: -8 }}>
                          Insufficient stock. Only {p.stock} available.
                        </div>
                      )}
                      {p && (
                        <div className="text-sm text-muted" style={{ gridColumn: '1 / -1', marginTop: -8 }}>
                          Subtotal: ${lineTotal.toFixed(2)}
                        </div>
                      )}
                    </div>
                  )
                })}
                <button type="button" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 12px' }} onClick={addLine}>
                  <IconPlus /> Add Another Item
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                Total: ${estimatedTotal.toFixed(2)}
              </div>
              <div className="flex gap-3">
                <button type="button" className="btn btn-ghost" onClick={() => { setIsCreating(false); setLines([{product_id:'', quantity:1}]); setCustomerId('') }}>Cancel</button>
                <button className="btn btn-primary" type="submit">Place Order</button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="empty-state">
            <div className="spinner" style={{ width: 32, height: 32, border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p style={{ fontWeight: 500, color: 'var(--text-main)' }}>No orders yet</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order Details</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const customer = customerById(o.customer_id)
                  return (
                    <tr key={o.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>#{o.id}</div>
                        <div className="text-xs text-muted">Created recently</div>
                      </td>
                      <td>
                        <div className="user-cell">
                          <div className="user-cell-info">
                            <span className="user-cell-name">{customer?.name || `Customer #${o.customer_id}`}</span>
                            {customer && <span className="user-cell-email text-muted">{customer.email}</span>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge neutral">{o.items.reduce((s, it) => s + it.quantity, 0)} units</span>
                      </td>
                      <td>
                        <span className={`badge ${o.status === 'Completed' ? 'success' : o.status === 'Pending' ? 'warning' : 'info'}`}>
                          {o.status || 'Processed'}
                        </span>
                      </td>
                      <td className="text-right font-medium">${Number(o.total_amount).toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
