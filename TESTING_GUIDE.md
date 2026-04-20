# 🧪 Testing Guide - WhatsApp API

## Quick Test Steps

### 1. Start the Server
```bash
cd /workspaces/whatsappapi
npm start
```

You should see:
```
Server running on port 20115
```

### 2. Test Health Check
```bash
curl http://localhost:20115/
```

Expected response:
```
WhatsApp API running
```

---

## 3. Test Each New Endpoint

### A. Get All Messages Endpoint
```bash
curl "http://localhost:20115/api/messages?apiKey=test-key"
```

**Expected Response Format:**
```json
{
  "success": true,
  "data": [],
  "count": 0
}
```

**Note:** If WAHA server is not available, you'll get an error message like:
```json
{
  "error": "No response received from the WhatsApp API"
}
```

---

### B. Send Reply Message Endpoint
```bash
curl -X POST http://localhost:20115/api/replyMessage \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "test-key",
    "phone": "08123456789",
    "message": "Test reply",
    "messageId": "msg-123"
  }'
```

**Expected Response Format:**
```json
{
  "success": true,
  "message": "Reply message sent successfully",
  "data": {
    "id": "msg-id"
  }
}
```

**Note:** If WAHA server is not available, you'll get an error message.

---

### C. Swagger Documentation
Open in browser:
```
http://localhost:20115/api-docs
```

You should see:
- ✅ Interactive Swagger UI
- ✅ All 6 endpoints listed and grouped by tags
- ✅ Detailed parameter descriptions
- ✅ Try it out buttons for testing
- ✅ Request/response examples

---

## 4. View API Logs
```bash
curl "http://localhost:20115/api/logs?limit=10"
```

**Expected Response:**
```json
{
  "total": X,
  "limit": 10,
  "offset": 0,
  "logs": [
    {
      "id": 1,
      "timestamp": "2024-04-20 XX:XX:XX",
      "endpoint": "/api/messages",
      "phone": null,
      "message": null,
      "status_code": 200,
      "response": "{...}"
    }
  ]
}
```

---

## 5. Test Swagger UI Interactive Features

1. Visit: `http://localhost:20115/api-docs`
2. Click on any endpoint (e.g., "POST /api/replyMessage")
3. Click "Try it out" button
4. Fill in the parameters
5. Click "Execute"
6. Verify response is displayed

---

## Complete Feature Checklist

### Feature 1: Get All WhatsApp Messages ✅
- [x] Endpoint exists: `GET /api/messages`
- [x] Accepts `apiKey` parameter
- [x] Accepts optional `limit` parameter
- [x] Accepts optional `session` parameter
- [x] Returns array of messages
- [x] Returns message count
- [x] Properly documented in Swagger
- [x] Error handling implemented
- [x] API calls logged to database

### Feature 2: Send Reply WhatsApp Message ✅
- [x] Endpoint exists: `POST /api/replyMessage`
- [x] Accepts `apiKey` parameter
- [x] Accepts `phone` parameter
- [x] Accepts `message` parameter
- [x] Accepts `messageId` parameter (for quoting)
- [x] Accepts optional `session` parameter
- [x] Phone number normalization works
- [x] Properly documented in Swagger
- [x] Error handling implemented
- [x] API calls logged to database

### Feature 3: API Documentation with Swagger ✅
- [x] Swagger UI accessible at `/api-docs`
- [x] OpenAPI 3.0.0 specification
- [x] All endpoints documented
- [x] Request/response schemas defined
- [x] Error models documented
- [x] Endpoints organized by tags
- [x] Interactive "Try it out" feature
- [x] Example parameters shown
- [x] Server configuration documented
- [x] Component schemas defined
- [x] Security schemes documented
- [x] Complete parameter descriptions

### Existing Features Maintained ✅
- [x] Send single message: `POST /api/sendMessage`
- [x] Send broadcast: `POST /api/sendBroadcast`
- [x] View logs: `GET /api/logs`
- [x] Health check: `GET /`
- [x] Phone number normalization still works
- [x] API logging still works
- [x] Error handling still works

---

## Browser Testing

### Swagger UI Tests
1. Open: `http://localhost:20115/api-docs`
2. Look for these endpoints in the list:
   - [ ] GET / (Health Check)
   - [ ] POST /api/sendMessage
   - [ ] GET /api/messages ← NEW
   - [ ] POST /api/replyMessage ← NEW
   - [ ] POST /api/sendBroadcast
   - [ ] GET /api/logs

3. Click each endpoint and verify:
   - [ ] Summary and description are shown
   - [ ] All parameters are listed
   - [ ] Request/response schemas are displayed
   - [ ] "Try it out" button works

---

## Database Verification

Check that all API calls are being logged:

```bash
# Check database exists
ls -la logs.db

# View recent logs
sqlite3 logs.db "SELECT * FROM api_logs ORDER BY id DESC LIMIT 5;"

# Count total logs
sqlite3 logs.db "SELECT COUNT(*) FROM api_logs;"
```

---

## Error Handling Tests

### Test 1: Missing API Key
```bash
curl -X POST http://localhost:20115/api/replyMessage \
  -H "Content-Type: application/json" \
  -d '{"phone": "08123456789", "message": "test", "messageId": "123"}'
```

**Expected:** 400 error with message "Invalid or missing apiKey"

### Test 2: Invalid Phone Number
```bash
curl -X POST http://localhost:20115/api/replyMessage \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "test",
    "phone": "",
    "message": "test",
    "messageId": "123"
  }'
```

**Expected:** 400 error with message "Invalid or missing phone"

### Test 3: Missing Message ID
```bash
curl -X POST http://localhost:20115/api/replyMessage \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "test",
    "phone": "08123456789",
    "message": "test"
  }'
```

**Expected:** 400 error with message "Invalid or missing messageId"

---

## Performance Notes

- **Logging:** All requests are logged to SQLite
- **Phone Normalization:** Automatic for all endpoints
- **Response Time:** Should be <1s for local requests
- **Concurrent Requests:** Express handles multiple requests

---

## Cleanup

To reset the API logs database:
```bash
rm logs.db
```

The database will be recreated on next server start.

---

## Troubleshooting

### Server won't start?
```bash
# Check Node version
node --version

# Check dependencies
npm list

# Try clearing node_modules
rm -rf node_modules
npm install

# Verify syntax
node -c app.js
```

### Port 20115 already in use?
```bash
# Kill existing process
lsof -i :20115
kill -9 <PID>

# Or use different port
PORT=20116 npm start
```

### Swagger UI not loading?
- Check http://localhost:20115/api-docs loads
- Check browser console for errors (F12)
- Verify swagger packages installed: `npm list | grep swagger`

---

## Next Steps

1. ✅ Start the server
2. ✅ Test all endpoints using cURL
3. ✅ Access Swagger UI in browser
4. ✅ Try interactive features in Swagger
5. ✅ Review database logs
6. ✅ Test error cases
7. ✅ Deploy to production when ready

---

**Test Date:** April 20, 2024  
**Server Version:** 2.0.0  
**Status:** Ready for Testing ✅
