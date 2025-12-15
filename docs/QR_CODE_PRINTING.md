# QR Code Printing Feature

This document explains how to use the QR code printing feature for door-to-door sales tracking.

## Overview

The QR code printing feature allows you to generate and print unique tracking codes for each address in your route. These QR codes can be printed on Avery square labels and used to track your door-to-door sales activities.

## How It Works

1. **Create a Route**: Draw a polygon on the map to select addresses and save the route
2. **Generate Tracking Codes**: Click "Print QR Codes" to generate unique tracking codes
3. **Print Labels**: Print the QR codes on Avery 22806 square labels (1.5" x 1.5")
4. **Use in the Field**: Scan the QR codes during your door-to-door visits to track progress

## Features

- **Unique Tracking Codes**: Each QR code has a unique 8-character code (e.g., "A3K7M9P2")
- **Avery Label Format**: Optimized for Avery 22806 square labels (12 labels per sheet)
- **Not Assigned Yet**: QR codes are generated but not assigned to specific houses until needed
- **Print-Optimized Layout**: Labels are formatted with proper spacing and margins for accurate printing

## Using the Feature

### Step 1: View Saved Routes

Navigate to `/routes` to see all your saved routes. From here you can:
- View route details
- See the number of addresses in each route
- Generate and print QR codes

### Step 2: Generate QR Codes

Click the "Print QR Codes" button on any route. The system will:
- Generate unique tracking codes for the number of addresses in the route
- Create QR codes that link to your tracking URL
- Display them in a print-ready format

### Step 3: Print Labels

When on the print preview page:
1. Click the "Print Labels" button
2. Configure your printer settings:
   - **Paper**: Letter (8.5" x 11")
   - **Margins**: 0.19" on all sides
   - **Scale**: 100% (no fit to page)
   - **Labels**: Avery 22806 or equivalent
3. Print the labels

### Step 4: Track in the Field

Each QR code links to a tracking page at:
```
https://yourdomain.com/track/{TRACKING_CODE}
```

When scanned, the tracking page displays:
- The tracking code
- The route name
- The assigned address (if applicable)
- Status information

## Database Schema

The feature uses the following database tables:

### `tracking_codes`
```sql
- id: UUID (primary key)
- code: TEXT (unique 8-character code)
- route_id: UUID (references routes)
- route_address_id: UUID (references route_addresses, nullable)
- assigned_at: TIMESTAMPTZ (when assigned to an address)
- created_at: TIMESTAMPTZ
```

## API Endpoints

### Generate Tracking Codes
```
POST /api/routes/[id]/tracking-codes
Body: { count: number }
```

### Get Tracking Codes
```
GET /api/routes/[id]/tracking-codes
```

### Track by Code
```
GET /api/track/[code]
```

## Configuration

Set the tracking base URL in your environment variables:

```env
NEXT_PUBLIC_TRACKING_URL=https://openturf.app/track
```

This URL is embedded in the QR codes. Update it to match your production domain.

## Label Specifications

**Avery 22806 Square Labels:**
- Label size: 1.5" x 1.5"
- Labels per sheet: 12 (3 columns × 4 rows)
- Spacing: 0.19" between labels
- Sheet size: Letter (8.5" × 11")
- QR code size: 1.1" × 1.1"
- Code text: 8pt Courier New, below QR code

## Tips

1. **Print Quality**: Use a high-quality printer for best QR code scanning results
2. **Label Alignment**: Test print on regular paper first to ensure alignment
3. **Code Assignment**: Assign tracking codes to specific addresses in the mobile app
4. **Batch Printing**: Generate and print all codes at once before starting your route

## Mobile App Integration

The tracking codes can be assigned to specific addresses in the mobile app. Once assigned:
- The tracking page will display the full address details
- Status updates can be tracked per address
- Field reps can scan codes to update lead status

## Troubleshooting

**QR codes won't scan:**
- Ensure print quality is high (at least 600 DPI)
- Check that the QR code is not distorted
- Make sure there's adequate white space around the QR code

**Labels not aligning:**
- Verify you're using Avery 22806 or exact equivalent
- Check printer margins are set to 0.19"
- Ensure scale is set to 100% (no auto-fit)

**Tracking page not loading:**
- Verify the NEXT_PUBLIC_TRACKING_URL is correctly set
- Check that the database migration has been run
- Ensure the tracking code exists in the database
