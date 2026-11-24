
import { useEffect, useState } from 'react'
import '../App.css'

const API = 'http://localhost:3001/api'

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

const initialOffering = {
  courseId: '',
  term: '2026-1',
  section: 1,
  day: 'Monday',
  startTime: '09:00',
  endTime: '11:00',
  room: '',
  instructor: '',
  seats: 30,
  addDropOpen: true,
}

const navigation = [
  ['overview', 'Overview', 'grid'],
  ['offerings', 'Course Offerings', 'book'],
  ['students', 'Student Management', 'users'],
  ['registrations', 'Registrations', 'calendar'],
  ['records', 'Academic Records', 'file'],
  ['eligibility', 'Course Eligibility', 'check'],
]

// =========================================
// ICONS
// =========================================

function Icon({ name }) {
  const paths = {
    grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',

    book: 'M12 5v16 M3 4h5l4 2 4-2h5v15h-5l-4 2-4-2H3z',

    users: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2 M20 4a4 4 0 0 1 0 8',

    user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2',

    calendar: 'M3 5h18v16H3z M7 2v6 M17 2v6 M3 11h18',

    file: 'M5 3h14v18H5z M8 8h8 M8 12h8 M8 16h5',

    check: 'M9 11l3 3 5-6 M5 3h14v18H5z',

    menu: 'M3 6h18 M3 12h18 M3 18h18',

    logout: 'M10 3H4v18h6 M9 12h12 M16 7l5 5-5 5',

    search: 'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0 M15 15l6 6',

    plus: 'M12 5v14 M5 12h14',

    arrow: 'M5 12h14 M13 6l6 6-6 6',

    refresh: 'M20 7v5h-5 M20 12a8 8 0 1 0-2 6',

    close: 'M6 6l12 12 M18 6L6 18',

    graduation: 'M2 9l10-5 10 5-10 5z M6 11v6c4 3 8 3 12 0v-6 M22 9v7',

    seats: 'M5 3h14v12H5z M3 15h18v4H3z M6 19v3 M18 19v3',

    tick: 'M5 12l4 4L19 6',
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

function initials(name) {
  return (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase() || '?'
}

// =========================================
// API REQUESTS
// =========================================

async function request(path, options = {}) {
  const token = localStorage.getItem('token')

  if (!token) {
    throw new Error('Please sign in again.')
  }

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
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

// =========================================
// SHARED COMPONENTS
// =========================================

function EmptyState({ message, loading = false }) {
  return (
    <div className="st-empty">
      {loading ? (
        <div className="st-spinner" />
      ) : (
        <Icon name="file" />
      )}

      <p>{message}</p>
    </div>
  )
}

function StatusBadge({ active, children }) {
  return (
    <span
      className={
        active
          ? 'st-badge st-green'
          : 'st-badge st-gray'
      }
    >
      {children}
    </span>
  )
}

// =========================================
// ADVISOR DASHBOARD
// =========================================

function AdvisorDashboard() {
  const [page, setPage] = useState('overview')
  const [collapsed, setCollapsed] = useState(false)

  const [advisor] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('user') || '{}'
      ) || {}
    } catch {
      return {}
    }
  })

  const advisorName = advisor.name || 'Advisor'

  // Course offerings

  const [term, setTerm] = useState('2026-1')
  const [loadedTerm, setLoadedTerm] = useState('')
  const [offerings, setOfferings] = useState([])
  const [courses, setCourses] = useState([])
  const [courseSearch, setCourseSearch] = useState('')
  const [courseStatus, setCourseStatus] = useState('all')
  const [loading, setLoading] = useState(false)

  // Students

  const [students, setStudents] = useState([])
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [studentsLoading, setStudentsLoading] = useState(false)

  // Academic information

  const [academicRecords, setAcademicRecords] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [eligibleCourses, setEligibleCourses] = useState([])
  const [studentLoading, setStudentLoading] = useState(false)
  const [eligibleLoading, setEligibleLoading] = useState(false)

  // Forms and notifications

  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(initialOffering)
  const [busy, setBusy] = useState(false)
  const [actionId, setActionId] = useState(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formError, setFormError] = useState('')
  const [studentError, setStudentError] = useState('')
  const [eligibleError, setEligibleError] = useState('')

  const selectedStudent = students.find(
    student => student._id === selectedStudentId
  )

  // =========================================
  // FETCH COURSES
  // =========================================

  const fetchCourses = async () => {
    try {
      const data = await request('/courses')
      setCourses(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
    }
  }

  // =========================================
  // FETCH STUDENTS
  // =========================================

  const fetchStudents = async () => {
    setStudentsLoading(true)

    try {
      const data = await request('/students')
      setStudents(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setStudentsLoading(false)
    }
  }

  // =========================================
  // FETCH OFFERINGS
  // =========================================

  const loadOfferings = async (value = term) => {
    const cleanTerm = value.trim()

    if (!cleanTerm) {
      setError('Please enter an academic term.')
      return false
    }

    setLoading(true)
    setError('')

    try {
      const data = await request(
        `/offerings?term=${encodeURIComponent(cleanTerm)}`
      )

      setOfferings(Array.isArray(data) ? data : [])
      setLoadedTerm(cleanTerm)

      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  // =========================================
  // INITIAL LOAD
  // =========================================

  useEffect(() => {
    if (
      !localStorage.getItem('token') ||
      advisor.role !== 'advisor'
    ) {
      window.location.replace('/login')
      return
    }

    fetchCourses()
    fetchStudents()
    loadOfferings('2026-1')
  }, [advisor.role])

  // =========================================
  // CLOSE MODAL WITH ESCAPE
  // =========================================

  useEffect(() => {
    if (!modal) return

    const handleEscape = event => {
      if (event.key === 'Escape' && !busy) {
        setModal(null)
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () =>
      window.removeEventListener(
        'keydown',
        handleEscape
      )
  }, [modal, busy])

  // =========================================
  // STUDENT ACADEMIC INFORMATION
  // =========================================

  useEffect(() => {
    setAcademicRecords([])
    setRegistrations([])
    setStudentError('')

    if (!selectedStudentId) {
      setStudentLoading(false)
      return
    }

    const controller = new AbortController()

    const loadStudent = async () => {
      setStudentLoading(true)

      try {
        const [records, current] = await Promise.all([
          request(
            `/students/${selectedStudentId}/record`,
            { signal: controller.signal }
          ),

          request(
            `/registrations/student/${selectedStudentId}`,
            { signal: controller.signal }
          ),
        ])

        if (!controller.signal.aborted) {
          setAcademicRecords(
            Array.isArray(records) ? records : []
          )

          setRegistrations(
            Array.isArray(current) ? current : []
          )
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setStudentError(err.message)
        }
      } finally {
        if (!controller.signal.aborted) {
          setStudentLoading(false)
        }
      }
    }

    loadStudent()

    return () => controller.abort()
  }, [selectedStudentId])

  // =========================================
  // COURSE ELIGIBILITY
  // =========================================

  const fetchEligibility = async (
    studentId = selectedStudentId,
    currentTerm = loadedTerm,
    signal
  ) => {
    if (!studentId || !currentTerm) return

    setEligibleLoading(true)
    setEligibleError('')
    setEligibleCourses([])

    try {
      const data = await request(
        `/students/${studentId}/eligible?term=${encodeURIComponent(currentTerm)}`,
        { signal }
      )

      if (!signal?.aborted) {
        setEligibleCourses(
          Array.isArray(data) ? data : []
        )
      }
    } catch (err) {
      if (!signal?.aborted) {
        setEligibleError(err.message)
      }
    } finally {
      if (!signal?.aborted) {
        setEligibleLoading(false)
      }
    }
  }

  useEffect(() => {
    setEligibleCourses([])
    setEligibleError('')

    if (!selectedStudentId || !loadedTerm) {
      setEligibleLoading(false)
      return
    }

    const controller = new AbortController()

    fetchEligibility(
      selectedStudentId,
      loadedTerm,
      controller.signal
    )

    return () => controller.abort()
  }, [selectedStudentId, loadedTerm])

  // =========================================
  // REFRESH STUDENT INFORMATION
  // =========================================

  const refreshStudent = async () => {
    if (!selectedStudentId) return

    setStudentLoading(true)
    setStudentError('')

    try {
      const [records, current] = await Promise.all([
        request(
          `/students/${selectedStudentId}/record`
        ),

        request(
          `/registrations/student/${selectedStudentId}`
        ),
      ])

      setAcademicRecords(
        Array.isArray(records) ? records : []
      )

      setRegistrations(
        Array.isArray(current) ? current : []
      )

      if (loadedTerm) {
        await loadOfferings(loadedTerm)
        await fetchEligibility()
      }
    } catch (err) {
      setStudentError(err.message)
    } finally {
      setStudentLoading(false)
    }
  }

  // =========================================
  // SEARCH AND FILTER
  // =========================================

  const visibleOfferings = offerings.filter(offering => {
    const matchesSearch = [
      offering.courseId?.code,
      offering.courseId?.title,
      offering.instructor,
      offering.room,
      offering.day,
    ].some(value =>
      String(value ?? '')
        .toLowerCase()
        .includes(courseSearch.trim().toLowerCase())
    )

    const matchesStatus =
      courseStatus === 'all' ||
      (courseStatus === 'open'
        ? offering.addDropOpen
        : !offering.addDropOpen)

    return matchesSearch && matchesStatus
  })

  const visibleStudents = students.filter(student =>
    [
      student.name,
      student.studentId,
      student.email,
    ].some(value =>
      String(value ?? '')
        .toLowerCase()
        .includes(studentSearch.trim().toLowerCase())
    )
  )

  // =========================================
  // STATISTICS
  // =========================================

  const totalSeats = offerings.reduce(
    (total, item) =>
      total + (Number(item.seats) || 0),
    0
  )

  const seatsTaken = offerings.reduce(
    (total, item) =>
      total + (Number(item.seatsTaken) || 0),
    0
  )

  const availableSeats = Math.max(
    0,
    totalSeats - seatsTaken
  )

  const occupancy = totalSeats
    ? Math.round((seatsTaken / totalSeats) * 100)
    : 0

  const statistics = [
    {
      label: 'Course Offerings',
      value: offerings.length,
      icon: 'book',
      color: 'blue',
    },
    {
      label: 'Total Seats',
      value: totalSeats,
      icon: 'users',
      color: 'purple',
    },
    {
      label: 'Seats Taken',
      value: seatsTaken,
      icon: 'user',
      color: 'green',
    },
    {
      label: 'Available Seats',
      value: availableSeats,
      icon: 'grid',
      color: 'orange',
    },
  ]

  // =========================================
  // NAVIGATION
  // =========================================

  const navigate = nextPage => {
    setPage(nextPage)
    setError('')
    setSuccess('')
  }

  const selectStudent = student => {
    if (actionId || busy) return

    setSelectedStudentId(student._id)
    setSuccess('')
    setError('')
  }

  // =========================================
  // CREATE AND EDIT OFFERINGS
  // =========================================

  const openCreate = () => {
    setForm({
      ...initialOffering,
      term: loadedTerm || term.trim() || '2026-1',
    })

    setFormError('')
    setModal({ type: 'create' })
  }

  const openEdit = offering => {
    setForm({
      section: offering.section,
      day: offering.day,
      startTime: offering.startTime,
      endTime: offering.endTime,
      room: offering.room || '',
      instructor: offering.instructor || '',
      seats: offering.seats,
      addDropOpen: offering.addDropOpen,
    })

    setFormError('')

    setModal({
      type: 'edit',
      offering,
    })
  }

  const handleChange = event => {
    const { name, value } = event.target

    setForm(previous => ({
      ...previous,
      [name]:
        name === 'section' || name === 'seats'
          ? Number(value)
          : name === 'addDropOpen'
            ? value === 'true'
            : value,
    }))
  }

  const saveOffering = async event => {
    event.preventDefault()

    setBusy(true)
    setFormError('')
    setSuccess('')

    try {
      if (form.startTime >= form.endTime) {
        throw new Error(
          'End time must be later than start time.'
        )
      }

      if (
        !form.room.trim() ||
        !form.instructor.trim()
      ) {
        throw new Error(
          'Room and instructor are required.'
        )
      }

      const editing = modal.type === 'edit'

      const body = {
        ...form,
        room: form.room.trim(),
        instructor: form.instructor.trim(),
      }

      if (!editing) {
        body.term = body.term.trim()

        if (!body.term) {
          throw new Error(
            'Academic term is required.'
          )
        }
      }

      await request(
        editing
          ? `/offerings/${modal.offering._id}`
          : '/offerings',
        {
          method: editing ? 'PATCH' : 'POST',
          body: JSON.stringify(body),
        }
      )

      setSuccess(
        editing
          ? 'Course offering updated successfully.'
          : 'Course offering created successfully.'
      )

      setModal(null)

      const nextTerm = editing
        ? loadedTerm
        : body.term

      setTerm(nextTerm)

      await loadOfferings(nextTerm)

      if (
        selectedStudentId &&
        nextTerm === loadedTerm
      ) {
        await fetchEligibility(
          selectedStudentId,
          nextTerm
        )
      }
    } catch (err) {
      setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }

  // =========================================
  // DELETE OFFERING
  // =========================================

  const deleteOffering = async () => {
    setBusy(true)
    setFormError('')

    try {
      await request(
        `/offerings/${modal.offering._id}`,
        { method: 'DELETE' }
      )

      setSuccess(
        'Course offering deleted successfully.'
      )

      setModal(null)

      await loadOfferings(loadedTerm)

      if (selectedStudentId) {
        await fetchEligibility()
      }
    } catch (err) {
      setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }

  // =========================================
  // OPEN / CLOSE REGISTRATION
  // =========================================

  const toggleAddDrop = async offering => {
    setActionId(offering._id)
    setError('')
    setSuccess('')

    try {
      await request(
        `/offerings/${offering._id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            addDropOpen: !offering.addDropOpen,
          }),
        }
      )

      setSuccess(
        'Registration availability updated.'
      )

      await loadOfferings(loadedTerm)

      if (selectedStudentId) {
        await fetchEligibility()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setActionId(null)
    }
  }

  // =========================================
  // REGISTER STUDENT
  // =========================================

  const registerStudent = async item => {
    if (
      !selectedStudentId ||
      !item.eligible ||
      actionId
    ) return

    setActionId(item.offeringId)
    setError('')
    setSuccess('')

    try {
      await request('/registrations', {
        method: 'POST',
        body: JSON.stringify({
          studentId: selectedStudentId,
          offeringId: item.offeringId,
        }),
      })

      setSuccess(
        'Student registered successfully.'
      )

      await refreshStudent()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionId(null)
    }
  }

  // =========================================
  // DROP REGISTRATION
  // =========================================

  const dropRegistration = async () => {
    setBusy(true)
    setFormError('')

    try {
      await request(
        `/registrations/${modal.registration._id}`,
        { method: 'DELETE' }
      )

      setSuccess('Course dropped successfully.')
      setModal(null)

      await refreshStudent()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }

  // =========================================
  // LOGOUT
  // =========================================

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    window.location.replace('/login')
  }

  const pageTitle =
    navigation.find(([id]) => id === page)?.[1] ||
    'Overview'

  const studentPages = [
    'students',
    'registrations',
    'records',
    'eligibility',
  ]

  // =========================================
  // MAIN INTERFACE
  // =========================================

  return (
    <div
      className={
        collapsed
          ? 'st-layout advisor-dashboard st-collapsed'
          : 'st-layout advisor-dashboard'
      }
    >

      {/* SIDEBAR */}

      <aside className="st-sidebar">

        <div className="st-brand">

          <div className="st-logo">S</div>

          <div className="st-brand-text">
            <strong>STAMFORD</strong>
            <small>INTERNATIONAL UNIVERSITY</small>
          </div>

        </div>

        <div className="st-sidebar-label">
          ADVISOR WORKSPACE
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
              {initials(advisorName)}
            </div>

            <div className="st-profile-text">
              <strong>{advisorName}</strong>
              <small>Advisor Account</small>
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

            <span>Advisor Portal</span>

            <span className="st-breadcrumb">/</span>

            <strong>{pageTitle}</strong>

          </div>

          <div className="st-topbar-right">

            <span className="st-term-badge">
              Term {loadedTerm || term}
            </span>

            <div className="st-avatar">
              {initials(advisorName)}
            </div>

          </div>

        </header>

        <div className="st-content">

          {/* PAGE HEADING */}

          <div className="st-page-heading">

            <div>

              <p className="st-eyebrow">
                ACADEMIC MANAGEMENT
              </p>

              <h1>
                {page === 'overview'
                  ? 'Advisor Overview'
                  : pageTitle}
              </h1>

              <p>
                Manage courses, students and
                academic registrations.
              </p>

            </div>

            {(page === 'overview' ||
              page === 'offerings') && (

              <button
                type="button"
                className="st-primary-button adv-inline"
                disabled={busy || !!actionId}
                onClick={openCreate}
              >

                <Icon name="plus" />

                New Offering

              </button>

            )}

          </div>

          {/* NOTIFICATIONS */}

          {success && (
            <div className="adv-success" role="status">
              {success}
            </div>
          )}

          {error && (
            <div className="st-error" role="alert">
              {error}
            </div>
          )}

          {/* ACADEMIC TERM */}

          <form
            className="adv-term-panel"
            onSubmit={event => {
              event.preventDefault()
              loadOfferings(term)
            }}
          >

            <div>
              <strong>Academic Term</strong>

              <small>
                Select the semester to manage.
              </small>
            </div>

            <div className="st-term-form">

              <input
                aria-label="Academic term"
                value={term}
                onChange={event =>
                  setTerm(event.target.value)
                }
                placeholder="2026-1"
                required
              />

              <button
                type="submit"
                className="st-primary-button"
                disabled={
                  loading || busy || !!actionId
                }
              >

                {loading
                  ? 'Loading...'
                  : 'Apply Term'}

              </button>

            </div>

          </form>

          {/* OVERVIEW */}

          {page === 'overview' && (

            <>

              {/* WELCOME BANNER */}

              <section className="st-welcome">

                <div>

                  <span>
                    YOUR ACADEMIC WORKSPACE
                  </span>

                  <h2>
                    Welcome back, {advisorName}!
                  </h2>

                  <p>
                    Support student success and
                    manage academic activities
                    in one place.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      navigate('offerings')
                    }
                  >

                    Manage Courses

                    <Icon name="arrow" />

                  </button>

                </div>

                <div className="st-welcome-decoration">

                  <Icon name="graduation" />

                </div>

              </section>

              {/* STATISTIC CARDS */}

              <div className="st-stat-grid">

                {statistics.map(item => (

                  <button
                    type="button"
                    key={item.label}
                    className="st-stat-card adv-stat-button"
                    onClick={() =>
                      navigate('offerings')
                    }
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
                      {loading ? '—' : item.value}
                    </h2>

                    <small className="adv-stat-caption">
                      Current academic term
                    </small>

                  </button>

                ))}

              </div>

              {/* ENROLLMENT AND QUICK ACTIONS */}

              <div className="adv-overview-grid">

                <section className="st-panel adv-capacity">

                  <div className="st-panel-heading">

                    <div>

                      <h2>Enrollment Overview</h2>

                      <p>
                        Seat utilization for{' '}
                        {loadedTerm || 'this term'}
                      </p>

                    </div>

                  </div>

                  <div className="adv-capacity-number">
                    {occupancy}%
                  </div>

                  <progress
                    value={seatsTaken}
                    max={Math.max(1, totalSeats)}
                    aria-label="Enrollment capacity"
                  />

                  <div className="adv-capacity-labels">

                    <span>
                      {seatsTaken} occupied
                    </span>

                    <span>
                      {availableSeats} available
                    </span>

                  </div>

                </section>

                <section className="st-panel adv-quick">

                  <div className="st-panel-heading">

                    <div>

                      <h2>Quick Actions</h2>

                      <p>
                        Access your daily academic tasks.
                      </p>

                    </div>

                  </div>

                  <button
                    type="button"
                    disabled={busy || !!actionId}
                    onClick={openCreate}
                  >

                    <Icon name="plus" />

                    <span>Create course offering</span>

                    <Icon name="arrow" />

                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('students')}
                  >

                    <Icon name="search" />

                    <span>Find a student</span>

                    <Icon name="arrow" />

                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      navigate('eligibility')
                    }
                  >

                    <Icon name="check" />

                    <span>Check course eligibility</span>

                    <Icon name="arrow" />

                  </button>

                </section>

              </div>

            </>

          )}

          {/* COURSE OFFERINGS */}

          {(page === 'overview' ||
            page === 'offerings') && (

            <section className="st-panel">

              <div className="st-panel-heading">

                <div>

                  <h2>Course Offerings</h2>

                  <p>
                    {visibleOfferings.length}
                    {' '}matching course sections
                  </p>

                </div>

                <button
                  type="button"
                  className="adv-secondary adv-inline"
                  disabled={loading || !!actionId}
                  onClick={() =>
                    loadOfferings(loadedTerm || term)
                  }
                >

                  <Icon name="refresh" />

                  Refresh

                </button>

              </div>

              {/* SEARCH AND FILTER */}

              <div className="adv-toolbar">

                <div className="adv-search">

                  <Icon name="search" />

                  <input
                    type="search"
                    aria-label="Search courses"
                    placeholder="Search course, instructor or room..."
                    value={courseSearch}
                    onChange={event =>
                      setCourseSearch(event.target.value)
                    }
                  />

                </div>

                <select
                  aria-label="Registration status"
                  value={courseStatus}
                  onChange={event =>
                    setCourseStatus(event.target.value)
                  }
                >

                  <option value="all">
                    All statuses
                  </option>

                  <option value="open">
                    Open
                  </option>

                  <option value="closed">
                    Closed
                  </option>

                </select>

              </div>

              {loading ? (

                <EmptyState
                  loading
                  message="Loading course offerings..."
                />

              ) : visibleOfferings.length === 0 ? (

                <EmptyState
                  message="No matching course offerings found."
                />

              ) : (

                <div className="st-table-wrap">

                  <table className="st-table adv-offering-table">

                    <thead>

                      <tr>
                        <th>Course</th>
                        <th>Section</th>
                        <th>Schedule</th>
                        <th>Room</th>
                        <th>Instructor</th>
                        <th>Enrollment</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>

                    </thead>

                    <tbody>

                      {visibleOfferings.map(offering => (

                        <tr key={offering._id}>

                          <td>

                            <div className="adv-course">

                              <div className="adv-course-icon">
                                <Icon name="book" />
                              </div>

                              <div>

                                <strong>
                                  {offering.courseId?.code}
                                </strong>

                                <small>
                                  {offering.courseId?.title}
                                </small>

                              </div>

                            </div>

                          </td>

                          <td>{offering.section}</td>

                          <td>

                            <strong>
                              {offering.day}
                            </strong>

                            <small>
                              {offering.startTime}
                              {' – '}
                              {offering.endTime}
                            </small>

                          </td>

                          <td>{offering.room}</td>

                          <td>{offering.instructor}</td>

                          <td>

                            <div className="adv-seat">

                              <span>
                                {offering.seatsTaken || 0}
                                {' / '}
                                {offering.seats}
                              </span>

                              <progress
                                aria-label="Seats occupied"
                                value={offering.seatsTaken || 0}
                                max={Math.max(
                                  1,
                                  offering.seats
                                )}
                              />

                            </div>

                          </td>

                          <td>

                            <button
                              type="button"
                              className={
                                offering.addDropOpen
                                  ? 'st-badge st-green adv-status-button'
                                  : 'st-badge st-gray adv-status-button'
                              }
                              title="Change registration availability"
                              disabled={!!actionId || busy}
                              onClick={() =>
                                toggleAddDrop(offering)
                              }
                            >

                              {offering.addDropOpen
                                ? 'Open'
                                : 'Closed'}

                            </button>

                          </td>

                          <td>

                            <div className="adv-actions">

                              <button
                                type="button"
                                className="adv-edit-button"
                                disabled={!!actionId || busy}
                                onClick={() =>
                                  openEdit(offering)
                                }
                              >

                                Edit

                              </button>

                              <button
                                type="button"
                                className="adv-delete-button"
                                disabled={!!actionId || busy}
                                onClick={() => {
                                  setFormError('')

                                  setModal({
                                    type: 'delete',
                                    offering,
                                  })
                                }}
                              >

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

          )}

          {/* STUDENT DIRECTORY */}

          {studentPages.includes(page) && (

            <>

              <section className="st-panel">

                <div className="st-panel-heading">

                  <div>

                    <h2>Find a Student</h2>

                    <p>
                      Search by name, student ID or email.
                    </p>

                  </div>

                  <span className="st-count">
                    {visibleStudents.length} students
                  </span>

                </div>

                <div className="adv-search adv-student-search">

                  <Icon name="search" />

                  <input
                    type="search"
                    aria-label="Search students"
                    placeholder="Search student name or ID..."
                    value={studentSearch}
                    onChange={event =>
                      setStudentSearch(event.target.value)
                    }
                  />

                </div>

                <div className="adv-student-results">

                  {studentsLoading ? (

                    <EmptyState
                      loading
                      message="Loading students..."
                    />

                  ) : visibleStudents.length === 0 ? (

                    <EmptyState
                      message="No matching students found."
                    />

                  ) : (

                    visibleStudents.map(student => (

                      <button
                        type="button"
                        key={student._id}
                        disabled={!!actionId || busy}
                        className={
                          selectedStudentId === student._id
                            ? 'adv-student-result selected'
                            : 'adv-student-result'
                        }
                        onClick={() =>
                          selectStudent(student)
                        }
                      >

                        <div className="st-avatar">
                          {initials(student.name)}
                        </div>

                        <div className="adv-student-info">

                          <strong>{student.name}</strong>

                          <small>
                            {student.studentId}
                            {' · '}
                            {student.email}
                          </small>

                        </div>

                        <Icon
                          name={
                            selectedStudentId === student._id
                              ? 'tick'
                              : 'arrow'
                          }
                        />

                      </button>

                    ))

                  )}

                </div>

              </section>

              {/* SELECTED STUDENT */}

              {selectedStudent ? (

                <section className="st-panel adv-student-profile">

                  <div className="st-avatar st-avatar-large">
                    {initials(selectedStudent.name)}
                  </div>

                  <div className="adv-selected-info">

                    <span>SELECTED STUDENT</span>

                    <h2>{selectedStudent.name}</h2>

                    <p>
                      {selectedStudent.studentId}
                      {' · '}
                      {selectedStudent.email}
                    </p>

                  </div>

                  <button
                    type="button"
                    className="adv-secondary"
                    disabled={!!actionId || busy}
                    onClick={() =>
                      setSelectedStudentId('')
                    }
                  >

                    Clear

                  </button>

                </section>

              ) : (

                <section className="st-panel">

                  <EmptyState
                    message="Select a student to view academic information."
                  />

                </section>

              )}

              {studentError && (
                <div className="st-error">
                  {studentError}
                </div>
              )}

            </>

          )}

          {/* STUDENT MANAGEMENT QUICK LINKS */}

          {page === 'students' && selectedStudent && (

            <div className="adv-student-links">

              {[
                [
                  'registrations',
                  'Current Registrations',
                  registrations.length,
                  'calendar',
                  'blue',
                ],
                [
                  'records',
                  'Academic Records',
                  academicRecords.length,
                  'file',
                  'purple',
                ],
                [
                  'eligibility',
                  'Eligible Courses',
                  eligibleCourses.filter(
                    item => item.eligible
                  ).length,
                  'check',
                  'green',
                ],
              ].map(([id, label, count, icon, color]) => (

                <button
                  type="button"
                  key={id}
                  className="st-stat-card adv-stat-button"
                  onClick={() => navigate(id)}
                >

                  <div className={`st-stat-icon st-${color}`}>
                    <Icon name={icon} />
                  </div>

                  <p>{label}</p>

                  <h2>
                    {studentLoading || eligibleLoading
                      ? '—'
                      : count}
                  </h2>

                  <small className="adv-stat-caption">
                    View details →
                  </small>

                </button>

              ))}

            </div>

          )}

          {/* CURRENT REGISTRATIONS */}

          {page === 'registrations' && selectedStudent && (

            <section className="st-panel">

              <div className="st-panel-heading">

                <div>

                  <h2>Current Registrations</h2>

                  <p>
                    Registered courses for{' '}
                    {selectedStudent.name}
                  </p>

                </div>

                <button
                  type="button"
                  className="adv-secondary adv-inline"
                  disabled={studentLoading || !!actionId}
                  onClick={refreshStudent}
                >

                  <Icon name="refresh" />

                  Refresh

                </button>

              </div>

              {studentLoading ? (

                <EmptyState
                  loading
                  message="Loading registrations..."
                />

              ) : registrations.length === 0 ? (

                <EmptyState
                  message="No active registrations."
                />

              ) : (

                <div className="st-table-wrap">

                  <table className="st-table">

                    <thead>

                      <tr>
                        <th>Course</th>
                        <th>Term</th>
                        <th>Section</th>
                        <th>Schedule</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>

                    </thead>

                    <tbody>

                      {registrations.map(registration => {

                        const offering =
                          registration.offeringId

                        const course =
                          offering?.courseId

                        return (

                          <tr key={registration._id}>

                            <td>

                              <strong>
                                {course?.code || 'Course'}
                              </strong>

                              <small>{course?.title}</small>

                            </td>

                            <td>{registration.term}</td>

                            <td>{offering?.section}</td>

                            <td>

                              <strong>{offering?.day}</strong>

                              <small>
                                {offering?.startTime}
                                {' – '}
                                {offering?.endTime}
                              </small>

                            </td>

                            <td>

                              <StatusBadge active>
                                Registered
                              </StatusBadge>

                            </td>

                            <td>

                              <button
                                type="button"
                                className="adv-delete-button"
                                disabled={
                                  !offering?.addDropOpen ||
                                  !!actionId ||
                                  busy
                                }
                                onClick={() => {
                                  setFormError('')

                                  setModal({
                                    type: 'drop',
                                    registration,
                                  })
                                }}
                              >

                                {offering?.addDropOpen
                                  ? 'Drop Course'
                                  : 'Add/Drop Closed'}

                              </button>

                            </td>

                          </tr>

                        )
                      })}

                    </tbody>

                  </table>

                </div>

              )}

            </section>

          )}

          {/* ACADEMIC RECORDS */}

          {page === 'records' && selectedStudent && (

            <section className="st-panel">

              <div className="st-panel-heading">

                <div>

                  <h2>Academic History</h2>

                  <p>
                    Course results and academic grades.
                  </p>

                </div>

                <span className="st-count">
                  {academicRecords.length} records
                </span>

              </div>

              {studentLoading ? (

                <EmptyState
                  loading
                  message="Loading academic records..."
                />

              ) : academicRecords.length === 0 ? (

                <EmptyState
                  message="No academic records found."
                />

              ) : (

                <div className="st-table-wrap">

                  <table className="st-table">

                    <thead>

                      <tr>
                        <th>Course Code</th>
                        <th>Course Title</th>
                        <th>Academic Term</th>
                        <th>Grade</th>
                      </tr>

                    </thead>

                    <tbody>

                      {academicRecords.map(record => (

                        <tr key={record._id}>

                          <td>

                            <strong>
                              {record.courseId?.code}
                            </strong>

                          </td>

                          <td>{record.courseId?.title}</td>

                          <td>{record.term}</td>

                          <td>

                            <span
                              className={
                                record.grade === 'F'
                                  ? 'st-badge st-red'
                                  : 'st-grade'
                              }
                            >

                              {record.grade}

                            </span>

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}

            </section>

          )}

          {/* COURSE ELIGIBILITY */}

          {page === 'eligibility' && selectedStudent && (

            <section className="st-panel">

              <div className="st-panel-heading">

                <div>

                  <h2>Course Eligibility</h2>

                  <p>
                    Registration requirements for{' '}
                    {loadedTerm || '—'}
                  </p>

                </div>

                <button
                  type="button"
                  className="adv-secondary adv-inline"
                  disabled={
                    eligibleLoading ||
                    !loadedTerm ||
                    !!actionId
                  }
                  onClick={() => fetchEligibility()}
                >

                  <Icon name="check" />

                  {eligibleLoading
                    ? 'Checking...'
                    : 'Check Eligibility'}

                </button>

              </div>

              {eligibleError && (

                <div className="st-error">
                  {eligibleError}
                </div>

              )}

              {eligibleLoading ? (

                <EmptyState
                  loading
                  message="Checking course eligibility..."
                />

              ) : eligibleCourses.length === 0 ? (

                <EmptyState
                  message="No eligibility results available."
                />

              ) : (

                <div className="st-table-wrap">

                  <table className="st-table">

                    <thead>

                      <tr>
                        <th>Course</th>
                        <th>Section</th>
                        <th>Eligibility</th>
                        <th>Requirements</th>
                        <th>Action</th>
                      </tr>

                    </thead>

                    <tbody>

                      {eligibleCourses.map(item => {

                        const offering = offerings.find(
                          current =>
                            current._id === item.offeringId
                        )

                        return (

                          <tr key={item.offeringId}>

                            <td>

                              <strong>
                                {offering?.courseId?.code ||
                                  'Course'}
                              </strong>

                              <small>
                                {offering?.courseId?.title}
                              </small>

                            </td>

                            <td>{item.section}</td>

                            <td>

                              <StatusBadge active={item.eligible}>

                                {item.eligible
                                  ? 'Eligible'
                                  : 'Not Eligible'}

                              </StatusBadge>

                            </td>

                            <td>

                              {item.reasons?.length
                                ? item.reasons.join(', ')
                                : item.eligible
                                  ? 'All requirements met'
                                  : 'Requirements not met'}

                            </td>

                            <td>

                              <button
                                type="button"
                                className="st-primary-button"
                                disabled={
                                  !item.eligible ||
                                  !!actionId ||
                                  studentLoading ||
                                  busy
                                }
                                onClick={() =>
                                  registerStudent(item)
                                }
                              >

                                {actionId === item.offeringId
                                  ? 'Registering...'
                                  : 'Register'}

                              </button>

                            </td>

                          </tr>

                        )
                      })}

                    </tbody>

                  </table>

                </div>

              )}

            </section>

          )}

          {/* FOOTER */}

          <footer className="st-footer">

            Stamford International University
            · Course Registration System

          </footer>

        </div>

      </main>

      {/* =========================================
          MODAL WINDOWS
      ========================================= */}

      {modal && (

        <div
          className="adv-overlay"
          onClick={() =>
            !busy && setModal(null)
          }
        >

          <section
            className="adv-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="adv-modal-title"
            onClick={event =>
              event.stopPropagation()
            }
          >

            <header className="adv-modal-header">

              <div>

                <h2 id="adv-modal-title">

                  {{
                    create: 'New Course Offering',
                    edit: 'Edit Course Offering',
                    delete: 'Delete Course Offering',
                    drop: 'Drop Registration',
                  }[modal.type]}

                </h2>

                <p>
                  Academic management workspace
                </p>

              </div>

              <button
                type="button"
                className="st-icon-button"
                aria-label="Close dialog"
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

            {modal.type === 'delete' ||
            modal.type === 'drop' ? (

              <>

                <div className="adv-confirm-message">

                  <p>

                    {modal.type === 'delete'
                      ? `Delete ${modal.offering.courseId?.code || 'this course'} Section ${modal.offering.section}?`
                      : `Drop ${modal.registration.offeringId?.courseId?.code || 'this course'} from the student's registration?`}

                  </p>

                </div>

                <footer>

                  <button
                    type="button"
                    className="adv-secondary"
                    disabled={busy}
                    onClick={() => setModal(null)}
                  >

                    Cancel

                  </button>

                  <button
                    type="button"
                    className="adv-danger"
                    disabled={busy}
                    onClick={
                      modal.type === 'delete'
                        ? deleteOffering
                        : dropRegistration
                    }
                  >

                    {busy ? 'Processing...' : 'Confirm'}

                  </button>

                </footer>

              </>

            ) : (

              <form onSubmit={saveOffering}>

                <div className="adv-form-grid">

                  {modal.type === 'create' && (

                    <>

                      <label className="adv-full">

                        Course

                        <select
                          name="courseId"
                          value={form.courseId}
                          onChange={handleChange}
                          required
                        >

                          <option value="">
                            Select a course
                          </option>

                          {courses.map(course => (

                            <option
                              key={course._id}
                              value={course._id}
                            >

                              {course.code} — {course.title}

                            </option>

                          ))}

                        </select>

                      </label>

                      <label>

                        Academic Term

                        <input
                          name="term"
                          value={form.term}
                          onChange={handleChange}
                          required
                        />

                      </label>

                    </>

                  )}

                  <label>

                    Section

                    <input
                      type="number"
                      min="1"
                      name="section"
                      value={form.section}
                      onChange={handleChange}
                      required
                    />

                  </label>

                  <label>

                    Day

                    <select
                      name="day"
                      value={form.day}
                      onChange={handleChange}
                    >

                      {DAYS.map(day => (

                        <option key={day}>
                          {day}
                        </option>

                      ))}

                    </select>

                  </label>

                  <label>

                    Start Time

                    <input
                      type="time"
                      name="startTime"
                      value={form.startTime}
                      onChange={handleChange}
                      required
                    />

                  </label>

                  <label>

                    End Time

                    <input
                      type="time"
                      name="endTime"
                      value={form.endTime}
                      onChange={handleChange}
                      required
                    />

                  </label>

                  <label>

                    Room

                    <input
                      name="room"
                      value={form.room}
                      onChange={handleChange}
                      placeholder="e.g. 1201"
                      required
                    />

                  </label>

                  <label>

                    Instructor

                    <input
                      name="instructor"
                      value={form.instructor}
                      onChange={handleChange}
                      placeholder="Instructor name"
                      required
                    />

                  </label>

                  <label>

                    Seat Capacity

                    <input
                      type="number"
                      min="1"
                      name="seats"
                      value={form.seats}
                      onChange={handleChange}
                      required
                    />

                  </label>

                  <label>

                    Registration Status

                    <select
                      name="addDropOpen"
                      value={String(form.addDropOpen)}
                      onChange={handleChange}
                    >

                      <option value="true">
                        Open
                      </option>

                      <option value="false">
                        Closed
                      </option>

                    </select>

                  </label>

                </div>

                <footer>

                  <button
                    type="button"
                    className="adv-secondary"
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
                      : modal.type === 'create'
                        ? 'Create Offering'
                        : 'Save Changes'}

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

export default AdvisorDashboard
