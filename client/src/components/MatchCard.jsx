import { useState } from 'react'

export default function MatchCard({ match, onInterested }) {
  const [loading, setLoading] = useState(false)

  async function handleInterested() {
    setLoading(true)
    try {
      await onInterested(match.userId)
    } finally {
      setLoading(false)
    }
  }

  const statusBadge = () => {
    if (match.myInterest && match.theirInterest) {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
          ✓ Mutual Match!
        </span>
      )
    }
    if (match.myInterest) {
      return (
        <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
          Waiting for response
        </span>
      )
    }
    if (match.theirInterest) {
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
          Interested in you!
        </span>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-dark text-lg">
            {match.name}
            {match.isDemoUser && (
              <span className="ml-2 text-xs text-gray-400">(Demo)</span>
            )}
          </h3>
          <p className="text-gray-500 text-sm">
            📍 {match.distance} miles away
          </p>
        </div>
        {statusBadge()}
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            They can help you with:
          </p>
          <div className="flex flex-wrap gap-1">
            {match.theyOffer.map(skill => (
              <span
                key={skill}
                className="px-2 py-1 bg-green-50 text-green-700 text-sm rounded"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            They need help with:
          </p>
          <div className="flex flex-wrap gap-1">
            {match.theyNeed.map(skill => (
              <span
                key={skill}
                className="px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {!match.myInterest && (
        <button
          onClick={handleInterested}
          disabled={loading}
          className="w-full bg-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {loading ? 'Sending...' : "☕ I'm Interested"}
        </button>
      )}

      {match.myInterest && match.theirInterest && (
        <a
          href={`/matches`}
          className="block w-full text-center bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          Schedule Coffee Meeting →
        </a>
      )}

      {match.myInterest && !match.theirInterest && (
        <p className="text-center text-gray-500 text-sm py-2">
          You've expressed interest. Waiting for {match.name} to respond.
        </p>
      )}
    </div>
  )
}
