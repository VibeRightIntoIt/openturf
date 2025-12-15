import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// GET - Get tracking codes for a route
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: trackingCodes, error } = await supabase
      .from("tracking_codes")
      .select(`
        id,
        code,
        route_id,
        route_address_id,
        assigned_at,
        created_at,
        route_addresses (
          id,
          address,
          city,
          state,
          zip
        )
      `)
      .eq("route_id", id)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching tracking codes:", error)
      return NextResponse.json(
        { error: "Failed to fetch tracking codes" },
        { status: 500 }
      )
    }

    return NextResponse.json({ trackingCodes })
  } catch (error) {
    console.error("Error in GET /api/routes/[id]/tracking-codes:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Generate tracking codes for a route
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { count } = body

    if (!count || count < 1) {
      return NextResponse.json(
        { error: "Invalid count" },
        { status: 400 }
      )
    }

    // Check if tracking codes already exist for this route
    const { data: existingCodes, error: checkError } = await supabase
      .from("tracking_codes")
      .select("id")
      .eq("route_id", id)
      .limit(1)

    if (checkError) {
      console.error("Error checking existing codes:", checkError)
      return NextResponse.json(
        { error: "Failed to check existing codes" },
        { status: 500 }
      )
    }

    if (existingCodes && existingCodes.length > 0) {
      return NextResponse.json(
        { error: "Tracking codes already exist for this route" },
        { status: 400 }
      )
    }

    // Call the database function to generate codes
    const { data: trackingCodes, error } = await supabase
      .rpc("create_tracking_codes_for_route", {
        p_route_id: id,
        p_count: count,
      })

    if (error) {
      console.error("Error generating tracking codes:", error)
      return NextResponse.json(
        { error: "Failed to generate tracking codes" },
        { status: 500 }
      )
    }

    return NextResponse.json({ trackingCodes })
  } catch (error) {
    console.error("Error in POST /api/routes/[id]/tracking-codes:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
