import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

interface UnlinkCodeRequest {
  code: string
}

// POST - Unlink a tracking code from its address
export async function POST(request: Request) {
  try {
    const body: UnlinkCodeRequest = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { error: "Missing required field: code" },
        { status: 400 }
      )
    }

    // Verify the tracking code exists
    const { data: trackingCode, error: codeError } = await supabase
      .from("tracking_codes")
      .select("id, route_address_id")
      .eq("code", code.toUpperCase())
      .single()

    if (codeError || !trackingCode) {
      return NextResponse.json(
        { error: "Invalid tracking code" },
        { status: 404 }
      )
    }

    if (!trackingCode.route_address_id) {
      return NextResponse.json(
        { error: "Tracking code is not assigned to any address" },
        { status: 400 }
      )
    }

    // Unlink the tracking code from the address
    const { data: updated, error: updateError } = await supabase
      .from("tracking_codes")
      .update({
        route_address_id: null,
        assigned_at: null,
      })
      .eq("id", trackingCode.id)
      .select()
      .single()

    if (updateError) {
      console.error("Error unlinking tracking code:", updateError)
      return NextResponse.json(
        { error: "Failed to unlink tracking code" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      trackingCode: updated,
    })
  } catch (error) {
    console.error("Error in POST /api/tracking-codes/unlink:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
