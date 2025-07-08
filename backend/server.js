// backend/server.js
const express = require('express');
const cors = require('cors');
const log = require('logging-middleware/logger'); // Import as npm module
const { nanoid } = require('nanoid'); // For unique shortcode generation
const isURL = require('validator/lib/isURL'); // For URL validation

const app = express();
const PORT = 3001;

// --- In-memory Data Store ---
const urlDatabase = new Map();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// =======================================================
// MANDATORY: Logging Middleware Integration (MUST be the first function)
// =======================================================
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const requestInfo = `[${timestamp}] ${req.method} ${req.originalUrl}`;
    // Using 'middleware' which is allowed for both backend/frontend
    log("backend", "info", "middleware", requestInfo);

    // Log request body for POST/PUT
    if (req.method === 'POST' || req.method === 'PUT') {
        if (req.body && Object.keys(req.body).length > 0) {
            // Using 'handler' as it processes incoming requests
            log("backend", "info", "handler", `Body: ${JSON.stringify(req.body)}`);
        }
    }
    next();
});

// --- Helper Functions ---
const generateUniqueShortcode = () => {
    let shortcode;
    do {
        shortcode = nanoid(7); // Generate a 7-character unique ID
    } while (urlDatabase.has(shortcode));
    return shortcode;
};

const isValidShortcode = (shortcode) => {
    return /^[a-zA-Z0-9]{5,10}$/.test(shortcode);
};

// --- API Endpoints ---

// 1. Create Short URL
app.post('/shorturls', (req, res) => {
    const { url, validity, shortcode } = req.body;

    // Input validation (part of controller/handler logic)
    if (!url || !isURL(url, { require_protocol: true })) {
        // Using 'controller' or 'handler'
        log("backend", "error", "controller", `Invalid URL: ${url}`);
        return res.status(400).json({ error: "Invalid or missing 'url'. Must be a valid URL with protocol (e.g., http:// or https://)." });
    }

    let finalShortcode = shortcode;
    if (finalShortcode) {
        if (!isValidShortcode(finalShortcode)) {
            // Using 'controller'
            log("backend", "error", "controller", `Invalid custom code format: ${finalShortcode}`);
            return res.status(400).json({ error: "Invalid 'shortcode' format. Must be alphanumeric and 5-10 characters long." });
        }
        if (urlDatabase.has(finalShortcode)) {
            // Using 'db' as it involves checking the database
            log("backend", "warn", "db", `Custom code collision: ${finalShortcode}`);
            return res.status(409).json({ error: "Custom 'shortcode' already exists. Please choose another or omit to auto-generate." });
        }
    } else {
        finalShortcode = generateUniqueShortcode();
        // Using 'service' for business logic like ID generation
        log("backend", "info", "service", `Auto-generated code: ${finalShortcode}`);
    }

    const validityMinutes = typeof validity === 'number' && validity > 0 ? validity : 30;
    const expiryDate = new Date(Date.now() + validityMinutes * 60 * 1000);
    const createdAt = new Date();

    const shortLinkData = {
        originalUrl: url,
        expiryDate: expiryDate,
        createdAt: createdAt,
        clicks: [],
        custom: !!shortcode
    };

    urlDatabase.set(finalShortcode, shortLinkData);
    // Using 'db' for database write operation
    log("backend", "info", "db", `Link created: ${finalShortcode}`);

    res.status(201).json({
        shortLink: `http://localhost:${PORT}/${finalShortcode}`,
        expiry: expiryDate.toISOString()
    });
});

// 2. Retrieve Short URL Statistics
app.get('/shorturls/:shortcode', (req, res) => {
    const { shortcode } = req.params;

    if (!urlDatabase.has(shortcode)) {
        // Using 'db' for database lookup
        log("backend", "warn", "db", `Stats for non-existent code: ${shortcode}`);
        return res.status(404).json({ error: "Short URL not found." });
    }

    const data = urlDatabase.get(shortcode);

    if (new Date() > data.expiryDate) {
        // Using 'service' for business logic regarding expiry
        log("backend", "info", "service", `Stats for expired code: ${shortcode}`);
        return res.status(200).json({
            message: "Short URL has expired.",
            originalUrl: data.originalUrl,
            shortLink: `http://localhost:${PORT}/${shortcode}`,
            creationDate: data.createdAt.toISOString(),
            expiryDate: data.expiryDate.toISOString(),
            totalClicks: data.clicks.length,
            clickData: data.clicks,
            expired: true
        });
    }

    // Using 'service' for retrieving stats
    log("backend", "info", "service", `Stats retrieved for: ${shortcode}`);
    res.status(200).json({
        originalUrl: data.originalUrl,
        shortLink: `http://localhost:${PORT}/${shortcode}`,
        creationDate: data.createdAt.toISOString(),
        expiryDate: data.expiryDate.toISOString(),
        totalClicks: data.clicks.length,
        clickData: data.clicks,
        expired: false
    });
});

// 3. Redirect to Original URL
app.get('/:shortcode', (req, res) => {
    const { shortcode } = req.params;
    const data = urlDatabase.get(shortcode);

    if (!data) {
        // Using 'route' for handling URL routing
        log("backend", "warn", "route", `Redirect for non-existent code: ${shortcode}`);
        return res.status(404).send("Short URL not found or has expired.");
    }
    if (new Date() > data.expiryDate) {
        // Using 'route'
        log("backend", "warn", "route", `Redirect for expired code: ${shortcode}`);
        urlDatabase.delete(shortcode); // Optionally remove expired links
        return res.status(410).send("Short URL has expired and is no longer available.");
    }

    const clickInfo = {
        timestamp: new Date().toISOString(),
        source: req.headers.referer || 'direct',
        geo: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
    };
    data.clicks.push(clickInfo);
    urlDatabase.set(shortcode, data);
    // Using 'db' as it updates the database with click info
    log("backend", "info", "db", `Redirecting ${shortcode}`);

    res.redirect(302, data.originalUrl);
});

// --- Root Route for Browser Access ---
app.get('/', (req, res) => {
  res.send('Afford Medical URL Shortener Backend is running. Use POST /shorturls to shorten URLs.');
});


// --- General Error Handling Middleware ---
app.use((err, req, res, next) => {
    // Using 'handler' for general error handling
    log("backend", "error", "handler", `Unhandled error: ${err.message}`);
    console.error(err.stack);
    res.status(500).send('An unexpected server error occurred.');
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Backend URL Shortener running on http://localhost:${PORT}`);
    // Using 'service' for application lifecycle events
    log("backend", "info", "service", `Server started on port ${PORT}`);
});