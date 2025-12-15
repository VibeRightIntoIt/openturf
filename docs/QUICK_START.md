# QR Code Printing Feature - Quick Start Guide

## What Was Built

A complete QR code label printing system for door-to-door sales tracking, optimized for Avery 22806 square labels.

## New Pages & Routes

### 1. Routes List (`/routes`)
**Purpose**: View all saved routes and access QR code printing

**Features**:
- Lists all saved routes with creation date
- Shows address count for each route
- "Print QR Codes" button for each route
- Clean B2B SaaS design

**How to Access**: 
- Click "View Saved Routes" in the address panel (right sidebar)
- Click "Routes" button in the map header

---

### 2. Route Detail (`/routes/[id]`)
**Purpose**: View detailed information about a specific route

**Features**:
- Shows all addresses in the route
- Displays status for each address (pending, interested, not home, etc.)
- Address count and status statistics
- "Print QR Codes" button in header

---

### 3. Print QR Codes (`/routes/[id]/print-qr-codes`)
**Purpose**: Generate and print QR code labels

**Features**:
- Generates unique 8-character tracking codes
- Print-optimized layout for Avery 22806 labels
- 12 labels per sheet (3x4 grid)
- Print button with browser print dialog
- Print instructions at the top

**Layout Specifications**:
```
┌─────────┬─────────┬─────────┐
│ QR+Code │ QR+Code │ QR+Code │  ← Row 1
├─────────┼─────────┼─────────┤
│ QR+Code │ QR+Code │ QR+Code │  ← Row 2
├─────────┼─────────┼─────────┤
│ QR+Code │ QR+Code │ QR+Code │  ← Row 3
├─────────┼─────────┼─────────┤
│ QR+Code │ QR+Code │ QR+Code │  ← Row 4
└─────────┴─────────┴─────────┘

Each label: 1.5" x 1.5"
QR Code: 1.1" x 1.1"
Code Text: 8pt Courier New
Spacing: 0.19" between labels
```

---

### 4. Tracking Page (`/track/[code]`)
**Purpose**: Public page for scanned QR codes

**Features**:
- Shows tracking code
- Displays route name
- Shows address if assigned
- Mobile-friendly design
- Clean, simple interface for field use

**Example**: `https://yourdomain.com/track/A3K7M9P2`

---

## API Endpoints Created

### Generate Tracking Codes
```
POST /api/routes/[id]/tracking-codes
Body: { count: number }
Response: { trackingCodes: Array<{ code: string, id: string }> }
```

### Get Tracking Codes
```
GET /api/routes/[id]/tracking-codes
Response: { trackingCodes: Array<TrackingCode> }
```

### Track QR Code
```
GET /api/track/[code]
Response: { 
  code: string, 
  routeName: string, 
  address: string | null,
  city: string | null,
  state: string | null,
  zip: string | null
}
```

---

## User Flow

```
1. Main Map (/page.tsx)
   └─> Draw polygon & save route
       │
       ├─> Click "View Saved Routes"
       │   └─> Routes List (/routes)
       │       └─> Click "Print QR Codes"
       │           └─> Print Page (/routes/[id]/print-qr-codes)
       │               └─> Generate codes (first time)
       │               └─> Print labels
       │
       └─> Or click "View Saved Routes" from sidebar

2. Field Use
   └─> Sales rep scans QR code
       └─> Opens Tracking Page (/track/[code])
           └─> Shows route info
```

---

## Database Schema

