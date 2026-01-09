import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Polling interval in milliseconds (2 seconds)
const POLL_INTERVAL = 2000

export default function Meeting() {
  const { matchId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [meeting, setMeeting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  
  // Form state for new proposal
  const [location, setLocation] = useState('')
  const [proposedDate, setProposedDate] = useState('')
  const [proposedTime, setProposedTime] = useState('')

  const fetchMeeting = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/meetings/${matchId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!res.ok) {
        throw new Error('Failed to load meeting')
      }

      const data = await res.json()
      setMeeting(data.meeting)
      
      if (data.meeting && !location) {
        setLocation(data.meeting.location || '')
        setProposedDate(data.meeting.proposedDate || '')
        setProposedTime(data.meeting.proposedTime || '')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [matchId, location])

  // Initial fetch
  useEffect(() => {
    fetchMeeting(true)
  }, [matchId])

  // Polling for updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMeeting(false)
    }, POLL_INTERVAL)

    return () => clearInterval(interval)
  }, [fetchMeeting])

  async function handlePropose(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ matchId, location, proposedDate, proposedTime })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Failed to propose meeting')
      }

      await fetchMeeting(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleAccept() {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/meetings/${meeting.meetingId}/accept`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!res.ok) {
        throw new Error('Failed to accept meeting')
      }

      await fetchMeeting(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirm() {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/meetings/${meeting.meetingId}/confirm`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!res.ok) {
        throw new Error('Failed to confirm meeting')
      }

      await fetchMeeting(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-32 bg-gray-100 rounded"></div>
      </div>
    )
  }

  // No meeting yet - show proposal form
  if (!meeting) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/matches')}
          className="text-primary hover:text-primary-dark text-sm"
        >
          ← Back to Matches
        </button>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-dark mb-4">
            ☕ Propose a Coffee Meeting
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handlePropose} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meeting Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                placeholder="e.g., Blue Bottle Coffee, 123 Main St"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-gray-500 mt-1">
                Choose a public place like a coffee shop
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={proposedTime}
                  onChange={(e) => setProposedTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {saving ? 'Sending...' : 'Send Meeting Proposal'}
            </button>
          </form>
        </div>

        <div className="bg-secondary-light rounded-lg p-4 text-sm text-dark">
          <p className="font-medium mb-1">💡 Why meet in person?</p>
          <p>
            The coffee meeting is the heart of SkillSwap. It's not just verification—
            it's an opportunity to slow down, connect with a neighbor, and build trust
            before exchanging skills.
          </p>
        </div>
      </div>
    )
  }

  // Meeting exists - show details
  const isProposer = meeting.proposedBy === user?.id
  const canAccept = meeting.status === 'proposed' && !isProposer
  const canConfirm = meeting.status === 'scheduled' && !meeting.userConfirmed

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate('/matches')}
        className="text-primary hover:text-primary-dark text-sm"
      >
        ← Back to Matches
      </button>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-dark">
            ☕ Coffee Meeting with {meeting.otherUser.name}
          </h2>
          <StatusBadge status={meeting.status} />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📍</span>
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="text-dark font-medium">{meeting.location}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-2xl">📅</span>
            <div>
              <p className="text-sm text-gray-500">Date & Time</p>
              <p className="text-dark font-medium">
                {new Date(meeting.proposedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })} at {meeting.proposedTime}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-2xl">👤</span>
            <div>
              <p className="text-sm text-gray-500">Proposed by</p>
              <p className="text-dark font-medium">
                {isProposer ? 'You' : meeting.proposedByName}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons based on status */}
        {canAccept && (
          <div className="space-y-3">
            <button
              onClick={handleAccept}
              disabled={saving}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Accepting...' : '✓ Accept Meeting'}
            </button>
            <p className="text-center text-gray-500 text-sm">
              Or propose a different time by filling out the form above
            </p>
          </div>
        )}

        {meeting.status === 'proposed' && isProposer && (
          <div className="bg-amber-50 rounded-lg p-4 text-amber-800 text-sm">
            Waiting for {meeting.otherUser.name} to accept your proposal...
          </div>
        )}

        {canConfirm && (
          <div className="space-y-3">
            <div className="bg-blue-50 rounded-lg p-4 text-blue-800 text-sm mb-4">
              <p className="font-medium">Meeting scheduled!</p>
              <p>After you meet, both of you need to confirm the meeting happened.</p>
            </div>
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Confirming...' : '✓ Confirm Meeting Happened'}
            </button>
          </div>
        )}

        {meeting.status === 'scheduled' && meeting.userConfirmed && !meeting.otherConfirmed && (
          <div className="bg-amber-50 rounded-lg p-4 text-amber-800 text-sm">
            <p className="font-medium">You've confirmed!</p>
            <p>Waiting for {meeting.otherUser.name} to confirm...</p>
          </div>
        )}

        {meeting.status === 'completed' && (
          <div className="bg-green-50 rounded-lg p-4 text-green-800">
            <p className="font-medium text-lg mb-2">🎉 Meeting Verified!</p>
            <p className="mb-4">
              Both of you have confirmed the meeting. You can now exchange skills!
            </p>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <p className="text-sm text-green-700 mb-2">Contact {meeting.otherUser.name} to arrange your skill swap:</p>
              <p className="text-green-800">
                You met in person, so you can exchange contact info directly.
                The skill swap is now unlocked!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    proposed: 'bg-amber-100 text-amber-800',
    scheduled: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800'
  }

  const labels = {
    proposed: 'Proposed',
    scheduled: 'Scheduled',
    completed: 'Verified ✓'
  }

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
