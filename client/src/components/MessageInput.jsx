import { useState, useRef, useEffect } from 'react'

/**
 * MessageInput Component
 * Text input with send button
 * Character count indicator (500 max)
 * Send on Enter, newline on Shift+Enter
 * 
 * Requirements: 2.2, 9.4
 */
const MAX_LENGTH = 500

export default function MessageInput({ onSendMessage, disabled = false, placeholder = 'Type a message...' }) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [message])

  const handleSubmit = async (e) => {
    e?.preventDefault()
    
    const trimmedMessage = message.trim()
    if (!trimmedMessage || isSending || disabled) return

    setIsSending(true)
    try {
      await onSendMessage(trimmedMessage)
      setMessage('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleChange = (e) => {
    const value = e.target.value
    if (value.length <= MAX_LENGTH) {
      setMessage(value)
    }
  }

  const charCount = message.length
  const isNearLimit = charCount > MAX_LENGTH * 0.8
  const isAtLimit = charCount >= MAX_LENGTH

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 bg-white p-3">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isSending}
            rows={1}
            className="w-full px-4 py-2 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          {isNearLimit && (
            <span
              className={`absolute right-3 bottom-2 text-xs ${
                isAtLimit ? 'text-red-500' : 'text-gray-400'
              }`}
            >
              {charCount}/{MAX_LENGTH}
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={!message.trim() || isSending || disabled}
          className="p-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex-shrink-0"
          aria-label="Send message"
        >
          {isSending ? (
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          )}
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-1 px-1">
        Press Enter to send, Shift+Enter for new line
      </p>
    </form>
  )
}
