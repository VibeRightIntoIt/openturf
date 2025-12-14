import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

interface UpdateAddressRequest {
  status?: string
  notes?: string
}

// PATCH - Update address status or notes
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; addressId: string }> }
) {
  try {
    const { id, addressId } = await params
    const body: UpdateAddressRequest = await request.json()

    // Validate status if provided
    const validStatuses = [
      "pending",
      "not_home",
      "interested",
      "not_interested",
      "callback",
      "do_not_contact",
    ]
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      )
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (body.status) updates.status = body.status
    if (body.notes !== undefined) updates.notes = body.notes

    // Verify address belongs to route
    const { data: address, error: verifyError } = await supabase
      .from("route_addresses")
      .select("id")
      .eq("id", addressId)
      .eq("route_id", id)
      .single()

    if (verifyError || !address) {
      return NextResponse.json(
        { error: "Address not found in this route" },
        { status: 404 }
      )
    }

    // Update the address
    const { data, error } = await supabase
      .from("route_addresses")
      .update(updates)
      .eq("id", addressId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ address: data })
  } catch (error) {
    console.error("Error in PATCH /api/routes/[id]/addresses/[addressId]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
