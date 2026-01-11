import { Link } from 'react-router-dom'
import PublicLayout from '../components/PublicLayout'
import { useAuth } from '../context/AuthContext'

export default function FrontPage() {
  const { user } = useAuth()

  return (
    <PublicLayout showFooter={true}>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-dark via-primary-dark to-primary overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-accent rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className="text-white">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Skills are better
                <span className="block text-accent">shared over coffee</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-lg">
                Connect with neighbors who have the skills you need. Trade your expertise. 
                But first—meet for coffee. Because real connections happen face to face.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {user ? (
                  <Link
                    to="/discover"
                    className="inline-flex items-center justify-center bg-accent text-dark px-8 py-4 rounded-lg font-bold text-lg hover:bg-accent-dark transition-colors shadow-lg"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="inline-flex items-center justify-center bg-accent text-dark px-8 py-4 rounded-lg font-bold text-lg hover:bg-accent-dark transition-colors shadow-lg"
                    >
                      Get Started Free
                    </Link>
                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center border-2 border-white text-white px-8 py-4 rounded-lg font-medium text-lg hover:bg-white hover:text-dark transition-colors"
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            </div>
            
            {/* Right: Visual Element */}
            <div className="hidden md:flex justify-center">
              <div className="relative">
                <div className="absolute -inset-4 bg-accent/20 rounded-full blur-2xl"></div>
                <img 
                  src="/SkillSwap_logo.png" 
                  alt="SkillSwap" 
                  className="relative w-64 h-64 lg:w-80 lg:h-80 drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-light py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-dark mb-4">
              How SkillSwap Works
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Four simple steps to start exchanging skills with your neighbors
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                icon: '👤',
                title: 'Create Profile',
                description: 'Sign up and list the skills you can offer and the skills you need'
              },
              {
                step: '02',
                icon: '🔍',
                title: 'Find Neighbors',
                description: 'Discover people within 2 miles who have complementary skills'
              },
              {
                step: '03',
                icon: '☕',
                title: 'Meet for Coffee',
                description: 'Schedule a mandatory coffee meeting to connect in person first'
              },
              {
                step: '04',
                icon: '🤝',
                title: 'Exchange Skills',
                description: 'After meeting, unlock the ability to exchange skills and help each other'
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                {/* Connector line */}
                {index < 3 && (
                  <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gray-300"></div>
                )}
                
                <div className="relative bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                    <span className="text-3xl">{item.icon}</span>
                  </div>
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-dark mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coffee Meeting Section - The Differentiator */}
      <section className="bg-accent-light py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block bg-accent text-dark px-4 py-1 rounded-full text-sm font-medium mb-4">
                What Makes Us Different
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-dark mb-6">
                The Coffee Meeting Isn't Optional—
                <span className="text-primary">It's the Point</span>
              </h2>
              <p className="text-gray-700 text-lg mb-6">
                In a world of instant transactions, we're intentionally slow. The mandatory 
                coffee meeting before any skill exchange isn't a hurdle—it's the heart of SkillSwap.
              </p>
              
              <div className="space-y-4">
                {[
                  { icon: '✓', title: 'Verification', text: 'Meet face-to-face to confirm who you\'re working with' },
                  { icon: '✓', title: 'Safety', text: 'Public meeting places ensure everyone feels secure' },
                  { icon: '✓', title: 'Connection', text: 'Build real relationships, not just transactions' }
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm">
                      {item.icon}
                    </span>
                    <div>
                      <span className="font-semibold text-dark">{item.title}:</span>
                      <span className="text-gray-700 ml-1">{item.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <div className="text-6xl mb-4 text-center">☕</div>
                <blockquote className="text-center">
                  <p className="text-xl text-gray-700 italic mb-4">
                    "The skill swap is the excuse. Human connection is the product."
                  </p>
                  <footer className="text-gray-500 text-sm">— The SkillSwap Philosophy</footer>
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-dark mb-4">
              Why Choose SkillSwap?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: '📍',
                title: 'Local Community',
                description: 'Connect with neighbors within 2 miles of your location'
              },
              {
                icon: '🔄',
                title: 'Mutual Matching',
                description: 'Both parties must express interest before connecting'
              },
              {
                icon: '✅',
                title: 'Verified Connections',
                description: 'In-person meetings ensure authentic interactions'
              },
              {
                icon: '💚',
                title: 'Free Forever',
                description: 'No hidden costs, no premium tiers—just community'
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className="text-center p-6 rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-dark mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-primary py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {user ? 'Continue Your Journey' : 'Ready to Meet Your Neighbors?'}
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            {user 
              ? 'Head to your dashboard to discover matches, schedule coffee meetings, and exchange skills with your neighbors.'
              : 'Join SkillSwap today and discover the skills hiding in your neighborhood. Your next coffee meeting could change everything.'
            }
          </p>
          <Link
            to={user ? '/discover' : '/register'}
            className="inline-flex items-center justify-center bg-white text-primary px-10 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            {user ? 'Go to Dashboard' : 'Get Started — It\'s Free'}
          </Link>
        </div>
      </section>
    </PublicLayout>
  )
}
