import { Link } from 'react-router-dom'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-dark text-white py-8 mt-auto">
      <div className="max-w-4xl mx-auto px-4">
        {/* Links */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 mb-6">
          <Link 
            to="/privacy" 
            className="text-gray-300 hover:text-white text-sm transition-colors"
          >
            Privacy Policy
          </Link>
          <Link 
            to="/terms" 
            className="text-gray-300 hover:text-white text-sm transition-colors"
          >
            Terms of Service
          </Link>
          <Link 
            to="/contact" 
            className="text-gray-300 hover:text-white text-sm transition-colors"
          >
            Contact
          </Link>
          <Link 
            to="/cookies" 
            className="text-gray-300 hover:text-white text-sm transition-colors"
          >
            Cookie Policy
          </Link>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 mb-6"></div>

        {/* Copyright */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            © {currentYear} SkillSwap. All rights reserved.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Connecting neighbors through skill exchange and coffee meetings.
          </p>
        </div>
      </div>
    </footer>
  )
}
