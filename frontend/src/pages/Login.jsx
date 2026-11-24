
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'

const API = 'http://localhost:3001/api'
const CAMPUS_IMAGE = '/stamford-campus.png'

const DASHBOARD_ROUTES = {
  admin: '/admin',
  advisor: '/advisor',
  student: '/student',
}

const ACCOUNT_ROLES = [
  { name: 'Admin', icon: 'shield' },
  { name: 'Advisor', icon: 'user' },
  { name: 'Student', icon: 'graduation' },
]

// =========================================
// REUSABLE ICON COMPONENT
// =========================================

function Icon({ name, size = 20, className = '' }) {
  const paths = {
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 6 9 7 9-7" />
      </>
    ),

    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        <path d="M12 14v3" />
      </>
    ),

    eye: (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),

    eyeOff: (
      <>
        <path d="M3 3l18 18" />
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
        <path d="M9.9 5.2A11 11 0 0 1 12 5c6 0 10 7 10 7a15 15 0 0 1-3 3.7" />
        <path d="M6.2 6.2C3.5 8 2 12 2 12s4 7 10 7a10 10 0 0 0 4.5-1" />
      </>
    ),

    graduation: (
      <>
        <path d="M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c4 3 8 3 12 0v-5" />
        <path d="M22 10v6" />
      </>
    ),

    shield: (
      <>
        <path d="M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),

    user: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
      </>
    ),

    arrow: (
      <path d="M5 12h14M13 6l6 6-6 6" />
    ),

    alert: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6M12 16h.01" />
      </>
    ),
  }

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

// =========================================
// LOGIN PAGE
// =========================================

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // =========================================
  // LOGIN FUNCTION
  // =========================================

  const handleLogin = async event => {
    event.preventDefault()

    if (loading) return

    const cleanEmail = email.trim()

    setError('')

    if (!cleanEmail || !password) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        `${API}/auth/login`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            email: cleanEmail,
            password,
          }),
        }
      )

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.message ||
          'Invalid email or password.'
        )
      }

      if (!data?.user || !data?.token) {
        throw new Error(
          'Invalid account information. Please try again.'
        )
      }

      // Store account information

      const loggedInUser = {
        id: data.user.id || data.user._id,

        name: data.user.name || '',

        email: data.user.email || cleanEmail,

        role: data.user.role,

        studentId: data.user.studentId || '',

        advisorId: data.user.advisorId || '',

        active: data.user.active ?? true,
      }

      // Validate account role

      const destination =
        DASHBOARD_ROUTES[loggedInUser.role]

      if (!destination || !loggedInUser.id) {
        throw new Error(
          'This account does not have valid dashboard access.'
        )
      }

      // Save authenticated session

      localStorage.setItem('token', data.token)

      localStorage.setItem(
        'user',
        JSON.stringify(loggedInUser)
      )

      // Redirect to the correct dashboard

      navigate(destination, { replace: true })

    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'Unable to connect to the server. Please try again.'
          : err.message || 'Something went wrong.'
      )

    } finally {
      setLoading(false)
    }
  }

  // =========================================
  // LOGIN INTERFACE
  // =========================================

  return (
    <main className="stamford-login">

      {/* UNIVERSITY CAMPUS */}

      <section
        className="stamford-campus"
        aria-label="Stamford International University"
        style={{
          backgroundImage: `
            linear-gradient(
              180deg,
              rgba(10, 28, 65, 0.72),
              rgba(10, 28, 65, 0.12),
              rgba(10, 28, 65, 0.92)
            ),
            url("${CAMPUS_IMAGE}")
          `,
        }}
      >

        {/* UNIVERSITY BRAND */}

        <div className="stamford-brand">

          <div className="stamford-brand-icon">
            <Icon name="graduation" size={32} />
          </div>

          <div>
            <h2>STAMFORD</h2>
            <p>INTERNATIONAL UNIVERSITY</p>
          </div>

        </div>

        {/* CAMPUS DESCRIPTION */}

        <div className="campus-caption">

          <span className="campus-label">
            YOUR ACADEMIC JOURNEY
          </span>

          <h1>
            Your future<br />
            starts here.
          </h1>

          <p>
            Manage your courses, explore opportunities
            and take the next step toward your
            academic success.
          </p>

          <div className="campus-divider" />

          <span className="campus-footer">
            Stamford International University · Thailand
          </span>

        </div>

      </section>

      {/* LOGIN SECTION */}

      <section className="stamford-login-side">

        {/* PORTAL HEADER */}

        <div className="stamford-topbar">

          <span className="portal-indicator" />

          Academic Services Portal

        </div>

        <div className="stamford-form-wrapper">

          {/* FORM HEADING */}

          <div className="stamford-form-heading">

            <span className="stamford-eyebrow">
              COURSE REGISTRATION SYSTEM
            </span>

            <h1>Welcome back.</h1>

            <p>
              Sign in to access your university
              dashboard.
            </p>

          </div>

          {/* LOGIN FORM */}

          <form
            className="stamford-form"
            onSubmit={handleLogin}
            aria-busy={loading}
          >

            {/* EMAIL ADDRESS */}

            <div className="stamford-field">

              <label htmlFor="email">
                Email address
              </label>

              <div className="stamford-input-wrapper">

                <Icon
                  name="mail"
                  className="stamford-input-icon"
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  placeholder="Enter your email"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  disabled={loading}
                  required
                  onChange={event => {
                    setEmail(event.target.value)
                    setError('')
                  }}
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div className="stamford-field">

              <label htmlFor="password">
                Password
              </label>

              <div className="stamford-input-wrapper">

                <Icon
                  name="lock"
                  className="stamford-input-icon"
                />

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={password}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                  required
                  onChange={event => {
                    setPassword(event.target.value)
                    setError('')
                  }}
                />

                <button
                  type="button"
                  className="password-toggle"
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                  aria-pressed={showPassword}
                  onClick={() =>
                    setShowPassword(previous => !previous)
                  }
                >

                  <Icon
                    name={
                      showPassword
                        ? 'eyeOff'
                        : 'eye'
                    }
                  />

                </button>

              </div>

            </div>

            {/* ERROR MESSAGE */}

            {error && (

              <div
                className="stamford-login-error"
                role="alert"
              >

                <Icon name="alert" size={18} />

                <span>{error}</span>

              </div>

            )}

            {/* SIGN IN BUTTON */}

            <button
              type="submit"
              className="stamford-signin"
              disabled={loading}
            >

              <span>
                {loading
                  ? 'Signing in...'
                  : 'Sign in'}
              </span>

              {loading ? (

                <span
                  className="signin-spinner"
                  aria-hidden="true"
                />

              ) : (

                <Icon name="arrow" />

              )}

            </button>

          </form>

          {/* AUTHORIZED ACCOUNT ROLES */}

          <div className="stamford-role-section">

            <div className="stamford-separator">

              <span />

              <p>Authorized access for</p>

              <span />

            </div>

            <div className="stamford-roles">

              {ACCOUNT_ROLES.map(role => (

                <div
                  className="stamford-role"
                  key={role.name}
                >

                  <Icon name={role.icon} />

                  <span>{role.name}</span>

                </div>

              ))}

            </div>

          </div>

          {/* SUPPORT INFORMATION */}

          <p className="stamford-help">
            Need assistance? Contact your
            university administrator.
          </p>

        </div>

        {/* UNIVERSITY FOOTER */}

        <footer className="stamford-login-footer">

          © {new Date().getFullYear()} Stamford
          International University. All rights reserved.

        </footer>

      </section>

    </main>
  )
}

export default Login
