import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import MatchCard from '../components/MatchCard'

// Polling interval in milliseconds (2 seconds)
const POLL_INTERVAL = 2000

export default function Discover() {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchMatches = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/matches/discover', {
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

  async function handleInterested(targetUserId) {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/matches/${targetUserId}/interest`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!res.ok) {
        throw new Error('Failed to express interest')
      }

      const data = await res.json()

      // Update local state
      setMatches(prev => prev.map(m => {
        if (m.userId === targetUserId) {
          return {
            ...m,
            myInterest: true,
            // If mutual, update theirInterest too
            ...(data.status === 'mutual' ? { theirInterest: true } : {})
          }
        }
        return m
      }))

      if (data.status === 'mutual') {
        // Could show a toast/notification here
      }
    } catch (err) {
      setError(err.message)
    }
  }

  // Check if profile is complete
  const profileComplete = user?.latitude && 
    user?.skills?.offer?.length > 0 && 
    user?.skills?.need?.length > 0

  if (!profileComplete) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-amber-800 mb-2">
          Complete Your Profile First
        </h2>
        <p className="text-amber-700 mb-4">
          To discover neighbors with matching skills, you need to:
        </p>
        <ul className="text-amber-600 space-y-1 mb-4">
          {!user?.latitude && <li>• Share your location</li>}
          {!user?.skills?.offer?.length && <li>• Add skills you can offer</li>}
          {!user?.skills?.need?.length && <li>• Add skills you need</li>}
        </ul>
        <a
          href="/profile"
          className="inline-block bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
        >
          Go to Profile →
        </a>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-dark">Discover Neighbors</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-4"></div>
              <div className="h-20 bg-light rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-dark">Discover Neighbors</h2>
        <button
          onClick={() => fetchMatches(true)}
          className="text-primary hover:text-primary-dark text-sm"
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {matches.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-700 mb-2">No matches found nearby</p>
          <p className="text-gray-500 text-sm">
            We're looking for neighbors within 2 miles who have skills you need
            and need skills you offer. Check back later or update your skills!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {matches.map(match => (
            <MatchCard
              key={match.userId}
              match={match}
              onInterested={handleInterested}
            />
          ))}
        </div>
      )}

      <div className="bg-secondary-light rounded-lg p-4 text-sm text-dark">
        <p className="font-medium mb-1">💡 How matching works:</p>
        <p>
          We show you neighbors within 2 miles who offer skills you need AND need
          skills you offer. When you both express interest, you can schedule a
          coffee meeting to get to know each other before swapping skills!
        </p>
      </div>
    </div>
  )
}
