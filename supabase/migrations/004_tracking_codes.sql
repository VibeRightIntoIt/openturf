-- Tracking codes table for QR code labels
CREATE TABLE tracking_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  route_address_id UUID REFERENCES route_addresses(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_tracking_codes_code ON tracking_codes(code);
CREATE INDEX idx_tracking_codes_route_id ON tracking_codes(route_id);
CREATE INDEX idx_tracking_codes_route_address_id ON tracking_codes(route_address_id);

-- Function to generate unique tracking code
CREATE OR REPLACE FUNCTION generate_tracking_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Removed ambiguous chars
  result TEXT := '';
  i INTEGER;
BEGIN
  -- Generate 8-character code (e.g., 'A3K7M9P2')
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to create tracking codes for a route
CREATE OR REPLACE FUNCTION create_tracking_codes_for_route(
  p_route_id UUID,
  p_count INTEGER
)
RETURNS TABLE(code TEXT, id UUID) AS $$
DECLARE
  v_code TEXT;
  v_id UUID;
  i INTEGER := 0;
BEGIN
  WHILE i < p_count LOOP
    v_code := generate_tracking_code();
    
    -- Check if code already exists, regenerate if it does
    WHILE EXISTS (SELECT 1 FROM tracking_codes WHERE tracking_codes.code = v_code) LOOP
      v_code := generate_tracking_code();
    END LOOP;
    
    INSERT INTO tracking_codes (code, route_id)
    VALUES (v_code, p_route_id)
    RETURNING tracking_codes.id, tracking_codes.code INTO v_id, v_code;
    
    i := i + 1;
    RETURN QUERY SELECT v_code, v_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
