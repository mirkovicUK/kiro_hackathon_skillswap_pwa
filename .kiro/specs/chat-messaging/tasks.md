# Implementation Plan: Chat Messaging

## Overview

This implementation plan breaks down the chat messaging feature into discrete coding tasks. The approach prioritizes backend infrastructure first, then frontend components, followed by demo user behavior, and finally integration testing.

## Tasks

- [x] 1. Database schema and migrations
  - [x] 1.1 Add messages table to database schema ✅
    - Create messages table with id, match_id, from_user_id, to_user_id, content, is_read, is_from_demo, created_at
    - Add indexes for match_id and unread queries
    - _Requirements: 5.3, 5.4_
  - [x] 1.2 Add chat_sessions table to database schema ✅
    - Create chat_sessions table with match_id, user1_id, user2_id, unread counts, conversation_stage
    - _Requirements: 5.1, 10.6_
  - [x] 1.3 Add push_subscriptions table to database schema ✅
    - Create push_subscriptions table with user_id, endpoint, keys
    - _Requirements: 4.1, 4.2_

- [x] 2. ChatService backend implementation
  - [x] 2.1 Create ChatService with sendMessage method
    - Implement message creation with validation
    - Verify mutual interest before allowing message
    - Update chat session and unread counters
    - _Requirements: 1.1, 2.3, 8.1_
  - [x] 2.2 Write property test for chat access control
    - **Property 1: Chat Access Control**
    - **Validates: Requirements 1.1, 1.2, 1.3, 8.1, 10.1, 10.2**
  - [x] 2.3 Implement getMessages method with pagination
    - Load messages for a match with limit/offset
    - Return messages in chronological order
    - _Requirements: 5.1, 5.2, 2.6_
  - [x] 2.4 Write property test for message persistence round-trip
    - **Property 2: Message Persistence Round-Trip**
    - **Validates: Requirements 2.3, 2.4, 5.3, 5.4**
  - [x] 2.5 Write property test for message chronological ordering
    - **Property 3: Message Chronological Ordering**
    - **Validates: Requirements 2.6, 5.6**
  - [x] 2.6 Implement markMessagesAsRead and getUnreadCount methods
    - Mark messages as read for a user in a match
    - Calculate unread count for a user
    - _Requirements: 3.2, 10.6_
  - [x] 2.7 Write property test for unread counter consistency
    - **Property 4: Unread Counter Consistency**
    - **Validates: Requirements 3.2, 10.6**

- [x] 3. Chat API routes
  - [x] 3.1 Create chat routes file with authentication middleware
    - POST /api/chat/:matchId/messages - Send message
    - GET /api/chat/:matchId/messages - Get message history
    - POST /api/chat/:matchId/read - Mark messages as read
    - GET /api/chat/unread - Get all unread counts
    - _Requirements: 2.1, 5.1, 8.1_
  - [x] 3.2 Implement message validation middleware
    - Validate message length (max 500 chars)
    - Sanitize content to prevent XSS
    - Reject empty messages
    - _Requirements: 8.6, 9.4_
  - [x] 3.3 Write property test for message validation
    - **Property 7: Message Validation**
    - **Validates: Requirements 8.6, 9.4**
  - [x] 3.4 Implement chat privacy checks
    - Verify user is part of the match before allowing access
    - Return 403 for unauthorized access attempts
    - _Requirements: 8.3, 8.4_
  - [x] 3.5 Write property test for chat privacy isolation
    - **Property 8: Chat Privacy Isolation**
    - **Validates: Requirements 8.3, 8.4**

- [x] 4. Checkpoint - Backend core complete
  - Ensure all backend tests pass
  - Verify API endpoints work with manual testing
  - Ask the user if questions arise

- [x] 5. DemoResponseService implementation
  - [x] 5.1 Create DemoResponseService with response pools
    - Define greeting, skill_discussion, meeting_coordination, busy_response arrays
    - Implement response selection based on conversation stage
    - _Requirements: 6.2, 6.3, 6.5_
  - [x] 5.2 Implement conversation stage progression logic
    - Track message count per conversation
    - Progress through stages: greeting (0-2) → skill_discussion (3-6) → meeting_coordination (7-10) → busy_response (11+)
    - _Requirements: 6.4, 6.6_
  - [x] 5.3 Write property test for demo conversation stage progression
    - **Property 6: Demo Conversation Stage Progression**
    - **Validates: Requirements 6.2, 6.3, 6.4, 6.6**
  - [x] 5.4 Implement delayed response scheduling
    - Schedule responses with random delays (10-30 seconds for 20%, 1-3 minutes for 50%, etc.)
    - Use setTimeout for demo response timing
    - _Requirements: 6.1, 6.7_
  - [x] 5.5 Write property test for demo user response timing
    - **Property 5: Demo User Response Timing**
    - **Validates: Requirements 6.1, 6.7**
  - [x] 5.6 Integrate DemoResponseService with ChatService
    - Trigger demo response when real user messages demo user
    - Store demo responses in messages table
    - _Requirements: 6.1_

