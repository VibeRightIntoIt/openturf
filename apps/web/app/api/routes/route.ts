import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

interface Address {
  id: string
  address: string
  city: string
  state: string
  zip: string
  lat: number
  lng: number
}

interface CreateRouteRequest {
  name: string
  polygon: number[][]
  addresses: Address[]
  destinationUrl?: string
  campaignName?: string
}

// POST - Create a new route
export async function POST(request: Request) {
  try {
    const body: CreateRouteRequest = await request.json()
    const { name, polygon, addresses, destinationUrl, campaignName } = body

    if (!name || !polygon || !addresses || addresses.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: name, polygon, and addresses" },
        { status: 400 }
      )
    }

    // Calculate center of polygon
    const centerLng = polygon.reduce((sum, coord) => sum + coord[0]!, 0) / polygon.length
    const centerLat = polygon.reduce((sum, coord) => sum + coord[1]!, 0) / polygon.length

    // Create the route
    const { data: route, error: routeError } = await supabase
      .from("routes")
      .insert({
        name,
        polygon_geojson: { type: "Polygon", coordinates: [polygon] },
        center_lat: centerLat,
        center_lng: centerLng,
        address_count: addresses.length,
        destination_url: destinationUrl || "https://www.brightersettings.com/",
        campaign_name: campaignName || null,
      })
      .select()
      .single()

    if (routeError) {
      console.error("Error creating route:", routeError)
      return NextResponse.json(
        { error: "Failed to create route" },
        { status: 500 }
      )
    }

    // Insert all addresses for this route
    const routeAddresses = addresses.map((addr) => ({
      route_id: route.id,
      address: addr.address,
      city: addr.city,
      state: addr.state || "CA",
      zip: addr.zip,
      lat: addr.lat,
      lng: addr.lng,
      status: "pending",
    }))

    const { error: addressesError } = await supabase
      .from("route_addresses")
      .insert(routeAddresses)

    if (addressesError) {
      console.error("Error creating route addresses:", addressesError)
      // Clean up the route if addresses failed
      await supabase.from("routes").delete().eq("id", route.id)
      return NextResponse.json(
        { error: "Failed to save route addresses" },
        { status: 500 }
      )
    }

    return NextResponse.json({ route, addressCount: addresses.length })
  } catch (error) {
    console.error("Error in POST /api/routes:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET - List all routes
export async function GET() {
  try {
    const { data: routes, error } = await supabase
      .from("routes")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching routes:", error)
      return NextResponse.json(
        { error: "Failed to fetch routes" },
        { status: 500 }
      )
    }

    return NextResponse.json({ routes })
  } catch (error) {
    console.error("Error in GET /api/routes:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
