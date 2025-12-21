import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// GET - Get tracking information for a code and record the scan
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    // Fetch tracking code info
    const { data: trackingCode, error: trackingError } = await supabase
      .from("tracking_codes")
      .select("id, code, route_id, route_address_id")
      .eq("code", code.toUpperCase())
      .single()

    if (trackingError || !trackingCode) {
      return NextResponse.json(
        { error: "Invalid tracking code" },
        { status: 404 }
      )
    }

    // Fetch route info including destination URL and campaign name
    const { data: route, error: routeError } = await supabase
      .from("routes")
      .select("id, name, destination_url, campaign_name")
      .eq("id", trackingCode.route_id)
      .single()

    if (routeError || !route) {
      return NextResponse.json(
        { error: "Route not found" },
        { status: 404 }
      )
    }

    // Fetch address info if assigned
    let addressInfo = null
    if (trackingCode.route_address_id) {
      const { data: address } = await supabase
        .from("route_addresses")
        .select("address, city, state, zip")
        .eq("id", trackingCode.route_address_id)
        .single()
      
      addressInfo = address
    }

    const trackingInfo = {
      code: trackingCode.code,
      routeName: route.name,
      address: addressInfo?.address || null,
      city: addressInfo?.city || null,
      state: addressInfo?.state || null,
      zip: addressInfo?.zip || null,
    }

    return NextResponse.json(trackingInfo)
  } catch (error) {
    console.error("Error in GET /api/track/[code]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
