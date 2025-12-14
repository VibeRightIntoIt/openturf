import React, { useEffect, useState, useCallback, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from "react-native"
import { useLocalSearchParams, useNavigation } from "expo-router"
import * as Location from "expo-location"
import Mapbox from "@rnmapbox/maps"
import BottomSheet from "@gorhom/bottom-sheet"
import { supabase } from "../../lib/supabase"
import { Route, RouteAddress, LeadStatus, LEAD_STATUS_CONFIG } from "../../types"
import { navigateToArea } from "../../lib/navigation"
import {
  requestLocationPermission,
  isInRouteArea,
  getNearbyAddresses,
  calculateDistance,
} from "../../lib/location"
import { AddressSheet } from "../../components/AddressSheet"
import Constants from "expo-constants"

// Initialize Mapbox
const MAPBOX_TOKEN =
  Constants.expoConfig?.extra?.mapboxToken ||
  process.env.EXPO_PUBLIC_MAPBOX_TOKEN ||
  ""
Mapbox.setAccessToken(MAPBOX_TOKEN)

export default function RouteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const navigation = useNavigation()

  // State
  const [route, setRoute] = useState<Route | null>(null)
  const [addresses, setAddresses] = useState<RouteAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [isWalkingMode, setIsWalkingMode] = useState(false)
  const [nearbyAddresses, setNearbyAddresses] = useState<RouteAddress[]>([])
  const [selectedAddress, setSelectedAddress] = useState<RouteAddress | null>(
    null
  )

  // Refs
  const bottomSheetRef = useRef<BottomSheet>(null)
  const locationSubscription = useRef<Location.LocationSubscription | null>(null)

  // Fetch route and addresses
  useEffect(() => {
    async function fetchData() {
      if (!id) return

      try {
        // Fetch route
        const { data: routeData, error: routeError } = await supabase
          .from("routes")
          .select("*")
          .eq("id", id)
          .single()

        if (routeError) throw routeError
        setRoute(routeData)
        navigation.setOptions({ title: routeData.name })

        // Fetch addresses
        const { data: addressData, error: addressError } = await supabase
          .from("route_addresses")
          .select("*")
          .eq("route_id", id)

        if (addressError) throw addressError
        setAddresses(addressData || [])
      } catch (error) {
        console.error("Error fetching route:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, navigation])

  // Location tracking
  useEffect(() => {
    async function startLocationTracking() {
      const hasPermission = await requestLocationPermission()
      if (!hasPermission) return

      // Get initial location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })
      setUserLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      })

      // Watch location changes
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5, // Update every 5 meters
        },
        (location) => {
          setUserLocation({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          })
        }
      )
    }

    startLocationTracking()

    return () => {
      locationSubscription.current?.remove()
    }
  }, [])

  // Check if user is in walking mode and find nearby addresses
  useEffect(() => {
    if (!userLocation || !route) return

    const inArea = isInRouteArea(
      userLocation.lat,
      userLocation.lng,
      route.center_lat,
      route.center_lng,
      200 // 200 meters threshold
    )
    setIsWalkingMode(inArea)

    if (inArea) {
      const nearby = getNearbyAddresses(
        userLocation.lat,
        userLocation.lng,
        addresses,
        30 // 30 meters threshold for nearby
      )
      setNearbyAddresses(nearby)
    } else {
      setNearbyAddresses([])
    }
  }, [userLocation, route, addresses])

  // Handle status update
  const handleUpdateStatus = useCallback(
    async (addressId: string, status: LeadStatus) => {
      try {
        const { error } = await supabase
          .from("route_addresses")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", addressId)

        if (error) throw error

        // Update local state
        setAddresses((prev) =>
          prev.map((addr) =>
            addr.id === addressId ? { ...addr, status } : addr
          )
        )

        if (selectedAddress?.id === addressId) {
          setSelectedAddress((prev) => (prev ? { ...prev, status } : null))
        }
      } catch (error) {
        console.error("Error updating status:", error)
      }
    },
    [selectedAddress]
  )

  // Handle navigate button
  const handleNavigate = useCallback(() => {
    if (!route) return
    navigateToArea(route.center_lat, route.center_lng)
  }, [route])

  // Handle address selection
  const handleSelectAddress = useCallback((address: RouteAddress) => {
    setSelectedAddress(address)
    bottomSheetRef.current?.snapToIndex(1)
  }, [])

  // Clear selection when sheet is collapsed
  const handleClearSelection = useCallback(() => {
    setSelectedAddress(null)
  }, [])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading route...</Text>
      </View>
    )
  }

  if (!route) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Route not found</Text>
      </View>
    )
  }

  // Navigation mode (user not in area)
  if (!isWalkingMode) {
    return (
      <View style={styles.navigationModeContainer}>
        <View style={styles.navigationContent}>
          <View style={styles.navigationIcon}>
            <Text style={styles.navigationIconText}>🚗</Text>
          </View>
          <Text style={styles.navigationTitle}>Navigate to Area</Text>
          <Text style={styles.navigationDescription}>
            You're not in the route area yet. Open your maps app to navigate to{" "}
            {route.name}.
          </Text>
          <Text style={styles.addressCount}>
            {route.address_count} addresses waiting
          </Text>
          <TouchableOpacity
            style={styles.navigateButton}
            onPress={handleNavigate}
            activeOpacity={0.8}
          >
            <Text style={styles.navigateButtonText}>Open Maps</Text>
          </TouchableOpacity>
        </View>

        {userLocation && (
          <View style={styles.distanceInfo}>
            <Text style={styles.distanceText}>
              📍{" "}
              {Math.round(
                calculateDistance(
                  userLocation.lat,
                  userLocation.lng,
                  route.center_lat,
                  route.center_lng
                )
              ).toLocaleString()}{" "}
              m away
            </Text>
          </View>
        )}
      </View>
    )
  }

  // Walking mode (user in area)
  return (
    <View style={styles.container}>
      <Mapbox.MapView
        style={styles.map}
        styleURL={Mapbox.StyleURL.Light}
        logoEnabled={false}
        attributionEnabled={false}
        scaleBarEnabled={false}
      >
        <Mapbox.Camera
          zoomLevel={18}
          centerCoordinate={
            userLocation
              ? [userLocation.lng, userLocation.lat]
              : [route.center_lng, route.center_lat]
          }
          followUserLocation={true}
          followUserMode="normal"
          animationMode="flyTo"
          animationDuration={1000}
        />

        <Mapbox.UserLocation visible={true} />

        {/* Address markers */}
        {addresses.map((address) => {
          const config = LEAD_STATUS_CONFIG[address.status]
          const isSelected = selectedAddress?.id === address.id
          const isNearby = nearbyAddresses.some((a) => a.id === address.id)

          return (
            <Mapbox.PointAnnotation
              key={address.id}
              id={address.id}
              coordinate={[address.lng, address.lat]}
              onSelected={() => handleSelectAddress(address)}
            >
              <View
                style={[
                  styles.marker,
                  {
                    backgroundColor: config.color,
                    width: isSelected ? 24 : isNearby ? 16 : 12,
                    height: isSelected ? 24 : isNearby ? 16 : 12,
                    borderWidth: isSelected ? 3 : 2,
                  },
                ]}
              />
            </Mapbox.PointAnnotation>
          )
        })}
      </Mapbox.MapView>

      {/* Stats overlay */}
      <View style={styles.statsOverlay}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {addresses.filter((a) => a.status === "pending").length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#10b981" }]}>
            {addresses.filter((a) => a.status === "interested").length}
          </Text>
          <Text style={styles.statLabel}>Interested</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#eab308" }]}>
            {addresses.filter((a) => a.status === "not_home").length}
          </Text>
          <Text style={styles.statLabel}>Not Home</Text>
        </View>
      </View>

      {/* Address bottom sheet */}
      <AddressSheet
        ref={bottomSheetRef}
        addresses={nearbyAddresses}
        selectedAddress={selectedAddress}
        onSelectAddress={handleSelectAddress}
        onUpdateStatus={handleUpdateStatus}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#6b7280",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
  },
  navigationModeContainer: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  navigationContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  navigationIcon: {
    width: 100,
    height: 100,
    borderRadius: 25,
    backgroundColor: "#d1fae5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  navigationIconText: {
    fontSize: 44,
  },
  navigationTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 12,
  },
  navigationDescription: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
  },
  addressCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10b981",
    marginBottom: 32,
  },
  navigateButton: {
    backgroundColor: "#10b981",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  navigateButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "600",
  },
  distanceInfo: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 50 : 30,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  distanceText: {
    fontSize: 14,
    color: "#6b7280",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  map: {
    flex: 1,
  },
  marker: {
    borderRadius: 100,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  statsOverlay: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 20,
    left: 16,
    right: 16,
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  statLabel: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
})
