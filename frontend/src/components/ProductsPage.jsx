import { useEffect, useState, useMemo } from 'react'
import { api } from '../api/client.js'
import Alert from './Alert.jsx'

const EMPTY = { sku: '', name: '', description: '', price: '', stock: '' }

function IconPlus() {
  return <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
}

function IconSearch() {
  return <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
}

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [search, setSearch] = useState('')

  const load = async () => {
    try {
      setProducts(await api.listProducts())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const reset = () => { 
    setForm(EMPTY); 
    setEditingId(null); 
    setIsFormOpen(false); 
  }

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        price: Number(form.price),
        stock: Number(form.stock),
      }
      if (editingId) {
        await api.updateProduct(editingId, payload)
        setSuccess('Product updated successfully')
      } else {
        await api.createProduct({ ...payload, sku: form.sku })
        setSuccess('Product created successfully')
      }
      reset()
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  const edit = (p) => {
    setEditingId(p.id)
    setForm({ sku: p.sku, name: p.name, description: p.description || '', price: p.price, stock: p.stock })
    setIsFormOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const remove = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    setError(''); setSuccess('')
    try {
      await api.deleteProduct(id)
      setSuccess('Product deleted successfully')
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.sku.toLowerCase().includes(search.toLowerCase())
    )
  }, [products, search])

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 style={{ marginBottom: 0 }}>Products</h2>
        {!isFormOpen && (
          <button className="btn btn-primary" onClick={() => setIsFormOpen(true)}>
            <IconPlus /> Add Product
          </button>
        )}
      </div>

      <Alert error={error} success={success} />

      {isFormOpen && (
        <div className="card">
          <div className="card-header">
            <h3>{editingId ? 'Edit Product' : 'Create New Product'}</h3>
          </div>
          <form onSubmit={submit}>
            <div className="form-grid">
              <div className="form-group">
                <label>SKU <span className="text-muted">*</span></label>
                <input name="sku" value={form.sku} onChange={change} placeholder="e.g. PRD-001" required disabled={!!editingId} />
              </div>
              <div className="form-group">
                <label>Product Name <span className="text-muted">*</span></label>
                <input name="name" value={form.name} onChange={change} placeholder="e.g. Wireless Mouse" required />
              </div>
              <div className="form-group">
                <label>Unit Price ($) <span className="text-muted">*</span></label>
                <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={change} placeholder="0.00" required />
              </div>
              <div className="form-group">
                <label>Stock Quantity <span className="text-muted">*</span></label>
                <input name="stock" type="number" min="0" step="1" value={form.stock} onChange={change} placeholder="0" required />
              </div>
            </div>
            <div className="form-group mb-4">
              <label>Description</label>
              <textarea name="description" value={form.description} onChange={change} rows="2" placeholder="Brief details about the product..." />
            </div>
            <div className="flex justify-between items-center mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
              <button type="button" className="btn btn-ghost" onClick={reset}>Cancel</button>
              <button className="btn btn-primary" type="submit">
                {editingId ? 'Save Changes' : 'Create Product'}
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
              placeholder="Search products..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              style={{ paddingLeft: 36, marginBottom: 0 }}
            />
          </div>
          <span className="text-muted text-sm">{filteredProducts.length} items</span>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="spinner" style={{ width: 32, height: 32, border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p style={{ fontWeight: 500, color: 'var(--text-main)' }}>No products found</p>
            <p className="text-sm">Try adjusting your search or add a new product.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th className="text-right">Price</th>
                  <th>Inventory</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                      {p.description && <div className="text-muted" style={{ fontSize: 12, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{p.description}</div>}
                    </td>
                    <td>
                      <code style={{ background: 'var(--bg-surface-hover)', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem' }}>{p.sku}</code>
                    </td>
                    <td className="text-right font-medium">${Number(p.price).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${p.stock > 10 ? 'success' : p.stock > 0 ? 'warning' : 'error'}`}>
                        {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                      </span>
                    </td>
                    <td className="text-right">
                      <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={() => edit(p)}>Edit</button>
                      <button className="btn btn-danger" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={() => remove(p.id)}>Delete</button>
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
