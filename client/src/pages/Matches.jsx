import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'

// Polling interval in milliseconds (2 seconds)
const POLL_INTERVAL = 2000

export default function Matches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchMatches = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/matches', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!res.ok) {
        throw new Error('Failed to load matches')
      }

      const data = await res.json()
      setMatches(data.matches || [])
    } catch (err) {
      setError(err.message)
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchMatches(true)
  }, [])

  // Polling for updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMatches(false)
    }, POLL_INTERVAL)

    return () => clearInterval(interval)
  }, [fetchMatches])

  const getMeetingStatusBadge = (status) => {
    switch (status) {
      case 'proposed':
        return <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">Meeting Proposed</span>
      case 'scheduled':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Meeting Scheduled</span>
      case 'completed':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">✓ Verified</span>
      default:
        return <span className="px-2 py-1 bg-accent-light text-dark text-xs rounded-full">Schedule Meeting</span>
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-dark">Your Matches</h2>
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-dark">Your Matches</h2>
        <span className="text-gray-500 text-sm">{matches.length} mutual match{matches.length !== 1 ? 'es' : ''}</span>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {matches.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-700 mb-2">No mutual matches yet</p>
          <p className="text-gray-500 text-sm mb-4">
            When you and another neighbor both express interest, they'll appear here.
          </p>
          <Link
            to="/discover"
            className="inline-block bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            Discover Neighbors →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map(match => (
            <div
              key={match.matchId}
              className="bg-white rounded-lg shadow-md p-4 border border-gray-100"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-dark text-lg">
                    {match.otherUser.name}
                    {match.otherUser.isDemoUser && (
                      <span className="ml-2 text-xs text-gray-400">(Demo)</span>
                    )}
                  </h3>
                  {match.otherUser.distance && (
                    <p className="text-gray-500 text-sm">
                      📍 {match.otherUser.distance} miles away
                    </p>
                  )}
                </div>
                {getMeetingStatusBadge(match.meetingStatus)}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    You'll teach:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {match.skillsExchange.iGive.map(skill => (
                      <span
                        key={skill}
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    You'll learn:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {match.skillsExchange.iGet.map(skill => (
                      <span
                        key={skill}
                        className="px-2 py-1 bg-green-50 text-green-700 text-sm rounded"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <Link
                to={`/meeting/${match.matchId}`}
                className="block w-full text-center bg-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-dark transition-colors"
              >
                {match.meetingStatus === 'none' ? '☕ Schedule Coffee Meeting' : 'View Meeting Details'}
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="bg-secondary-light rounded-lg p-4 text-sm text-dark">
        <p className="font-medium mb-1">☕ The Coffee Meeting</p>
        <p>
          Before you can swap skills, you need to meet in person over coffee.
          This isn't just a formality—it's the heart of SkillSwap. The skill exchange
          is the excuse; human connection is the product.
        </p>
      </div>
    </div>
  )
}
