import React from "react"
import { TouchableOpacity, Text, StyleSheet } from "react-native"
import { LeadStatus, LEAD_STATUS_CONFIG } from "../types"

interface StatusButtonProps {
  status: LeadStatus
  isActive: boolean
  onPress: () => void
}

export function StatusButton({ status, isActive, onPress }: StatusButtonProps) {
  const config = LEAD_STATUS_CONFIG[status]

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: isActive ? config.color : config.bgColor,
          borderColor: config.color,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.label,
          {
            color: isActive ? "#ffffff" : config.color,
          },
        ]}
      >
        {config.label}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    marginRight: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
})
