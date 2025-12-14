import * as Linking from "expo-linking"
import { Platform } from "react-native"

/**
 * Opens the device's maps app with navigation to the specified coordinates
 */
export async function navigateToArea(lat: number, lng: number) {
  const url = Platform.select({
    ios: `maps://?daddr=${lat},${lng}`,
    android: `google.navigation:q=${lat},${lng}`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
  })

  const canOpen = await Linking.canOpenURL(url)
  if (canOpen) {
    await Linking.openURL(url)
  } else {
    // Fallback to Google Maps web
    await Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    )
  }
}
