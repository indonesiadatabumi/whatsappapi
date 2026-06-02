# WhatsApp API Complete Documentation

## Overview

This is a comprehensive WhatsApp HTTP API server built with Express.js and WAHA (WhatsApp HTTP API). It provides endpoints to send messages, manage conversations, and monitor API activities.

**API Base URL:** `http://localhost:20115` (or your configured port)

**Interactive Swagger Documentation:** `http://localhost:20115/api-docs`

---

## Table of Contents

1. [Authentication](#authentication)
2. [System Endpoints](#system-endpoints)
3. [Message Endpoints](#message-endpoints)
4. [Contact Endpoints](#contact-endpoints)
5. [Broadcast Endpoints](#broadcast-endpoints)
6. [Monitoring Endpoints](#monitoring-endpoints)
7. [Error Handling](#error-handling)
8. [Examples](#examples)

---

## Authentication

All endpoints (except the health check) require an API key passed via:
- **Query Parameter:** `apiKey=your-api-key` (for GET requests)
- **Request Body:** `{ "apiKey": "your-api-key", ... }` (for POST requests)

### Phone Number Normalization

Phone numbers are automatically normalized to include the Indonesia country code (+62):
- `08123456789` → `628123456789`
- `8123456789` → `628123456789`
- `628123456789` → `628123456789` (already normalized)

---

## System Endpoints

### Health Check

**Endpoint:** `GET /`

**Description:** Verify that the WhatsApp API server is running.

**Response:**
```
WhatsApp API running
```

---

## Message Endpoints

### 1. Send Single Message

**Endpoint:** `POST /api/sendMessage`

**Description:** Send a text message to a single WhatsApp contact.

**Request Body:**
```json
{
  "apiKey": "your-api-key",
  "phone": "08123456789",
  "message": "Hello from WhatsApp API!",
  "session": "default"
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| apiKey | string | Yes | API key for authentication |
| phone | string | Yes | Recipient phone number (auto-normalized) |
| message | string | Yes | Message text to send |
| session | string | No | WhatsApp session name (default: "default") |

**Response (Success):**
```json
{
  "id": "message-id-123",
  "status": "sent"
}
```

**Response (Error):**
```json
{
  "error": "Invalid or missing phone"
}
```

**Example (cURL):**
```bash
curl -X POST http://localhost:20115/api/sendMessage \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your-api-key",
    "phone": "628123456789",
    "message": "Hello World!"
  }'
```

**Example (JavaScript):**
```javascript
const response = await fetch('http://localhost:20115/api/sendMessage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    apiKey: 'your-api-key',
    phone: '08123456789',
    message: 'Hello World!'
  })
});
const data = await response.json();
console.log(data);
```

**Example (Python):**
```python
import requests

response = requests.post(
    'http://localhost:20115/api/sendMessage',
    json={
        'apiKey': 'your-api-key',
        'phone': '08123456789',
        'message': 'Hello World!'
    }
)
print(response.json())
```

---

### 2. Get All Messages

**Endpoint:** `GET /api/messages`

**Description:** Retrieve all WhatsApp messages from the WAHA API.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| apiKey | string | - | API key for authentication (required) |
| session | string | default | WhatsApp session name |
| limit | integer | 100 | Maximum number of messages to retrieve |

**Response (Success):**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "msg-id-1",
      "chatId": "628123456789@c.us",
      "from": "628123456789",
      "to": "6287654321",
      "text": "Hello!",
      "timestamp": 1713607800
    }
  ]
}
```

**Response (Error):**
```json
{
  "error": "Invalid or missing apiKey"
}
```

**Example (cURL):**
```bash
curl "http://localhost:20115/api/messages?apiKey=your-api-key&limit=50"
```

**Example (JavaScript):**
```javascript
const response = await fetch('http://localhost:20115/api/messages?apiKey=your-api-key&limit=50');
const data = await response.json();
console.log(data);
```

---

### 3. Get Full Conversation Messages

**Endpoint:** `GET /api/conversations`

**Description:** Retrieve the full chat message history for a specific WhatsApp conversation by `chatId`.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| apiKey | string | - | API key for authentication (required) |
| session | string | default | WhatsApp session name |
| chatId | string | - | WhatsApp chat ID (e.g. `6281276101562@c.us`) |
| limit | integer | 100 | Maximum number of messages to retrieve |

**Response (Success):**
```json
{
  "success": true,
  "chatId": "6281276101562@c.us",
  "count": 50,
  "data": [
    {
      "id": "message-id-1",
      "chatId": "6281276101562@c.us",
      "from": "6281276101562",
      "to": "6287654321",
      "text": "Hello!",
      "timestamp": 1713607800
    }
  ]
}
```

**Example (cURL):**
```bash
curl "http://localhost:20115/api/conversations?apiKey=your-api-key&chatId=6281276101562%40c.us&limit=100"
```

---

**Example (Python):**
```python
import requests

response = requests.get(
    'http://localhost:20115/api/messages',
    params={
        'apiKey': 'your-api-key',
        'limit': 50
    }
)
print(response.json())
```

---

### 3. Send Reply Message

**Endpoint:** `POST /api/replyMessage`

**Description:** Send a reply to an existing WhatsApp message.

**Request Body:**
```json
{
  "apiKey": "your-api-key",
  "phone": "08123456789",
  "message": "Thanks for your message!",
  "messageId": "msg-id-123",
  "session": "default"
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| apiKey | string | Yes | API key for authentication |
| phone | string | Yes | Recipient phone number (auto-normalized) |
| message | string | Yes | Reply message text |
| messageId | string | Yes | ID of the message to reply to |
| session | string | No | WhatsApp session name (default: "default") |

**Response (Success):**
```json
{
  "success": true,
  "message": "Reply message sent successfully",
  "data": {
    "id": "msg-id-456"
  }
}
```

**Response (Error):**
```json
{
  "error": "Invalid or missing messageId"
}
```

**Example (cURL):**
```bash
curl -X POST http://localhost:20115/api/replyMessage \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your-api-key",
    "phone": "08123456789",
    "message": "Thanks for your message!",
    "messageId": "msg-id-123"
  }'
```

**Example (JavaScript):**
```javascript
const response = await fetch('http://localhost:20115/api/replyMessage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    apiKey: 'your-api-key',
    phone: '08123456789',
    message: 'Thanks for your message!',
    messageId: 'msg-id-123'
  })
});
const data = await response.json();
console.log(data);
```

---

## Contact Endpoints

### 1. Check Contact

**Endpoint:** `GET /api/checkContact`

**Description:** Check if a phone number exists as a WhatsApp contact.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| apiKey | string | - | API key for authentication (required) |
| phone | string | - | Phone number to check (required) |
| session | string | default | WhatsApp session name |

**Response (Contact Exists):**
```json
{
  "exists": true,
  "phone": "628123456789",
  "chatId": "628123456789@c.us",
  "data": {
    "id": "628123456789@c.us",
    "name": "John Doe",
    "pushname": "John"
  }
}
```

**Response (Contact Not Found):**
```json
{
  "exists": false,
  "phone": "628123456789",
  "chatId": "628123456789@c.us"
}
```

**Example (cURL):**
```bash
curl "http://localhost:20115/api/checkContact?apiKey=your-api-key&phone=08123456789"
```

---

### 2. Get All Contacts

**Endpoint:** `GET /api/contacts`

**Description:** Retrieve all WhatsApp contacts from the WAHA API.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| apiKey | string | - | API key for authentication (required) |
| session | string | default | WhatsApp session name |

**Response (Success):**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "628123456789@c.us",
      "name": "John Doe",
      "pushname": "John",
      "isBusiness": false
    }
  ]
}
```

