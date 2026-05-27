import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient.js'

export default function Settings() {
  const [user, setUser] = useState(null)
  const [signingOut, setSigningOut] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null))
  }, [])

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div>
      <h1 className="page-title">Settings</h1>

      <div className="card settings-card">
        <h3 className="settings-section-title">Account</h3>

        <div className="settings-row">
          <span className="settings-label">Email</span>
          <span className="settings-value">{user?.email || '—'}</span>
        </div>

        <div className="settings-row">
          <span className="settings-label">Created</span>
          <span className="settings-value">
            {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
          </span>
        </div>

        <hr className="settings-divider" />

        <button className="btn settings-signout" onClick={handleSignOut} disabled={signingOut}>
          {signingOut ? 'Signing out...' : 'Sign Out from COG24'}
        </button>
      </div>
    </div>
  )
}
