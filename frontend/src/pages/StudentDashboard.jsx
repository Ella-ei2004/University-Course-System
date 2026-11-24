
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  getOfferings,
  getMyRegistrations,
  getStudentRecord,
} from '../api'

import '../App.css'

const DEFAULT_TERM = '2026-1'

const PASSED_GRADES = [
  'A', 'A-', 'B+', 'B', 'B-',
  'C+', 'C', 'C-', 'D+', 'D',
]

const NAVIGATION = [
  { id: 'overview', label: 'Overview', icon: 'grid' },
  { id: 'registrations', label: 'My Registrations', icon: 'calendar' },
  { id: 'courses', label: 'Course Offerings', icon: 'book' },
  { id: 'records', label: 'Academic Records', icon: 'record' },
  { id: 'profile', label: 'My Profile', icon: 'user' },
]

// =========================================
// ICON COMPONENT
// =========================================

function Icon({ name, size = 20 }) {
  const paths = {
    grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',

    calendar: 'M3 5h18v16H3z M7 2v6 M17 2v6 M3 11h18',

    book: 'M12 5v16 M3 3h4c3 0 5 2 5 2s2-2 5-2h4v16h-4c-3 0-5 2-5 2s-2-2-5-2H3z',

    record: 'M5 3h14v18H5z M8 8h8 M8 12h8 M8 16h5',

    user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2',

    logout: 'M10 3H4v18h6 M9 12h12 M16 7l5 5-5 5',

    menu: 'M3 6h18 M3 12h18 M3 18h18',

    search: 'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0 M15 15l6 6',

    arrow: 'M5 12h14 M13 6l6 6-6 6',

    graduation: 'M2 10l10-5 10 5-10 5z M6 12v5c4 3 8 3 12 0v-5 M22 10v6',

    alert: 'M12 3l10 18H2z M12 9v5 M12 17h.01',
  }

  return (
    <svg
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
      <path d={paths[name]} />
    </svg>
  )
}

// =========================================
// REUSABLE COMPONENTS
// =========================================

