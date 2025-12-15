import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Environment variables for enrichment API
const ENRICHMENT_API_URL = process.env.ENRICHMENT_API_URL
const ENRICHMENT_API_KEY = process.env.ENRICHMENT_API_KEY

// Timeout for third-party API calls (3 seconds)
const API_TIMEOUT_MS = 3000

// Expected response shape from third-party
interface ThirdPartyEnrichment {
  quote?: string
  beds?: number
  baths?: number
  sqft?: number
  owners?: string
  owner_occupied?: boolean
}

// GET - Get enrichment data for an address
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; addressId: string }> }
) {
  try {
    const { id: routeId, addressId } = await params

    // Fetch the address to verify it exists and get location data
    const { data: address, error } = await supabase
      .from("route_addresses")
      .select("*")
      .eq("id", addressId)
      .eq("route_id", routeId)
      .single()

    if (error || !address) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      )
    }

    // Check if enrichment API is configured
    if (!ENRICHMENT_API_URL || !ENRICHMENT_API_KEY) {
      // No enrichment API configured - return empty enrichment
      return NextResponse.json({ enrichment: null })
    }

    // Build full address string for the query
    const fullAddress = [
      address.address,
      address.city,
      address.state,
      address.zip
    ].filter(Boolean).join(', ')

    // Call the third-party enrichment API
    const enrichmentUrl = `${ENRICHMENT_API_URL}?address=${encodeURIComponent(fullAddress)}`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

    try {
      const response = await fetch(enrichmentUrl, {
        method: 'GET',
        headers: {
          'X-API-Key': ENRICHMENT_API_KEY,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        // Third-party returned an error - return empty enrichment
        console.error(`Enrichment API error: ${response.status}`)
        return NextResponse.json({ enrichment: null })
      }

      const data: ThirdPartyEnrichment = await response.json()

      // Transform to our enrichment format
      const enrichment = {
        quote: data.quote || null,
        beds: data.beds || null,
        baths: data.baths || null,
        sqft: data.sqft || null,
        owners: data.owners || null,
        owner_occupied: data.owner_occupied ?? null,
      }

      return NextResponse.json({ enrichment })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('Enrichment API timeout')
      } else {
        console.error('Enrichment API error:', fetchError)
      }
      
      // Return empty enrichment on any fetch error
      return NextResponse.json({ enrichment: null })
    }
  } catch (error) {
    console.error("Error in GET /api/routes/[id]/addresses/[addressId]/enrichment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
