import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import PostComments from '../components/PostComments.jsx'

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [batchRoll, setBatchRoll] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileRef = useRef(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [profileResult, postsResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])

    if (profileResult.data) {
      setProfile(profileResult.data)
      setFullName(profileResult.data.full_name || '')
      setBio(profileResult.data.bio || '')
      setBatchRoll(profileResult.data.batch_roll || '')
    }

    const postsData = postsResult.data || []
    const postIds = postsData.map((p) => p.id)

    const [{ data: likeRows }, { data: userLikeRows }] = await Promise.all([
      supabase.from('likes').select('post_id').in('post_id', postIds),
      supabase.from('likes').select('post_id').in('post_id', postIds).eq('user_id', user.id),
    ])

    const countMap = {}
    likeRows?.forEach((l) => { countMap[l.post_id] = (countMap[l.post_id] || 0) + 1 })
    const userLikeSet = new Set(userLikeRows?.map((l) => l.post_id))

    setPosts(
      postsData.map((p) => ({
        ...p,
        like_count: countMap[p.id] || 0,
        user_liked: userLikeSet.has(p.id),
        comments_open: false,
      }))
    )

    setLoading(false)
  }

  async function handleLike(post) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (post.user_liked) {
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id)
    } else {
      await supabase.from('likes').insert({ post_id: post.id, user_id: user.id })
    }

    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, user_liked: !p.user_liked, like_count: p.like_count + (p.user_liked ? -1 : 1) }
          : p
      )
    )
  }

  function toggleComments(postId) {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments_open: !p.comments_open } : p))
    )
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    let avatar_url = profile?.avatar_url

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const filePath = `avatars/${user.id}/${Date.now()}.${ext}`
      await supabase.storage.from('cog24-media').upload(filePath, avatarFile)
      const { data: { publicUrl } } = supabase.storage.from('cog24-media').getPublicUrl(filePath)
      avatar_url = publicUrl
    }

    const updates = { full_name: fullName, bio, batch_roll: batchRoll, avatar_url }
    const { data } = await supabase.from('profiles').update(updates).eq('id', user.id).select().single()

    if (data) {
      setProfile(data)
      setAvatarFile(null)
      setEditing(false)
    }
    setSaving(false)
  }

  async function handleDeletePost(postId) {
    if (!window.confirm('Delete this post permanently?')) return
    await supabase.from('posts').delete().eq('id', postId)
    setPosts((p) => p.filter((post) => post.id !== postId))
  }

  if (loading) {
    return (
      <div>
        <h1 className="page-title">My Profile</h1>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="page-title">My Profile</h1>

      <div className="card profile-header">
        <div style={{ position: 'relative' }}>
          <img
            className="profile-header-avatar"
            src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || '?')}&background=2c2e32&color=e4e6ea&size=80`}
            alt={fullName}
          />
        </div>
        <div className="profile-header-info" style={{ flex: 1 }}>
          {editing ? (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" />
              <input className="input" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" />
              <input className="input" value={batchRoll} onChange={(e) => setBatchRoll(e.target.value)} placeholder="Batch Roll" />
              <label className="btn btn-ghost file-label" style={{ alignSelf: 'flex-start' }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileRef} onChange={(e) => setAvatarFile(e.target.files[0])} />
                {avatarFile ? avatarFile.name : 'Change avatar'}
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <>
              <h2>{fullName}</h2>
              {bio && <p>{bio}</p>}
              {batchRoll && <div className="profile-stats"><span><strong>Batch Roll:</strong> {batchRoll}</span></div>}
              <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={() => setEditing(true)}>Edit Details</button>
            </>
          )}
        </div>
      </div>

      <h3 style={{ margin: '24px 0 16px', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
        My Posts
      </h3>

      {posts.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No posts yet.</div>
      )}

      {posts.map((post) => (
        <div key={post.id} className="card feed-post">
          <p className="feed-post-content">{post.content}</p>
          {post.media_url && post.media_type === 'video' && (
            <video controls className="feed-post-media"><source src={post.media_url} /></video>
          )}
          {post.media_url && post.media_type === 'image' && (
            <img className="feed-post-media" src={post.media_url} alt="" />
          )}

          <div className="post-toolbar">
            <button
              className={`toolbar-btn${post.user_liked ? ' liked' : ''}`}
              onClick={() => handleLike(post)}
            >
              {post.user_liked ? '♥' : '♡'} {post.like_count}
            </button>
            <button
              className="toolbar-btn"
              onClick={() => toggleComments(post.id)}
            >
              💬 Comment
            </button>
            <button
              className="toolbar-btn toolbar-btn--delete"
              onClick={() => handleDeletePost(post.id)}
            >
              🗑 Delete
            </button>
          </div>

          {post.comments_open && (
            <PostComments postId={post.id} open={post.comments_open} />
          )}
        </div>
      ))}
    </div>
  )
}
