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

    return NextResponse.json({ route, addresses })
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
