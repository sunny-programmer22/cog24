import { useLocation, useNavigate } from 'react-router-dom'

const links = [
  { path: '/', label: 'Feed', icon: '◉' },
  { path: '/search', label: 'Search Profiles', icon: '◎' },
  { path: '/up-next', label: 'Up Next', icon: '◈' },
  { path: '/notes', label: 'My Notes', icon: '◇' },
  { path: '/profile', label: 'My Profile', icon: '⊙' },
  { path: '/settings', label: 'Settings', icon: '⚙' },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    if (path === '/profile') return location.pathname === '/profile'
    return location.pathname.startsWith(path)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span>COG</span>24
      </div>
      <nav className="sidebar-nav">
        {links.map((link) => (
          <button
            key={link.path}
            className={`sidebar-link${isActive(link.path) ? ' active' : ''}`}
            onClick={() => navigate(link.path)}
          >
            <span className="sidebar-icon">{link.icon}</span>
            <span>{link.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