function EmptyState({ icon, title, description }) {
  return (
    <div className="st-empty">
      <Icon name={icon} size={32} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

function Badge({ children, color = 'gray' }) {
  return (
    <span className={`st-badge st-${color}`}>
      {children}
    </span>
  )
}

function PanelHeading({ title, description, children }) {
  return (
    <div className="st-panel-heading">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      {children}
    </div>
  )
}

function Schedule({ offering }) {
  return (
    <div className="st-subject-schedule">
      <strong>{offering?.day || '—'}</strong>

      <small>
        {offering?.startTime || '—'}
        {' – '}
        {offering?.endTime || '—'}
      </small>
    </div>
  )
}

function getInitials(name) {
  return (name || 'Student')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase() || 'S'
}

// =========================================
// STUDENT DASHBOARD
// =========================================

function StudentDashboard() {
  const navigate = useNavigate()

  // Account information

  const [user, setUser] = useState(null)

  // Academic information

  const [offerings, setOfferings] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [academicRecords, setAcademicRecords] = useState([])

  // Navigation and filters

  const [activePage, setActivePage] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [term, setTerm] = useState(DEFAULT_TERM)
  const [loadedTerm, setLoadedTerm] = useState(DEFAULT_TERM)
  const [search, setSearch] = useState('')

  // Loading and notifications

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // =========================================
  // LOGOUT
  // =========================================

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    navigate('/login', { replace: true })
  }, [navigate])

  // =========================================
  // LOAD ACADEMIC DATA
  // =========================================

  const loadStudentData = useCallback(
    async (accountId, selectedTerm) => {
      setLoading(true)
      setError('')

      try {
        const results = await Promise.allSettled([
          getOfferings(selectedTerm),
          getMyRegistrations(),
          getStudentRecord(accountId),
        ])

        const errors = []

        const readResult = (result, label) => {
          if (result.status === 'rejected') {
            errors.push(
              `${label}: ${
                result.reason?.message || 'Unable to load data'
              }`
            )

            return []
          }

          if (!Array.isArray(result.value)) {
            errors.push(`${label}: Invalid server response.`)
            return []
          }

          return result.value
        }

        setOfferings(
          readResult(results[0], 'Course offerings')
        )

        setRegistrations(
          readResult(results[1], 'Registrations')
        )

        setAcademicRecords(
          readResult(results[2], 'Academic records')
        )

        setLoadedTerm(selectedTerm)
        setError(errors.join(' | '))

      } catch (err) {
        setError(
          err.message || 'Unable to load academic information.'
        )
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // =========================================
  // LOAD LOGGED-IN STUDENT
  // =========================================

  useEffect(() => {
    try {
      const token = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')

      if (!token || !storedUser) {
        handleLogout()
        return
      }

      const parsedUser = JSON.parse(storedUser)

      if (
        !parsedUser ||
        parsedUser.role !== 'student' ||
        parsedUser.active === false
      ) {
        handleLogout()
        return
      }

      // MongoDB account ID for API requests

      const accountId = parsedUser.id || parsedUser._id

      if (!accountId) {
        handleLogout()
        return
      }

      // University Student ID for display

      setUser({
        ...parsedUser,
        id: accountId,
        studentId: parsedUser.studentId ?? null,
      })

      loadStudentData(accountId, DEFAULT_TERM)

    } catch (err) {
      handleLogout()
    }
  }, [handleLogout, loadStudentData])

  // =========================================
  // STUDENT INFORMATION
  // =========================================

  const studentName = user?.name || 'Student'

  const studentEmail = user?.email || '—'

  const studentId =
    user?.studentId || 'Not assigned'

  const studentInitials = getInitials(studentName)

  const pageTitle =
    NAVIGATION.find(item => item.id === activePage)?.label ||
    'Overview'

  // =========================================
  // NAVIGATION
  // =========================================

  const changePage = nextPage => {
    setActivePage(nextPage)
    setSearch('')
  }

  // =========================================
  // CHANGE ACADEMIC TERM
  // =========================================

  const handleLoadTerm = event => {
    event.preventDefault()

    const selectedTerm = term.trim()
    const accountId = user?.id || user?._id

    if (!selectedTerm) {
      setError('Please enter an academic term.')
      return
    }

    if (accountId && !loading) {
      loadStudentData(accountId, selectedTerm)
    }
  }

  // =========================================
  // ACADEMIC STATISTICS
  // =========================================

  const completedCourses = academicRecords.filter(
    record => PASSED_GRADES.includes(record.grade)
  )

  const totalCredits = completedCourses.reduce(
    (total, record) =>
      total + (Number(record.courseId?.credits) || 0),
    0
  )

  const retakeCourses = academicRecords.filter(
    record => record.grade === 'F'
  )

  const currentRegistrations = registrations.filter(
    registration =>
      (
        registration.term ||
        registration.offeringId?.term
      ) === loadedTerm
  )

  const registeredOfferingIds = new Set(
    currentRegistrations.map(registration =>
      String(
        registration.offeringId?._id ||
        registration.offeringId
      )
    )
  )

  const statistics = [
    {
      label: 'Registered Courses',
      value: currentRegistrations.length,
      icon: 'calendar',
      color: 'blue',
      page: 'registrations',
    },
    {
      label: 'Available Offerings',
      value: offerings.length,
      icon: 'book',
      color: 'purple',
      page: 'courses',
    },
    {
      label: 'Completed Courses',
      value: completedCourses.length,
      icon: 'record',
      color: 'green',
      page: 'records',
    },
    {
      label: 'Credits Earned',
      value: totalCredits,
      icon: 'graduation',
      color: 'orange',
      page: 'records',
    },
  ]

  // =========================================
  // SEARCH COURSE OFFERINGS
  // =========================================

  const searchValue = search.trim().toLowerCase()

  const filteredOfferings = offerings.filter(offering =>
    [
      offering.courseId?.code,
      offering.courseId?.title,
      offering.section,
      offering.instructor,
      offering.room,
      offering.day,
    ].some(value =>
      String(value ?? '')
        .toLowerCase()
        .includes(searchValue)
    )
  )

  // =========================================
  // GROUP COURSES BY SUBJECT
  // =========================================

  const groupedCourses = Object.values(
    filteredOfferings.reduce((groups, offering) => {
      const course = offering.courseId

      const key =
        course?._id ||
        course?.code ||
        offering._id

      if (!groups[key]) {
        groups[key] = {
          id: key,
          code: course?.code || 'Course',
          title: course?.title || 'Untitled Course',
          sections: [],
        }
      }

      groups[key].sections.push(offering)

      return groups
    }, {})
  ).sort((a, b) => a.code.localeCompare(b.code))

  // =========================================
  // GROUP ACADEMIC RECORDS BY TERM
  // =========================================

  const recordsByTerm = academicRecords.reduce(
    (groups, record) => {
      const key = record.term || 'Unknown Term'

      if (!groups[key]) {
        groups[key] = []
      }

      groups[key].push(record)

      return groups
    },
    {}
  )

  // =========================================
  // MY REGISTRATIONS
  // =========================================

  const renderRegistrations = () => (
    <section className="st-panel">

      <PanelHeading
        title="My Registrations"
        description={`Registered courses for term ${loadedTerm}.`}
      >
        <span className="st-count">
          {currentRegistrations.length} courses
        </span>
      </PanelHeading>

      {currentRegistrations.length === 0 ? (

        <EmptyState
          icon="calendar"
          title="No registrations yet"
          description="Your registered courses will appear here."
        />

      ) : (

        <div className="st-table-wrap">

          <table className="st-table">

            <thead>
              <tr>
                <th>Course</th>
                <th>Section</th>
                <th>Schedule</th>
                <th>Room</th>
                <th>Instructor</th>
                <th>Add / Drop</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>

              {currentRegistrations.map(registration => {
                const offering = registration.offeringId
                const course = offering?.courseId

                return (
                  <tr key={registration._id}>

                    <td>
                      <strong>
                        {course?.code || 'Course'}
                      </strong>

                      <small>
                        {course?.title || '—'}
                      </small>
                    </td>

                    <td>
                      {offering?.section ?? '—'}
                    </td>

                    <td>
                      <Schedule offering={offering} />
                    </td>

                    <td>
                      {offering?.room || '—'}
                    </td>

                    <td>
                      {offering?.instructor || '—'}
                    </td>

                    <td>
                      <Badge
                        color={
                          offering?.addDropOpen
                            ? 'green'
                            : 'gray'
                        }
                      >
                        {offering?.addDropOpen
                          ? 'Open'
                          : 'Closed'}
                      </Badge>
                    </td>

                    <td>
                      <Badge color="blue">
                        Registered
                      </Badge>
                    </td>

                  </tr>
                )
              })}

            </tbody>

          </table>

        </div>

      )}

    </section>
  )

  // =========================================
  // COURSE OFFERINGS
  // =========================================

  const renderOfferings = () => (
    <section className="st-offerings">

      {/* SEARCH BAR */}

      <div className="st-offerings-search">

        <Icon name="search" />

        <input
          type="search"
          aria-label="Search courses"
          placeholder="Search by course code, title or instructor..."
          value={search}
          onChange={event =>
            setSearch(event.target.value)
          }
        />

      </div>

      {/* GROUPED COURSE LIST */}

      {groupedCourses.length === 0 ? (

        <div className="st-panel">

          <EmptyState
            icon="book"
            title="No courses found"
            description="Try another search or academic term."
          />

        </div>

      ) : (

        <div className="st-grouped-courses">

          {groupedCourses.map(course => (

            <article
              className="st-subject-card"
              key={course.id}
            >

              {/* COURSE HEADER */}

              <div className="st-subject-header">

                <div className="st-subject-icon">
                  <Icon name="book" size={26} />
                </div>

                <div className="st-subject-info">

                  <span>{course.code}</span>

                  <h2>{course.title}</h2>

                </div>

                <span className="st-section-count">

                  {course.sections.length}{' '}

                  {course.sections.length === 1
                    ? 'section'
                    : 'sections'}

                </span>

              </div>

              {/* COURSE SECTIONS */}

              <div className="st-subject-table-wrap">

                <table className="st-subject-table">

                  <thead>
                    <tr>
                      <th>Section</th>
                      <th>Instructor</th>
                      <th>Schedule</th>
                      <th>Room</th>
                      <th>Seats</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>

                    {[...course.sections]
                      .sort((a, b) =>
                        String(a.section ?? '').localeCompare(
                          String(b.section ?? ''),
                          undefined,
                          { numeric: true }
                        )
                      )
                      .map(offering => {

                        const seats =
                          Number(offering.seats) || 0

                        const taken =
                          Number(offering.seatsTaken) || 0

                        const available =
                          Math.max(0, seats - taken)

                        const isRegistered =
                          registeredOfferingIds.has(
                            String(offering._id)
                          )

                        let status = 'Open'
                        let color = 'green'

                        if (isRegistered) {
                          status = 'Registered'
                          color = 'blue'
                        } else if (!offering.addDropOpen) {
                          status = 'Closed'
                          color = 'gray'
                        } else if (available === 0) {
                          status = 'Full'
                          color = 'red'
                        }

                        return (

                          <tr key={offering._id}>

                            <td>
                              <strong>
                                {offering.section ?? '—'}
                              </strong>
                            </td>

                            <td>
                              {offering.instructor || '—'}
                            </td>

                            <td>
                              <Schedule offering={offering} />
                            </td>

                            <td>
                              {offering.room || '—'}
                            </td>

                            <td>
                              <strong>
                                {available} / {seats}
                              </strong>
                            </td>

                            <td>
                              <Badge color={color}>
                                {status}
                              </Badge>
                            </td>

                          </tr>

                        )
                      })}

                  </tbody>

                </table>

              </div>

            </article>

          ))}

        </div>

      )}

    </section>
  )

  // =========================================
  // ACADEMIC RECORDS
  // =========================================

  const renderRecords = () => (
    <section className="st-panel">

      <PanelHeading
        title="Academic Records"
        description="Review your grades and academic history."
      >
        <span className="st-count">
          {totalCredits} credits earned
        </span>
      </PanelHeading>

      {academicRecords.length === 0 ? (

        <EmptyState
          icon="record"
          title="No academic records"
          description="Your academic history will appear here."
        />

      ) : (

        Object.entries(recordsByTerm)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([recordTerm, records]) => (

            <div
              className="st-term-group"
              key={recordTerm}
            >

              <h3>
                Academic Term {recordTerm}
              </h3>

              <div className="st-table-wrap">

                <table className="st-table">

                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Title</th>
                      <th>Credits</th>
                      <th>Grade</th>
                      <th>Result</th>
                    </tr>
                  </thead>

                  <tbody>

                    {records.map(record => {

                      const passed =
                        PASSED_GRADES.includes(record.grade)

                      const failed =
                        record.grade === 'F'

                      const result = failed
                        ? 'Retake Required'
                        : passed
                          ? 'Completed'
                          : record.grade === 'W'
                            ? 'Withdrawn'
                            : record.grade || 'Pending'

                      const color = failed
                        ? 'red'
                        : passed
                          ? 'green'
                          : 'gray'

                      return (

                        <tr key={record._id}>

                          <td>
                            <strong>
                              {record.courseId?.code || '—'}
                            </strong>
                          </td>

                          <td>
                            {record.courseId?.title || '—'}
                          </td>

                          <td>
                            {record.courseId?.credits ?? '—'}
                          </td>

                          <td>
                            <span className="st-grade">
                              {record.grade || '—'}
                            </span>
                          </td>

                          <td>
                            <Badge color={color}>
                              {result}
                            </Badge>
                          </td>

                        </tr>

                      )
                    })}

                  </tbody>

                </table>

              </div>

            </div>

          ))

      )}

    </section>
  )

  // =========================================
  // MY PROFILE
  // =========================================

  const renderProfile = () => {

    const profileFields = [
      {
        label: 'Full Name',
        value: studentName,
      },
      {
        label: 'Student ID',
        value: studentId,
      },
      {
        label: 'Email Address',
        value: studentEmail,
      },
      {
        label: 'Account Role',
        value: 'Student',
      },
      {
        label: 'University',
        value: 'Stamford International University',
      },
      {
        label: 'Account Status',
        value: user?.active === false
          ? 'Inactive'
          : user?.active === true
            ? 'Active'
            : 'Unknown',
      },
    ]

    return (

      <section className="st-panel">

        <PanelHeading
          title="Personal Information"
          description="View your university account details."
        />

        {/* PROFILE HEADER */}

        <div className="st-profile-header">

          <div className="st-avatar st-avatar-large">
            {studentInitials}
          </div>

          <div>

            <h2>{studentName}</h2>

            <Badge color="blue">
              Student
            </Badge>

          </div>

        </div>

        {/* PERSONAL INFORMATION */}

        <div className="st-profile-grid">

          {profileFields.map(field => (

            <div key={field.label}>

              <span>
                {field.label}
              </span>

              <strong>
                {field.value}
              </strong>

            </div>

          ))}

        </div>

      </section>

    )
  }

  // =========================================
  // OVERVIEW
  // =========================================

  const renderOverview = () => (
    <>

      {/* WELCOME BANNER */}

      <section className="st-welcome">

        <div>

          <span>
            YOUR ACADEMIC JOURNEY
          </span>

          <h2>
            Welcome back, {studentName}!
          </h2>

          <p>
            Manage your courses, view your registrations
            and track your academic progress in one place.
          </p>

          <button
            type="button"
            onClick={() => changePage('courses')}
          >

            Explore Courses

            <Icon name="arrow" />

          </button>

        </div>

        <div className="st-welcome-decoration">
          <Icon name="graduation" size={62} />
        </div>

      </section>

      {/* STATISTICS */}

      <div className="st-stat-grid">

        {statistics.map(item => (

          <button
            type="button"
            className="st-stat-card"
            key={item.label}
            onClick={() => changePage(item.page)}
          >

            <div className={`st-stat-icon st-${item.color}`}>

              <Icon name={item.icon} />

            </div>

            <p>{item.label}</p>

            <h2>{item.value}</h2>

          </button>

        ))}

      </div>

      {/* ACADEMIC WARNING */}

      {retakeCourses.length > 0 && (

        <div className="st-warning">

          <strong>
            Academic attention required
          </strong>

          <p>
            {retakeCourses.length} course(s) have an F grade.
            Please review your academic records with your advisor.
          </p>

        </div>

      )}

      {/* CURRENT REGISTRATIONS */}

      {renderRegistrations()}

    </>
  )

  // =========================================
  // PAGE CONTENT
  // =========================================

  const renderContent = () => {

    if (!user) {
      return (
        <div className="st-panel st-empty">
          <div className="st-spinner" />
          <p>Loading your account...</p>
        </div>
      )
    }

    if (activePage === 'profile') {
      return renderProfile()
    }

    if (loading) {
      return (
        <div className="st-panel st-empty">

          <div className="st-spinner" />

          <p>
            Loading your academic information...
          </p>

        </div>
      )
    }

    switch (activePage) {

      case 'registrations':
        return renderRegistrations()

      case 'courses':
        return renderOfferings()

      case 'records':
        return renderRecords()

      default:
        return renderOverview()
    }
  }

  // =========================================
  // MAIN DASHBOARD
  // =========================================

  return (

    <div
      className={`st-layout ${
        sidebarOpen ? '' : 'st-collapsed'
      }`}
    >

      {/* =====================================
          SIDEBAR
      ===================================== */}

      <aside className="st-sidebar">

        {/* UNIVERSITY BRAND */}

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
          STUDENT WORKSPACE
        </div>

        {/* NAVIGATION */}

        <nav
          className="st-navigation"
          aria-label="Student navigation"
        >

          {NAVIGATION.map(item => (

            <button
              type="button"
              key={item.id}
              title={item.label}
              aria-label={item.label}
              aria-current={
                activePage === item.id
                  ? 'page'
                  : undefined
              }
              className={`st-nav-item ${
                activePage === item.id
                  ? 'st-nav-active'
                  : ''
              }`}
              onClick={() => changePage(item.id)}
            >

              <Icon name={item.icon} />

              <span>{item.label}</span>

            </button>

          ))}

        </nav>

        {/* SIDEBAR ACCOUNT */}

        <div className="st-sidebar-bottom">

          <div className="st-sidebar-profile">

            <div className="st-avatar">
              {studentInitials}
            </div>

            <div className="st-profile-text">

              <strong>
                {studentName}
              </strong>

              <small>
                Student Account
              </small>

            </div>

          </div>

          <button
            type="button"
            className="st-nav-item st-logout"
            onClick={handleLogout}
            aria-label="Sign out"
          >

            <Icon name="logout" />

            <span>Sign Out</span>

          </button>

        </div>

      </aside>

      {/* =====================================
          MAIN CONTENT
      ===================================== */}

      <main className="st-main">

        {/* TOPBAR */}

        <header className="st-topbar">

          <div className="st-topbar-left">

            <button
              type="button"
              className="st-icon-button"
              aria-label="Toggle sidebar"
              aria-expanded={sidebarOpen}
              onClick={() =>
                setSidebarOpen(previous => !previous)
              }
            >

              <Icon name="menu" />

            </button>

            <span>Student Portal</span>

            <span className="st-breadcrumb">
              /
            </span>

            <strong>{pageTitle}</strong>

          </div>

          <div className="st-topbar-right">

            <span className="st-term-badge">
              Term {loadedTerm}
            </span>

            <button
              type="button"
              className="st-avatar st-profile-button"
              aria-label="Open my profile"
              title="My Profile"
              onClick={() => changePage('profile')}
            >
              {studentInitials}
            </button>

          </div>

        </header>

        {/* DASHBOARD CONTENT */}

        <div className="st-content">

          {/* PAGE HEADING */}

          <div className="st-page-heading">

            <div>

              <p className="st-eyebrow">
                ACADEMIC WORKSPACE
              </p>

              <h1>{pageTitle}</h1>

              <p>
                {{
                  overview:
                    'Manage and view your academic information.',

                  registrations:
                    'View your current course registrations.',

                  courses:
                    'Explore available courses and class schedules.',

                  records:
                    'Track your grades and academic progress.',

                  profile:
                    'View your personal and university account information.',
                }[activePage]}
              </p>

            </div>

            {/* ACADEMIC TERM */}

            {activePage !== 'profile' && (

              <form
                className="st-term-form"
                onSubmit={handleLoadTerm}
              >

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
                  disabled={loading || !user}
                >

                  {loading
                    ? 'Loading...'
                    : 'Apply Term'}

                </button>

              </form>

            )}

          </div>

          {/* ERROR MESSAGE */}

          {error && activePage !== 'profile' && (

            <div
              className="st-error"
              role="alert"
            >
              {error}
            </div>

          )}

          {/* ACTIVE PAGE */}

          {renderContent()}

          {/* FOOTER */}

          <footer className="st-footer">

            Stamford International University
            · Course Registration System

          </footer>

        </div>

      </main>

    </div>

  )
}

export default StudentDashboard