- [x] 6. Checkpoint - Demo behavior complete
  - Ensure demo response tests pass
  - Test demo conversation flow manually
  - Ask the user if questions arise

- [x] 7. Frontend ChatButton component
  - [x] 7.1 Create ChatButton component
    - Display chat icon with unread badge
    - Only show for mutual matches
    - Handle click to open chat interface
    - _Requirements: 1.3, 1.4, 10.1_
  - [x] 7.2 Integrate ChatButton into Matches page
    - Add ChatButton to each mutual match card
    - Fetch and display unread counts
    - _Requirements: 10.1, 10.6_

- [x] 8. Frontend ChatInterface component
  - [x] 8.1 Create ChatInterface modal/overlay component
    - Full-screen on mobile, modal on desktop
    - Header with match name and close button
    - Message list area with scroll
    - Fixed input area at bottom
    - _Requirements: 2.1, 7.1_
  - [x] 8.2 Create MessageList component
    - Display messages with sender alignment (own messages right, theirs left)
    - Show timestamps in user-friendly format
    - Implement scroll to bottom on new messages
    - _Requirements: 2.6, 5.5_
  - [x] 8.3 Create MessageInput component
    - Text input with send button
    - Character count indicator (500 max)
    - Send on Enter, newline on Shift+Enter
    - Disable when sending
    - _Requirements: 2.2, 9.4_
  - [x] 8.4 Implement message sending and optimistic updates
    - Show message immediately with "sending" status
    - Update to "sent" on success
    - Handle errors with retry option
    - _Requirements: 2.3, 2.4, 9.3_

- [x] 9. Real-time messaging with polling
  - [x] 9.1 Implement polling for new messages
    - Poll every 3 seconds when chat is open
    - Fetch only messages newer than last received
    - Update message list without full reload
    - _Requirements: 3.1, 3.5_
  - [x] 9.2 Implement unread count polling on Matches page
    - Poll every 10 seconds for unread counts
    - Update badge counts on ChatButtons
    - _Requirements: 3.2, 10.6_

- [x] 10. Checkpoint - Frontend chat complete
  - Ensure chat interface works on mobile and desktop
  - Test full message flow with demo users
  - Ask the user if questions arise

- [x] 11. Push notifications
  - [x] 11.1 Update service worker for push notifications
    - Handle push events and display notifications
    - Handle notification click to open chat
    - _Requirements: 4.2, 4.4_
  - [x] 11.2 Implement push subscription registration
    - Request notification permission on first chat access
    - Store subscription in push_subscriptions table
    - _Requirements: 4.1_
  - [x] 11.3 Implement NotificationService
    - Send push notifications for new messages
    - Only send when recipient not viewing chat
    - Include sender name and message preview
    - _Requirements: 4.2, 4.3, 4.5_
  - [x] 11.4 Write property test for push notification delivery rules
    - **Property 10: Push Notification Delivery Rules**
    - **Validates: Requirements 4.2, 4.3, 4.5**

- [x] 12. Chat persistence through meeting flow
  - [x] 12.1 Ensure chat remains accessible during meeting scheduling
    - Verify chat works when meeting is proposed
    - Verify chat works when meeting is scheduled
    - _Requirements: 10.3, 10.4_
  - [x] 12.2 Ensure chat remains accessible after meeting completion
    - Verify chat history persists after meeting confirmed
    - Verify users can continue chatting after swap
    - _Requirements: 1.5, 1.6, 10.5_
  - [x] 12.3 Write property test for chat persistence through meeting flow
    - **Property 9: Chat Persistence Through Meeting Flow**
    - **Validates: Requirements 1.5, 1.6, 10.3, 10.4, 10.5**

- [x] 13. Final checkpoint - All tests pass
  - Run all property tests and ensure they pass
  - Run all unit tests and ensure they pass
  - Test complete flow: match → chat → schedule meeting → complete meeting → continue chat
  - Ask the user if questions arise

## Notes

- All tasks including property tests are required for comprehensive testing
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (10 properties total)
- Polling is used instead of WebSocket for simplicity (can upgrade later)
- Demo user responses use setTimeout for realistic timing delays
