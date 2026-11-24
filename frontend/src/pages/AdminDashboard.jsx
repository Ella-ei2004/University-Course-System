
import { useEffect, useState } from 'react'
import '../App.css'

const API = 'http://localhost:3001/api/users'

const initialForm = {
  name: '',
  email: '',
  password: '',
  role: 'student',
  studentId: '',
  advisorId: '',
  active: true,
}

const roles = [
  ['all', 'All Users'],
  ['student', 'Students'],
  ['advisor', 'Advisors'],
  ['admin', 'Administrators'],
]

const navigation = [
  ['dashboard', 'Overview', 'grid'],
  ['all', 'All Users', 'users'],
  ['student', 'Students', 'student'],
  ['advisor', 'Advisors', 'user'],
  ['admin', 'Administrators', 'shield'],
]

const getInitials = (name) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase() || '?'

// SVG ICONS

function Icon({ name }) {
  const paths = {
    grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',

    users: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2 M20 4a4 4 0 0 1 0 8 M22 20v-2a6 6 0 0 0-3-5',

    student: 'M2 9l10-5 10 5-10 5z M6 11v6c4 3 8 3 12 0v-6 M22 9v7',

    user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2',

    shield: 'M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z M9 12l2 2 4-4',

    logout: 'M10 3H4v18h6 M9 12h12 M16 7l5 5-5 5',

    menu: 'M3 6h18 M3 12h18 M3 18h18',

    search: 'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0 M15 15l6 6',

    arrow: 'M5 12h14 M13 6l6 6-6 6',

    plus: 'M12 5v14 M5 12h14',

    refresh: 'M20 7v5h-5 M20 12a8 8 0 1 0-2 6',

    edit: 'M12 20H4v-8L16 0l8 8-12 12 M13 3l8 8',

    trash: 'M3 6h18 M9 6V3h6v3 M6 6l1 15h10l1-15 M10 10v7 M14 10v7',

    close: 'M6 6l12 12 M18 6L6 18',
  }

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}

// API REQUESTS

async function request(path = '', options = {}) {
  const token = localStorage.getItem('token')

  if (!token) {
    throw new Error('Please sign in again.')
  }

  const response = await fetch(API + path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      data?.message ||
      `Request failed (${response.status})`
    )
  }

  return data
}

