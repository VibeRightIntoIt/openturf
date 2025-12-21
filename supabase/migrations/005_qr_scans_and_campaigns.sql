-- Add destination URL and campaign name to routes
ALTER TABLE routes ADD COLUMN IF NOT EXISTS destination_url TEXT DEFAULT 'https://www.brightersettings.com/';
ALTER TABLE routes ADD COLUMN IF NOT EXISTS campaign_name TEXT;

-- QR code scans tracking table
CREATE TABLE qr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code_id UUID REFERENCES tracking_codes(id) ON DELETE CASCADE,
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  route_address_id UUID REFERENCES route_addresses(id) ON DELETE SET NULL,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT,
  referer TEXT
);

-- Index for faster scan lookups
CREATE INDEX idx_qr_scans_tracking_code_id ON qr_scans(tracking_code_id);
CREATE INDEX idx_qr_scans_route_id ON qr_scans(route_id);
CREATE INDEX idx_qr_scans_scanned_at ON qr_scans(scanned_at);
