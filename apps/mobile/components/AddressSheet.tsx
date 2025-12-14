import React, { forwardRef, useCallback, useMemo } from "react"
import { View, Text, StyleSheet, ScrollView } from "react-native"
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet"
import { RouteAddress, LeadStatus, LEAD_STATUS_CONFIG } from "../types"
import { StatusButton } from "./StatusButton"

interface AddressSheetProps {
  addresses: RouteAddress[]
  selectedAddress: RouteAddress | null
  onSelectAddress: (address: RouteAddress) => void
  onUpdateStatus: (addressId: string, status: LeadStatus) => void
}

const ALL_STATUSES: LeadStatus[] = [
  "not_home",
  "interested",
  "not_interested",
  "callback",
  "do_not_contact",
]

export const AddressSheet = forwardRef<BottomSheet, AddressSheetProps>(
  function AddressSheet(
    { addresses, selectedAddress, onSelectAddress, onUpdateStatus },
    ref
  ) {
    const snapPoints = useMemo(() => ["25%", "50%"], [])

    const handleSheetChanges = useCallback((index: number) => {
      // Optional: handle sheet position changes
    }, [])

    return (
      <BottomSheet
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.indicator}
      >
        <BottomSheetView style={styles.contentContainer}>
          {selectedAddress ? (
            // Selected address detail view
            <View style={styles.detailView}>
              <View style={styles.addressHeader}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: LEAD_STATUS_CONFIG[selectedAddress.status].color },
                  ]}
                />
                <View style={styles.addressInfo}>
                  <Text style={styles.addressText}>{selectedAddress.address}</Text>
                  <Text style={styles.cityText}>
                    {selectedAddress.city}, {selectedAddress.state}{" "}
                    {selectedAddress.zip}
                  </Text>
                </View>
              </View>

              <Text style={styles.statusLabel}>Mark as:</Text>
              <View style={styles.statusButtons}>
                {ALL_STATUSES.map((status) => (
                  <StatusButton
                    key={status}
                    status={status}
                    isActive={selectedAddress.status === status}
                    onPress={() => onUpdateStatus(selectedAddress.id, status)}
                  />
                ))}
              </View>
            </View>
          ) : addresses.length > 0 ? (
            // Nearby addresses list
            <View style={styles.listView}>
              <Text style={styles.nearbyTitle}>
                {addresses.length} nearby{" "}
                {addresses.length === 1 ? "address" : "addresses"}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.addressCards}
              >
                {addresses.map((address) => (
                  <NearbyAddressCard
                    key={address.id}
                    address={address}
                    onPress={() => onSelectAddress(address)}
                  />
                ))}
              </ScrollView>
            </View>
          ) : (
            // No nearby addresses
            <View style={styles.emptyView}>
              <Text style={styles.emptyText}>
                Walk closer to addresses to see suggestions
              </Text>
            </View>
          )}
        </BottomSheetView>
      </BottomSheet>
    )
  }
)

function NearbyAddressCard({
  address,
  onPress,
}: {
  address: RouteAddress
  onPress: () => void
}) {
  const config = LEAD_STATUS_CONFIG[address.status]

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={[styles.cardDot, { backgroundColor: config.color }]} />
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardAddress} numberOfLines={1}>
            {address.address}
          </Text>
          <Text style={styles.cardCity} numberOfLines={1}>
            {address.city}
          </Text>
        </View>
      </View>
      <StatusButton status={address.status} isActive={false} onPress={onPress} />
    </View>
  )
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  indicator: {
    backgroundColor: "#d1d5db",
    width: 40,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  detailView: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  addressInfo: {
    flex: 1,
  },
  addressText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  cityText: {
    fontSize: 14,
    color: "#6b7280",
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  listView: {
    flex: 1,
  },
  nearbyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
  },
  addressCards: {
    paddingRight: 20,
  },
  card: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 14,
    marginRight: 12,
    minWidth: 180,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
    marginRight: 8,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardAddress: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  cardCity: {
    fontSize: 12,
    color: "#6b7280",
  },
  emptyView: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
})
