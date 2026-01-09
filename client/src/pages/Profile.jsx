import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import SkillSelector from '../components/SkillSelector'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [name, setName] = useState('')
  const [offerSkills, setOfferSkills] = useState([])
  const [needSkills, setNeedSkills] = useState([])
  const [location, setLocation] = useState(null)
  const [manualLat, setManualLat] = useState('')
  const [manualLon, setManualLon] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setOfferSkills(user.skills?.offer || [])
      setNeedSkills(user.skills?.need || [])
      if (user.latitude && user.longitude) {
        setLocation({ latitude: user.latitude, longitude: user.longitude })
      }
      setLoading(false)
    }
  }, [user])

  async function handleSave() {
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const token = localStorage.getItem('token')

      // Update name if changed
      if (name !== user.name) {
        await fetch('/api/users/me', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name })
        })
      }

      // Update skills
      const skillsRes = await fetch('/api/users/me/skills', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ offer: offerSkills, need: needSkills })
      })

      if (!skillsRes.ok) {
        const err = await skillsRes.json()
        throw new Error(err.message || 'Failed to save skills')
      }

      // Refresh user data
      await updateUser({ name })
      setSuccess('Profile saved successfully!')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleGetLocation() {
    setError('')
    setGeoLoading(true)

    if (!navigator.geolocation) {
      // Fallback to default location if geolocation not supported
      await setDefaultLocation()
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          const token = localStorage.getItem('token')
          const res = await fetch('/api/users/me/location', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ latitude, longitude })
          })

          if (!res.ok) {
            throw new Error('Failed to save location')
          }

          setLocation({ latitude, longitude })
          setSuccess('Location updated!')
        } catch (err) {
          setError(err.message)
        } finally {
          setGeoLoading(false)
        }
      },
      async (err) => {
        // On error/timeout, use default location (NYC)
        console.log('Geolocation failed, using default location:', err.message)
        await setDefaultLocation()
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
    )
  }

  // Fallback to default location (NYC) for testing
  async function setDefaultLocation() {
    const latitude = 40.7128
    const longitude = -74.0060
    
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/users/me/location', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ latitude, longitude })
      })

      if (!res.ok) {
        throw new Error('Failed to save location')
      }

      setLocation({ latitude, longitude })
      setSuccess('Location set to default (NYC) for testing')
    } catch (err) {
      setError(err.message)
    } finally {
      setGeoLoading(false)
    }
  }

  // Handle manual coordinate input
  async function handleManualLocation() {
    setError('')
    setSuccess('')
    setGeoLoading(true)

    const latitude = parseFloat(manualLat)
    const longitude = parseFloat(manualLon)

    if (isNaN(latitude) || isNaN(longitude)) {
      setError('Please enter valid coordinates')
      setGeoLoading(false)
      return
    }

    if (latitude < -90 || latitude > 90) {
      setError('Latitude must be between -90 and 90')
      setGeoLoading(false)
      return
    }

    if (longitude < -180 || longitude > 180) {
      setError('Longitude must be between -180 and 180')
      setGeoLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/users/me/location', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ latitude, longitude })
      })

      if (!res.ok) {
        throw new Error('Failed to save location')
      }

      setLocation({ latitude, longitude })
      setManualLat('')
      setManualLon('')
      setSuccess('Location updated!')
    } catch (err) {
      setError(err.message)
    } finally {
      setGeoLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-10 bg-gray-100 rounded mb-4"></div>
          <div className="h-32 bg-gray-100 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-dark mb-4">Your Profile</h2>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {success}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-light text-gray-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-dark mb-4">📍 Your Location</h3>
        
        {location ? (
          <div className="mb-4">
            <p className="text-gray-700 text-sm">
              Location set: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              We'll show you neighbors within ~2 miles
            </p>
          </div>
        ) : (
          <p className="text-gray-700 text-sm mb-4">
            Share your location to find neighbors with matching skills
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={handleGetLocation}
            disabled={geoLoading}
            className="bg-secondary-light text-dark px-4 py-2 rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
          >
            {geoLoading ? 'Getting location...' : '📍 Auto-detect Location'}
          </button>
        </div>

        <div className="border-t border-gray-200 pt-4 mt-4">
          <p className="text-sm text-gray-700 mb-3">Or enter coordinates manually:</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs text-gray-500 mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                placeholder="e.g. 51.5074"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs text-gray-500 mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                placeholder="e.g. -0.1278"
                value={manualLon}
                onChange={(e) => setManualLon(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleManualLocation}
                disabled={geoLoading || !manualLat || !manualLon}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 text-sm"
              >
                Set Location
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Tip: Search "my coordinates" on Google to find your lat/long
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-dark mb-4">🛠️ Your Skills</h3>
        
        <div className="space-y-6">
          <SkillSelector
            selected={offerSkills}
            onChange={setOfferSkills}
            type="offer"
            disabled={saving}
          />

          <SkillSelector
            selected={needSkills}
            onChange={setNeedSkills}
            type="need"
            disabled={saving}
          />
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      {offerSkills.length > 0 && needSkills.length > 0 && location && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">✓ Profile Complete!</p>
          <p className="text-green-600 text-sm mt-1">
            You're ready to discover neighbors. Head to the Discover tab to find matches!
          </p>
        </div>
      )}

      {(!offerSkills.length || !needSkills.length || !location) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-800 font-medium">Complete your profile to find matches:</p>
          <ul className="text-amber-600 text-sm mt-2 space-y-1">
            {!location && <li>• Share your location</li>}
            {!offerSkills.length && <li>• Add skills you can offer</li>}
            {!needSkills.length && <li>• Add skills you need</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
