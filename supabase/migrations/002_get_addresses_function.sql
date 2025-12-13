-- Function to query addresses within a polygon
-- Used by the addresses API endpoint

CREATE OR REPLACE FUNCTION get_addresses_in_polygon(polygon_geojson TEXT)
RETURNS TABLE (
  ogc_fid INTEGER,
  address VARCHAR,
  city VARCHAR,
  zipcode VARCHAR,
  lng DOUBLE PRECISION,
  lat DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ap.ogc_fid,
    ap.address,
    ap.city,
    ap.zipcode,
    ST_X(ST_GeometryN(ap.geom, 1)) as lng,
    ST_Y(ST_GeometryN(ap.geom, 1)) as lat
  FROM address_points ap
  WHERE ST_Intersects(
    ap.geom,
    ST_SetSRID(ST_GeomFromGeoJSON(polygon_geojson), 4326)
  )
  LIMIT 5000;
END;
$$ LANGUAGE plpgsql;
