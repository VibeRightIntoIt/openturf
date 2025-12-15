"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Calendar, Printer, Home, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"
import QRCode from "qrcode"

interface Route {
  id: string
  name: string
  address_count: number
  created_at: string
  center_lat: number
  center_lng: number
}

interface TrackingCode {
  id: string
  code: string
}

export default function RoutesPage() {
  const router = useRouter()
  const [routes, setRoutes] = useState<Route[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [generatingCodes, setGeneratingCodes] = useState<string | null>(null)
  const [printData, setPrintData] = useState<{ codes: TrackingCode[], qrDataUrls: Record<string, string> } | null>(null)
  const printContainerRef = useRef<HTMLDivElement>(null)

  const trackingBaseUrl = process.env.NEXT_PUBLIC_TRACKING_URL || "https://openturf.app/track"

  useEffect(() => {
    fetchRoutes()
  }, [])

  const fetchRoutes = async () => {
    try {
      const response = await fetch("/api/routes")
      if (!response.ok) throw new Error("Failed to fetch routes")
      const data = await response.json()
      setRoutes(data.routes || [])
    } catch (error) {
      console.error("Error fetching routes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrintQRCodes = async (routeId: string, addressCount: number) => {
    setGeneratingCodes(routeId)
    try {
      // First, check if codes already exist
      const checkResponse = await fetch(`/api/routes/${routeId}/tracking-codes`)
      const checkData = await checkResponse.json()

      let trackingCodes: TrackingCode[] = checkData.trackingCodes || []

      if (trackingCodes.length === 0) {
        // Generate tracking codes
        const response = await fetch(`/api/routes/${routeId}/tracking-codes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ count: addressCount }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to generate tracking codes")
        }

        const data = await response.json()
        trackingCodes = data.trackingCodes || []
      }

      // Generate QR code data URLs
      const qrDataUrls: Record<string, string> = {}
      for (const trackingCode of trackingCodes) {
        const url = `${trackingBaseUrl}/${trackingCode.code}`
        const dataUrl = await QRCode.toDataURL(url, {
          width: 400,
          margin: 1,
          errorCorrectionLevel: "M",
        })
        qrDataUrls[trackingCode.code] = dataUrl
      }

      // Set print data and trigger print
      setPrintData({ codes: trackingCodes, qrDataUrls })
      
      // Wait for DOM to update, then print
      setTimeout(() => {
        window.print()
      }, 100)

    } catch (error) {
      console.error("Error generating tracking codes:", error)
      alert("Failed to generate tracking codes. Please try again.")
    } finally {
      setGeneratingCodes(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="print:hidden border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">OpenTurf</h1>
                <p className="text-sm text-muted-foreground">Saved Routes</p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Back to Map
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="print:hidden container mx-auto flex-1 px-6 py-8">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : routes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <MapPin className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-medium">No routes yet</h3>
              <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                Create your first route by drawing an area on the map and saving it.
              </p>
              <Button onClick={() => router.push("/")} className="gap-2">
                <MapPin className="h-4 w-4" />
                Go to Map
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {routes.map((route, index) => (
              <Card
                key={route.id}
                className="group overflow-hidden transition-all hover:border-emerald-500/50 hover:shadow-md"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animation: "fadeInUp 0.4s ease-out forwards",
                  opacity: 0,
                }}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 transition-colors group-hover:bg-emerald-500/20">
                        <MapPin className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold truncate">
                          {route.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Home className="h-3.5 w-3.5" />
                            <span>{route.address_count} addresses</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formatDate(route.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="font-mono">
                        {route.address_count}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => handlePrintQRCodes(route.id, route.address_count)}
                        disabled={generatingCodes === route.id}
                      >
                        {generatingCodes === route.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Preparing...
                          </>
                        ) : (
                          <>
                            <Printer className="h-4 w-4" />
                            Print QR Codes
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/routes/${route.id}`)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Hidden print container - only visible when printing */}
      {printData && (
        <div ref={printContainerRef} className="hidden print:block">
          <div className="qr-labels-grid">
            {printData.codes.map((trackingCode) => (
              <div key={trackingCode.code} className="qr-label">
                <div className="qr-code-container">
                  {printData.qrDataUrls[trackingCode.code] && (
                    <img
                      src={printData.qrDataUrls[trackingCode.code]}
                      alt={`QR Code ${trackingCode.code}`}
                      className="qr-code-image"
                    />
                  )}
                </div>
                <div className="qr-code-text">{trackingCode.code}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Print-specific styles */
        @media print {
          @page {
            size: letter;
            margin: 0.19in;
          }

          body {
            margin: 0;
            padding: 0;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:block {
            display: block !important;
          }
        }

        /* Avery 22806 Square Labels - 12 labels per sheet (3 columns x 4 rows) */
        .qr-labels-grid {
          display: grid;
          grid-template-columns: repeat(3, 1.5in);
          grid-template-rows: repeat(4, 1.5in);
          gap: 0.19in;
          width: fit-content;
          margin: 0 auto;
        }

        .qr-label {
          width: 1.5in;
          height: 1.5in;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0.1in;
          box-sizing: border-box;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .qr-code-container {
          width: 1.1in;
          height: 1.1in;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .qr-code-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .qr-code-text {
          margin-top: 0.05in;
          font-size: 8pt;
          font-family: 'Courier New', monospace;
          font-weight: 600;
          text-align: center;
          color: #1f2937;
          letter-spacing: 0.5px;
        }

        /* Ensure proper page breaks */
        @media print {
          .qr-labels-grid {
            page-break-after: always;
          }

          .qr-labels-grid:last-child {
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  )
}