**Example (cURL):**
```bash
curl "http://localhost:20115/api/contacts?apiKey=your-api-key"
```

---

## Broadcast Endpoints

### Send Broadcast Messages

**Endpoint:** `POST /api/sendBroadcast`

**Description:** Send personalized messages to multiple recipients using templates with variable substitution. Includes anti-suspension features: random delays (1-5 seconds), typing simulation, and rate limiting (50 broadcasts per hour).

**Rate Limiting:** Maximum 50 broadcast requests per hour to prevent account suspension.

**Anti-Suspension Features:**
- Random delays between messages (1-5 seconds)
- Typing start/stop simulation
- Message signatures
- Rate limiting per hour

**Request Body:**
```json
{
  "apiKey": "your-api-key",
  "session": "default",
  "data": [
    {
      "to": "08123456789",
      "template": "Hi {{name}}, your order #{{orderId}} is {{status}}",
      "data": {
        "name": "John",
        "orderId": "ORD-001",
        "status": "delivered"
      }
    },
    {
      "to": "08198765432",
      "template": "Hi {{name}}, your order #{{orderId}} is {{status}}",
      "data": {
        "name": "Jane",
        "orderId": "ORD-002",
        "status": "in transit"
      }
    }
  ]
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| apiKey | string | Yes | API key for authentication |
| session | string | No | WhatsApp session name (default: "default") |
| data | array | Yes | Array of broadcast items |

**Data Item Structure:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| to | string | Yes | Recipient phone number |
| template | string | Yes | Message template with {{placeholder}} syntax |
| data | object | Yes | Object with values to replace placeholders |

**Response (Success):**
```json
{
  "successes": 2,
  "failures": 0,
  "successfulDetails": [
    {
      "to": "08123456789",
      "message": "Hi John, your order #ORD-001 is delivered",
      "response": { "id": "msg-123" }
    }
  ],
  "failureDetails": []
}
```

**Response (Partial Failure):**
```json
{
  "successes": 1,
  "failures": 1,
  "successfulDetails": [
    {
      "to": "08123456789",
      "message": "Hi John, your order #ORD-001 is delivered",
      "response": { "id": "msg-123" }
    }
  ],
  "failureDetails": [
    {
      "to": "08198765432",
      "error": "Invalid phone number"
    }
  ]
}
```

**Example (cURL):**
```bash
curl -X POST http://localhost:20115/api/sendBroadcast \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your-api-key",
    "data": [
      {
        "to": "08123456789",
        "template": "Hi {{name}}, welcome!",
        "data": { "name": "John" }
      },
      {
        "to": "08198765432",
        "template": "Hi {{name}}, welcome!",
        "data": { "name": "Jane" }
      }
    ]
  }'
