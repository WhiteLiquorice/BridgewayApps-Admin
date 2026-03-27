import { useSearchParams } from 'react-router-dom'

export default function Onboarding() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')

  return (
    <div className="min-h-screen bg-[#0c1a2e] flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-xl font-semibold text-white mb-2">Payment confirmed!</h1>
        <p className="text-sm text-gray-400 mb-6">
          Your Bridgeway account is being set up. Check your email for an invitation to set your password and log in.
        </p>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-6">
          <h2 className="text-sm font-medium text-white mb-2">What happens next</h2>
          <ul className="space-y-2 text-left">
            {[
              'You\'ll receive an email invitation within a few minutes',
              'Click the link to set your password',
              'Log in to your Admin dashboard to configure your practice',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                <span className="text-amber-500 font-semibold mt-0.5">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ul>
        </div>

        <a
          href="/login"
          className="inline-block px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-[#0c1a2e] text-sm font-semibold rounded-lg transition-colors"
        >
          Go to Login
        </a>

        {sessionId && (
          <p className="text-xs text-gray-600 mt-4">Session: {sessionId}</p>
        )}
      </div>
    </div>
  )
}
