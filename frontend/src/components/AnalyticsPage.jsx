import { useState } from 'react'
import { VegaLite } from 'react-vega'
import { api } from '../api/client.js'
import Alert from './Alert.jsx'

const EXAMPLES = [
  'What were the total sales per month?',
  'Top 5 products by revenue',
  'How many orders does each customer have?',
  'Current stock level by product',
]

function IconSparkles() {
  return <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
}

export default function AnalyticsPage() {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const run = async (q) => {
    const question = (q ?? prompt).trim()
    if (!question) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await api.analyticsQuery(question)
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const submit = (e) => {
    e.preventDefault()
    run()
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h2 style={{ marginBottom: 0 }}>Analytics</h2>
        <span className="badge info">AI Powered</span>
      </div>
      
      <Alert error={error} success="" />

      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '24px', marginTop: '16px' }}>
          <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', background: 'var(--info-bg)', color: 'var(--accent)', marginBottom: '16px' }}>
            <IconSparkles />
          </div>
          <h3>Ask your data anything</h3>
          <p className="text-muted text-sm" style={{ maxWidth: '400px', margin: '0 auto' }}>
            Type a question in plain English, and we'll instantly generate a chart or dashboard visualizing the answer.
          </p>
        </div>

        <form onSubmit={submit} style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ position: 'relative' }}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows="2"
              placeholder="e.g. What were the total sales for last month?"
              style={{
                width: '100%',
                padding: '16px 48px 16px 16px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
                resize: 'none',
                fontSize: '1rem'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit(e);
                }
              }}
            />
            <button 
              type="submit" 
              disabled={loading || !prompt.trim()}
              style={{
                position: 'absolute',
                right: '12px',
                bottom: '16px',
                background: loading || !prompt.trim() ? 'var(--bg-surface-hover)' : 'var(--primary)',
                color: loading || !prompt.trim() ? 'var(--text-muted)' : 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              {loading ? (
                <div className="spinner" style={{ width: 16, height: 16, border: '2px solid transparent', borderTopColor: 'currentColor', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              ) : (
                'Generate'
              )}
            </button>
          </div>
        </form>

        <div style={{ maxWidth: '600px', margin: '24px auto 0' }}>
          <p className="text-xs text-muted mb-4 text-center">SUGGESTED QUESTIONS</p>
          <div className="flex" style={{ flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                style={{
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '999px',
                  padding: '6px 14px',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
                disabled={loading}
                onClick={() => { setPrompt(ex); run(ex) }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--text-main)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

      {result && (
        <div className="card" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          <div className="card-header">
            <h3>Results</h3>
          </div>
          {result.explanation && (
            <p className="text-muted" style={{ marginTop: 0, marginBottom: '24px', padding: '16px', background: 'var(--bg-app)', borderRadius: '8px', borderLeft: '4px solid var(--accent)' }}>
              {result.explanation}
            </p>
          )}
          {result.data.length === 0 ? (
            <div className="empty-state">
              <svg className="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p>No data matched that question.</p>
            </div>
          ) : (
            <div style={{ width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
              <VegaLite spec={result.vega_spec} actions={false} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
