import PublicHeader from './PublicHeader'
import Footer from './Footer'
import CookieConsent from './CookieConsent'

export default function PublicLayout({ children, showFooter = true }) {
  return (
    <div className="min-h-screen flex flex-col bg-light">
      <PublicHeader />
      <main className="flex-grow">
        {children}
      </main>
      {showFooter && <Footer />}
      <CookieConsent />
    </div>
  )
}