```

**Example (JavaScript):**
```javascript
const response = await fetch('http://localhost:20115/api/sendBroadcast', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    apiKey: 'your-api-key',
    data: [
      {
        to: '08123456789',
        template: 'Hi {{name}}, welcome!',
        data: { name: 'John' }
      },
      {
        to: '08198765432',
        template: 'Hi {{name}}, welcome!',
        data: { name: 'Jane' }
      }
    ]
  })
});
const result = await response.json();
console.log(`Sent: ${result.successes}, Failed: ${result.failures}`);
```

---

## Monitoring Endpoints

### Get API Logs

**Endpoint:** `GET /api/logs`

**Description:** Retrieve logs of all API calls with pagination and filtering options. Useful for monitoring and debugging.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | integer | 100 | Number of logs to return |
| offset | integer | 0 | Offset for pagination |
| endpoint | string | - | Filter by API endpoint (e.g., `/api/sendMessage`) |
| phone | string | - | Filter by phone number |

**Response (Success):**
```json
{
  "total": 150,
  "limit": 10,
  "offset": 0,
  "logs": [
    {
      "id": 1,
      "timestamp": "2024-04-20 10:30:45",
      "endpoint": "/api/sendMessage",
      "phone": "628123456789",
      "message": "Hello!",
      "status_code": 200,
      "response": "{\"id\":\"msg-123\"}"
    }
  ]
}
```

**Example (cURL):**
```bash
# Get latest 20 logs
curl "http://localhost:20115/api/logs?limit=20"

# Get logs for a specific endpoint
curl "http://localhost:20115/api/logs?endpoint=/api/sendMessage&limit=50"

# Get logs for a specific phone number
curl "http://localhost:20115/api/logs?phone=628123456789"

