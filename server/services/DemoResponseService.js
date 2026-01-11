/**
 * DemoResponseService - Generates realistic automated responses for demo users
 * Creates human-like conversation flow through staged responses
 */

import { db } from '../db.js'
import { ChatService } from './ChatService.js'

// Response pools for different conversation stages
const RESPONSE_POOLS = {
  greeting: [
    "Hi! I saw we matched - excited to learn more about your skills!",
    "Hello! Your skills look really impressive.",
    "Hey there! I think we could really help each other out.",
    "Hi! Great to connect with you. I've been looking for someone with your skills.",
    "Hello! I noticed we're a good match - looking forward to chatting!",
    "Hey! Nice to meet you. Your profile caught my attention.",
    "Hi there! Excited about our skill match!",
    "Hello! I think we could have a great exchange."
  ],
  skill_discussion: [
    "I've been looking for someone to help with that for a while now.",
    "How long have you been doing this? I'm always curious about people's backgrounds.",
    "I'd love to trade expertise - sounds like a great match!",
    "That's exactly what I need help with. What got you into this?",
    "Your experience sounds perfect for what I'm looking for.",
    "I've tried learning this myself but could really use some guidance.",
    "This is great - I think we can really help each other out.",
    "I'm impressed by your skills. I'd be happy to share what I know too.",
    "Sounds like we're a perfect match! I'm excited to learn from you.",
    "I've been wanting to improve in this area. Your help would be amazing."
  ],
  meeting_coordination: [
    "Should we set up that coffee meeting? I'm pretty flexible with timing.",
    "I'm free most afternoons this week if you want to grab coffee.",
    "Looking forward to meeting in person! Why don't you pick the place - I'm flexible.",
    "How about we meet for coffee soon? I know a few good spots nearby.",
    "I think it would be great to meet up. When works for you?",
    "Ready to schedule our coffee meeting whenever you are!",
    "Let's find a time to meet. I'm available most days this week.",
    "Would love to chat more in person. Coffee sounds perfect!",
    "I'm excited to meet! Just let me know what time works best.",
    "Shall we pick a coffee shop? I'm open to suggestions."
  ],
  busy_response: [
    "Sorry, I'm getting pretty busy with work this week. Let's definitely meet up soon though!",
    "I'm excited about our coffee meeting! I might be slow to respond for a bit.",
    "Thanks for being patient with my responses - looking forward to our meeting!",
    "Apologies for the delayed response - busy period at work. Still keen to meet!",
    "Sorry, things are hectic right now. Can't wait for our coffee chat though!",
    "I'll be a bit slow to respond this week, but definitely still want to meet up.",
    "Work's been crazy but I'm still looking forward to our skill exchange!",
    "Bear with me on response times - excited about meeting you though!",
    "Busy week ahead but our coffee meeting is on my calendar!",
    "Sorry for any delays - really looking forward to connecting in person soon."
  ]
}

// Timing distribution for responses (in milliseconds)
// Very fast responses for instant demo experience
const TIMING_DISTRIBUTION = [
  { weight: 70, minDelay: 500, maxDelay: 1500 },      // 70% - 0.5-1.5 seconds (instant)
  { weight: 25, minDelay: 1500, maxDelay: 3000 },     // 25% - 1.5-3 seconds (quick)
  { weight: 5, minDelay: 3000, maxDelay: 5000 }       // 5% - 3-5 seconds (normal)
]

// Active scheduled responses (in-memory for simplicity)
const scheduledResponses = new Map()

export class DemoResponseService {
  /**
   * Get a random response for the current conversation stage
   * @param {string} stage - Conversation stage
   * @returns {string} Response text
   */
  static getResponseForStage(stage) {
    const pool = RESPONSE_POOLS[stage] || RESPONSE_POOLS.greeting
    const randomIndex = Math.floor(Math.random() * pool.length)
    return pool[randomIndex]
  }

