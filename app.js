const express = require('express');
const axios = require('axios');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();

// ─── Configuration ─────────────────────────────────────────────────────────────
const WAHA_BASE_URL = process.env.WAHA_BASE_URL || 'http://41.216.186.50:30401';
const WAHA_API_KEY = process.env.WAHA_API_KEY || '';
const WAHA_SESSION = process.env.WAHA_SESSION || 'default';

// ─── Database Setup ───────────────────────────────────────────────────────────
const db = new Database(path.join(__dirname, 'logs.db'));

db.exec(`
    CREATE TABLE IF NOT EXISTS api_logs (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp   DATETIME DEFAULT (datetime('now','localtime')),
        endpoint    TEXT NOT NULL,
        phone       TEXT,
        message     TEXT,
        status_code INTEGER,
        response    TEXT
    )
`);

const insertLog = db.prepare(`
    INSERT INTO api_logs (endpoint, phone, message, status_code, response)
    VALUES (@endpoint, @phone, @message, @status_code, @response)
`);

function saveLog({ endpoint, phone, message, status_code, response }) {
    try {
        insertLog.run({
            endpoint,
            phone:       phone       ? String(phone)                        : null,
            message:     message     ? String(message)                      : null,
            status_code: status_code ? Number(status_code)                  : null,
            response:    response    ? JSON.stringify(response)             : null
        });
    } catch (err) {
        console.error('[LOG ERROR]', err.message);
    }
}

