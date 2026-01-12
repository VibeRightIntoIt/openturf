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

export async function POST(request: NextRequest) {
  console.log("[polygon] POST request received")
  const startTime = Date.now()

  try {
    const { polygon } = await request.json()
    console.log("[polygon] Polygon received with", polygon?.length, "points")

    if (!polygon || !Array.isArray(polygon) || polygon.length < 3) {
      return NextResponse.json(
        { error: "Invalid polygon provided" },
        { status: 400 }
      )
    }

    // Build GeoJSON polygon - ensure it's closed
    const coordinates = [...polygon]
    if (
      coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
      coordinates[0][1] !== coordinates[coordinates.length - 1][1]
    ) {
      coordinates.push(coordinates[0])
    }

    const polygonGeoJSON = {
      type: "Polygon",
      coordinates: [coordinates],
    }

    console.log("[polygon] Querying address_points table...")
    const queryStartTime = Date.now()

    const { data, error } = await supabase.rpc("get_addresses_in_polygon", {
      polygon_geojson: JSON.stringify(polygonGeoJSON),
    })

    if (error) {
      console.error("[polygon] Database error:", error)
      return NextResponse.json(
        { error: "Database query failed" },
        { status: 500 }
      )
    }

    console.log(
      "[polygon] Query completed in",
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
      "[polygon] Total request time:",
      Date.now() - startTime,
      "ms"
    )
    return NextResponse.json({ addresses })
  } catch (error) {
    console.error("[polygon] Error fetching addresses:", error)
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
      { status: 500 }
    )
  }
}
