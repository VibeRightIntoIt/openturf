"use client"

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from "react"
import mapboxgl from "mapbox-gl"
import MapboxDraw from "@mapbox/mapbox-gl-draw"
import "mapbox-gl/dist/mapbox-gl.css"
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css"

export interface Address {
  id: string
  address: string
  city: string
  state: string
  zip: string
  lat: number
  lng: number
}

interface MapProps {
  accessToken: string
  viewportAddresses?: Address[]
  polygonAddresses?: Address[]
  polygonAddressIds?: Set<string>
  onPolygonCreate: (coordinates: number[][]) => void
  onPolygonDelete: () => void
  onViewportChange: (bounds: { north: number; south: number; east: number; west: number }) => void
}

export interface MapRef {
  resetPolygon: () => void
  toggleSatellite: () => void
  flyTo: (lng: number, lat: number, zoom?: number) => void
}

// Check if a point is inside a polygon using ray casting algorithm
function isPointInPolygon(point: [number, number], polygon: number[][]): boolean {
  const [x, y] = point
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i]![0]!
    const yi = polygon[i]![1]!
    const xj = polygon[j]![0]!
    const yj = polygon[j]![1]!

    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }

  return inside
}

export const Map = forwardRef<MapRef, MapProps>(function Map(
  { accessToken, viewportAddresses = [], polygonAddresses = [], polygonAddressIds = new Set(), onPolygonCreate, onPolygonDelete, onViewportChange },
  ref
) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const draw = useRef<MapboxDraw | null>(null)
  const markers = useRef<globalThis.Map<string, mapboxgl.Marker>>(new globalThis.Map())
  const currentPolygon = useRef<number[][] | null>(null)
  const isSatellite = useRef(false)
  const isOverMarker = useRef(false)

  const handleCreate = useCallback(
    (e: { features: GeoJSON.Feature[] }) => {
      const features = e.features
      const polygon = features[0]
      if (polygon && polygon.geometry.type === "Polygon") {
        const coordinates = polygon.geometry.coordinates[0] as number[][]
        currentPolygon.current = coordinates
        onPolygonCreate(coordinates)
      }
    },
    [onPolygonCreate]
  )

  const handleDelete = useCallback(() => {
    currentPolygon.current = null
    onPolygonDelete()
  }, [onPolygonDelete])

  const handleUpdate = useCallback(
    (e: { features: GeoJSON.Feature[] }) => {
      const features = e.features
      const polygon = features[0]
      if (polygon && polygon.geometry.type === "Polygon") {
        const coordinates = polygon.geometry.coordinates[0] as number[][]
        currentPolygon.current = coordinates
        onPolygonCreate(coordinates)
      }
    },
    [onPolygonCreate]
  )

  const resetPolygon = useCallback(() => {
    if (draw.current) {
      draw.current.deleteAll()
      draw.current.changeMode("draw_polygon")
    }
    currentPolygon.current = null
    onPolygonDelete()
  }, [onPolygonDelete])

  const toggleSatellite = useCallback(() => {
    if (!map.current) return
    isSatellite.current = !isSatellite.current
    map.current.setStyle(
      isSatellite.current
        ? "mapbox://styles/mapbox/satellite-streets-v12"
        : "mapbox://styles/mapbox/light-v11"
    )
  }, [])

  const flyTo = useCallback((lng: number, lat: number, zoom: number = 17) => {
    if (!map.current) return
    map.current.flyTo({
      center: [lng, lat],
      zoom,
      duration: 1500,
    })
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      resetPolygon,
      toggleSatellite,
      flyTo,
    }),
    [resetPolygon, toggleSatellite, flyTo]
  )

  const emitViewportChange = useCallback(() => {
    if (!map.current) return
    const bounds = map.current.getBounds()
    if (!bounds) return
    onViewportChange({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    })
  }, [onViewportChange])

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    mapboxgl.accessToken = accessToken

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      // Residential Oakland (Rockridge/Temescal area)
      center: [-122.2516, 37.8407],
      zoom: 17,
    })

    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
      defaultMode: "draw_polygon",
      styles: [
        // Polygon fill
        {
          id: "gl-draw-polygon-fill",
          type: "fill",
          filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
          paint: {
            "fill-color": "#10b981",
            "fill-outline-color": "#10b981",
            "fill-opacity": 0.15,
          },
        },
        // Polygon outline stroke
        {
          id: "gl-draw-polygon-stroke-active",
          type: "line",
          filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": "#10b981",
            "line-dasharray": [0.2, 2],
            "line-width": 2,
          },
        },
        // Vertex point halos
        {
          id: "gl-draw-polygon-and-line-vertex-halo-active",
          type: "circle",
          filter: [
            "all",
            ["==", "meta", "vertex"],
            ["==", "$type", "Point"],
            ["!=", "mode", "static"],
          ],
          paint: {
            "circle-radius": 7,
            "circle-color": "#fff",
          },
        },
        // Vertex points
        {
          id: "gl-draw-polygon-and-line-vertex-active",
          type: "circle",
          filter: [
            "all",
            ["==", "meta", "vertex"],
            ["==", "$type", "Point"],
            ["!=", "mode", "static"],
          ],
          paint: {
            "circle-radius": 5,
            "circle-color": "#10b981",
          },
        },
        // Line (for drawing in progress)
        {
          id: "gl-draw-line",
          type: "line",
          filter: ["all", ["==", "$type", "LineString"], ["!=", "mode", "static"]],
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": "#10b981",
            "line-dasharray": [0.2, 2],
            "line-width": 2,
          },
        },
        // Midpoint
        {
          id: "gl-draw-polygon-midpoint",
          type: "circle",
          filter: ["all", ["==", "$type", "Point"], ["==", "meta", "midpoint"]],
          paint: {
            "circle-radius": 4,
            "circle-color": "#10b981",
          },
        },
      ],
    })

    map.current.addControl(draw.current, "bottom-left")
    map.current.addControl(new mapboxgl.NavigationControl(), "bottom-left")

    map.current.on("draw.create", handleCreate)
    map.current.on("draw.delete", handleDelete)
    map.current.on("draw.update", handleUpdate)

    // Intercept clicks when over a marker to prevent drawing
    const canvas = map.current.getCanvas()
    canvas.addEventListener("mousedown", (e) => {
      if (isOverMarker.current) {
        e.stopImmediatePropagation()
      }
    }, true) // Use capture phase

    // Emit viewport changes
    map.current.on("load", emitViewportChange)
    map.current.on("moveend", emitViewportChange)

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [accessToken, handleCreate, handleDelete, handleUpdate, emitViewportChange])

  // Update markers when addresses or polygon status changes
  useEffect(() => {
    if (!map.current) return

    // Merge viewport and polygon addresses, with polygon addresses taking priority
    const addressMap = new Map<string, Address>()
    viewportAddresses.forEach((a) => addressMap.set(a.id, a))
    polygonAddresses.forEach((a) => addressMap.set(a.id, a))
    const allAddresses = Array.from(addressMap.values())

    const currentMarkerIds = new Set(markers.current.keys())
    const newAddressIds = new Set(allAddresses.map((a) => a.id))

    // Remove markers that are no longer needed
    currentMarkerIds.forEach((id) => {
      if (!newAddressIds.has(id)) {
        markers.current.get(id)?.remove()
        markers.current.delete(id)
      }
    })

    // Add or update markers
    allAddresses.forEach((address, index) => {
      const isInPolygon = polygonAddressIds.has(address.id)
      const existingMarker = markers.current.get(address.id)

      // Calculate the index for addresses in polygon (for numbering)
      const polygonIndex = isInPolygon
        ? Array.from(polygonAddressIds).indexOf(address.id) + 1
        : null

      if (existingMarker) {
        // Update existing marker color if polygon status changed
        const el = existingMarker.getElement()
        const markerDiv = el.querySelector("div") as HTMLDivElement
        if (markerDiv) {
          markerDiv.style.background = isInPolygon ? "#10b981" : "#6b7280"
          markerDiv.innerHTML = isInPolygon && polygonIndex ? String(polygonIndex) : ""
          markerDiv.style.fontSize = isInPolygon ? "11px" : "0"
        }
      } else {
        // Create new marker
        const el = document.createElement("div")
        el.className = "address-marker"
        el.innerHTML = `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${isInPolygon ? "28px" : "12px"};
            height: ${isInPolygon ? "28px" : "12px"};
            background: ${isInPolygon ? "#10b981" : "#6b7280"};
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            color: white;
            font-size: ${isInPolygon ? "11px" : "0"};
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
          ">${isInPolygon && polygonIndex ? polygonIndex : ""}</div>
        `
        // Track when mouse is over marker to prevent drawing
        el.addEventListener("mouseenter", () => {
          isOverMarker.current = true
          const inner = el.querySelector("div") as HTMLDivElement
          if (inner) {
            inner.style.transform = "scale(1.3)"
            inner.style.width = "28px"
            inner.style.height = "28px"
          }
          el.style.zIndex = "10"
        })
        el.addEventListener("mouseleave", () => {
          isOverMarker.current = false
          const inner = el.querySelector("div") as HTMLDivElement
          const currentlyInPolygon = polygonAddressIds.has(address.id)
          if (inner) {
            inner.style.transform = "scale(1)"
            inner.style.width = currentlyInPolygon ? "28px" : "12px"
            inner.style.height = currentlyInPolygon ? "28px" : "12px"
          }
          el.style.zIndex = "1"
        })

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([address.lng, address.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div style="padding: 4px 0;">
                <div style="font-weight: 600; font-size: 13px;">${address.address}</div>
                <div style="color: #666; font-size: 12px;">${address.city}, ${address.state} ${address.zip}</div>
              </div>
            `)
          )
          .addTo(map.current!)

        markers.current.set(address.id, marker)
      }
    })
  }, [viewportAddresses, polygonAddresses, polygonAddressIds])

  return (
    <div
      ref={mapContainer}
      className="absolute inset-0"
      style={{ width: "100%", height: "100%" }}
    />
  )
})

export { isPointInPolygon }
