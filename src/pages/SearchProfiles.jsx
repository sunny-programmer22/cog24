import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient.js'

export default function SearchProfiles() {
  const [query, setQuery] = useState('')
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const debounceRef = useRef(null)

  const search = useCallback(async (q) => {
    if (!q.trim()) {
      setProfiles([])
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .ilike('full_name', `%${q}%`)
      .limit(20)

    if (!error) setProfiles(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 250)
    return () => clearTimeout(debounceRef.current)
  }, [query, search])

  return (
    <div>
      <h1 className="page-title">Search Profiles</h1>

      <div className="search-input-wrap">
        <input
          className="input"
          type="text"
          placeholder="Search cadets by name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {loading && (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Searching...
        </div>
      )}

      {!loading && query.trim() && profiles.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          No cadets found.
        </div>
      )}

      {profiles.map((profile) => (
        <div
          key={profile.id}
          className="card card-clickable profile-card"
          onClick={() => navigate(`/profile/${profile.id}`)}
        >
          <img
            className="profile-avatar"
            src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || '?')}&background=2c2e32&color=e4e6ea`}
            alt={profile.full_name}
          />
          <div>
            <div className="profile-name">{profile.full_name}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
