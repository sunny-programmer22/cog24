import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient.js'

export default function UpNext() {
  const [statuses, setStatuses] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchStatuses()
  }, [])

  async function fetchStatuses() {
    setLoading(true)
    const { data, error } = await supabase
      .from('view_up_next')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setStatuses(data || [])
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || submitting) return

    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSubmitting(false)
      return
    }

    const { error } = await supabase
      .from('up_next')
      .insert({ user_id: user.id, status: trimmed })

    if (!error) {
      setText('')
      await fetchStatuses()
    }
    setSubmitting(false)
  }

  return (
    <div>
      <h1 className="page-title">Up Next</h1>

      <form className="upnext-composer" onSubmit={handleSubmit}>
        <input
          className="input"
          type="text"
          placeholder="What's coming up in the next 24h?"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={submitting || !text.trim()}>
          {submitting ? 'Posting...' : 'Post'}
        </button>
      </form>

      {loading && (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading...</div>
      )}

      {!loading && statuses.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          No status updates in the last 24 hours.
        </div>
      )}

      {statuses.map((status) => (
        <div key={status.id} className="card status-item">
          <img
            className="status-avatar"
            src={status.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(status.full_name || '?')}&background=2c2e32&color=e4e6ea`}
            alt={status.full_name}
          />
          <div className="status-body">
            <div className="status-text">
              <strong>{status.full_name}</strong>: {status.status}
            </div>
            <div className="status-time">
              {new Date(status.created_at).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
