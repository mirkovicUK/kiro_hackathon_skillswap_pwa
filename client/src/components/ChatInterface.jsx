import { useState, useEffect, useCallback, useRef } from 'react'
import MessageList from './MessageList'
import MessageInput from './MessageInput'

/**
 * ChatInterface Component
 * Full-screen on mobile, modal on desktop
 * Header with match name and close button
 * Message list area with scroll
 * Fixed input area at bottom
 * 
 * Requirements: 2.1, 7.1
 */

// Polling interval for new messages (3 seconds)
const MESSAGE_POLL_INTERVAL = 3000

// Request push notification permission and register subscription
async function requestPushPermission() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    console.log('Push notifications not supported')
    return
  }

  if (Notification.permission === 'granted') {
    await registerPushSubscription()
    return
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      await registerPushSubscription()
    }
  }
}

// Register push subscription with server
async function registerPushSubscription() {
  try {
    const registration = await navigator.serviceWorker.ready
    
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription()
    
    if (!subscription) {
      // Create new subscription (using a placeholder VAPID key for demo)
      // In production, this would be a real VAPID public key
      const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
      
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        })
      } catch (e) {
        console.log('Push subscription failed (expected in dev):', e.message)
        return
      }
    }

    // Send subscription to server
    const token = localStorage.getItem('token')
    if (token && subscription) {
      await fetch('/api/chat/push-subscription', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth'))))
          }
        })
      })
      console.log('📬 Push subscription registered')
    }
  } catch (error) {
    console.log('Push subscription error:', error.message)
  }
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function ChatInterface({ matchId, currentUserId, otherUserName, isOpen, onClose }) {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const lastMessageIdRef = useRef(null)

  // Fetch messages
  const fetchMessages = useCallback(async (showLoading = false) => {
    if (!matchId) return

    if (showLoading) setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/chat/${matchId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!res.ok) {
        throw new Error('Failed to load messages')
      }

      const data = await res.json()
      setMessages(data.messages || [])
      
      // Track last message for polling
      if (data.messages?.length > 0) {
        lastMessageIdRef.current = data.messages[data.messages.length - 1].id
      }

      // Mark messages as read
      await fetch(`/api/chat/${matchId}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
    } catch (err) {
      setError(err.message)
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }, [matchId])

  // Initial fetch when chat opens
  useEffect(() => {
    if (isOpen && matchId) {
      fetchMessages(true)
      // Request push notification permission on first chat access
      requestPushPermission()
    }
  }, [isOpen, matchId, fetchMessages])

  // Poll for new messages when chat is open
  useEffect(() => {
    if (!isOpen || !matchId) return

    const interval = setInterval(() => {
      fetchMessages(false)
    }, MESSAGE_POLL_INTERVAL)

    return () => clearInterval(interval)
  }, [isOpen, matchId, fetchMessages])

  // Handle sending a message
  const handleSendMessage = async (content) => {
    const token = localStorage.getItem('token')
    
    // Optimistic update (use snake_case to match server response)
    const tempMessage = {
      id: `temp-${Date.now()}`,
      match_id: matchId,
      from_user_id: currentUserId,
      content,
      created_at: new Date().toISOString(),
      status: 'sending'
    }
    setMessages(prev => [...prev, tempMessage])

    try {
      const res = await fetch(`/api/chat/${matchId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed to send message')
      }

      const data = await res.json()
      
      // Replace temp message with real one from server (already snake_case)
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id ? data : msg
      ))
    } catch (err) {
      // Mark message as failed
      setMessages(prev => prev.map(msg =>
        msg.id === tempMessage.id ? { ...msg, status: 'failed' } : msg
      ))
      throw err
    }
  }

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when chat is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop for desktop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 hidden md:block"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Chat container */}
      <div
        className="fixed inset-0 z-50 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[500px] md:h-[600px] md:rounded-lg md:shadow-xl bg-white flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label={`Chat with ${otherUserName}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-primary text-white md:rounded-t-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-full transition-colors md:hidden"
              aria-label="Close chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="font-semibold">{otherUserName}</h2>
              <p className="text-xs text-white/80">Chat</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors hidden md:block"
            aria-label="Close chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-2 text-sm">
            {error}
            <button
              onClick={() => { setError(''); fetchMessages(true); }}
              className="ml-2 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Message list */}
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          isLoading={isLoading}
        />

        {/* Message input */}
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          placeholder={`Message ${otherUserName}...`}
        />
      </div>
    </>
  )
}
