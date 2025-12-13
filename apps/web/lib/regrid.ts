export interface RegridParcel {
  type: string
  properties: {
    ll_uuid: string
    address: string
    situs_city: string
    situs_state: string
    situs_zip: string
    lat: number
    lon: number
    fields?: {
      ll_uuid?: string
      address?: string
      scity?: string
      situs_city?: string
      state2?: string
      situs_state?: string
      szip?: string
      szip5?: string
      situs_zip?: string
      lat?: string
      lon?: string
      [key: string]: unknown
    }
    [key: string]: unknown
  }
  geometry: {
    type: string
    coordinates: number[] | number[][] | number[][][]
  }
}

export interface RegridResponse {
  type: string
  features: RegridParcel[]
}

export interface RegridAreaResponse {
  parcels: RegridResponse
  area?: {
    acres: number
    sq_meters: number
    sq_miles: number
  }
}

export interface Address {
  id: string
  address: string
  city: string
  state: string
  zip: string
  lat: number
  lng: number
}

/**
 * Fetch parcels from REGRID API for a given polygon
 */
export async function fetchParcelsFromRegrid(
  coordinates: number[][],
  apiKey: string
): Promise<{ addresses: Address[]; error?: string; status?: number }> {
  // Build the GeoJSON polygon for the REGRID API
  const polygon = {
    type: "Polygon",
    coordinates: [coordinates],
  }

  // REGRID API v2 area endpoint - designed for geographic area searches
  // See: https://developer.regrid.com/reference/get_parcels-area-1
  console.log("[regrid] Calling REGRID Area API (GET)...")
  const regridStartTime = Date.now()

  // Create abort controller for timeout (30 seconds)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  // Build URL - geojson param first (matching working example)
  const geojsonEncoded = encodeURIComponent(JSON.stringify(polygon))
  const regridUrl = `https://app.regrid.com/api/v2/parcels/area?geojson=${geojsonEncoded}&token=${apiKey}&limit=100`

  console.log("[regrid] === REGRID REQUEST ===")
  console.log("[regrid] GeoJSON:", JSON.stringify(polygon))
  console.log("[regrid] URL:", regridUrl.replace(apiKey, "REDACTED"))

  let response: Response
  try {
    response = await fetch(regridUrl, {
      method: "GET",
      signal: controller.signal,
    })
  } catch (fetchError) {
    clearTimeout(timeoutId)
    if (fetchError instanceof Error && fetchError.name === "AbortError") {
      console.error("[regrid] REGRID API timeout after 30s")
      return {
        addresses: [],
        error: "Request timed out. Try drawing a smaller area.",
        status: 504,
      }
    }
    throw fetchError
  }
  clearTimeout(timeoutId)
  console.log(
    "[regrid] REGRID API responded in",
    Date.now() - regridStartTime,
    "ms with status:",
    response.status
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[regrid] REGRID API error:", response.status, errorText)
    return {
      addresses: [],
      error: `REGRID API error: ${response.status}`,
      status: response.status,
    }
  }

  console.log("[regrid] === REGRID RESPONSE ===")
  const rawData: RegridAreaResponse = await response.json()

  console.log(
    "[regrid] Raw response (first 3000 chars):",
    JSON.stringify(rawData, null, 2).slice(0, 3000)
  )

  // Area endpoint returns { parcels: { type, features }, area: { acres, sq_meters, sq_miles } }
  const data: RegridResponse = rawData.parcels || (rawData as unknown as RegridResponse)

  if (rawData.area) {
    console.log("[regrid] Area stats:", JSON.stringify(rawData.area))
  }
  console.log("[regrid] Features count:", data.features?.length || 0)

  if (data.features?.length > 0) {
    console.log(
      "[regrid] First feature:",
      JSON.stringify(data.features[0], null, 2).slice(0, 1500)
    )
  } else {
    console.log(
      "[regrid] No features returned - possible coverage gap for this area"
    )
  }

  // Transform the REGRID response to our address format
  // Area API returns properties in a nested 'fields' object
  const addresses: Address[] = data.features
    .filter((feature) => {
      const fields = feature.properties.fields || feature.properties
      return fields.address
    })
    .map((feature) => {
      const fields = feature.properties.fields || feature.properties
      return {
        id:
          feature.properties.ll_uuid ||
          (fields as { ll_uuid?: string }).ll_uuid ||
          crypto.randomUUID(),
        address: (fields as { address?: string }).address || "Unknown Address",
        city:
          (fields as { scity?: string }).scity ||
          (fields as { situs_city?: string }).situs_city ||
          "",
        state:
          (fields as { state2?: string }).state2 ||
          (fields as { situs_state?: string }).situs_state ||
          "",
        zip:
          (fields as { szip?: string }).szip ||
          (fields as { szip5?: string }).szip5 ||
          (fields as { situs_zip?: string }).situs_zip ||
          "",
        lat: parseFloat(String((fields as { lat?: string | number }).lat)) || 0,
        lng: parseFloat(String((fields as { lon?: string | number }).lon)) || 0,
      }
    })
  console.log("[regrid] Filtered to", addresses.length, "valid addresses")

  return { addresses }
}
