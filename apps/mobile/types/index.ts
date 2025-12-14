export interface Route {
  id: string
  name: string
  polygon_geojson: {
    type: "Polygon"
    coordinates: number[][][]
  }
  center_lat: number
  center_lng: number
  address_count: number
  created_at: string
}

export interface RouteAddress {
  id: string
  route_id: string
  address: string
  city: string | null
  state: string
  zip: string | null
  lat: number
  lng: number
  status: LeadStatus
  notes: string | null
  updated_at: string
}

export type LeadStatus =
  | "pending"
  | "not_home"
  | "interested"
  | "not_interested"
  | "callback"
  | "do_not_contact"

export const LEAD_STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; color: string; bgColor: string }
> = {
  pending: {
    label: "Pending",
    color: "#6b7280",
    bgColor: "#f3f4f6",
  },
  not_home: {
    label: "Not Home",
    color: "#eab308",
    bgColor: "#fef9c3",
  },
  interested: {
    label: "Interested",
    color: "#10b981",
    bgColor: "#d1fae5",
  },
  not_interested: {
    label: "Not Interested",
    color: "#ef4444",
    bgColor: "#fee2e2",
  },
  callback: {
    label: "Callback",
    color: "#3b82f6",
    bgColor: "#dbeafe",
  },
  do_not_contact: {
    label: "Do Not Contact",
    color: "#1f2937",
    bgColor: "#e5e7eb",
  },
}
