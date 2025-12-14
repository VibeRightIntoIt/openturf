import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { StyleSheet } from "react-native"

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#ffffff",
          },
          headerTintColor: "#1f2937",
          headerTitleStyle: {
            fontWeight: "600",
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: "#f9fafb",
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "OpenTurf",
            headerLargeTitle: true,
          }}
        />
        <Stack.Screen
          name="route/[id]"
          options={{
            title: "Route",
            headerBackTitle: "Routes",
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
