import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Footer from './Footer'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col bg-light">
      {/* Header */}
      <header className="bg-dark text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 md:gap-3 hover:opacity-90 transition-opacity">
            <img src="/SkillSwap_logo.png" alt="SkillSwap" className="h-8 w-8 md:h-10 md:w-10" />
            <h1 className="text-lg md:text-xl font-bold">SkillSwap</h1>
          </Link>
          <div className="flex items-center gap-2 md:gap-4">
            <span className="text-gray-300 text-xs md:text-sm hidden sm:inline">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-gray-300 hover:text-white text-xs md:text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Navigation */}
      <nav className="bg-primary-dark text-white hidden md:block">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1">
            <NavLink
              to="/discover"
              className={({ isActive }) =>
                `px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-200 hover:bg-primary hover:text-white'
                }`
              }
            >
              Discover
            </NavLink>
            <NavLink
              to="/matches"
              className={({ isActive }) =>
                `px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-200 hover:bg-primary hover:text-white'
                }`
              }
            >
              Matches
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-200 hover:bg-primary hover:text-white'
                }`
              }
            >
              Profile
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow max-w-4xl mx-auto px-4 py-4 md:py-6 w-full pb-20 md:pb-6">
        <Outlet />
      </main>

      {/* Footer - hidden on mobile due to bottom nav */}
      <div className="hidden md:block">
        <Footer />
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40">
        <div className="flex justify-around">
          <NavLink
            to="/discover"
            className={({ isActive }) =>
              `flex flex-col items-center py-2 px-4 text-xs ${
                isActive ? 'text-primary' : 'text-gray-500'
              }`
            }
          >
            <span className="text-xl mb-1">🔍</span>
            <span>Discover</span>
          </NavLink>
          <NavLink
            to="/matches"
            className={({ isActive }) =>
              `flex flex-col items-center py-2 px-4 text-xs ${
                isActive ? 'text-primary' : 'text-gray-500'
              }`
            }
          >
            <span className="text-xl mb-1">🤝</span>
            <span>Matches</span>
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center py-2 px-4 text-xs ${
                isActive ? 'text-primary' : 'text-gray-500'
              }`
            }
          >
            <span className="text-xl mb-1">👤</span>
            <span>Profile</span>
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
