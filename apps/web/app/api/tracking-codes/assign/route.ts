import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

interface AssignCodeRequest {
  code: string
  routeId: string
  addressId: string
}

// POST - Assign a tracking code to an address
export async function POST(request: Request) {
  try {
    const body: AssignCodeRequest = await request.json()
    const { code, routeId, addressId } = body

    if (!code || !routeId || !addressId) {
      return NextResponse.json(
        { error: "Missing required fields: code, routeId, addressId" },
        { status: 400 }
      )
    }

    // Verify the tracking code exists and belongs to the route
    const { data: trackingCode, error: codeError } = await supabase
      .from("tracking_codes")
      .select("id, route_id, route_address_id")
      .eq("code", code.toUpperCase())
      .single()

    if (codeError || !trackingCode) {
      return NextResponse.json(
        { error: "Invalid tracking code" },
        { status: 404 }
      )
    }

    if (trackingCode.route_address_id) {
      return NextResponse.json(
        { error: "Tracking code is already assigned to an address" },
        { status: 400 }
      )
    }

    // Verify the address exists and belongs to the route
    const { data: address, error: addressError } = await supabase
      .from("route_addresses")
      .select("id")
      .eq("id", addressId)
      .eq("route_id", routeId)
      .single()

    if (addressError || !address) {
      return NextResponse.json(
        { error: "Address not found in this route" },
        { status: 404 }
      )
    }

    // Assign the tracking code to the address
    const { data: updated, error: updateError } = await supabase
      .from("tracking_codes")
      .update({
        route_address_id: addressId,
        assigned_at: new Date().toISOString(),
      })
      .eq("id", trackingCode.id)
      .select()
      .single()

    if (updateError) {
      console.error("Error assigning tracking code:", updateError)
      return NextResponse.json(
        { error: "Failed to assign tracking code" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      trackingCode: updated,
    })
  } catch (error) {
    console.error("Error in POST /api/tracking-codes/assign:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
