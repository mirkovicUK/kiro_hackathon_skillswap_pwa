import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PublicHeader() {
  const { user } = useAuth()

  return (
    <header className="bg-dark text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo and App Name */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <img 
            src="/SkillSwap_logo.png" 
            alt="SkillSwap" 
            className="h-10 w-10 md:h-12 md:w-12" 
          />
          <span className="text-xl md:text-2xl font-bold">SkillSwap</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-4">
          {user ? (
            <Link
              to="/discover"
              className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors text-sm md:text-base"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors text-sm md:text-base"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
