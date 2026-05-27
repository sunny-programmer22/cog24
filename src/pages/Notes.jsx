import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient.js'

export default function Notes() {
  const [notes, setNotes] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    fetchNotes()
  }, [])

  async function fetchNotes() {
    const { data } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false })
    setNotes(data || [])
  }

  function handleFileDrop(e) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer?.files?.[0] || e.target.files?.[0]
    if (f && f.type.startsWith('image/')) setFile(f)
  }

  function handleDragOver(e) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !file || uploading) return

    setUploading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setUploading(false)
      return
    }

    const ext = file.name.split('.').pop()
    const filePath = `notes/${user.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('cog24-media')
      .upload(filePath, file)

    if (uploadError) {
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('cog24-media')
      .getPublicUrl(filePath)

    const { error: insertError } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        photo_url: publicUrl,
      })

    if (!insertError) {
      setTitle('')
      setDescription('')
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
      await fetchNotes()
    }

    setUploading(false)
  }

  return (
    <div>
      <h1 className="page-title">My Notes</h1>

      <form className="card notes-form" onSubmit={handleSubmit}>
        <input
          className="input"
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="textarea"
          placeholder="Detailed description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div
          className={`drop-zone${dragging ? ' dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleFileDrop}
          onClick={() => fileRef.current?.click()}
        >
          {file ? (
            <div>
              <span>{file.name}</span>
              <img className="drop-zone-preview" src={URL.createObjectURL(file)} alt="preview" />
            </div>
          ) : (
            <span>Drag & drop an image here, or click to browse</span>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileDrop}
        />

        <button className="btn btn-primary" type="submit" disabled={uploading || !title.trim() || !file}>
          {uploading ? 'Uploading...' : 'Save Note'}
        </button>
      </form>

      <div className="gallery-grid">
        {notes.map((note) => (
          <div key={note.id} className="note-card">
            <div style={{ position: 'relative' }}>
              <img src={note.photo_url} alt={note.title} />
              <div className="note-overlay">
                <span>View Details</span>
              </div>
            </div>
            <div className="note-card-body">
              <h4>{note.title}</h4>
              {note.description && <p>{note.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
