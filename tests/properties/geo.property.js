/**
 * Property Tests for Geolocation Service
 * Feature: skillswap-pwa
 * Properties: 8 (Haversine Distance Accuracy)
 */

import { describe, test, expect } from 'vitest'
import fc from 'fast-check'
import { GeoService } from '../../server/services/GeoService.js'

describe('Property Tests: GeoService', () => {
  /**
   * Property 8: Haversine Distance Accuracy
   * For any two coordinate pairs with known distances, the Haversine calculation
   * SHALL return a distance accurate to within 1% of the actual great-circle distance.
   * Validates: Requirements 4.3
   */
  describe('Property 8: Haversine Distance Accuracy', () => {
    // Known distance pairs for verification
    const knownDistances = [
      // New York to Los Angeles: ~2,451 miles
      { lat1: 40.7128, lon1: -74.0060, lat2: 34.0522, lon2: -118.2437, expected: 2451, tolerance: 25 },
      // London to Paris: ~213 miles
      { lat1: 51.5074, lon1: -0.1278, lat2: 48.8566, lon2: 2.3522, expected: 213, tolerance: 5 },
      // Sydney to Melbourne: ~443 miles (great circle distance)
      { lat1: -33.8688, lon1: 151.2093, lat2: -37.8136, lon2: 144.9631, expected: 443, tolerance: 10 },
      // Same point: 0 miles
      { lat1: 40.7128, lon1: -74.0060, lat2: 40.7128, lon2: -74.0060, expected: 0, tolerance: 0.001 },
      // Short distance (~1 mile)
      { lat1: 40.7128, lon1: -74.0060, lat2: 40.7273, lon2: -74.0060, expected: 1, tolerance: 0.1 },
    ]

    test('Known distances are accurate within tolerance', () => {
      for (const { lat1, lon1, lat2, lon2, expected, tolerance } of knownDistances) {
        const calculated = GeoService.calculateDistance(lat1, lon1, lat2, lon2)
        expect(Math.abs(calculated - expected)).toBeLessThanOrEqual(tolerance)
      }
    })

    test('Distance is always non-negative', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -90, max: 90, noNaN: true }),
          fc.double({ min: -180, max: 180, noNaN: true }),
          fc.double({ min: -90, max: 90, noNaN: true }),
          fc.double({ min: -180, max: 180, noNaN: true }),
          (lat1, lon1, lat2, lon2) => {
            const distance = GeoService.calculateDistance(lat1, lon1, lat2, lon2)
            return distance >= 0
          }
        ),
        { numRuns: 100 }
      )
    })

    test('Distance is symmetric (A to B = B to A)', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -90, max: 90, noNaN: true }),
          fc.double({ min: -180, max: 180, noNaN: true }),
          fc.double({ min: -90, max: 90, noNaN: true }),
          fc.double({ min: -180, max: 180, noNaN: true }),
          (lat1, lon1, lat2, lon2) => {
            const d1 = GeoService.calculateDistance(lat1, lon1, lat2, lon2)
            const d2 = GeoService.calculateDistance(lat2, lon2, lat1, lon1)
            return Math.abs(d1 - d2) < 0.0001 // Allow tiny floating point differences
          }
        ),
        { numRuns: 100 }
      )
    })

    test('Same point has zero distance', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -90, max: 90, noNaN: true }),
          fc.double({ min: -180, max: 180, noNaN: true }),
          (lat, lon) => {
            const distance = GeoService.calculateDistance(lat, lon, lat, lon)
            return distance < 0.0001
          }
        ),
        { numRuns: 100 }
      )
    })

    test('Maximum distance is less than half Earth circumference (~12,450 miles)', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -90, max: 90, noNaN: true }),
          fc.double({ min: -180, max: 180, noNaN: true }),
          fc.double({ min: -90, max: 90, noNaN: true }),
          fc.double({ min: -180, max: 180, noNaN: true }),
          (lat1, lon1, lat2, lon2) => {
            const distance = GeoService.calculateDistance(lat1, lon1, lat2, lon2)
            return distance <= 12500 // Half Earth circumference + margin
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Test isWithinRadius function
   */
  describe('isWithinRadius', () => {
    test('Points within radius return true', () => {
      // Two points ~1 mile apart
      const result = GeoService.isWithinRadius(40.7128, -74.0060, 40.7273, -74.0060, 2)
      expect(result).toBe(true)
    })

    test('Points outside radius return false', () => {
      // NY to LA is ~2451 miles
      const result = GeoService.isWithinRadius(40.7128, -74.0060, 34.0522, -118.2437, 100)
      expect(result).toBe(false)
    })

    test('Radius boundary is inclusive', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -90, max: 90, noNaN: true }),
          fc.double({ min: -180, max: 180, noNaN: true }),
          fc.double({ min: -90, max: 90, noNaN: true }),
          fc.double({ min: -180, max: 180, noNaN: true }),
          (lat1, lon1, lat2, lon2) => {
            const distance = GeoService.calculateDistance(lat1, lon1, lat2, lon2)
            // If we use the exact distance as radius, it should be within
            const result = GeoService.isWithinRadius(lat1, lon1, lat2, lon2, distance)
            return result === true
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  /**
   * Test generateNearbyPoint function
   */
  describe('generateNearbyPoint', () => {
    test('Generated points are within specified distance range', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -85, max: 85, noNaN: true }), // Avoid poles
          fc.double({ min: -175, max: 175, noNaN: true }),
          fc.double({ min: 0.1, max: 5, noNaN: true }), // minMiles
          fc.double({ min: 5, max: 10, noNaN: true }), // maxMiles
          (centerLat, centerLon, minMiles, maxMiles) => {
            // Ensure min < max
            const actualMin = Math.min(minMiles, maxMiles)
            const actualMax = Math.max(minMiles, maxMiles)

            const point = GeoService.generateNearbyPoint(centerLat, centerLon, actualMin, actualMax)
            const distance = GeoService.calculateDistance(
              centerLat, centerLon,
              point.latitude, point.longitude
            )

            // Allow small tolerance for floating point
            return distance >= actualMin - 0.01 && distance <= actualMax + 0.01
          }
        ),
        { numRuns: 50 }
      )
    })

    test('Generated points have valid coordinates', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -85, max: 85, noNaN: true }),
          fc.double({ min: -175, max: 175, noNaN: true }),
          (centerLat, centerLon) => {
            const point = GeoService.generateNearbyPoint(centerLat, centerLon, 0.5, 1.5)
            return (
              point.latitude >= -90 &&
              point.latitude <= 90 &&
              point.longitude >= -180 &&
              point.longitude <= 180
            )
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  /**
   * Test coordinate validation
   */
  describe('isValidCoordinates', () => {
    test('Valid coordinates return true', () => {
      expect(GeoService.isValidCoordinates(40.7128, -74.0060)).toBe(true)
      expect(GeoService.isValidCoordinates(0, 0)).toBe(true)
      expect(GeoService.isValidCoordinates(-90, -180)).toBe(true)
      expect(GeoService.isValidCoordinates(90, 180)).toBe(true)
    })

    test('Invalid coordinates return false', () => {
      expect(GeoService.isValidCoordinates(91, 0)).toBe(false)
      expect(GeoService.isValidCoordinates(-91, 0)).toBe(false)
      expect(GeoService.isValidCoordinates(0, 181)).toBe(false)
      expect(GeoService.isValidCoordinates(0, -181)).toBe(false)
      expect(GeoService.isValidCoordinates(NaN, 0)).toBe(false)
      expect(GeoService.isValidCoordinates(0, NaN)).toBe(false)
      expect(GeoService.isValidCoordinates('40', '-74')).toBe(false)
    })
  })
})
