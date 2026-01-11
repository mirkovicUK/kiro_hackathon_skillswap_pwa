import PublicLayout from '../components/PublicLayout'

export default function Terms() {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-dark mb-8">Terms of Service</h1>
        
        <div className="prose prose-lg max-w-none text-gray-700 space-y-8">
          <section>
            <p className="text-gray-500 text-sm mb-6">Last updated: January 2026</p>
            <p>
              Welcome to SkillSwap. By accessing or using our service, you agree to be bound by these 
              Terms of Service. Please read them carefully.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-dark mt-8 mb-4">Acceptance of Terms</h2>
            <p>
              By creating an account or using SkillSwap, you acknowledge that you have read, understood, 
              and agree to be bound by these Terms of Service. If you do not agree to these terms, 
              please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-dark mt-8 mb-4">Description of Service</h2>
            <p>
              SkillSwap is a platform that connects neighbors for skill exchanges. Our unique approach 
              requires users to meet in person for a coffee meeting before any skill exchange can occur. 
              This mandatory meeting serves to:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Verify user identities through face-to-face interaction</li>
              <li>Ensure safety by meeting in public locations</li>
              <li>Foster genuine community connections</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-dark mt-8 mb-4">User Responsibilities</h2>
            <p>As a user of SkillSwap, you agree to:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Provide accurate and truthful information in your profile</li>
              <li>Represent your skills honestly and accurately</li>
              <li>Attend scheduled coffee meetings or provide reasonable notice if you cannot</li>
              <li>Treat other users with respect and courtesy</li>
              <li>Meet in safe, public locations for coffee meetings</li>
              <li>Not use the platform for any illegal or unauthorized purpose</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-dark mt-8 mb-4">Prohibited Activities</h2>
            <p>You may not use SkillSwap to:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Harass, abuse, or harm other users</li>
              <li>Impersonate another person or entity</li>
              <li>Post false, misleading, or fraudulent content</li>
              <li>Solicit money or commercial services outside of skill exchanges</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Attempt to gain unauthorized access to other accounts or systems</li>
              <li>Use automated systems or bots to access the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-dark mt-8 mb-4">Limitation of Liability</h2>
            <p>
              SkillSwap provides a platform for users to connect but is not responsible for:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>The quality or outcome of skill exchanges between users</li>
              <li>User conduct during or after coffee meetings</li>
              <li>Any disputes between users</li>
              <li>Loss or damage resulting from use of the service</li>
            </ul>
            <p className="mt-4">
              The service is provided "as is" without warranties of any kind, either express or implied.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-dark mt-8 mb-4">Modifications to Terms</h2>
            <p>
              We reserve the right to modify these Terms of Service at any time. We will notify users 
              of significant changes by posting a notice on our platform. Your continued use of SkillSwap 
              after changes are posted constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-dark mt-8 mb-4">Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us through 
              our <a href="/contact" className="text-primary hover:underline">Contact page</a>.
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  )
}