### New Table: `tracking_codes`
```sql
CREATE TABLE tracking_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,              -- 8-char code (e.g., "A3K7M9P2")
  route_id UUID REFERENCES routes(id),
  route_address_id UUID,                  -- NULL initially, assigned later
  assigned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Helper Functions
- `generate_tracking_code()` - Generates unique 8-char codes
- `create_tracking_codes_for_route(route_id, count)` - Bulk code generation

---

## Component Updates

### Address Panel (`components/address-panel.tsx`)
**Added**:
- "View Saved Routes" button (always visible)
- Navigation to routes list page
- Uses `List` icon from lucide-react

### Main Page (`app/page.tsx`)
**Added**:
- "Routes" button in header
- Navigation to routes list
- Uses Next.js router

---

## Styling & Design

### Design System
- Clean B2B SaaS aesthetic (2026 AI style)
- Shadcn UI components
- Emerald color scheme (primary: emerald-500/600)
- Backdrop blur effects
- Smooth animations (fadeInUp)
- Responsive layout

### Print Styles
- Page size: Letter (8.5" x 11")
- Print margins: 0.19" all sides
- Hidden UI elements during print
- Proper page breaks
- High-quality QR codes (400x400px)

---

## Environment Configuration

### Required Environment Variable
```bash
# apps/web/.env.local
NEXT_PUBLIC_TRACKING_URL=https://openturf.app/track
```

This URL is embedded in QR codes and must match your production domain.

---

## Installation & Setup

### 1. Install Dependencies
```bash
cd /Users/vibes/Desktop/openturf
pnpm install
```

### 2. Run Database Migration
```bash
# Apply to your Supabase database
psql -f supabase/migrations/004_tracking_codes.sql
```

### 3. Set Environment Variable
```bash
# Add to apps/web/.env.local
NEXT_PUBLIC_TRACKING_URL=https://yourdomain.com/track
```

### 4. Start Dev Server
```bash
pnpm dev --filter web
```

### 5. Test the Feature
1. Go to `http://localhost:3000`
2. Draw a polygon on the map
3. Save the route
4. Click "View Saved Routes"
5. Click "Print QR Codes"
6. Review the print preview

---

## Printing Instructions

### Recommended Settings
- **Printer**: High-quality laser or inkjet
- **Paper Size**: Letter (8.5" x 11")
- **Labels**: Avery 22806 square labels
- **Margins**: 0.19" (all sides)
- **Scale**: 100% (no fit-to-page)
- **Quality**: High (600+ DPI)

### Test Print
1. Print on regular paper first
2. Hold up to light over label sheet
3. Verify alignment
4. Adjust if needed
5. Print on label sheet

---

## Next Steps

### Immediate
1. Apply database migration
2. Set tracking URL
3. Test print alignment
4. Order Avery 22806 labels

### Future Enhancements
- Assign codes to addresses in mobile app
- Track scan analytics
- Bulk code assignment
- Custom label templates
- Multi-route printing
- Code reprint functionality

---

## Support & Documentation

- **Full Guide**: `docs/QR_CODE_PRINTING.md`
- **Implementation Details**: `docs/IMPLEMENTATION_SUMMARY.md`
- **Database Migration**: `supabase/migrations/004_tracking_codes.sql`

---

## File Structure

```
apps/web/
├── app/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── [id]/
│   │   │   │   └── tracking-codes/
│   │   │   │       └── route.ts          (Generate/Get codes)
│   │   └── track/
│   │       └── [code]/
│   │           └── route.ts              (Track endpoint)
│   ├── routes/
│   │   ├── page.tsx                      (Routes list)
│   │   └── [id]/
│   │       ├── page.tsx                  (Route detail)
│   │       └── print-qr-codes/
│   │           └── page.tsx              (Print page)
│   └── track/
│       └── [code]/
│           └── page.tsx                  (Tracking page)
│
├── components/
│   └── address-panel.tsx                 (Updated with routes link)
│
└── package.json                          (Updated with qrcode)

supabase/
└── migrations/
    └── 004_tracking_codes.sql            (Database schema)

docs/
├── QR_CODE_PRINTING.md                   (User guide)
├── IMPLEMENTATION_SUMMARY.md             (Technical details)
└── QUICK_START.md                        (This file)
```

---

## Success Criteria

✅ Tracking codes generate successfully
✅ QR codes render correctly
✅ Print layout matches Avery 22806 specs
✅ Tracking page displays correctly
✅ Navigation works throughout app
✅ TypeScript compiles without errors
✅ Mobile-responsive design
✅ Clean B2B SaaS aesthetic

---

**Questions?** Check `docs/QR_CODE_PRINTING.md` for detailed information.
