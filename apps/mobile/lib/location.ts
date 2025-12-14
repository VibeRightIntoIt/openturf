import * as Location from "expo-location"

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

/**
 * Request location permissions
 */
export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync()
  return status === "granted"
}

/**
 * Get current location
 */
export async function getCurrentLocation(): Promise<Location.LocationObject | null> {
  try {
    const hasPermission = await requestLocationPermission()
    if (!hasPermission) return null

    return await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    })
  } catch (error) {
    console.error("Error getting location:", error)
    return null
  }
}

/**
 * Check if user is within the route area (within threshold meters of center)
 */
export function isInRouteArea(
  userLat: number,
  userLng: number,
  centerLat: number,
  centerLng: number,
  thresholdMeters: number = 200
): boolean {
  const distance = calculateDistance(userLat, userLng, centerLat, centerLng)
  return distance <= thresholdMeters
}

/**
 * Get nearby addresses (within threshold meters)
 */
export function getNearbyAddresses<T extends { lat: number; lng: number }>(
  userLat: number,
  userLng: number,
  addresses: T[],
  thresholdMeters: number = 30
): T[] {
  return addresses
    .filter((addr) => {
      const distance = calculateDistance(userLat, userLng, addr.lat, addr.lng)
      return distance <= thresholdMeters
    })
    .sort((a, b) => {
      const distA = calculateDistance(userLat, userLng, a.lat, a.lng)
      const distB = calculateDistance(userLat, userLng, b.lat, b.lng)
      return distA - distB
    })
}
