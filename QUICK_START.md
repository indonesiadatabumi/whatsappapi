# WhatsApp API - Quick Start Guide

## 🚀 Getting Started

### 1. Start the Server
```bash
cd /workspaces/whatsappapi
npm start
```
The server will start on: `http://localhost:20115`

### 2. Access Swagger Documentation
Open in your browser: **`http://localhost:20115/api-docs`**

All API endpoints are documented with interactive examples!

---

## 📋 Available Endpoints

### ✉️ Send a Single Message
```bash
POST /api/sendMessage
```
Send a message to one WhatsApp contact.

```bash
curl -X POST http://localhost:20115/api/sendMessage \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your-api-key",
    "phone": "08123456789",
    "message": "Hello World!"
  }'
```

---

### 📨 Get All Messages
```bash
GET /api/messages
```
Retrieve all WhatsApp messages from the WAHA API.

```bash
curl "http://localhost:20115/api/messages?apiKey=your-api-key&limit=50"
```

---

### 💬 Send a Reply Message
```bash
POST /api/replyMessage
```
Reply to an existing WhatsApp message.

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

---

### 📢 Send Broadcast Messages
```bash
POST /api/sendBroadcast
```
Send personalized messages to multiple recipients using templates.

```bash
curl -X POST http://localhost:20115/api/sendBroadcast \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your-api-key",
    "data": [
      {
        "to": "08123456789",
        "template": "Hi {{name}}, your balance is {{amount}}",
        "data": { "name": "John", "amount": "$100" }
      },
      {
        "to": "08198765432",
        "template": "Hi {{name}}, your balance is {{amount}}",
        "data": { "name": "Jane", "amount": "$200" }
      }
    ]
  }'
```

---

### 📊 Get API Activity Logs
```bash
GET /api/logs
```
View API call logs with filtering and pagination.

```bash
# Get latest 20 logs
curl "http://localhost:20115/api/logs?limit=20"

# Filter by endpoint
curl "http://localhost:20115/api/logs?endpoint=/api/sendMessage&limit=50"

# Filter by phone number
curl "http://localhost:20115/api/logs?phone=628123456789"
```

---

## 💡 Usage Examples

### Example 1: Send Welcome Message
```javascript
const response = await fetch('http://localhost:20115/api/sendMessage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    apiKey: 'your-api-key',
    phone: '628123456789',
    message: 'Welcome to our service! 🎉'
  })
});
const result = await response.json();
console.log('Message sent:', result);
```

### Example 2: Send Personalized Broadcast
```javascript
const broadcasts = [
  { name: 'John', email: 'john@example.com', phone: '628123456789' },
  { name: 'Jane', email: 'jane@example.com', phone: '628987654321' }
];

const data = broadcasts.map(user => ({
  to: user.phone,
  template: 'Hi {{name}}, confirm your email: {{email}}',
  data: { name: user.name, email: user.email }
}));

const response = await fetch('http://localhost:20115/api/sendBroadcast', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ apiKey: 'your-api-key', data })
});
const result = await response.json();
console.log(`Sent: ${result.successes}, Failed: ${result.failures}`);
```

### Example 3: Get and Reply to Messages
```javascript
// Step 1: Get all messages
const getResponse = await fetch('http://localhost:20115/api/messages?apiKey=your-api-key');
const messages = await getResponse.json();
console.log(`Found ${messages.count} messages`);

// Step 2: Reply to first message
if (messages.count > 0) {
  const firstMsg = messages.data[0];
  const replyResponse = await fetch('http://localhost:20115/api/replyMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: 'your-api-key',
      phone: firstMsg.from,
      message: 'Thanks for reaching out!',
      messageId: firstMsg.id
    })
  });
  const replyResult = await replyResponse.json();
  console.log('Reply sent:', replyResult);
}
```

### Example 4: Monitor API Usage
```javascript
// Check API logs for last hour
async function checkApiUsage() {
  const response = await fetch('http://localhost:20115/api/logs?limit=1000');
  const logs = await response.json();
  
  const groupedByEndpoint = {};
  logs.logs.forEach(log => {
    if (!groupedByEndpoint[log.endpoint]) {
      groupedByEndpoint[log.endpoint] = { count: 0, successes: 0, failures: 0 };
    }
    groupedByEndpoint[log.endpoint].count++;
    if (log.status_code === 200) {
      groupedByEndpoint[log.endpoint].successes++;
    } else {
      groupedByEndpoint[log.endpoint].failures++;
    }
  });
  
  console.log('API Usage Summary:');
  console.table(groupedByEndpoint);
}

checkApiUsage();
```

---

## 🔧 Configuration

Create a `.env` file in the project root:

```env
# WAHA Server Configuration
WAHA_BASE_URL=http://41.216.186.50:30401
WAHA_API_KEY=your-waha-api-key
WAHA_SESSION=default

# Server Port
PORT=20115
```

---

## 🎯 Phone Number Normalization

All phone numbers are automatically normalized to include the Indonesia country code (+62):

| Input | Normalized |
|-------|-----------|
| `08123456789` | `628123456789` |
| `8123456789` | `628123456789` |
| `628123456789` | `628123456789` |

---

## 📖 Complete Documentation

For detailed information about all endpoints, parameters, and response formats, see:
📄 **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**

---

## 🐛 Troubleshooting

**Server won't start?**
```bash
# Check if port is in use
lsof -i :20115

# Check logs
tail -f logs/error.log
```

**Messages not sending?**
- Verify WAHA server is running: `curl http://41.216.186.50:30401/`
- Check API key is correct
- Verify phone number format

**View API logs:**
```bash
sqlite3 logs.db
sqlite> SELECT * FROM api_logs ORDER BY timestamp DESC LIMIT 10;
```

---

## 📚 Swagger UI Features

The interactive Swagger documentation at `http://localhost:20115/api-docs` allows you to:

✅ View all available endpoints  
✅ See detailed parameter descriptions  
✅ View request/response schemas  
✅ Try endpoints directly from the browser  
✅ Copy example cURL commands  

---

**Happy messaging! 🚀**
