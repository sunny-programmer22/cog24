import { useState, useEffect, useRef } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient.js'
import Sidebar from './components/Sidebar.jsx'
import Auth from './pages/Auth.jsx'
import Feed from './pages/Feed.jsx'
import SearchProfiles from './pages/SearchProfiles.jsx'
import UserProfile from './pages/UserProfile.jsx'
import UpNext from './pages/UpNext.jsx'
import Notes from './pages/Notes.jsx'
import Profile from './pages/Profile.jsx'
import Settings from './pages/Settings.jsx'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const prevSession = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session && !prevSession.current) {
      navigate('/', { replace: true })
    }
    prevSession.current = !!session
  }, [session, navigate])

  if (loading) return null

  if (!session) return <Auth />

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/search" element={<SearchProfiles />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:id" element={<UserProfile />} />
          <Route path="/up-next" element={<UpNext />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}
