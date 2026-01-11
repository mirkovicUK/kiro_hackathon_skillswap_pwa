import PublicLayout from '../components/PublicLayout'

export default function Privacy() {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-dark mb-8">Privacy Policy</h1>
        
        <div className="prose prose-lg max-w-none text-gray-700 space-y-8">
          <section>
            <p className="text-gray-500 text-sm mb-6">Last updated: January 2026</p>
            <p>
              At SkillSwap, we take your privacy seriously. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you use our application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-dark mt-8 mb-4">Information We Collect</h2>
            <p>We collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li><strong>Account Information:</strong> Email address, name, and password when you register</li>
              <li><strong>Profile Information:</strong> Skills you offer and skills you need</li>
              <li><strong>Location Data:</strong> Your geographic coordinates (with your permission) to find nearby matches</li>
              <li><strong>Meeting Information:</strong> Details about coffee meetings you schedule with other users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-dark mt-8 mb-4">How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Create and manage your account</li>
              <li>Match you with nearby users who have complementary skills</li>
              <li>Facilitate communication and meeting scheduling between matched users</li>
              <li>Improve and optimize our services</li>
              <li>Send you important updates about your account and matches</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-dark mt-8 mb-4">Data Storage and Security</h2>
            <p>
              Your data is stored securely using industry-standard encryption. We implement appropriate 
              technical and organizational measures to protect your personal information against unauthorized 
              access, alteration, disclosure, or destruction.
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Passwords are hashed using bcrypt encryption</li>
              <li>Session tokens are securely generated and expire after 24 hours</li>
              <li>Location data is only used for matching purposes and is not shared publicly</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-dark mt-8 mb-4">Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your account and associated data</li>
              <li>Withdraw consent for location tracking at any time</li>
              <li>Export your data in a portable format</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-dark mt-8 mb-4">Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or our data practices, please contact us 
              through our <a href="/contact" className="text-primary hover:underline">Contact page</a>.
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  )
}
