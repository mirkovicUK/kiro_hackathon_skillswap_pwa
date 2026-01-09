/**
 * GeoService - Geolocation calculations using Haversine formula
 * No external APIs required - pure math
 */

const EARTH_RADIUS_MILES = 3958.8 // Earth's radius in miles

export class GeoService {
  /**
   * Calculate distance between two points using Haversine formula
   * @param {number} lat1 - Latitude of point 1
   * @param {number} lon1 - Longitude of point 1
   * @param {number} lat2 - Latitude of point 2
   * @param {number} lon2 - Longitude of point 2
   * @returns {number} Distance in miles
   */
  static calculateDistance(lat1, lon1, lat2, lon2) {
    // Convert to radians
    const toRad = (deg) => (deg * Math.PI) / 180

    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return EARTH_RADIUS_MILES * c
  }

  /**
   * Check if two points are within a given radius
   * @param {number} lat1 - Latitude of point 1
   * @param {number} lon1 - Longitude of point 1
   * @param {number} lat2 - Latitude of point 2
   * @param {number} lon2 - Longitude of point 2
   * @param {number} radiusMiles - Maximum distance in miles
   * @returns {boolean}
   */
  static isWithinRadius(lat1, lon1, lat2, lon2, radiusMiles) {
    const distance = this.calculateDistance(lat1, lon1, lat2, lon2)
    return distance <= radiusMiles
  }

  /**
   * Generate a random point within a distance range from a center point
   * Used for seeding demo users around a real user's location
   * @param {number} centerLat - Center latitude
   * @param {number} centerLon - Center longitude
   * @param {number} minMiles - Minimum distance from center
   * @param {number} maxMiles - Maximum distance from center
   * @returns {{ latitude: number, longitude: number }}
   */
  static generateNearbyPoint(centerLat, centerLon, minMiles, maxMiles) {
    // Random distance between min and max
    const distance = minMiles + Math.random() * (maxMiles - minMiles)
    
    // Random bearing (direction) in radians
    const bearing = Math.random() * 2 * Math.PI

    // Convert center to radians
    const lat1 = (centerLat * Math.PI) / 180
    const lon1 = (centerLon * Math.PI) / 180

    // Angular distance
    const angularDistance = distance / EARTH_RADIUS_MILES

    // Calculate new point
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
    )

    const lon2 = lon1 + Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
    )

    // Convert back to degrees
    return {
      latitude: (lat2 * 180) / Math.PI,
      longitude: (lon2 * 180) / Math.PI
    }
  }

  /**
   * Validate coordinates
   * @param {number} latitude 
   * @param {number} longitude 
   * @returns {boolean}
   */
  static isValidCoordinates(latitude, longitude) {
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      !isNaN(latitude) &&
      !isNaN(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    )
  }
}