function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [page, setPage] = useState('dashboard')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('active')
  const [collapsed, setCollapsed] = useState(false)

  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')

  const [admin] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('user') || '{}'
      ) || {}
    } catch {
      return {}
    }
  })

  const adminName = admin.name || 'Administrator'
  const adminInitials = getInitials(adminName)

  // LOAD USERS

  const fetchUsers = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await request()

      if (!Array.isArray(data)) {
        throw new Error('Unexpected user response.')
      }

      setUsers(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (
      !localStorage.getItem('token') ||
      admin.role !== 'admin'
    ) {
      window.location.replace('/login')
      return
    }

    fetchUsers()
  }, [admin.role])

  // CLOSE MODAL WITH ESCAPE

  useEffect(() => {
    if (!modal) return

    const closeModal = event => {
      if (event.key === 'Escape' && !busy) {
        setModal(null)
      }
    }

    window.addEventListener('keydown', closeModal)

    return () =>
      window.removeEventListener('keydown', closeModal)
  }, [modal, busy])

  // LOGOUT

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.replace('/login')
  }

  // USER STATISTICS

  const activeUsers = users.filter(
    user => user.active === true
  )

  const countUsers = role =>
    activeUsers.filter(
      user => role === 'all' || user.role === role
    ).length

  const statistics = [
    {
      id: 'all',
      label: 'All Users',
      icon: 'users',
      color: 'blue',
    },
    {
      id: 'student',
      label: 'Students',
      icon: 'student',
      color: 'purple',
    },
    {
      id: 'advisor',
      label: 'Advisors',
      icon: 'user',
      color: 'green',
    },
    {
      id: 'admin',
      label: 'Administrators',
      icon: 'shield',
      color: 'orange',
    },
  ]

  // SEARCH AND FILTER

  const filteredUsers = users.filter(user => {
    const matchesRole =
      page === 'dashboard' ||
      page === 'all' ||
      user.role === page

    const matchesStatus =
      status === 'all' ||
      (status === 'active'
        ? user.active === true
        : user.active !== true)

    const matchesSearch = [
      user.name,
      user.email,
      user.studentId,
      user.advisorId,
    ].some(value =>
      String(value || '')
        .toLowerCase()
        .includes(search.trim().toLowerCase())
    )

    return (
      matchesRole &&
      matchesStatus &&
      matchesSearch
    )
  })

  // NAVIGATION

  const navigate = nextPage => {
    setPage(nextPage)
    setSearch('')
  }

  const pageTitle =
    page === 'dashboard'
      ? 'People Overview'
      : roles.find(([id]) => id === page)?.[1]

  // OPEN MODAL

  const openModal = (type, user = null) => {
    setForm(
      user
        ? {
            ...initialForm,
            ...user,
            studentId: user.studentId || '',
            advisorId: user.advisorId || '',
            password: '',
          }
        : { ...initialForm }
    )

    setFormError('')
    setSuccess('')
    setModal({ type, user })
  }

  // FORM INPUT

  const handleChange = event => {
    const { name, value } = event.target

    setForm(previous => ({
      ...previous,
      [name]:
        name === 'active'
          ? value === 'true'
          : value,
    }))
  }

  // CREATE OR UPDATE USER

  const handleSave = async event => {
    event.preventDefault()
    setBusy(true)
    setFormError('')

    try {
      const editing = modal.type === 'edit'

      const body = {
        name: form.name.trim(),
        email: form.email.trim(),
        active: form.active,
      }

      if (!body.name) {
        throw new Error('Please enter a name.')
      }

      if (!editing) {
        body.role = form.role
        body.password = form.password
        body.active = true
      } else if (form.password.trim()) {
        body.password = form.password
      }

      if (form.role === 'student') {
        body.studentId = form.studentId.trim()

        if (!body.studentId) {
          throw new Error('Student ID is required.')
        }
      }

      if (form.role === 'advisor') {
        body.advisorId = form.advisorId.trim()

        if (!body.advisorId) {
          throw new Error('Advisor ID is required.')
        }
      }

      await request(
        editing ? `/${modal.user._id}` : '',
        {
          method: editing ? 'PATCH' : 'POST',
          body: JSON.stringify(body),
        }
      )

      setSuccess(
        editing
          ? 'User updated successfully.'
          : 'User created successfully.'
      )

      setModal(null)
      await fetchUsers()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }

  // DELETE USER

  const handleDelete = async () => {
    setBusy(true)
    setFormError('')

    try {
      await request(`/${modal.user._id}`, {
        method: 'DELETE',
      })

      setSuccess('User removed successfully.')
      setModal(null)
      await fetchUsers()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }

  // MAIN DASHBOARD

  return (
    <div
      className={
        collapsed
          ? 'st-layout admin-dashboard st-collapsed'
          : 'st-layout admin-dashboard'
      }
    >

      {/* SIDEBAR */}

      <aside className="st-sidebar">

        <div className="st-brand">

          <div className="st-logo">
            S
          </div>

          <div className="st-brand-text">

            <strong>STAMFORD</strong>

            <small>
              INTERNATIONAL UNIVERSITY
            </small>

          </div>

        </div>

        <div className="st-sidebar-label">
          ADMIN WORKSPACE
        </div>

        <nav className="st-navigation">

          {navigation.map(([id, label, icon]) => (

            <button
              type="button"
              key={id}
              title={label}
              aria-label={label}
              aria-current={
                page === id ? 'page' : undefined
              }
              className={
                page === id
                  ? 'st-nav-item st-nav-active'
                  : 'st-nav-item'
              }
              onClick={() => navigate(id)}
            >

              <Icon name={icon} />

              <span>{label}</span>

            </button>

          ))}

        </nav>

        <div className="st-sidebar-bottom">

          <div className="st-sidebar-profile">

            <div className="st-avatar">
              {adminInitials}
            </div>

            <div className="st-profile-text">

              <strong>{adminName}</strong>

              <small>Admin Account</small>

            </div>

          </div>

          <button
            type="button"
            className="st-nav-item st-logout"
            onClick={handleLogout}
          >

            <Icon name="logout" />

            <span>Sign Out</span>

          </button>

        </div>

      </aside>

      {/* MAIN CONTENT */}

      <main className="st-main">

        {/* TOPBAR */}

        <header className="st-topbar">

          <div className="st-topbar-left">

            <button
              type="button"
              className="st-icon-button"
              aria-label="Toggle sidebar"
              aria-expanded={!collapsed}
              onClick={() =>
                setCollapsed(previous => !previous)
              }
            >

              <Icon name="menu" />

            </button>

            <span>Admin Portal</span>

            <span className="st-breadcrumb">
              /
            </span>

            <strong>{pageTitle}</strong>

          </div>

          <div className="st-topbar-right">

            <span className="st-term-badge">
              Management Workspace
            </span>

            <div className="st-avatar">
              {adminInitials}
            </div>

          </div>

        </header>

        <div className="st-content">

          {/* PAGE HEADING */}

          <div className="st-page-heading">

            <div>

              <p className="st-eyebrow">
                UNIVERSITY ADMINISTRATION
              </p>

              <h1>{pageTitle}</h1>

              <p>
                Manage university accounts and
                access in one place.
              </p>

            </div>

            <button
              type="button"
              className="st-primary-button adm-inline-button"
              onClick={() => openModal('create')}
            >

              <Icon name="plus" />

              Add User

            </button>

          </div>

          {/* NOTIFICATIONS */}

          {success && (

            <div
              className="adm-success"
              role="status"
            >
              {success}
            </div>

          )}

          {error && (

            <div className="st-error" role="alert">

              {error}

              <button
                className="adm-secondary"
                onClick={fetchUsers}
              >
                Retry
              </button>

            </div>

          )}

          {/* OVERVIEW */}

          {page === 'dashboard' && (

            <>

              {/* WELCOME BANNER */}

              <section className="st-welcome">

                <div>

                  <span>
                    UNIVERSITY MANAGEMENT
                  </span>

                  <h2>
                    Welcome back, {adminName}!
                  </h2>

                  <p>
                    Manage students, advisors and
                    administrators through your
                    university management workspace.
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate('all')}
                  >

                    Manage Users

                    <Icon name="arrow" />

                  </button>

                </div>

                <div className="st-welcome-decoration">

                  <Icon name="shield" />

                </div>

              </section>

              {/* STATISTIC CARDS */}

              <div className="st-stat-grid">

                {statistics.map(item => (

                  <button
                    type="button"
                    className="st-stat-card adm-stat-button"
                    key={item.id}
                    onClick={() => navigate(item.id)}
                  >

                    <div
                      className={
                        `st-stat-icon st-${item.color}`
                      }
                    >

                      <Icon name={item.icon} />

                    </div>

                    <p>{item.label}</p>

                    <h2>
                      {loading
                        ? '—'
                        : countUsers(item.id)}
                    </h2>

                    <small className="adm-stat-caption">
                      Active accounts
                    </small>

                  </button>

                ))}

              </div>

            </>

          )}

          {/* USER DIRECTORY */}

          <section className="st-panel">

            <div className="st-panel-heading">

              <div>

                <h2>User Directory</h2>

                <p>
                  {loading
                    ? 'Loading university accounts...'
                    : `${filteredUsers.length} matching accounts`}
                </p>

              </div>

              <button
                type="button"
                className="adm-secondary adm-inline-button"
                onClick={fetchUsers}
                disabled={loading}
              >

                <Icon name="refresh" />

                Refresh

              </button>

            </div>

            {/* SEARCH AND FILTER */}

            <div className="adm-tools">

              <div className="adm-search">

                <Icon name="search" />

                <input
                  type="search"
                  aria-label="Search users"
                  placeholder="Search name, email or ID..."
                  value={search}
                  onChange={event =>
                    setSearch(event.target.value)
                  }
                />

              </div>

              <select
                aria-label="Account status"
                value={status}
                onChange={event =>
                  setStatus(event.target.value)
                }
              >

                <option value="active">
                  Active accounts
                </option>

                <option value="inactive">
                  Inactive accounts
                </option>

                <option value="all">
                  All statuses
                </option>

              </select>

            </div>

            {/* USERS TABLE */}

            {loading ? (

              <div className="st-empty">

                <div className="st-spinner" />

                <p>Loading accounts...</p>

              </div>

            ) : filteredUsers.length === 0 ? (

              <div className="st-empty">

                <Icon name="users" />

                <h3>No accounts found</h3>

                <p>
                  Try another name or filter.
                </p>

              </div>

            ) : (

              <div className="st-table-wrap">

                <table className="st-table adm-user-table">

                  <thead>

                    <tr>
                      <th>Account</th>
                      <th>Role</th>
                      <th>University ID</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>

                  </thead>

                  <tbody>

                    {filteredUsers.map(user => (

                      <tr key={user._id}>

                        <td>

                          <div className="adm-person">

                            <div className="st-avatar">

                              {getInitials(user.name)}

                            </div>

                            <div>

                              <strong>
                                {user.name}
                              </strong>

                              <small>
                                {user.email}
                              </small>

                            </div>

                          </div>

                        </td>

                        <td>

                          <span className={
                            `st-badge ${
                              user.role === 'admin'
                                ? 'st-orange'
                                : user.role === 'advisor'
                                  ? 'st-purple'
                                  : 'st-blue'
                            }`
                          }>

                            {user.role === 'admin'
                              ? 'Administrator'
                              : user.role === 'advisor'
                                ? 'Advisor'
                                : 'Student'}

                          </span>

                        </td>

                        <td>

                          {user.studentId ||
                            user.advisorId ||
                            '—'}

                        </td>

                        <td>

                          <span className={
                            user.active
                              ? 'st-badge st-green'
                              : 'st-badge st-gray'
                          }>

                            {user.active
                              ? 'Active'
                              : 'Inactive'}

                          </span>

                        </td>

                        <td>

                          <div className="adm-actions">

                            <button
                              type="button"
                              className="adm-edit-button"
                              onClick={() =>
                                openModal('edit', user)
                              }
                            >

                              <Icon name="edit" />

                              Edit

                            </button>

                            <button
                              type="button"
                              className="adm-delete-button"
                              onClick={() =>
                                openModal('delete', user)
                              }
                            >

                              <Icon name="trash" />

                              Delete

                            </button>

                          </div>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            )}

          </section>

          {/* FOOTER */}

          <footer className="st-footer">

            Stamford International University
            · Course Registration System

          </footer>

        </div>

      </main>

      {/* ACCOUNT MODAL */}

      {modal && (

        <div
          className="adm-overlay"
          onClick={() =>
            !busy && setModal(null)
          }
        >

          <section
            className="adm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="adm-modal-title"
            onClick={event =>
              event.stopPropagation()
            }
          >

            <header className="adm-modal-header">

              <div>

                <h2 id="adm-modal-title">

                  {modal.type === 'delete'
                    ? 'Remove Account'
                    : modal.type === 'edit'
                      ? 'Edit Account'
                      : 'Create Account'}

                </h2>

                <p>

                  {modal.type === 'delete'
                    ? 'Confirm account removal.'
                    : 'Manage university account details.'}

                </p>

              </div>

              <button
                type="button"
                className="st-icon-button"
                aria-label="Close"
                disabled={busy}
                onClick={() => setModal(null)}
              >

                <Icon name="close" />

              </button>

            </header>

            {formError && (

              <div className="st-error" role="alert">
                {formError}
              </div>

            )}

            {modal.type === 'delete' ? (

              <>

                <div className="adm-delete-message">

                  <p>
                    Are you sure you want to remove{' '}
                    <strong>{modal.user.name}</strong>?
                  </p>

                </div>

                <footer>

                  <button
                    type="button"
                    className="adm-secondary"
                    disabled={busy}
                    onClick={() => setModal(null)}
                  >

                    Cancel

                  </button>

                  <button
                    type="button"
                    className="adm-danger"
                    disabled={busy}
                    onClick={handleDelete}
                  >

                    {busy
                      ? 'Removing...'
                      : 'Remove Account'}

                  </button>

                </footer>

              </>

            ) : (

              <form onSubmit={handleSave}>

                <label>

                  Full Name

                  <input
                    autoFocus
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    required
                  />

                </label>

                <label>

                  Email Address

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    required
                  />

                </label>

                <label>

                  {modal.type === 'edit'
                    ? 'New Password (Optional)'
                    : 'Password'}

                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Minimum 8 characters"
                    minLength={8}
                    required={modal.type === 'create'}
                    autoComplete="new-password"
                  />

                </label>

                <label>

                  Account Role

                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    disabled={modal.type === 'edit'}
                  >

                    <option value="student">
                      Student
                    </option>

                    <option value="advisor">
                      Advisor
                    </option>

                    <option value="admin">
                      Administrator
                    </option>

                  </select>

                </label>

                {form.role === 'student' && (

                  <label>

                    Student ID

                    <input
                      name="studentId"
                      value={form.studentId}
                      onChange={handleChange}
                      placeholder="Enter student ID"
                      required
                    />

                  </label>

                )}

                {form.role === 'advisor' && (

                  <label>

                    Advisor ID

                    <input
                      name="advisorId"
                      value={form.advisorId}
                      onChange={handleChange}
                      placeholder="Enter advisor ID"
                      required
                    />

                  </label>

                )}

                {modal.type === 'edit' && (

                  <label>

                    Account Status

                    <select
                      name="active"
                      value={String(form.active)}
                      onChange={handleChange}
                    >

                      <option value="true">
                        Active
                      </option>

                      <option value="false">
                        Inactive
                      </option>

                    </select>

                  </label>

                )}

                <footer>

                  <button
                    type="button"
                    className="adm-secondary"
                    disabled={busy}
                    onClick={() => setModal(null)}
                  >

                    Cancel

                  </button>

                  <button
                    type="submit"
                    className="st-primary-button"
                    disabled={busy}
                  >

                    {busy
                      ? 'Saving...'
                      : 'Save Account'}

                  </button>

                </footer>

              </form>

            )}

          </section>

        </div>

      )}

    </div>
  )
}

export default AdminDashboard
