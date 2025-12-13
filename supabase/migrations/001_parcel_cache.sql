-- Create parcel cache table
CREATE TABLE IF NOT EXISTS parcel_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  polygon_hash TEXT NOT NULL UNIQUE,
  polygon_geojson JSONB NOT NULL,
  addresses JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by polygon hash
CREATE INDEX IF NOT EXISTS idx_parcel_cache_polygon_hash ON parcel_cache(polygon_hash);

-- Index for cleanup of old entries
CREATE INDEX IF NOT EXISTS idx_parcel_cache_created_at ON parcel_cache(created_at);
