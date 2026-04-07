const express = require('express');
const axios = require('axios');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

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

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// ─── Helper ───────────────────────────────────────────────────────────────────
function replacePlaceholders(template, data) {
    return template.replace(/{{(\w+)}}/g, (match, key) => {
        return data[key] !== undefined ? data[key] : match;
    });
}

// ─── POST /api/sendMessage ────────────────────────────────────────────────────
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
        // Format phone number for WAHA (ensure it has @c.us suffix)
        const formattedPhone = String(phone).replace(/[^0-9]/g, '');
        const chatId = formattedPhone.endsWith('@c.us') ? formattedPhone : `${formattedPhone}@c.us`;

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
                    'x-api-key': apiKey
                }
            }
        );

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
            // Format phone number for WAHA (ensure it has @c.us suffix)
            const formattedPhone = String(to).replace(/[^0-9]/g, '');
            const chatId = formattedPhone.endsWith('@c.us') ? formattedPhone : `${formattedPhone}@c.us`;

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
                        'x-api-key': apiKey
                    }
                }
            );

            successes++;
            successfulDetails.push({ to, message, response: response.data });
            saveLog({ endpoint: '/api/sendBroadcast', phone: to, message, status_code: response.status, response: response.data });

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

// ─── GET /api/logs ────────────────────────────────────────────────────────────
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
