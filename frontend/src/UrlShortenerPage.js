// frontend/src/UrlShortenerPage.js
import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, TextField, Button, Box, Grid, Alert
} from '@mui/material';
import axios from 'axios';
import log from 'logging-middleware/logger'; // Correct import path
import { isURL } from 'validator'; // For URL validation

// Component to manage a single URL shortening input and display result
const UrlInputForm = ({ onShortenSuccess }) => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [validity, setValidity] = useState('');
  const [customShortcode, setCustomShortcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    // Client-side validation
    if (!originalUrl || !isURL(originalUrl, { require_protocol: true })) {
      setError('Please enter a valid URL with protocol (http:// or https://).');
      log("frontend", "error", "shortener_validation", "Invalid original URL input.");
      setLoading(false);
      return;
    }
    const validityMinutes = parseInt(validity);
    if (validity && (isNaN(validityMinutes) || validityMinutes <= 0)) {
        setError('Validity must be a positive integer in minutes.');
        log("frontend", "error", "shortener_validation", "Invalid validity input.");
        setLoading(false);
        return;
    }
    if (customShortcode && !/^[a-zA-Z0-9]{5,10}$/.test(customShortcode)) {
        setError('Custom shortcode must be alphanumeric and 5-10 characters long.');
        log("frontend", "error", "shortener_validation", "Invalid custom shortcode format.");
        setLoading(false);
        return;
    }

    const payload = {
      url: originalUrl,
      ...(validity && { validity: validityMinutes }),
      ...(customShortcode && { shortcode: customShortcode }),
    };

    try {
      log("frontend", "info", "api_call", `Attempting to shorten URL: ${originalUrl}`);
      const response = await axios.post('http://localhost:3001/shorturls', payload);
      setResult(response.data);
      onShortenSuccess(response.data.shortLink); // Notify parent to update stats page
      log("frontend", "info", "api_success", `URL shortened successfully: ${response.data.shortLink}`);
    } catch (err) {
      console.error("Shorten URL Error:", err);
      const errorMessage = err.response?.data?.error || err.message || 'An unknown error occurred.';
      setError(errorMessage);
      log("frontend", "error", "api_error", `Failed to shorten URL: ${errorMessage}`);
      if (err.response) {
        log("frontend", "error", "api_error_details", `Status: ${err.response.status}, Data: ${JSON.stringify(err.response.data)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    log("frontend", "info", "clipboard", `Copied short link to clipboard: ${text}`);
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>Shorten a New URL</Typography>
      <TextField
        label="Original Long URL (required)"
        fullWidth
        margin="normal"
        value={originalUrl}
        onChange={(e) => setOriginalUrl(e.target.value)}
        helperText="e.g., https://very-very-long.com/path/to/page"
      />
      <TextField
        label="Validity (minutes, optional)"
        fullWidth
        margin="normal"
        type="number"
        value={validity}
        onChange={(e) => setValidity(e.target.value)}
        helperText="Default is 30 minutes. Enter a positive integer."
      />
      <TextField
        label="Custom Shortcode (optional)"
        fullWidth
        margin="normal"
        value={customShortcode}
        onChange={(e) => setCustomShortcode(e.target.value)}
        helperText="Alphanumeric, 5-10 chars. Will be auto-generated if omitted or unavailable."
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        disabled={loading}
        sx={{ mt: 2 }}
      >
        {loading ? 'Shortening...' : 'Shorten URL'}
      </Button>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      {result && (
        <Box sx={{ mt: 3, p: 2, border: '1px dashed grey', borderRadius: 1 }}>
          <Typography variant="body1">
            Short Link: <a href={result.shortLink} target="_blank" rel="noopener noreferrer">{result.shortLink}</a>
            <Button size="small" onClick={() => copyToClipboard(result.shortLink)} sx={{ ml: 1 }}>Copy</Button>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Expires: {new Date(result.expiry).toLocaleString()}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

function UrlShortenerPage() {
    const [shortenedUrls, setShortenedUrls] = useState([]); // To store all URLs shortened in this session

    const handleShortenSuccess = (shortLink) => {
        // Add the newly shortened link to a list for display or to pass to the stats page later
        setShortenedUrls(prev => [...prev, shortLink]);
    };

    useEffect(() => {
        log("frontend", "info", "UrlShortenerPage", "URL Shortener Page mounted.");
    }, []);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        URL Shortener
      </Typography>
      {/* Allow up to 5 concurrent URL shortening forms */}
      {[...Array(5)].map((_, index) => (
        <UrlInputForm key={index} onShortenSuccess={handleShortenSuccess} />
      ))}
    </Box>
  );
}

export default UrlShortenerPage;