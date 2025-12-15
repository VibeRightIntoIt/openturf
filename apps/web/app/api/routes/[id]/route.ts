import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// GET - Get a single route with its addresses
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch route
    const { data: route, error: routeError } = await supabase
      .from("routes")
      .select("*")
      .eq("id", id)
      .single()

    if (routeError) {
      if (routeError.code === "PGRST116") {
        return NextResponse.json({ error: "Route not found" }, { status: 404 })
      }
      throw routeError
    }

    // Fetch addresses for this route
    const { data: addresses, error: addressesError } = await supabase
      .from("route_addresses")
      .select("*")
      .eq("route_id", id)
      .order("address", { ascending: true })

    if (addressesError) throw addressesError

    // Fetch tracking codes for this route to map to addresses
    const { data: trackingCodes, error: trackingCodesError } = await supabase
      .from("tracking_codes")
      .select("code, route_address_id")
      .eq("route_id", id)
      .not("route_address_id", "is", null)

    // Create a map of address ID to tracking code
    const addressToCode: Record<string, string> = {}
    if (!trackingCodesError && trackingCodes) {
      for (const tc of trackingCodes) {
        if (tc.route_address_id) {
          addressToCode[tc.route_address_id] = tc.code
        }
      }
    }

    // Add tracking_code to each address
    const addressesWithCodes = addresses?.map(addr => ({
      ...addr,
      tracking_code: addressToCode[addr.id] || null,
    }))

    return NextResponse.json({ route, addresses: addressesWithCodes })
  } catch (error) {
    console.error("Error in GET /api/routes/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a route
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { error } = await supabase.from("routes").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/routes/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
