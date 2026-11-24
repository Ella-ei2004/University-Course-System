import { useNavigate } from 'react-router-dom'

function Header({ title, userName, role }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    navigate('/login')
  }

  return (
    <div className="dashboard-header-content">
      <div>
        <div className="portal-label">UNIVERSITY PORTAL</div>
        <h1>{title}</h1>

        <p>
          {userName === role ? role : `${userName} — ${role}`}
        </p>
      </div>

      <button
        type="button"
        className="logout-button"
        onClick={handleLogout}
      >
        Logout
      </button>
    </div>
  )
}

export default Header