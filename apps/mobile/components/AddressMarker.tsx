import React from "react"
import { View, StyleSheet } from "react-native"
import { LeadStatus, LEAD_STATUS_CONFIG } from "../types"

interface AddressMarkerProps {
  status: LeadStatus
  isSelected?: boolean
}

export function AddressMarker({ status, isSelected = false }: AddressMarkerProps) {
  const config = LEAD_STATUS_CONFIG[status]
  const size = isSelected ? 20 : 12
  const borderWidth = isSelected ? 3 : 2

  return (
    <View
      style={[
        styles.marker,
        {
          width: size,
          height: size,
          backgroundColor: config.color,
          borderWidth,
          transform: isSelected ? [{ scale: 1.2 }] : [],
        },
      ]}
    />
  )
}

const styles = StyleSheet.create({
  marker: {
    borderRadius: 100,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
})
