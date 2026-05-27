import { useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (error) setError(error.message)
    }

    setLoading(false)
  }

  function toggleMode() {
    setIsLogin((p) => !p)
    setError('')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><span>COG</span>24</div>
        <h2 className="auth-heading">{isLogin ? 'Sign In' : 'Create Account'}</h2>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              className="input"
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          )}
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          {error && <div className="auth-error">{error}</div>}

          <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <button className="auth-toggle" onClick={toggleMode}>
          {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
