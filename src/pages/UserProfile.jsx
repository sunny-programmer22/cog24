import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient.js'

export default function UserProfile() {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()
      setProfile(data)
    }

    const fetchPosts = async () => {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
      setPosts(data || [])
    }

    Promise.all([fetchProfile(), fetchPosts()]).finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div>
        <h1 className="page-title">Profile</h1>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Loading...
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div>
        <h1 className="page-title">Profile</h1>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Cadet not found.
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="card profile-header">
        <img
          className="profile-header-avatar"
          src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || '?')}&background=2c2e32&color=e4e6ea&size=80`}
          alt={profile.full_name}
        />
        <div className="profile-header-info">
          <h2>{profile.full_name}</h2>
          {profile.bio && <p>{profile.bio}</p>}
          <div className="profile-stats">
            {profile.rank && <span><strong>Rank:</strong> {profile.rank}</span>}
            {profile.squad && <span><strong>Squad:</strong> {profile.squad}</span>}
            <span><strong>Posts:</strong> {posts.length}</span>
          </div>
        </div>
      </div>

      <h3 style={{ marginBottom: 16, fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
        Activity Stream
      </h3>

      {posts.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          No posts yet.
        </div>
      )}

      {posts.map((post) => (
        <div key={post.id} className="card post-card">
          <p>{post.content}</p>
          <div className="post-meta">
            {new Date(post.created_at).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  )
}
