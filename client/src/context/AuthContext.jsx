import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('token')
    if (token) {
      fetchUser(token)
    } else {
      setLoading(false)
    }
  }, [])

  async function fetchUser(token) {
    try {
      const res = await fetch('/api/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data)
      } else {
        localStorage.removeItem('token')
      }
    } catch (err) {
      console.error('Failed to fetch user:', err)
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  async function login(email, password) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      if (!res.ok) {
        let errorMessage = 'Login failed'
        try {
          const error = await res.json()
          errorMessage = error.message || errorMessage
        } catch {
          // Response wasn't JSON
          if (res.status === 401) {
            errorMessage = 'Invalid email or password'
          } else if (res.status === 400) {
            errorMessage = 'Please enter email and password'
          }
        }
        throw new Error(errorMessage)
      }
      
      const data = await res.json()
      localStorage.setItem('token', data.token)
      setUser(data.user)
      return data
    } catch (err) {
      // Handle network errors
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please try again.')
      }
      throw err
    }
  }

  async function register(email, password, name) {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      })
      
      if (!res.ok) {
        let errorMessage = 'Registration failed'
        try {
          const error = await res.json()
          errorMessage = error.message || errorMessage
        } catch {
          // Response wasn't JSON
          if (res.status === 409) {
            errorMessage = 'Email already exists'
          } else if (res.status === 400) {
            errorMessage = 'Please fill in all fields'
          }
        }
        throw new Error(errorMessage)
      }
      
      const data = await res.json()
      localStorage.setItem('token', data.token)
      setUser(data.user)
      return data
    } catch (err) {
      // Handle network errors
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please try again.')
      }
      throw err
    }
  }

  function logout() {
    localStorage.removeItem('token')
    setUser(null)
  }

  async function updateUser(updates) {
    const token = localStorage.getItem('token')
    const res = await fetch('/api/users/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    })
    
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.message || 'Update failed')
    }
    
    const data = await res.json()
    setUser(data)
    return data
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
