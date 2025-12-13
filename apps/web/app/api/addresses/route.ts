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

// Calculate polygon area in acres using the Shoelace formula
// Coordinates should be [lng, lat] pairs
function calculatePolygonAreaAcres(coordinates: number[][]): number {
  const n = coordinates.length
  if (n < 3) return 0

  // Use the Shoelace formula for polygon area
  // First convert to approximate meters using lat/lng
  const toRadians = (deg: number) => (deg * Math.PI) / 180

  // Get centroid for more accurate conversion
  let sumLat = 0
  let sumLng = 0
  for (const coord of coordinates) {
    sumLng += coord[0] ?? 0
    sumLat += coord[1] ?? 0
  }
  const centerLat = sumLat / n

  // Convert degrees to approximate meters at this latitude
  const metersPerDegreeLat = 111320 // roughly constant
  const metersPerDegreeLng = 111320 * Math.cos(toRadians(centerLat))

  // Convert coordinates to meters relative to first point
  const firstCoord = coordinates[0]!
  const metersCoords = coordinates.map((coord) => [
    ((coord[0] ?? 0) - (firstCoord[0] ?? 0)) * metersPerDegreeLng,
    ((coord[1] ?? 0) - (firstCoord[1] ?? 0)) * metersPerDegreeLat,
  ])

  // Shoelace formula
  let area = 0
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const currCoord = metersCoords[i]!
    const nextCoord = metersCoords[j]!
    area += (currCoord[0] ?? 0) * (nextCoord[1] ?? 0)
    area -= (nextCoord[0] ?? 0) * (currCoord[1] ?? 0)
  }
  area = Math.abs(area) / 2

  // Convert square meters to acres (1 acre = 4046.86 sq meters)
  const acres = area / 4046.86
  return acres
}

// Maximum area in acres we'll query (prevents timeout on huge areas)
const MAX_AREA_ACRES = 50

export async function POST(request: NextRequest) {
  console.log("[addresses] POST request received")
  const startTime = Date.now()

  try {
    console.log("[addresses] Parsing request body...")
    const { coordinates } = await request.json()
    console.log(
      "[addresses] Coordinates received:",
      coordinates?.length,
      "points"
    )

    if (!coordinates || !Array.isArray(coordinates)) {
      console.log("[addresses] Invalid coordinates provided")
      return NextResponse.json(
        { error: "Invalid coordinates provided" },
        { status: 400 }
      )
    }

    // Calculate and validate polygon area
    const areaAcres = calculatePolygonAreaAcres(coordinates)
    console.log("[addresses] Polygon area:", areaAcres.toFixed(2), "acres")

    if (areaAcres > MAX_AREA_ACRES) {
      console.log(
        "[addresses] ERROR: Polygon too large!",
        areaAcres.toFixed(2),
        "acres >",
        MAX_AREA_ACRES,
        "acres max"
      )
      return NextResponse.json(
        {
          error: `Area too large. Please draw a smaller area (max ${MAX_AREA_ACRES} acres). Your selection is ${areaAcres.toFixed(1)} acres.`,
        },
        { status: 400 }
      )
    }

    if (areaAcres < 0.01) {
      console.log(
        "[addresses] WARNING: Polygon very small:",
        areaAcres.toFixed(4),
        "acres"
      )
    }

    // Build GeoJSON polygon for PostGIS query
    const polygon = {
      type: "Polygon",
      coordinates: [coordinates],
    }

    // Query address_points table using PostGIS ST_Intersects
    console.log("[addresses] Querying address_points table...")
    const queryStartTime = Date.now()

    const { data, error } = await supabase.rpc("get_addresses_in_polygon", {
      polygon_geojson: JSON.stringify(polygon),
    })

    if (error) {
      console.error("[addresses] Database error:", error)
      return NextResponse.json(
        { error: "Database query failed" },
        { status: 500 }
      )
    }

    console.log(
      "[addresses] Query completed in",
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
        state: "CA", // All our data is California
        zip: row.zipcode || "",
        lat: row.lat,
        lng: row.lng,
      })
    )

    console.log(
      "[addresses] Total request time:",
      Date.now() - startTime,
      "ms"
    )
    return NextResponse.json({ addresses })
  } catch (error) {
    console.error("[addresses] Error fetching addresses:", error)
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
      { status: 500 }
    )
  }
}
