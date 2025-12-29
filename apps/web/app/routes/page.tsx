"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Calendar, Printer, Home, ChevronRight, Loader2, Search, QrCode, Link2, Link2Off, X, Settings2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import QRCode from "qrcode"

// Avery label templates
const averyTemplates = {
  "6570": {
    name: "Avery 6570 - ID Labels",
    description: "1-1/4\" x 1-3/4\" - 32 labels per sheet",
    page: {
      width: 8.5,
      height: 11,
      unit: "in"
    },
    label: {
      width: 1.75,        // 1-3/4 inches
      height: 1.25,       // 1-1/4 inches
      cornerRadius: 0.0
    },
    layout: {
      cols: 4,
      rows: 8,
      topMargin: 0.5,
      leftMargin: 0.46875, // 15/32 inches
      colSpacing: 0.1875,  // 3/16 inches
      rowSpacing: 0.0
    }
  },
} as const

type TemplateId = keyof typeof averyTemplates

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

interface SearchResult {
  id: string
  code: string
  route_id: string
  route_address_id: string | null
  assigned_at: string | null
  routes: {
    id: string
    name: string
  }
  route_addresses: {
    id: string
    address: string
    city: string
    state: string
    zip: string
  } | null
}

export default function RoutesPage() {
  const router = useRouter()
  const [routes, setRoutes] = useState<Route[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [generatingCodes, setGeneratingCodes] = useState<string | null>(null)
  const [printData, setPrintData] = useState<{ codes: TrackingCode[], qrDataUrls: Record<string, string> } | null>(null)
  const printContainerRef = useRef<HTMLDivElement>(null)
  
  // Template selection state
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("6570")
  
  // QR Code search state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const currentTemplate = averyTemplates[selectedTemplate]

  useEffect(() => {
    fetchRoutes()
  }, [])

  // Debounced search
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/tracking-codes/search?code=${encodeURIComponent(query)}`)
      if (!response.ok) throw new Error("Search failed")
      const data = await response.json()
      setSearchResults(data.results || [])
      setShowSearchResults(true)
    } catch (error) {
      console.error("Error searching:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleSearchInput = (value: string) => {
    setSearchQuery(value)
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value)
    }, 300)
  }

  const clearSearch = () => {
    setSearchQuery("")
    setSearchResults([])
    setShowSearchResults(false)
  }

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
      // Fetch route details to get destination_url
      const routeResponse = await fetch(`/api/routes/${routeId}`)
      const routeData = await routeResponse.json()
      const destinationUrl = routeData.route?.destination_url || "https://www.brightersettings.com/"
      
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

      // Generate QR code data URLs - pointing directly to destination with tracking params
      const qrDataUrls: Record<string, string> = {}
      for (const trackingCode of trackingCodes) {
        const url = new URL(destinationUrl)
        url.searchParams.set("c", trackingCode.code)
        
        const dataUrl = await QRCode.toDataURL(url.toString(), {
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
            <div className="flex items-center gap-3">
              {/* Print Template Selector */}
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedTemplate} onValueChange={(value) => setSelectedTemplate(value as TemplateId)}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(averyTemplates).map(([id, template]) => (
                      <SelectItem key={id} value={id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{template.name}</span>
                          <span className="text-xs text-muted-foreground">{template.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* QR Code Search */}
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search QR code..."
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    className="w-64 pl-9 pr-9"
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                {/* Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-96 rounded-lg border border-border bg-background p-2 shadow-lg">
                    <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                      {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                    </p>
                    <div className="mt-1 max-h-80 overflow-auto space-y-1">
                      {searchResults.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => {
                            router.push(`/routes/${result.route_id}`)
                            clearSearch()
                          }}
                          className="w-full rounded-md p-3 text-left transition-colors hover:bg-muted"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${result.route_address_id ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                              {result.route_address_id ? (
                                <Link2 className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <Link2Off className="h-4 w-4 text-amber-500" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-mono text-sm font-semibold tracking-wider">
                                {result.code}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                Route: {result.routes.name}
                              </p>
                              {result.route_addresses ? (
                                <p className="text-xs text-muted-foreground truncate">
                                  {result.route_addresses.address}, {result.route_addresses.city}
                                </p>
                              ) : (
                                <p className="text-xs text-amber-600 italic">
                                  Not linked to an address
                                </p>
                              )}
                            </div>
                            <Badge 
                              variant={result.route_address_id ? "default" : "secondary"}
                              className={`shrink-0 text-[10px] ${result.route_address_id ? 'bg-emerald-600' : ''}`}
                            >
                              {result.route_address_id ? "Linked" : "Unlinked"}
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {showSearchResults && searchResults.length === 0 && searchQuery && !isSearching && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-border bg-background p-4 shadow-lg text-center">
                    <QrCode className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      No QR codes found matching "{searchQuery}"
                    </p>
                  </div>
                )}
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
          {/* Split codes into pages based on labels per page */}
          {(() => {
            const labelsPerPage = currentTemplate.layout.cols * currentTemplate.layout.rows
            const pages: TrackingCode[][] = []
            for (let i = 0; i < printData.codes.length; i += labelsPerPage) {
              pages.push(printData.codes.slice(i, i + labelsPerPage))
            }
            return pages.map((pageCodes, pageIndex) => (
              <div 
                key={pageIndex}
                className="qr-labels-page"
                style={{
                  paddingTop: `${currentTemplate.layout.topMargin}in`,
                  paddingLeft: `${currentTemplate.layout.leftMargin}in`,
                }}
              >
                <div 
                  className="qr-labels-grid"
                  style={{
                    gridTemplateColumns: `repeat(${currentTemplate.layout.cols}, ${currentTemplate.label.width}in)`,
                    gridTemplateRows: `repeat(${currentTemplate.layout.rows}, ${currentTemplate.label.height}in)`,
                    columnGap: `${currentTemplate.layout.colSpacing}in`,
                    rowGap: `${currentTemplate.layout.rowSpacing}in`,
                  }}
                >
                  {pageCodes.map((trackingCode) => (
                    <div 
                      key={trackingCode.code} 
                      className="qr-label"
                      style={{
                        width: `${currentTemplate.label.width}in`,
                        height: `${currentTemplate.label.height}in`,
                      }}
                    >
                      <div className="qr-code-container">
                        {printData.qrDataUrls[trackingCode.code] && (
                          <img
                            src={printData.qrDataUrls[trackingCode.code]}
                            alt={`QR Code ${trackingCode.code}`}
                            className="qr-code-image"
                          />
                        )}
                      </div>
                      <div className="qr-label-text">
                        <div className="qr-code-text">{trackingCode.code}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          })()}
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
            margin: 0;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 8.5in;
            height: 11in;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:block {
            display: block !important;
          }

          /* Page container for each sheet of labels */
          .qr-labels-page {
            position: relative;
            width: 8.5in;
            height: 11in;
            overflow: hidden;
            box-sizing: border-box;
            page-break-after: always;
            break-after: page;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .qr-labels-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }

          /* Label grid - dynamically styled via inline styles */
          .qr-labels-grid {
            display: grid;
            width: fit-content;
          }

          /* Individual label - QR code on left, text on right */
          .qr-label {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: flex-start;
            padding: 0.08in;
            box-sizing: border-box;
            overflow: hidden;
            gap: 0.08in;
          }

          .qr-code-container {
            width: 1in;
            height: 1in;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .qr-code-image {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }

          .qr-label-text {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            flex: 1;
            min-width: 0;
            height: 100%;
          }

          .qr-code-text {
            font-size: 7pt;
            font-family: 'Courier New', monospace;
            font-weight: 600;
            color: #1f2937;
            letter-spacing: 1px;
            writing-mode: vertical-rl;
            text-orientation: mixed;
            white-space: nowrap;
          }
        }

        /* Screen styles for hidden print container */
        .qr-labels-page,
        .qr-labels-grid,
        .qr-label,
        .qr-code-container,
        .qr-code-image,
        .qr-label-text,
        .qr-code-text {
          /* These are only visible during print */
        }

      `}</style>
    </div>
  )
}
