import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export interface Address {
  id: string
  address: string
  city: string
  state: string
  zip: string
  lat: number
  lng: number
}

// Maximum viewport area to prevent huge queries
const MAX_VIEWPORT_AREA_SQ_KM = 5

function calculateBoundingBoxArea(bounds: {
  north: number
  south: number
  east: number
  west: number
}): number {
  const toRadians = (deg: number) => (deg * Math.PI) / 180
  const centerLat = (bounds.north + bounds.south) / 2

  const latDistance = Math.abs(bounds.north - bounds.south) * 111.32 // km per degree latitude
  const lngDistance =
    Math.abs(bounds.east - bounds.west) * 111.32 * Math.cos(toRadians(centerLat))

  return latDistance * lngDistance
}

export async function POST(request: NextRequest) {
  console.log("[viewport] POST request received")
  const startTime = Date.now()

  try {
    const { bounds } = await request.json()
    console.log("[viewport] Bounds received:", bounds)

    if (
      !bounds ||
      typeof bounds.north !== "number" ||
      typeof bounds.south !== "number" ||
      typeof bounds.east !== "number" ||
      typeof bounds.west !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid bounds provided" },
        { status: 400 }
      )
    }

    // Check viewport size
    const areaSqKm = calculateBoundingBoxArea(bounds)
    console.log("[viewport] Viewport area:", areaSqKm.toFixed(2), "sq km")

    if (areaSqKm > MAX_VIEWPORT_AREA_SQ_KM) {
      console.log("[viewport] Viewport too large, returning empty")
      return NextResponse.json({
        addresses: [],
        tooLarge: true,
        message: "Zoom in to see addresses",
      })
    }

    // Build bounding box polygon for PostGIS
    const bboxPolygon = {
      type: "Polygon",
      coordinates: [
        [
          [bounds.west, bounds.south],
          [bounds.east, bounds.south],
          [bounds.east, bounds.north],
          [bounds.west, bounds.north],
          [bounds.west, bounds.south],
        ],
      ],
    }

    console.log("[viewport] Querying address_points table...")
    const queryStartTime = Date.now()

    const { data, error } = await supabase.rpc("get_addresses_in_polygon", {
      polygon_geojson: JSON.stringify(bboxPolygon),
    })

    if (error) {
      console.error("[viewport] Database error:", error)
      return NextResponse.json(
        { error: "Database query failed" },
        { status: 500 }
      )
    }

    console.log(
      "[viewport] Query completed in",
      Date.now() - queryStartTime,
      "ms, found",
      data?.length || 0,
      "addresses"
    )

    const addresses: Address[] = (data || []).map(
      (row: {
        ogc_fid: number
        address: string
        city: string
        zipcode: string
        lng: number
        lat: number
      }) => ({
        id: String(row.ogc_fid),
        address: row.address || "Unknown Address",
        city: row.city || "",
        state: "CA",
        zip: row.zipcode || "",
        lat: row.lat,
        lng: row.lng,
      })
    )

    console.log(
      "[viewport] Total request time:",
      Date.now() - startTime,
      "ms"
    )
    return NextResponse.json({ addresses })
  } catch (error) {
    console.error("[viewport] Error fetching addresses:", error)
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
      { status: 500 }
    )
  }
}
