"use client"

import { useState, useCallback, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Map, type MapRef, type Address } from "@/components/map"
import { AddressPanel } from "@/components/address-panel"
import { AddressSearch } from "@/components/address-search"
import { Button } from "@workspace/ui/components/button"

export default function Page() {
  const router = useRouter()
  const [viewportAddresses, setViewportAddresses] = useState<Address[]>([])
  const [polygonAddresses, setPolygonAddresses] = useState<Address[]>([])
  const [currentPolygon, setCurrentPolygon] = useState<number[][] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPolygon, setIsLoadingPolygon] = useState(false)
  const [viewportTooLarge, setViewportTooLarge] = useState(false)
  const [isSatellite, setIsSatellite] = useState(false)
  const mapRef = useRef<MapRef>(null)
  const fetchController = useRef<AbortController | null>(null)
  const polygonFetchController = useRef<AbortController | null>(null)

  // Get the set of polygon address IDs for map highlighting
  const polygonAddressIds = useMemo(() => {
    return new Set(polygonAddresses.map((a) => a.id))
  }, [polygonAddresses])

  const hasPolygon = currentPolygon !== null && currentPolygon.length >= 3

  const handleViewportChange = useCallback(
    async (bounds: { north: number; south: number; east: number; west: number }) => {
      // Cancel any in-flight request
      if (fetchController.current) {
        fetchController.current.abort()
      }
      fetchController.current = new AbortController()

      setIsLoading(true)

      try {
        const response = await fetch("/api/addresses/viewport", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ bounds }),
          signal: fetchController.current.signal,
        })

        if (!response.ok) {
          throw new Error("Failed to fetch addresses")
        }

        const data = await response.json()
        
        if (data.tooLarge) {
          setViewportTooLarge(true)
          setViewportAddresses([])
        } else {
          setViewportTooLarge(false)
          setViewportAddresses(data.addresses || [])
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          // Request was cancelled, ignore
          return
        }
        console.error("Error fetching viewport addresses:", error)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const handlePolygonCreate = useCallback(async (coordinates: number[][]) => {
    setCurrentPolygon(coordinates)
    
    // Cancel any in-flight polygon request
    if (polygonFetchController.current) {
      polygonFetchController.current.abort()
    }
    polygonFetchController.current = new AbortController()

    setIsLoadingPolygon(true)

    try {
      const response = await fetch("/api/addresses/polygon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ polygon: coordinates }),
        signal: polygonFetchController.current.signal,
      })

      if (!response.ok) {
        throw new Error("Failed to fetch polygon addresses")
      }

      const data = await response.json()
      setPolygonAddresses(data.addresses || [])
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return
      }
      console.error("Error fetching polygon addresses:", error)
    } finally {
      setIsLoadingPolygon(false)
    }
  }, [])

  const handlePolygonDelete = useCallback(() => {
    setCurrentPolygon(null)
    setPolygonAddresses([])
  }, [])

  const handleClear = useCallback(() => {
    setCurrentPolygon(null)
    setPolygonAddresses([])
    mapRef.current?.resetPolygon()
  }, [])

  const handleRedraw = useCallback(() => {
    mapRef.current?.resetPolygon()
    setCurrentPolygon(null)
    setPolygonAddresses([])
  }, [])

  const handleToggleSatellite = useCallback(() => {
    mapRef.current?.toggleSatellite()
    setIsSatellite((prev) => !prev)
  }, [])

  const handleAddressSelect = useCallback((lng: number, lat: number) => {
    mapRef.current?.flyTo(lng, lat, 17)
  }, [])

  // Note: For client-side access, the env var needs NEXT_PUBLIC_ prefix
  // Set NEXT_PUBLIC_MAPBOX_TOKEN in your .env file
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

  return (
    <div className="flex h-svh w-full overflow-hidden">
      {/* Map Container */}
      <div className="relative flex-1">
        <Map
          ref={mapRef}
          accessToken={mapboxToken}
          viewportAddresses={viewportAddresses}
          polygonAddresses={polygonAddresses}
          polygonAddressIds={polygonAddressIds}
          onPolygonCreate={handlePolygonCreate}
          onPolygonDelete={handlePolygonDelete}
          onViewportChange={handleViewportChange}
        />

        {/* Floating Header */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="pointer-events-auto inline-flex items-center gap-3 rounded-xl border border-border/50 bg-background/80 px-5 py-3 shadow-lg backdrop-blur-md">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-semibold tracking-tight">OpenTurf</h1>
                <p className="text-xs text-muted-foreground">
                  {viewportTooLarge
                    ? "Zoom in to see addresses"
                    : hasPolygon
                      ? `${polygonAddresses.length} addresses selected`
                      : "Draw a polygon to select addresses"}
                </p>
              </div>
            </div>

              {/* Address Search */}
              <div className="pointer-events-auto">
                <AddressSearch
                  accessToken={mapboxToken}
                  onSelect={handleAddressSelect}
                />
              </div>
            </div>

            {/* Satellite Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/routes")}
                className="gap-2 border-border/50 bg-background/80 shadow-lg backdrop-blur-md"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
                Routes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleSatellite}
                className="gap-2 border-border/50 bg-background/80 shadow-lg backdrop-blur-md"
              >
              {isSatellite ? (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              {isSatellite ? "Map" : "Satellite"}
            </Button>
            </div>
          </div>
        </div>

        {/* Zoom in message */}
        {viewportTooLarge && (
          <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-700 backdrop-blur-sm dark:text-amber-400">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                />
              </svg>
              Zoom in to see addresses
            </div>
          </div>
        )}

        {/* Draw Mode Indicator */}
        {!hasPolygon && !viewportTooLarge && (
          <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-700 backdrop-blur-sm dark:text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              Click on the map to start drawing
            </div>
          </div>
        )}

        {/* Redraw Button */}
        {hasPolygon && !isLoading && (
          <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedraw}
              className="gap-2 border-border/50 bg-background/80 shadow-lg backdrop-blur-md"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Redraw Area
            </Button>
          </div>
        )}
      </div>

      {/* Address Panel */}
      <AddressPanel
        addresses={polygonAddresses}
        isLoading={isLoadingPolygon}
        hasPolygon={hasPolygon}
        polygon={currentPolygon}
        onClear={handleClear}
      />
    </div>
  )
}
