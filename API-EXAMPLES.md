# WAHA API Examples

## Configuration
Before testing, make sure to:
1. Set your WAHA API key: `318d6cd072944f0baaec16741e8b2b44`
2. WAHA server should be running at: `http://41.216.186.50:30401`
3. Have a valid WhatsApp session connected in WAHA

## Send Single Message

### cURL
```bash
curl -X POST http://localhost:20112/api/sendMessage \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "318d6cd072944f0baaec16741e8b2b44",
    "phone": "1234567890",
    "message": "Hello from WAHA API!"
  }'
```

### JavaScript/Node.js
```javascript
const axios = require('axios');

async function sendMessage() {
  try {
    const response = await axios.post('http://localhost:20112/api/sendMessage', {
      apiKey: '318d6cd072944f0baaec16741e8b2b44',
      phone: '1234567890',
      message: 'Hello from WAHA API!'
    });
    console.log('Message sent:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

sendMessage();
```

### Python
```python
import requests

response = requests.post('http://localhost:20112/api/sendMessage', json={
    'apiKey': '318d6cd072944f0baaec16741e8b2b44',
    'phone': '1234567890',
    'message': 'Hello from WAHA API!'
})
print(response.json())
```

## Send Broadcast Messages

### cURL
```bash
curl -X POST http://localhost:20112/api/sendBroadcast \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "318d6cd072944f0baaec16741e8b2b44",
    "data": [
      {
        "to": "1111111111",
        "template": "Hello {{name}}, welcome to our service!",
        "data": {"name": "Alice"}
      },
      {
        "to": "2222222222",
        "template": "Hello {{name}}, welcome to our service!",
        "data": {"name": "Bob"}
      },
      {
        "to": "3333333333",
        "template": "Hello {{name}}, welcome to our service!",
        "data": {"name": "Charlie"}
      }
    ]
  }'
```

### JavaScript/Node.js
```javascript
const axios = require('axios');

async function sendBroadcast() {
  try {
    const response = await axios.post('http://localhost:20112/api/sendBroadcast', {
      apiKey: '318d6cd072944f0baaec16741e8b2b44',
      data: [
        {
          to: '1111111111',
          template: 'Hello {{name}}, welcome!',
          data: { name: 'Alice' }
        },
        {
          to: '2222222222',
          template: 'Hello {{name}}, welcome!',
          data: { name: 'Bob' }
        }
      ]
    });
    console.log('Broadcast result:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

sendBroadcast();
```

### Python
```python
import requests

response = requests.post('http://localhost:20112/api/sendBroadcast', json={
    'apiKey': '318d6cd072944f0baaec16741e8b2b44',
    'data': [
        {
            'to': '1111111111',
            'template': 'Hello {{name}}, welcome!',
            'data': {'name': 'Alice'}
        },
        {
            'to': '2222222222',
            'template': 'Hello {{name}}, welcome!',
            'data': {'name': 'Bob'}
        }
    ]
})
print(response.json())
```

## Get Logs

### cURL - Get last 100 logs
```bash
curl -X GET "http://localhost:20112/api/logs?limit=100&offset=0"
```

### cURL - Filter by endpoint
```bash
curl -X GET "http://localhost:20112/api/logs?endpoint=/api/sendMessage&limit=50"
```

### cURL - Filter by phone number
```bash
curl -X GET "http://localhost:20112/api/logs?phone=1234567890&limit=50"
```

### JavaScript/Node.js
```javascript
const axios = require('axios');

async function getLogs() {
  try {
    const response = await axios.get('http://localhost:20112/api/logs', {
      params: {
        limit: 100,
        offset: 0,
        endpoint: '/api/sendMessage'
      }
    });
    console.log('Logs:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

getLogs();
```

### Python
```python
import requests

response = requests.get('http://localhost:20112/api/logs', params={
    'limit': 100,
    'offset': 0,
    'endpoint': '/api/sendMessage'
})
print(response.json())
```

## Response Examples

### Successful Send Message
```json
{
  "id": "3AA3A41234567890ABCDEF",
  "status": "sent",
  "timestamp": 1704067200000
}
```

### Successful Broadcast
```json
{
  "successes": 2,
  "failures": 0,
  "failureDetails": [],
  "successfulDetails": [
    {
      "to": "1111111111",
      "message": "Hello Alice, welcome!",
      "response": {
        "id": "3AA3A41234567890ABCDEF",
        "status": "sent"
      }
    },
    {
      "to": "2222222222",
      "message": "Hello Bob, welcome!",
      "response": {
        "id": "3AA3A41234567891BCDEFG",
        "status": "sent"
      }
    }
  ]
}
```

### Error Response
```json
{
  "error": "Invalid or missing apiKey"
}
```

## Phone Number Examples

Valid formats:
- `1234567890` ✓
- `+1234567890` ✓
- `+1 (234) 567-8900` ✓
- `1234567890@c.us` ✓

All will be converted to: `1234567890@c.us`

## Testing Checklist

- [ ] Server is running on port 20112
- [ ] WAHA server is running on port 30401
- [ ] WAHA session is active and connected
- [ ] API key is correctly set
- [ ] Test basic sendMessage endpoint
- [ ] Test sendBroadcast with multiple contacts
- [ ] Check logs endpoint for recorded requests
- [ ] Verify messages on WhatsApp

## Troubleshooting

**Issue: "Connection refused" at WAHA server**
- Check if WAHA is running: `http://41.216.186.50:30401`
- Check network connectivity

**Issue: "Unauthorized" error**
- Verify API key is correct
- Check if session is properly configured in WAHA

**Issue: "Invalid phone number"**
- Remove special characters from phone
- Ensure format is international (e.g., US numbers start with 1)
- Don't include + symbol

**Issue: Messages not appearing**
- Verify WAHA session is active and connected
- Check WAHA dashboard for session status
- Review logs for error details
