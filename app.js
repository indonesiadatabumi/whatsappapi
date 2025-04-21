const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
function replacePlaceholders(template, data) {
    return template.replace(/{{(\w+)}}/g, (match, key) => {
        return data[key] !== undefined ? data[key] : match;
    });
}

app.post('/api/sendMessage', async (req, res) => {
    const { apiKey, phone, message } = req.body;

    if (!apiKey || typeof apiKey !== 'string') {
        return res.status(400).json({ error: 'Invalid or missing apiKey' });
    }
    if (!phone || (typeof phone !== 'string' && typeof phone !== 'number')) {
        return res.status(400).json({ error: 'Invalid or missing phone' });
    }
    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Invalid or missing message' });
    }

    try {
        const response = await axios.post(
            'http://66.96.229.251:20611/api/sendMessage',
            { apiKey, phone, message },
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                transformRequest: [(data) => {
                    return Object.keys(data)
                        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
                        .join('&');
                }]
            }
        );

        res.status(response.status).json(response.data);
        
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json({ error: error.response.data });
        } else if (error.request) {
            res.status(500).json({ error: 'No response received from the external API' });
        } else {
            res.status(500).json({ error: 'Error setting up the request' });
        }
    }
});

app.post('/api/sendBroadcast', async (req, res) => {
    const { apiKey, data } = req.body;

    if (!apiKey || typeof apiKey !== 'string') {
        return res.status(400).json({ error: 'Invalid or missing apiKey' });
    }
    if (!Array.isArray(data) || data.length === 0) {
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
            continue;
        }
        if (!template || typeof template !== 'string') {
            failures++;
            failureDetails.push({ to, error: 'Invalid or missing template' });
            continue;
        }
        if (!templateData || typeof templateData !== 'object') {
            failures++;
            failureDetails.push({ to, error: 'Invalid or missing template data' });
            continue;
        }

        const message = replacePlaceholders(template, templateData);

        try {
            const response = await axios.post(
                'http://66.96.229.251:20611/api/sendMessage',
                { apiKey, phone: to, message },
                {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    transformRequest: [(data) => {
                        return Object.keys(data)
                            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
                            .join('&');
                    }]
                }
            );

            successes++;
            successfulDetails.push({
                to,
                message,
                response: response.data // Include the response from the external API
            });
        } catch (error) {
            failures++;
            failureDetails.push({ to, error: error.message });
        }
    }

    res.status(200).json({
        successes,
        failures,
        failureDetails,
        successfulDetails
    });
});

const PORT = process.env.PORT || 20612;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