  /**
   * Determine conversation stage based on message count
   * @param {number} messageCount 
   * @returns {string} Stage name
   */
  static determineStage(messageCount) {
    if (messageCount >= 11) return 'busy_response'
    if (messageCount >= 7) return 'meeting_coordination'
    if (messageCount >= 3) return 'skill_discussion'
    return 'greeting'
  }

  /**
   * Calculate a random delay based on timing distribution
   * @returns {number} Delay in milliseconds
   */
  static calculateDelay() {
    const random = Math.random() * 100
    let cumulative = 0
    
    for (const tier of TIMING_DISTRIBUTION) {
      cumulative += tier.weight
      if (random <= cumulative) {
        return tier.minDelay + Math.random() * (tier.maxDelay - tier.minDelay)
      }
    }
    
    // Fallback to quick response
    return 1000
  }

  /**
   * Generate and schedule a demo response
   * @param {string} matchId 
   * @param {number} demoUserId - The demo user who will respond
   * @param {string} userMessage - The message from the real user (for context)
   */
  static scheduleResponse(matchId, demoUserId, userMessage) {
    // Cancel any existing scheduled response for this match
    const existingTimeout = scheduledResponses.get(matchId)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Get current message count to determine stage
    const messageCount = ChatService.getMessageCount(matchId)
    const stage = this.determineStage(messageCount)
    
    // Calculate delay
    const delay = this.calculateDelay()
    
    // Schedule the response
    const timeoutId = setTimeout(() => {
      this.sendDemoResponse(matchId, demoUserId, stage)
      scheduledResponses.delete(matchId)
    }, delay)

    scheduledResponses.set(matchId, timeoutId)
    
    console.log(`📨 Demo response scheduled for match ${matchId} in ${Math.round(delay/1000)}s (stage: ${stage})`)
  }

  /**
   * Send a demo response
   * @param {string} matchId 
   * @param {number} demoUserId 
   * @param {string} stage 
   */
  static sendDemoResponse(matchId, demoUserId, stage) {
    try {
      const response = this.getResponseForStage(stage)
      ChatService.sendMessage(demoUserId, matchId, response, true)
      ChatService.updateConversationStage(matchId)
      console.log(`✅ Demo response sent for match ${matchId}: "${response.substring(0, 50)}..."`)
    } catch (error) {
      console.error(`❌ Failed to send demo response for match ${matchId}:`, error)
    }
  }

  /**
   * Check if a user is a demo user
   * @param {number} userId 
   * @returns {boolean}
   */
  static isDemoUser(userId) {
    const user = db.prepare('SELECT is_demo_user FROM users WHERE id = ?').get(userId)
    return user?.is_demo_user === 1
  }

  /**
   * Handle a new message and trigger demo response if needed
   * Called after a real user sends a message
   * @param {string} matchId 
   * @param {number} fromUserId - The user who sent the message
   */
  static handleNewMessage(matchId, fromUserId) {
    // Get the other user in the match
    const otherUserId = ChatService.getOtherUserId(fromUserId, matchId)
    
    // Check if the other user is a demo user
    if (this.isDemoUser(otherUserId)) {
      // Schedule a demo response
      this.scheduleResponse(matchId, otherUserId, '')
    }
  }

  /**
   * Cancel any scheduled response for a match
   * @param {string} matchId 
   */
  static cancelScheduledResponse(matchId) {
    const timeoutId = scheduledResponses.get(matchId)
    if (timeoutId) {
      clearTimeout(timeoutId)
      scheduledResponses.delete(matchId)
    }
  }

  /**
   * Get all response pools (for testing)
   * @returns {Object}
   */
  static getResponsePools() {
    return RESPONSE_POOLS
  }

  /**
   * Get timing distribution (for testing)
   * @returns {Array}
   */
  static getTimingDistribution() {
    return TIMING_DISTRIBUTION
  }
}
