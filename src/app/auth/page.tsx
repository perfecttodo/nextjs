import Link from 'next/link';

export default function AuthDemoPage() {
  return (
    <div className=" py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Authentication System
          </h1>
          <p className="text-xl text-gray-600">
            Choose your preferred authentication method
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Sign Up Card */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">🚀</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
              <p className="text-gray-600">
                Sign up with email/password, Google, or GitHub
              </p>
            </div>
            <div className="space-y-4">
              <Link
                href="/auth/signup"
                className="w-full block text-center bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* Sign In Card */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">🔑</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h2>
              <p className="text-gray-600">
                Access your account with existing credentials
              </p>
            </div>
            <div className="space-y-4">
              <Link
                href="/auth/signin"
                className="w-full block text-center bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors font-medium"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Authentication Features
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-3">📧</div>
              <h4 className="font-semibold text-gray-900 mb-2">Email & Password</h4>
              <p className="text-gray-600 text-sm">
                Traditional authentication with secure password hashing
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-3">🔍</div>
              <h4 className="font-semibold text-gray-900 mb-2">Google OAuth</h4>
              <p className="text-gray-600 text-sm">
                Sign in with your Google account securely
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-3">🐙</div>
              <h4 className="font-semibold text-gray-900 mb-2">GitHub OAuth</h4>
              <p className="text-gray-600 text-sm">
                Connect with your GitHub account for easy access
              </p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
