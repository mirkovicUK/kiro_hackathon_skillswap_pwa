import PublicLayout from '../components/PublicLayout'

export default function Cookies() {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-dark mb-8">Cookie Policy</h1>
        
        <div className="prose prose-lg max-w-none text-gray-700 space-y-8">
          <section>
            <p className="text-gray-500 text-sm mb-6">Last updated: January 2026</p>
            <p>
              This Cookie Policy explains how SkillSwap uses cookies and similar technologies 
              to recognize you when you visit our application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-dark mt-8 mb-4">What Are Cookies?</h2>
            <p>
              Cookies are small data files that are placed on your computer or mobile device when 
              you visit a website or use an application. Cookies are widely used to make websites 
              and apps work more efficiently and to provide information to the owners.
            </p>
            <p className="mt-4">
              We also use similar technologies like localStorage to store information locally on 
              your device to improve your experience.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-dark mt-8 mb-4">Types of Cookies We Use</h2>
            
            <div className="mt-6">
              <h3 className="text-xl font-medium text-dark mb-3">Essential Cookies</h3>
              <p>
                These cookies are necessary for the application to function properly. They enable 
                core functionality such as:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>User authentication and session management</li>
                <li>Security features</li>
                <li>Remembering your login status</li>
              </ul>
            </div>

            <div className="mt-6">
              <h3 className="text-xl font-medium text-dark mb-3">Preference Cookies</h3>
              <p>
                These cookies remember your preferences and choices, such as:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Your cookie consent preference</li>
                <li>Display preferences</li>
              </ul>
            </div>

            <div className="mt-6">
              <h3 className="text-xl font-medium text-dark mb-3">Local Storage</h3>
              <p>
                We use browser localStorage to store:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Authentication tokens for keeping you logged in</li>
                <li>Cookie consent preferences</li>
                <li>PWA installation preferences</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-dark mt-8 mb-4">How to Manage Cookies</h2>
            <p>
              You can control and manage cookies in several ways:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>
                <strong>Browser Settings:</strong> Most browsers allow you to refuse or accept cookies 
                through their settings. Check your browser's help section for instructions.
              </li>
              <li>
                <strong>Cookie Consent:</strong> When you first visit SkillSwap, you can choose to 
                accept or decline non-essential cookies through our consent banner.
              </li>
              <li>
                <strong>Clear Data:</strong> You can clear cookies and localStorage data through 
                your browser settings at any time.
              </li>
            </ul>
            <p className="mt-4 text-amber-700 bg-amber-50 p-4 rounded-lg">
              <strong>Note:</strong> Disabling essential cookies may affect the functionality of 
              SkillSwap and prevent you from using certain features like staying logged in.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-dark mt-8 mb-4">Changes to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in our practices 
              or for other operational, legal, or regulatory reasons. We encourage you to review 
              this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-dark mt-8 mb-4">Contact Us</h2>
            <p>
              If you have any questions about our use of cookies, please contact us through 
              our <a href="/contact" className="text-primary hover:underline">Contact page</a>.
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  )
}
