import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient.js'

export default function PostComments({ postId, open }) {
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (open) fetchComments()
  }, [open, postId])

  async function fetchComments() {
    setLoading(true)
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(full_name, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    setComments(data || [])
    setLoading(false)
  }

  async function handleSend(e) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || sending) return

    setSending(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSending(false); return }

    const { data } = await supabase
      .from('comments')
      .insert({ post_id: postId, user_id: user.id, content: trimmed })
      .select('*, profiles(full_name, avatar_url)')
      .single()

    if (data) {
      setComments((prev) => [...prev, data])
      setText('')
    }
    setSending(false)
  }

  return (
    <div className="comments-section">
      {loading && (
        <div className="comments-loading">Loading comments...</div>
      )}

      {!loading && comments.length === 0 && (
        <div className="comments-empty">No comments yet.</div>
      )}

      {comments.map((c) => (
        <div key={c.id} className="comment-item">
          <img
            className="comment-avatar"
            src={c.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.profiles?.full_name || '?')}&background=2c2e32&color=e4e6ea`}
            alt={c.profiles?.full_name}
          />
          <div className="comment-body">
            <span className="comment-author">{c.profiles?.full_name || 'Unknown'}</span>
            <p className="comment-text">{c.content}</p>
          </div>
        </div>
      ))}

      <form className="comment-form" onSubmit={handleSend}>
        <input
          className="input comment-input"
          type="text"
          placeholder="Write a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="comment-send" type="submit" disabled={sending || !text.trim()}>
          ➤
        </button>
      </form>
    </div>
  )
}