# Get logs with pagination
curl "http://localhost:20115/api/logs?limit=10&offset=0"
```

**Example (JavaScript):**
```javascript
// Get latest logs
const response = await fetch('http://localhost:20115/api/logs?limit=20');
const logs = await response.json();
console.log(`Total logs: ${logs.total}`);
console.log(logs.logs);

// Get logs for specific endpoint
const response2 = await fetch('http://localhost:20115/api/logs?endpoint=/api/sendMessage&limit=50');
const data = await response2.json();
```

**Example (Python):**
```python
import requests

# Get latest logs
response = requests.get(
    'http://localhost:20115/api/logs',
    params={'limit': 20}
)
logs = response.json()
print(f"Total logs: {logs['total']}")

# Filter by phone number
response = requests.get(
    'http://localhost:20115/api/logs',
    params={'phone': '628123456789', 'limit': 50}
)
filtered_logs = response.json()
```

---

## Error Handling

### Common Error Responses

**401 - Invalid API Key:**
```json
{
  "error": "Invalid or missing apiKey"
}
```

**400 - Bad Request:**
```json
{
  "error": "Invalid or missing phone",
  "detail": "Phone number field is required"
}
```

**500 - Server Error:**
```json
{
  "error": "Error setting up the request",
  "detail": "Connection refused"
}
```

**502 - WAHA API Error:**
```json
{
  "error": "Failed to send message",
  "detail": "WAHA API returned error: Invalid session"
}
```

### HTTP Status Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Bad Request (missing/invalid parameters) |
| 401 | Unauthorized (invalid API key) |
| 500 | Server Error |
| 502 | Bad Gateway (WAHA API error) |

---

## Examples

### Complete Workflow Example

**1. Send a message:**
```bash
curl -X POST http://localhost:20115/api/sendMessage \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your-api-key",
    "phone": "08123456789",
    "message": "Hi! How are you?"
  }'
```

**2. Get all messages:**
```bash
curl "http://localhost:20115/api/messages?apiKey=your-api-key"
```

**3. Reply to a message:**
```bash
curl -X POST http://localhost:20115/api/replyMessage \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your-api-key",
    "phone": "08123456789",
    "message": "Thanks! I am doing well.",
    "messageId": "msg-id-from-previous-response"
  }'
```

**4. Send broadcast:**
```bash
curl -X POST http://localhost:20115/api/sendBroadcast \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your-api-key",
    "data": [
      {
        "to": "08123456789",
        "template": "Hi {{name}}, this is a broadcast!",
        "data": { "name": "John" }
      }
    ]
  }'
```

**5. View activity logs:**
```bash
curl "http://localhost:20115/api/logs?limit=10"
```

---

## Configuration

Set environment variables in `.env` file:

```env
# WAHA Server Configuration
WAHA_BASE_URL=http://41.216.186.50:30401
WAHA_API_KEY=your-api-key
WAHA_SESSION=default

# Server Configuration
PORT=20115
```

---

## Running the Server

**Install dependencies:**
```bash
npm install
```

**Start the server:**
```bash
npm start
# or
node app.js
```

**Using PM2 (for production):**
```bash
pm2 start ecosystem.config.js
```

**Access API Documentation:**
Open your browser and navigate to: `http://localhost:20115/api-docs`

---

## Support & Debugging

### Check Server Health
```bash
curl http://localhost:20115/
```

### View Recent Logs
```bash
curl "http://localhost:20115/api/logs?limit=10"
```

### Monitor Specific Endpoint
```bash
curl "http://localhost:20115/api/logs?endpoint=/api/sendMessage"
```

### Database

All API calls are logged in `logs.db` (SQLite). You can inspect it using:
```bash
sqlite3 logs.db
sqlite> SELECT * FROM api_logs LIMIT 10;
```

---

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2024-04-20 | Added get messages, reply message endpoints; Enhanced Swagger docs |
| 1.0.0 | 2024-04-15 | Initial release with send & broadcast endpoints |

---

**Last Updated:** April 20, 2024
