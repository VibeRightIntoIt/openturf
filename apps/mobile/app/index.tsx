import React, { useEffect, useState, useCallback } from "react"
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native"
import { useRouter } from "expo-router"
import { supabase } from "../lib/supabase"
import { Route } from "../types"
import { RouteCard } from "../components/RouteCard"

export default function RoutesListScreen() {
  const router = useRouter()
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchRoutes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("routes")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setRoutes(data || [])
    } catch (error) {
      console.error("Error fetching routes:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchRoutes()
  }, [fetchRoutes])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchRoutes()
  }, [fetchRoutes])

  const handleRoutePress = (route: Route) => {
    router.push(`/route/${route.id}`)
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading routes...</Text>
      </View>
    )
  }

  if (routes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Text style={styles.emptyIconText}>🗺️</Text>
        </View>
        <Text style={styles.emptyTitle}>No Routes Yet</Text>
        <Text style={styles.emptyDescription}>
          Create a route on the web app by drawing an area on the map and saving
          it.
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={routes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RouteCard route={item} onPress={() => handleRoutePress(item)} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10b981"
            colors={["#10b981"]}
          />
        }
        ListHeaderComponent={
          <Text style={styles.headerText}>
            {routes.length} {routes.length === 1 ? "route" : "routes"} saved
          </Text>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
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
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    backgroundColor: "#f9fafb",
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyIconText: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
  },
  listContent: {
    paddingVertical: 12,
  },
  headerText: {
    fontSize: 13,
    color: "#6b7280",
    paddingHorizontal: 20,
    paddingBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
})
