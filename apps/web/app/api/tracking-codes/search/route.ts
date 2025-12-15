import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// GET - Search for a tracking code
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")

    if (!code) {
      return NextResponse.json(
        { error: "Missing code parameter" },
        { status: 400 }
      )
    }

    // Search for the tracking code with related data
    const { data: trackingCode, error } = await supabase
      .from("tracking_codes")
      .select(`
        id,
        code,
        route_id,
        route_address_id,
        assigned_at,
        created_at,
        routes!inner (
          id,
          name
        ),
        route_addresses (
          id,
          address,
          city,
          state,
          zip
        )
      `)
      .ilike("code", `%${code.toUpperCase()}%`)
      .limit(10)

    if (error) {
      console.error("Error searching tracking codes:", error)
      return NextResponse.json(
        { error: "Failed to search tracking codes" },
        { status: 500 }
      )
    }

    return NextResponse.json({ results: trackingCode || [] })
  } catch (error) {
    console.error("Error in GET /api/tracking-codes/search:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
