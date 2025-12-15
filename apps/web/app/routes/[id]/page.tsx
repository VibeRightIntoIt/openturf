"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { MapPin, Home, Calendar, Printer, ArrowLeft, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Skeleton } from "@workspace/ui/components/skeleton"

interface Route {
  id: string
  name: string
  address_count: number
  created_at: string
  center_lat: number
  center_lng: number
}

interface RouteAddress {
  id: string
  address: string
  city: string
  state: string
  zip: string
  lat: number
  lng: number
  status: string
  notes: string | null
  updated_at: string
}

const statusConfig = {
  pending: { icon: Clock, label: "Pending", color: "text-gray-500" },
  not_home: { icon: Home, label: "Not Home", color: "text-amber-500" },
  interested: { icon: CheckCircle2, label: "Interested", color: "text-green-500" },
  not_interested: { icon: XCircle, label: "Not Interested", color: "text-red-500" },
  callback: { icon: Clock, label: "Callback", color: "text-blue-500" },
  do_not_contact: { icon: XCircle, label: "Do Not Contact", color: "text-gray-700" },
}

export default function RouteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const routeId = params?.id as string

  const [route, setRoute] = useState<Route | null>(null)
  const [addresses, setAddresses] = useState<RouteAddress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [generatingCodes, setGeneratingCodes] = useState(false)

  useEffect(() => {
    if (routeId) {
      fetchRouteData()
    }
  }, [routeId])

  const fetchRouteData = async () => {
    try {
      const response = await fetch(`/api/routes/${routeId}`)
      if (!response.ok) throw new Error("Failed to fetch route")
      const data = await response.json()
      setRoute(data.route)
      setAddresses(data.addresses || [])
    } catch (error) {
      console.error("Error fetching route:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrintQRCodes = async () => {
    if (!route) return
    setGeneratingCodes(true)
    try {
      // Check if codes already exist
      const checkResponse = await fetch(`/api/routes/${routeId}/tracking-codes`)
      const checkData = await checkResponse.json()

      if (checkData.trackingCodes && checkData.trackingCodes.length > 0) {
        router.push(`/routes/${routeId}/print-qr-codes`)
        return
      }

      // Generate tracking codes
      const response = await fetch(`/api/routes/${routeId}/tracking-codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: route.address_count }),
      })

      if (!response.ok) throw new Error("Failed to generate tracking codes")

      router.push(`/routes/${routeId}/print-qr-codes`)
    } catch (error) {
      console.error("Error generating tracking codes:", error)
      alert("Failed to generate tracking codes")
    } finally {
      setGeneratingCodes(false)
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

  const getStatusCounts = () => {
    const counts: Record<string, number> = {}
    addresses.forEach((addr) => {
      counts[addr.status] = (counts[addr.status] || 0) + 1
    })
    return counts
  }

  const statusCounts = getStatusCounts()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading route...</span>
        </div>
      </div>
    )
  }

  if (!route) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Route not found</p>
          <Button onClick={() => router.push("/routes")} className="mt-4">
            Back to Routes
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/routes")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">{route.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    Created {formatDate(route.created_at)}
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={handlePrintQRCodes}
              disabled={generatingCodes}
              className="gap-2"
            >
              {generatingCodes ? (
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
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="border-b border-border/50 bg-background/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {route.address_count} Total Addresses
              </span>
            </div>
            {Object.entries(statusCounts).map(([status, count]) => {
              const config = statusConfig[status as keyof typeof statusConfig]
              if (!config) return null
              return (
                <div key={status} className="flex items-center gap-2">
                  <config.icon className={`h-4 w-4 ${config.color}`} />
                  <span className="text-sm">
                    {count} {config.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Addresses List */}
      <main className="container mx-auto flex-1 px-6 py-8">
        <ScrollArea className="h-full">
          <div className="space-y-2">
            {addresses.map((address, index) => {
              const config = statusConfig[address.status as keyof typeof statusConfig]
              const StatusIcon = config?.icon || Clock
              
              return (
                <Card
                  key={address.id}
                  className="group overflow-hidden transition-all hover:border-emerald-500/50 hover:shadow-sm"
                  style={{
                    animationDelay: `${index * 30}ms`,
                    animation: "fadeInUp 0.3s ease-out forwards",
                    opacity: 0,
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-emerald-500/10`}>
                        <StatusIcon className={`h-4 w-4 ${config?.color || "text-muted-foreground"}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium leading-tight">
                          {address.address}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {address.city}, {address.state} {address.zip}
                        </p>
                        {address.notes && (
                          <p className="mt-2 text-sm text-muted-foreground italic">
                            {address.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          #{index + 1}
                        </Badge>
                        {config && (
                          <Badge variant="secondary" className="text-xs">
                            {config.label}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </ScrollArea>
      </main>

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
