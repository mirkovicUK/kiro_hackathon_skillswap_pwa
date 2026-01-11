import { useEffect, useRef } from 'react'

/**
 * MessageList Component
 * Displays messages with sender alignment (own messages right, theirs left)
 * Shows timestamps in user-friendly format
 * Auto-scrolls to bottom on new messages
 * 
 * Requirements: 2.6, 5.5
 */
export default function MessageList({ messages, currentUserId, isLoading }) {
  const messagesEndRef = useRef(null)
  const containerRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading messages...</div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center text-gray-500">
          <p className="mb-2">No messages yet</p>
          <p className="text-sm">Start the conversation!</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-3"
    >
      {messages.map((message, index) => {
        const isOwn = message.from_user_id === currentUserId
        const showTimestamp = index === 0 || 
          new Date(message.created_at) - new Date(messages[index - 1].created_at) > 300000 // 5 min gap

        return (
          <div key={message.id || index}>
            {showTimestamp && (
              <div className="text-center text-xs text-gray-400 my-2">
                {formatTimestamp(message.created_at)}
              </div>
            )}
            <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                  isOwn
                    ? 'bg-primary text-white rounded-br-md'
                    : 'bg-gray-100 text-dark rounded-bl-md'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
                {message.status === 'sending' && (
                  <span className="text-xs opacity-70 mt-1 block">Sending...</span>
                )}
              </div>
            </div>
          </div>
        )
      })}
      <div ref={messagesEndRef} />
    </div>
  )
}