// ─── Swagger Setup ───────────────────────────────────────────────────────────
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'WhatsApp API',
            version: '2.0.0',
            description: 'Comprehensive API for WhatsApp message management via WAHA (WhatsApp HTTP API)',
            contact: {
                name: 'API Support',
            },
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 20115}`,
                description: 'Development Server',
            },
            {
                url: '/',
                description: 'Current Environment',
            },
        ],
        components: {
            securitySchemes: {
                ApiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-Api-Key',
                    description: 'API Key for authentication',
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            description: 'Error message',
                        },
                        detail: {
                            type: 'string',
                            description: 'Detailed error information',
                        },
                    },
                },
                Message: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Message ID',
                        },
                        chatId: {
                            type: 'string',
                            description: 'Chat ID',
                        },
                        from: {
                            type: 'string',
                            description: 'Sender phone number',
                        },
                        to: {
                            type: 'string',
                            description: 'Recipient phone number',
                        },
                        text: {
                            type: 'string',
                            description: 'Message text',
                        },
                        timestamp: {
                            type: 'number',
                            description: 'Message timestamp',
                        },
                    },
                },
                ApiLog: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Log ID',
                        },
                        timestamp: {
                            type: 'string',
                            description: 'Log timestamp',
                        },
                        endpoint: {
                            type: 'string',
                            description: 'API endpoint',
                        },
                        phone: {
                            type: 'string',
                            description: 'Phone number involved',
                        },
                        message: {
                            type: 'string',
                            description: 'Message sent',
                        },
                        status_code: {
                            type: 'integer',
                            description: 'HTTP status code',
                        },
                        response: {
                            type: 'object',
                            description: 'API response',
                        },
                    },
                },
            },
        },
    },
    apis: ['./app.js'],
};

const swaggerSpecs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// ─── Health Check ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /:
 *   get:
 *     summary: Health check endpoint
 *     description: Verify that the WhatsApp API server is running
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
app.get('/', (req, res) => {
    res.send('WhatsApp API running');
});

// ─── Helper ───────────────────────────────────────────────────────────────────
function replacePlaceholders(template, data) {
    return template.replace(/{{(\w+)}}/g, (match, key) => {
        return data[key] !== undefined ? data[key] : match;
    });
}

function normalizePhone(phone) {
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('62')) {
        return cleaned;
    } else if (cleaned.startsWith('0')) {
        return '62' + cleaned.slice(1);
    } else if (cleaned.startsWith('8')) {
        return '62' + cleaned;
    } else {
        // Assume it's a local number without prefix, add 62
        return '62' + cleaned;
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── POST /api/sendMessage ────────────────────────────────────────────────────
/**
 * @swagger
 * /api/sendMessage:
 *   post:
 *     summary: Send a WhatsApp message
 *     description: Send a text message to a WhatsApp contact. Phone number is automatically normalized.
 *     tags:
 *       - Messages
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - apiKey
 *               - phone
 *               - message
 *             properties:
 *               apiKey:
 *                 type: string
 *                 description: API key for authentication
 *               phone:
 *                 type: string
 *                 description: Recipient phone number (will be normalized to include country code)
 *               message:
 *                 type: string
 *                 description: Message text to send
 *               session:
 *                 type: string
 *                 default: default
 *                 description: WhatsApp session name
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Message ID returned by WAHA
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/sendMessage', async (req, res) => {
    const { apiKey, phone, message } = req.body;

    if (!apiKey || typeof apiKey !== 'string') {
        saveLog({ endpoint: '/api/sendMessage', phone, message, status_code: 400, response: { error: 'Invalid or missing apiKey' } });
        return res.status(400).json({ error: 'Invalid or missing apiKey' });
    }
    if (!phone || (typeof phone !== 'string' && typeof phone !== 'number')) {
        saveLog({ endpoint: '/api/sendMessage', phone, message, status_code: 400, response: { error: 'Invalid or missing phone' } });
        return res.status(400).json({ error: 'Invalid or missing phone' });
    }
    if (!message || typeof message !== 'string') {
        saveLog({ endpoint: '/api/sendMessage', phone, message, status_code: 400, response: { error: 'Invalid or missing message' } });
        return res.status(400).json({ error: 'Invalid or missing message' });
    }

    try {
        // Normalize and format phone number for WAHA
        const normalizedPhone = normalizePhone(String(phone));
        const chatId = `${normalizedPhone}@c.us`;

        // Start typing simulation
        try {
            await axios.post(`${WAHA_BASE_URL}/api/startTyping`, { chatId, session: WAHA_SESSION }, { headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey } });
        } catch (typingError) {
            console.log('Start typing failed:', typingError.message);
        }

        const typingDelay = Math.min(message.length * 100, 3000);
        await delay(typingDelay);

        const response = await axios.post(
            `${WAHA_BASE_URL}/api/sendText`,
            {
                chatId: chatId,
                text: message,
                session: WAHA_SESSION
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': apiKey
                }
            }
        );

        // Stop typing
        try {
            await axios.post(`${WAHA_BASE_URL}/api/stopTyping`, { chatId, session: WAHA_SESSION }, { headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey } });
        } catch (typingError) {
            console.log('Stop typing failed:', typingError.message);
        }

        saveLog({ endpoint: '/api/sendMessage', phone, message, status_code: response.status, response: response.data });
        res.status(response.status).json(response.data);

    } catch (error) {
        if (error.response) {
            saveLog({ endpoint: '/api/sendMessage', phone, message, status_code: error.response.status, response: error.response.data });
            res.status(error.response.status).json({ error: error.response.data });
        } else if (error.request) {
            saveLog({ endpoint: '/api/sendMessage', phone, message, status_code: 500, response: { error: 'No response received from the WhatsApp API' } });
            res.status(500).json({ error: 'No response received from the WhatsApp API' });
        } else {
            saveLog({ endpoint: '/api/sendMessage', phone, message, status_code: 500, response: { error: error.message } });
            res.status(500).json({ error: 'Error setting up the request' });
        }
    }
});

// ─── POST /api/sendBroadcast ──────────────────────────────────────────────────
/**
 * @swagger
 * /api/sendBroadcast:
 *   post:
 *     summary: Send broadcast messages to multiple recipients
 *     description: Send personalized messages to multiple recipients using templates with variable substitution
 *     tags:
 *       - Messages
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - apiKey
 *               - data
 *             properties:
 *               apiKey:
 *                 type: string
 *                 description: API key for authentication
 *               data:
 *                 type: array
 *                 description: Array of message data for each recipient
 *                 items:
 *                   type: object
 *                   required:
 *                     - to
 *                     - template
 *                     - data
 *                   properties:
 *                     to:
 *                       type: string
 *                       description: Recipient phone number (will be normalized)
 *                     template:
 *                       type: string
 *                       description: Message template with placeholders like {{name}}, {{amount}}
 *                     data:
 *                       type: object
 *                       description: Data object to replace placeholders in template
 *               session:
 *                 type: string
 *                 default: default
 *                 description: WhatsApp session name
 *     responses:
 *       200:
 *         description: Broadcast completed with results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 successes:
 *                   type: integer
 *                   description: Number of successfully sent messages
 *                 failures:
 *                   type: integer
 *                   description: Number of failed messages
 *                 successfulDetails:
 *                   type: array
 *                   description: Details of successful deliveries
 *                 failureDetails:
 *                   type: array
 *                   description: Details of failed deliveries
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/sendBroadcast', async (req, res) => {
    const { apiKey, data } = req.body;

    if (!apiKey || typeof apiKey !== 'string') {
        saveLog({ endpoint: '/api/sendBroadcast', status_code: 400, response: { error: 'Invalid or missing apiKey' } });
        return res.status(400).json({ error: 'Invalid or missing apiKey' });
    }
    if (!Array.isArray(data) || data.length === 0) {
        saveLog({ endpoint: '/api/sendBroadcast', status_code: 400, response: { error: 'Invalid or missing data array' } });
        return res.status(400).json({ error: 'Invalid or missing data array' });
    }

    let successes = 0;
    let failures = 0;
    const failureDetails = [];
    const successfulDetails = [];

    for (const item of data) {
        const { to, template, data: templateData } = item;

        if (!to || (typeof to !== 'string' && typeof to !== 'number')) {
            failures++;
            failureDetails.push({ to, error: 'Invalid or missing phone number' });
            saveLog({ endpoint: '/api/sendBroadcast', phone: to, status_code: 400, response: { error: 'Invalid or missing phone number' } });
            continue;
        }
        if (!template || typeof template !== 'string') {
            failures++;
            failureDetails.push({ to, error: 'Invalid or missing template' });
            saveLog({ endpoint: '/api/sendBroadcast', phone: to, status_code: 400, response: { error: 'Invalid or missing template' } });
            continue;
        }
        if (!templateData || typeof templateData !== 'object') {
            failures++;
            failureDetails.push({ to, error: 'Invalid or missing template data' });
            saveLog({ endpoint: '/api/sendBroadcast', phone: to, status_code: 400, response: { error: 'Invalid or missing template data' } });
            continue;
        }

        const message = replacePlaceholders(template, templateData);

        try {
            // Normalize and format phone number for WAHA
            const normalizedPhone = normalizePhone(String(to));
            const chatId = `${normalizedPhone}@c.us`;

            // Start typing simulation
            try {
                await axios.post(`${WAHA_BASE_URL}/api/startTyping`, { chatId, session: WAHA_SESSION }, { headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey } });
            } catch (typingError) {
                console.log('Start typing failed:', typingError.message);
            }

            const typingDelay = Math.min(message.length * 100, 3000);
            await delay(typingDelay);

            const response = await axios.post(
                `${WAHA_BASE_URL}/api/sendText`,
                {
                    chatId: chatId,
                    text: message,
                    session: WAHA_SESSION
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Api-Key': apiKey
                    }
                }
            );

            // Stop typing
            try {
                await axios.post(`${WAHA_BASE_URL}/api/stopTyping`, { chatId, session: WAHA_SESSION }, { headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey } });
            } catch (typingError) {
                console.log('Stop typing failed:', typingError.message);
            }

            successes++;
            successfulDetails.push({ to, message, response: response.data });
            saveLog({ endpoint: '/api/sendBroadcast', phone: to, message, status_code: response.status, response: response.data });

            // Delay between broadcasts to avoid suspension
            await delay(2000);

        } catch (error) {
            failures++;
            const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
            failureDetails.push({ to, error: errorMessage });
            saveLog({ endpoint: '/api/sendBroadcast', phone: to, message, status_code: error.response?.status || 500, response: { error: errorMessage } });
        }
    }

    const broadcastResult = { successes, failures, failureDetails, successfulDetails };
    saveLog({ endpoint: '/api/sendBroadcast', status_code: 200, response: { successes, failures } });
    res.status(200).json(broadcastResult);
});

// ─── GET /api/messages ────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: Get all WhatsApp messages
 *     description: Retrieve all messages from WhatsApp. Messages are fetched from the WAHA API.
 *     parameters:
 *       - in: query
 *         name: apiKey
 *         required: true
 *         schema:
 *           type: string
 *         description: API key for authentication
 *       - in: query
 *         name: session
 *         schema:
 *           type: string
 *           default: default
 *         description: WhatsApp session name
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of messages to retrieve
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *                 count:
 *                   type: integer
 *                   description: Total number of messages
 *       400:
 *         description: Invalid API key
 *       500:
 *         description: Server or WAHA API error
 */
app.get('/api/messages', async (req, res) => {
    const { apiKey, session = WAHA_SESSION, limit = 100 } = req.query;

    if (!apiKey || typeof apiKey !== 'string') {
        saveLog({ endpoint: '/api/messages', status_code: 400, response: { error: 'Invalid or missing apiKey' } });
        return res.status(400).json({ error: 'Invalid or missing apiKey' });
    }

    try {
        const response = await axios.get(
            `${WAHA_BASE_URL}/api/messages`,
            {
                params: {
                    session: session,
                    limit: Number(limit) || 100,
                },
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': apiKey,
                },
            }
        );

        saveLog({ endpoint: '/api/messages', status_code: response.status, response: { count: response.data?.length || 0 } });
        res.status(response.status).json({
            success: true,
            data: response.data || [],
            count: response.data?.length || 0,
        });

    } catch (error) {
        if (error.response) {
            const errorMsg = error.response.data?.error || error.response.statusText || 'Error from WAHA API';
            saveLog({ endpoint: '/api/messages', status_code: error.response.status, response: { error: errorMsg } });
            res.status(error.response.status).json({ error: errorMsg });
        } else if (error.request) {
            saveLog({ endpoint: '/api/messages', status_code: 500, response: { error: 'No response from WAHA API' } });
            res.status(500).json({ error: 'No response received from the WhatsApp API' });
        } else {
            saveLog({ endpoint: '/api/messages', status_code: 500, response: { error: error.message } });
            res.status(500).json({ error: 'Error setting up the request' });
        }
    }
});

// ─── POST /api/replyMessage ───────────────────────────────────────────────────
/**
 * @swagger
 * /api/replyMessage:
 *   post:
 *     summary: Send a reply to a WhatsApp message
 *     description: Send a reply message to an existing WhatsApp conversation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - apiKey
 *               - phone
 *               - message
 *               - messageId
 *             properties:
 *               apiKey:
 *                 type: string
 *                 description: API key for authentication
 *               phone:
 *                 type: string
 *                 description: Phone number to reply to (will be normalized)
 *               message:
 *                 type: string
 *                 description: Reply message text
 *               messageId:
 *                 type: string
 *                 description: Message ID to reply to
 *               session:
 *                 type: string
 *                 default: default
 *                 description: WhatsApp session name
 *     responses:
 *       200:
 *         description: Reply message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Server error
 */
app.post('/api/replyMessage', async (req, res) => {
    const { apiKey, phone, message, messageId, session = WAHA_SESSION } = req.body;

    if (!apiKey || typeof apiKey !== 'string') {
        saveLog({ endpoint: '/api/replyMessage', phone, message, status_code: 400, response: { error: 'Invalid or missing apiKey' } });
        return res.status(400).json({ error: 'Invalid or missing apiKey' });
    }
    if (!phone || (typeof phone !== 'string' && typeof phone !== 'number')) {
        saveLog({ endpoint: '/api/replyMessage', phone, message, status_code: 400, response: { error: 'Invalid or missing phone' } });
        return res.status(400).json({ error: 'Invalid or missing phone' });
    }
    if (!message || typeof message !== 'string') {
        saveLog({ endpoint: '/api/replyMessage', phone, message, status_code: 400, response: { error: 'Invalid or missing message' } });
        return res.status(400).json({ error: 'Invalid or missing message' });
    }
    if (!messageId || typeof messageId !== 'string') {
        saveLog({ endpoint: '/api/replyMessage', phone, message, status_code: 400, response: { error: 'Invalid or missing messageId' } });
        return res.status(400).json({ error: 'Invalid or missing messageId' });
    }

    try {
        // Normalize and format phone number for WAHA
        const normalizedPhone = normalizePhone(String(phone));
        const chatId = `${normalizedPhone}@c.us`;

        const response = await axios.post(
            `${WAHA_BASE_URL}/api/sendText`,
            {
                chatId: chatId,
                text: message,
                session: session,
                quotedMessageId: messageId,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': apiKey,
                },
            }
        );

        saveLog({ endpoint: '/api/replyMessage', phone, message, status_code: response.status, response: response.data });
        res.status(response.status).json({
            success: true,
            message: 'Reply message sent successfully',
            data: response.data,
        });

    } catch (error) {
        if (error.response) {
            const errorMsg = error.response.data?.error || error.response.statusText || 'Error from WAHA API';
            saveLog({ endpoint: '/api/replyMessage', phone, message, status_code: error.response.status, response: { error: errorMsg } });
            res.status(error.response.status).json({ error: errorMsg });
        } else if (error.request) {
            saveLog({ endpoint: '/api/replyMessage', phone, message, status_code: 500, response: { error: 'No response from WAHA API' } });
            res.status(500).json({ error: 'No response received from the WhatsApp API' });
        } else {
            saveLog({ endpoint: '/api/replyMessage', phone, message, status_code: 500, response: { error: error.message } });
            res.status(500).json({ error: 'Error setting up the request' });
        }
    }
});

// ─── GET /api/logs ────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: Get API activity logs
 *     description: Retrieve logs of all API calls with pagination and filtering options
 *     tags:
 *       - Logs & Monitoring
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of logs to return (pagination limit)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset for pagination (skip N records)
 *       - in: query
 *         name: endpoint
 *         schema:
 *           type: string
 *         description: Filter logs by API endpoint
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *         description: Filter logs by phone number
 *     responses:
 *       200:
 *         description: Logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: Total number of logs in database
 *                 limit:
 *                   type: integer
 *                   description: Limit used in query
 *                 offset:
 *                   type: integer
 *                   description: Offset used in query
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ApiLog'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/logs', (req, res) => {
    try {
        const { limit = 100, offset = 0, endpoint, phone } = req.query;

        let query = 'SELECT * FROM api_logs';
        const conditions = [];
        const params = {};

        if (endpoint) {
            conditions.push('endpoint = @endpoint');
            params.endpoint = endpoint;
        }
        if (phone) {
            conditions.push('phone = @phone');
            params.phone = String(phone);
        }
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY timestamp DESC LIMIT @limit OFFSET @offset';
        params.limit  = Number(limit);
        params.offset = Number(offset);

        const rows = db.prepare(query).all(params);
        const total = db.prepare('SELECT COUNT(*) as count FROM api_logs').get().count;

        res.status(200).json({ total, limit: Number(limit), offset: Number(offset), logs: rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve logs', detail: err.message });
    }
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 20115;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
