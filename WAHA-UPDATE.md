# WAHA API Update - Migration Guide

## Overview
The app has been updated to use the **WAHA (WhatsApp HTTP API)** server instead of the previous endpoint. This document outlines all the changes made and how to configure the application.

## Key Changes

### 1. **Endpoint Update**
- **Old:** `http://41.216.186.50:20111/api/sendMessage` (form-urlencoded)
- **New:** `http://41.216.186.50:30401/api/sendText` (JSON)

### 2. **API Request Format**
- **Old Request:**
  ```json
  {
    "apiKey": "your-api-key",
    "phone": "1234567890",
    "message": "Hello"
  }
  ```

- **New Request:**
  ```json
  {
    "apiKey": "your-api-key",
    "phone": "1234567890",
    "message": "Hello"
  }
  ```
  *(Same external API, but internally formatted for WAHA)*

### 3. **Internal API Format Conversion**
The application now:
- Automatically formats phone numbers to WAHA format: `{phone}@c.us` (e.g., `12132132130@c.us`)
- Uses JSON content type instead of form-urlencoded
- Sends API key as `x-api-key` header instead of in request body
- Includes session parameter (default: `'default'`)

### 4. **Configuration**

#### Environment Variables
Create a `.env` file in the project root with:

```env
# WAHA Server Configuration
WAHA_BASE_URL=http://41.216.186.50:30401
WAHA_API_KEY=318d6cd072944f0baaec16741e8b2b44
WAHA_SESSION=default

# Server Port
PORT=20112
```

#### Using `ecosystem.config.js` (PM2)
Update your `ecosystem.config.js` to include environment variables:

```javascript
module.exports = {
  apps: [{
    name: 'whatsappapi',
    script: './app.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      WAHA_BASE_URL: 'http://41.216.186.50:30401',
      WAHA_API_KEY: '318d6cd072944f0baaec16741e8b2b44',
      WAHA_SESSION: 'default',
      PORT: 20112
    }
  }]
};
```

## API Integration

### SendMessage Endpoint
**POST** `/api/sendMessage`

**Request:**
```json
{
  "apiKey": "your-waha-api-key",
  "phone": "1234567890",
  "message": "Your message text"
}
```

**Response:**
```json
{
  "id": "message-id",
  "status": "sent"
}
```

### SendBroadcast Endpoint
**POST** `/api/sendBroadcast`

**Request:**
```json
{
  "apiKey": "your-waha-api-key",
  "data": [
    {
      "to": "1111111111",
      "template": "Hello {{name}}, welcome!",
      "data": {"name": "John"}
    },
    {
      "to": "2222222222",
      "template": "Hello {{name}}, welcome!",
      "data": {"name": "Jane"}
    }
  ]
}
```

**Response:**
```json
{
  "successes": 1,
  "failures": 1,
  "failureDetails": [
    {
      "to": "2222222222",
      "error": "Invalid phone number"
    }
  ],
  "successfulDetails": [
    {
      "to": "1111111111",
      "message": "Hello John, welcome!",
      "response": {"id": "msg-123", "status": "sent"}
    }
  ]
}
```

### Logs Endpoint
**GET** `/api/logs?limit=100&offset=0&endpoint=/api/sendMessage&phone=1234567890`

Returns all API logs with optional filtering.

## Phone Number Format

The application automatically handles phone number formatting:
- Input: `1234567890` or `+1 234 567 890` or `1234567890@c.us`
- Internal format: `1234567890@c.us`
- Only digits are extracted and the `@c.us` suffix is added if missing

## Error Handling

The application includes comprehensive error handling:
- **Invalid apiKey:** 400 Bad Request
- **Invalid phone:** 400 Bad Request
- **No response from WAHA API:** 500 Internal Server Error
- **Connection errors:** 500 Internal Server Error

All errors are logged to the SQLite database for debugging.

## WAHA API Key

The WAHA API key is provided credentials:
- **Username:** `admin`
- **Password:** `318d6cd072944f0baaec16741e8b2b44`

Access the WAHA Dashboard at: `http://41.216.186.50:30401/`

## Database

The application logs all API requests to `logs.db` with:
- Timestamp
- Endpoint
- Phone number
- Message
- HTTP Status code
- Response

## Migration Checklist

- [ ] Update environment variables
- [ ] Update PM2 ecosystem.config.js (if using PM2)
- [ ] Test sendMessage endpoint with sample phone number
- [ ] Test sendBroadcast endpoint with sample data
- [ ] Verify logs are being recorded
- [ ] Monitor error rates in production

## Troubleshooting

### "Connection refused" Error
- Verify WAHA_BASE_URL is correct
- Check if WAHA server is running
- Ensure firewall allows connection to port 30401

### "Unauthorized" Error
- Verify WAHA_API_KEY is correct
- Check if the API key is still valid
- Access WAHA dashboard to regenerate if needed

### Phone number not working
- Ensure phone number is in international format
- Remove any special characters (spaces, dashes, etc.)
- Example: Use `12132132130` not `+1 (213) 213-2130`

## Additional Resources

- WAHA Documentation: https://waha.devlike.pro/
- GitHub Repository: https://github.com/devlikeapro/waha
