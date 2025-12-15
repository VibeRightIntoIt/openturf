"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { MapPin, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"

interface TrackingInfo {
  code: string
  routeName: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
}

export default function TrackPage() {
  const params = useParams()
  const trackingCode = params?.code as string

  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (trackingCode) {
      fetchTrackingInfo()
    }
  }, [trackingCode])

  const fetchTrackingInfo = async () => {
    try {
      const response = await fetch(`/api/track/${trackingCode}`)
      if (!response.ok) {
        throw new Error("Invalid tracking code")
      }
      const data = await response.json()
      setTrackingInfo(data)
    } catch (err) {
      setError("Invalid or expired tracking code")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading tracking information...</span>
        </div>
      </div>
    )
  }

  if (error || !trackingInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
              <MapPin className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="mb-2 text-lg font-medium">Invalid Tracking Code</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              The tracking code you scanned is invalid or has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold">OpenTurf</h1>
          <p className="text-sm text-muted-foreground">Door-to-Door Tracking</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Tracking Code
            </p>
            <p className="text-2xl font-mono font-bold text-center tracking-wider">
              {trackingInfo.code}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Route
            </p>
            <p className="text-base font-medium">
              {trackingInfo.routeName}
            </p>
          </div>

          {trackingInfo.address ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Address
              </p>
              <p className="text-base font-medium">
                {trackingInfo.address}
              </p>
              {trackingInfo.city && (
                <p className="text-sm text-muted-foreground">
                  {trackingInfo.city}, {trackingInfo.state} {trackingInfo.zip}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-4 text-center">
              <p className="text-sm text-muted-foreground">
                This tracking code has not been assigned to an address yet.
              </p>
            </div>
          )}

          <div className="pt-4">
            <p className="text-xs text-muted-foreground text-center">
              This QR code is used to track door-to-door sales activities.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
