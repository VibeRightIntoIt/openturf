# Address Enrichment Protocol

> **Version**: 2.0.0  
> **Status**: Production Specification

## Overview

The Address Enrichment Protocol enables OpenTurf to fetch property data from your system when a sales representative selects an address in the mobile app. OpenTurf makes a simple GET request to your endpoint, and you return property information that gets displayed to the rep.

This enables:
- Displaying property quotes/estimates
- Showing property details (beds, baths, sqft)
- Showing owner information
- Custom data relevant to your sales process

---

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌──────────────────┐
│   OpenTurf      │    │   OpenTurf      │    │   Your System    │
│   Mobile App    │───▶│   API Server    │───▶│   (Third Party)  │
└─────────────────┘    └─────────────────┘    └──────────────────┘
        │                      │                       │
        │  1. User taps        │                       │
        │     address          │                       │
        │─────────────────────▶│  2. GET request       │
        │                      │─────────────────────▶ │
        │                      │                       │
        │                      │  3. Property data     │
        │                      │◀───────────────────── │
        │  4. Display property │                       │
        │     card with data   │                       │
        │◀─────────────────────│                       │
```

---

## Your Endpoint Requirements

OpenTurf will call your endpoint when a user selects an address. You need to implement a GET endpoint that returns property enrichment data.

### Request Format

```
GET https://your-api.com/your-endpoint?address=<encoded_address>
```

**Headers sent by OpenTurf:**

| Header | Value | Description |
|--------|-------|-------------|
| `X-API-Key` | `your-api-key` | API key for authentication |
| `Accept` | `application/json` | Expected response format |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `address` | string | URL-encoded full address (e.g., `123 Main St, San Francisco, CA 94102`) |

### Example Request

```bash
curl -X GET "https://api.brightersettings.com/openturf?address=123%20Main%20St%2C%20San%20Francisco%2C%20CA%2094102" \
  -H "X-API-Key: your-api-key-here" \
  -H "Accept: application/json"
```

---

## Response Format

Your endpoint should return a JSON object with property enrichment data.

### Successful Response (200 OK)

```json
{
  "quote": "$12,500",
  "beds": 3,
  "baths": 2,
  "sqft": 1850,
  "owners": "John & Jane Smith",
  "owner_occupied": true
}
```

### Response Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `quote` | string | No | Formatted price quote (e.g., "$12,500", "$8,000 - $15,000") |
| `beds` | number | No | Number of bedrooms |
| `baths` | number | No | Number of bathrooms (can be decimal, e.g., 2.5) |
| `sqft` | number | No | Square footage of the property |
| `owners` | string | No | Owner name(s) as a single string |
| `owner_occupied` | boolean | No | Whether the owner lives at the property |

All fields are optional. Include only the data you have available. Missing fields will simply not be displayed.

### No Data Response (200 OK)

If you have no data for an address, return an empty object:

```json
{}
```

### Error Response (4xx/5xx)

If your endpoint returns an error, OpenTurf will display the address without enrichment data. The error won't be shown to the user.

```json
{
  "error": "Address not found",
  "code": "NOT_FOUND"
}
```

---

## Configuration

### Environment Variables (OpenTurf Server)

Configure these in your OpenTurf deployment:

```env
# Your enrichment API endpoint base URL
ENRICHMENT_API_URL=https://api.brightersettings.com/openturf

# API key sent in X-API-Key header
ENRICHMENT_API_KEY=your-api-key-here
```

---

## Timeout & Error Handling

- **Timeout**: OpenTurf waits up to **3 seconds** for your response
- **Retries**: Failed requests are not retried (enrichment is non-critical)
- **Fallback**: If your endpoint fails or times out, the app displays the address without enrichment data

---

## Mobile App Display

The enrichment data is displayed in the property card when a user selects an address:

```
┌─────────────────────────────────────────┐
│  123 Main Street                        │
│  San Francisco, CA 94102                │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ Quote: $12,500                      ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌────────┐ ┌────────┐ ┌──────────────┐ │
│  │ 3 Beds │ │ 2 Bath │ │ 1,850 sq ft  │ │
│  └────────┘ └────────┘ └──────────────┘ │
│                                         │
│  Owner: John & Jane Smith               │
│  ✓ Owner Occupied                       │
│                                         │
└─────────────────────────────────────────┘
```

---

## Testing Your Endpoint

### Test with cURL

```bash
# Test your endpoint directly
curl -X GET "https://your-api.com/your-endpoint?address=123%20Main%20St%2C%20San%20Francisco%2C%20CA%2094102" \
  -H "X-API-Key: test-key" \
  -H "Accept: application/json"
```

### Expected Response

```json
{
  "quote": "$12,500",
  "beds": 3,
  "baths": 2,
  "sqft": 1850,
  "owners": "John & Jane Smith",
  "owner_occupied": true
}
```

---

## Example Implementation

### Node.js/Express Example

```javascript
const express = require('express');
const app = express();

// Middleware to verify API key
function verifyApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.EXPECTED_API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
}

app.get('/openturf', verifyApiKey, async (req, res) => {
  const { address } = req.query;
  
  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }

  try {
    // Look up property data in your database
    const property = await lookupProperty(address);
    
    if (!property) {
      return res.json({}); // No data available
    }

    // Return enrichment data
    res.json({
      quote: property.estimatedQuote,
      beds: property.bedrooms,
      baths: property.bathrooms,
      sqft: property.squareFeet,
      owners: property.ownerNames,
      owner_occupied: property.isOwnerOccupied,
    });
  } catch (error) {
    console.error('Error looking up property:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(3000);
```

### Python/Flask Example

```python
from flask import Flask, request, jsonify
import os

app = Flask(__name__)

def verify_api_key():
    api_key = request.headers.get('X-API-Key')
    return api_key == os.environ.get('EXPECTED_API_KEY')

@app.route('/openturf', methods=['GET'])
def get_enrichment():
    if not verify_api_key():
        return jsonify({'error': 'Invalid API key'}), 401
    
    address = request.args.get('address')
    if not address:
        return jsonify({'error': 'Address is required'}), 400
    
    # Look up property data in your database
    property_data = lookup_property(address)
    
    if not property_data:
        return jsonify({})  # No data available
    
    return jsonify({
        'quote': property_data.get('estimated_quote'),
        'beds': property_data.get('bedrooms'),
        'baths': property_data.get('bathrooms'),
        'sqft': property_data.get('square_feet'),
        'owners': property_data.get('owner_names'),
        'owner_occupied': property_data.get('is_owner_occupied'),
    })

if __name__ == '__main__':
    app.run(port=3000)
```

---

## Support

For integration support, contact:
- Email: integrations@openturf.io
- Documentation: https://docs.openturf.io

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2024-12-14 | Simplified protocol - OpenTurf calls client endpoint via GET |
| 1.0.0 | 2024-12-14 | Initial specification (webhook-based) |
