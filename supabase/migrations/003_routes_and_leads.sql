-- Routes table (saved from web)
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  polygon_geojson JSONB NOT NULL,
  center_lat DOUBLE PRECISION NOT NULL,
  center_lng DOUBLE PRECISION NOT NULL,
  address_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Route addresses (snapshot of addresses in route)
CREATE TABLE route_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT DEFAULT 'CA',
  zip TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, not_home, interested, not_interested, callback, do_not_contact
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster route_addresses lookups
CREATE INDEX idx_route_addresses_route_id ON route_addresses(route_id);
CREATE INDEX idx_route_addresses_status ON route_addresses(status);
