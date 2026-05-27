import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import PostComments from '../components/PostComments.jsx'

export default function Feed() {
  const [posts, setPosts] = useState([])
  const [content, setContent] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    const { data: postsData } = await supabase
      .from('posts')
      .select('*, profiles(full_name, avatar_url)')
      .order('created_at', { ascending: false })

    if (!postsData) { setPosts([]); return }

    const { data: { user } } = await supabase.auth.getUser()
    const postIds = postsData.map((p) => p.id)

    const [{ data: likeRows }, { data: userLikeRows }] = await Promise.all([
      supabase.from('likes').select('post_id').in('post_id', postIds),
      user
        ? supabase.from('likes').select('post_id').in('post_id', postIds).eq('user_id', user.id)
        : Promise.resolve({ data: [] }),
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

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim() || uploading) return

    setUploading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }

    let mediaUrl = null
    let mediaType = null

    if (file) {
      const ext = file.name.split('.').pop().toLowerCase()
      mediaType = ['mp4', 'mov', 'webm'].includes(ext) ? 'video' : 'image'
      const filePath = `posts/${user.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('cog24-media')
        .upload(filePath, file)
      if (uploadError) { setUploading(false); return }

      const { data: { publicUrl } } = supabase.storage.from('cog24-media').getPublicUrl(filePath)
      mediaUrl = publicUrl
    }

    await supabase.from('posts').insert({
      user_id: user.id,
      content: content.trim(),
      media_url: mediaUrl,
      media_type: mediaType,
    })

    setContent('')
    setFile(null)
    if (fileRef.current) fileRef.current.value = ''
    await fetchPosts()
    setUploading(false)
  }

  return (
    <div>
      <h1 className="page-title">Feed</h1>

      <form className="card feed-composer" onSubmit={handleSubmit}>
        <textarea
          className="textarea"
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="feed-composer-actions">
          <label className="btn btn-ghost file-label">
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              style={{ display: 'none' }}
              onChange={(e) => setFile(e.target.files[0])}
            />
            {file ? file.name : 'Attach media'}
          </label>
          <button className="btn btn-primary" type="submit" disabled={uploading || !content.trim()}>
            {uploading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>

      {posts.map((post) => (
        <div key={post.id} className="card feed-post">
          <div className="feed-post-header">
            <img
              className="feed-post-avatar"
              src={post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.profiles?.full_name || '?')}&background=2c2e32&color=e4e6ea`}
              alt={post.profiles?.full_name}
            />
            <div>
              <div className="feed-post-author">{post.profiles?.full_name || 'Unknown'}</div>
              <div className="feed-post-time">{new Date(post.created_at).toLocaleString()}</div>
            </div>
          </div>

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
          </div>

          {post.comments_open && (
            <PostComments postId={post.id} open={post.comments_open} />
          )}
        </div>
      ))}
    </div>
  )
}
