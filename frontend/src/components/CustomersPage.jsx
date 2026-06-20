import { useEffect, useState, useMemo } from 'react'
import { api } from '../api/client.js'
import Alert from './Alert.jsx'

const EMPTY = { name: '', email: '', phone: '', address: '' }

function IconPlus() {
  return <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
}

function IconSearch() {
  return <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [search, setSearch] = useState('')

  const load = async () => {
    try {
      setCustomers(await api.listCustomers())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const reset = () => { setForm(EMPTY); setEditingId(null); setIsFormOpen(false); }

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    try {
      const payload = {
        name: form.name,
        phone: form.phone || null,
        address: form.address || null,
      }
      if (editingId) {
        await api.updateCustomer(editingId, payload)
        setSuccess('Customer updated successfully')
      } else {
        await api.createCustomer({ ...payload, email: form.email })
        setSuccess('Customer created successfully')
      }
      reset()
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  const edit = (c) => {
    setEditingId(c.id)
    setForm({ name: c.name, email: c.email, phone: c.phone || '', address: c.address || '' })
    setIsFormOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const remove = async (id) => {
    if (!confirm('Are you sure you want to delete this customer?')) return
    setError(''); setSuccess('')
    try {
      await api.deleteCustomer(id)
      setSuccess('Customer deleted successfully')
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.email.toLowerCase().includes(search.toLowerCase())
    )
  }, [customers, search])

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 style={{ marginBottom: 0 }}>Customers</h2>
        {!isFormOpen && (
          <button className="btn btn-primary" onClick={() => setIsFormOpen(true)}>
            <IconPlus /> Add Customer
          </button>
        )}
      </div>
      
      <Alert error={error} success={success} />

      {isFormOpen && (
        <div className="card">
          <div className="card-header">
            <h3>{editingId ? 'Edit Customer Profile' : 'New Customer Profile'}</h3>
          </div>
          <form onSubmit={submit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name <span className="text-muted">*</span></label>
                <input name="name" value={form.name} onChange={change} placeholder="Jane Doe" required />
              </div>
              <div className="form-group">
                <label>Email Address <span className="text-muted">*</span></label>
                <input name="email" type="email" value={form.email} onChange={change} placeholder="jane@example.com" required disabled={!!editingId} />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input name="phone" value={form.phone} onChange={change} placeholder="+1 (555) 000-0000" />
              </div>
            </div>
            <div className="form-group mb-4">
              <label>Shipping Address</label>
              <input name="address" value={form.address} onChange={change} placeholder="123 Main St, City, Country" />
            </div>
            <div className="flex justify-between items-center mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
              <button type="button" className="btn btn-ghost" onClick={reset}>Cancel</button>
              <button className="btn btn-primary" type="submit">
                {editingId ? 'Save Changes' : 'Create Customer'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="flex justify-between items-center mb-4 gap-4">
          <div style={{ position: 'relative', maxWidth: '300px', width: '100%' }}>
            <span style={{ position: 'absolute', left: 10, top: 9, color: 'var(--text-muted)' }}><IconSearch /></span>
            <input 
              type="text" 
              placeholder="Search customers..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              style={{ paddingLeft: 36, marginBottom: 0 }}
            />
          </div>
          <span className="text-muted text-sm">{filteredCustomers.length} customers</span>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="spinner" style={{ width: 32, height: 32, border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p style={{ fontWeight: 500, color: 'var(--text-main)' }}>No customers found</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact Info</th>
                  <th>Address</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="user-cell">
                        <div className="avatar">{c.name.charAt(0).toUpperCase()}</div>
                        <div className="user-cell-info">
                          <span className="user-cell-name">{c.name}</span>
                          <span className="user-cell-email text-muted">{c.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-muted">{c.phone || '—'}</span>
                    </td>
                    <td>
                      <span className="text-muted">{c.address || '—'}</span>
                    </td>
                    <td className="text-right">
                      <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={() => edit(c)}>Edit</button>
                      <button className="btn btn-danger" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={() => remove(c.id)}>Delete</button>
                    </td>
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
