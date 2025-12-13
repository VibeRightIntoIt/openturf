"use client"

import { MapPin, Home, Loader2, Trash2, Route } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Separator } from "@workspace/ui/components/separator"

export interface Address {
  id: string
  address: string
  city: string
  state: string
  zip: string
  lat: number
  lng: number
}

interface AddressPanelProps {
  addresses: Address[]
  isLoading: boolean
  hasPolygon: boolean
  onClear: () => void
  onPlanRoute: () => void
}

export function AddressPanel({
  addresses,
  isLoading,
  hasPolygon,
  onClear,
  onPlanRoute,
}: AddressPanelProps) {
  return (
    <div className="flex h-full w-[420px] flex-col border-l border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
            <MapPin className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Addresses</h2>
            <p className="text-sm text-muted-foreground">
              {hasPolygon
                ? isLoading
                  ? "Finding addresses..."
                  : `${addresses.length} properties found`
                : "Draw an area to start"}
            </p>
          </div>
        </div>
        {addresses.length > 0 && (
          <Badge variant="secondary" className="font-mono text-xs">
            {addresses.length}
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
          {!hasPolygon && !isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <MapPin className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-base font-medium">No area selected</h3>
              <p className="max-w-[280px] text-sm text-muted-foreground">
                Use the polygon tool on the map to draw an area and discover
                addresses within it.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Fetching addresses...</span>
              </div>
            </div>
          )}

          {!isLoading && addresses.length > 0 && (
            <div className="space-y-2">
              {addresses.map((address, index) => (
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
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-medium text-muted-foreground transition-colors group-hover:bg-emerald-500/10 group-hover:text-emerald-600">
                        <Home className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium leading-tight">
                          {address.address}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {address.city}, {address.state} {address.zip}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="shrink-0 font-mono text-[10px]"
                      >
                        #{index + 1}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          </div>
        </ScrollArea>
      </div>

      {/* Footer Actions */}
      {addresses.length > 0 && !isLoading && (
        <>
          <Separator />
          <div className="flex gap-3 p-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onClear}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={onPlanRoute}
            >
              <Route className="mr-2 h-4 w-4" />
              Plan Route
            </Button>
          </div>
        </>
      )}

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

