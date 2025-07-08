// frontend/src/UrlStatsPage.js
import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, TextField, Button, Box, Alert, CircularProgress,
  List, ListItem, ListItemText, Divider
} from '@mui/material';
import axios from 'axios';
import log from 'logging-middleware/logger'; // Correct import path

function UrlStatsPage() {
  const [shortcode, setShortcode] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    log("frontend", "info", "UrlStatsPage", "URL Statistics Page mounted.");
  }, []);

  const handleFetchStats = async () => {
    setLoading(true);
    setError('');
    setStats(null);

    if (!shortcode) {
      setError('Please enter a shortcode to retrieve statistics.');
      log("frontend", "warn", "UrlStatsPage", "Attempted to fetch stats without a shortcode.");
      setLoading(false);
      return;
    }

    try {
      log("frontend", "info", "api_call", `Fetching statistics for shortcode: ${shortcode}`);
      const response = await axios.get(`http://localhost:3001/shorturls/${shortcode}`);
      setStats(response.data);
      log("frontend", "info", "api_success", `Statistics fetched successfully for ${shortcode}`);
    } catch (err) {
      console.error("Fetch Stats Error:", err);
      const errorMessage = err.response?.data?.error || err.message || 'An unknown error occurred.';
      setError(errorMessage);
      log("frontend", "error", "api_error", `Failed to fetch stats for ${shortcode}: ${errorMessage}`);
      if (err.response) {
        log("frontend", "error", "api_error_details", `Status: ${err.response.status}, Data: ${JSON.stringify(err.response.data)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        URL Statistics
      </Typography>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Retrieve Short URL Statistics</Typography>
        <TextField
          label="Shortcode"
          fullWidth
          margin="normal"
          value={shortcode}
          onChange={(e) => setShortcode(e.target.value)}
          helperText="e.g., abcd1"
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleFetchStats}
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Fetch Statistics'}
        </Button>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        {stats && (
          <Box sx={{ mt: 3, p: 2, border: '1px dashed grey', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>Statistics for "{shortcode}"</Typography>
            {stats.expired && <Alert severity="warning" sx={{mb:2}}>This short URL has expired.</Alert>}
            <Typography variant="body1"><strong>Original URL:</strong> <a href={stats.originalUrl} target="_blank" rel="noopener noreferrer">{stats.originalUrl}</a></Typography>
            <Typography variant="body1"><strong>Short Link:</strong> <a href={stats.shortLink} target="_blank" rel="noopener noreferrer">{stats.shortLink}</a></Typography>
            <Typography variant="body1"><strong>Created At:</strong> {new Date(stats.creationDate).toLocaleString()}</Typography>
            <Typography variant="body1"><strong>Expires At:</strong> {new Date(stats.expiryDate).toLocaleString()}</Typography>
            <Typography variant="body1"><strong>Total Clicks:</strong> {stats.totalClicks}</Typography>

            {stats.clickData && stats.clickData.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Detailed Click Data:</Typography>
                <List dense>
                  {stats.clickData.map((click, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemText
                          primary={`Click ${index + 1}: ${new Date(click.timestamp).toLocaleString()}`}
                          secondary={`Source: ${click.source || 'N/A'}, Geo: ${click.geo || 'N/A'}`}
                        />
                      </ListItem>
                      {index < stats.clickData.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            )}
            {stats.clickData && stats.clickData.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{mt:2}}>No click data recorded yet.</Typography>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default UrlStatsPage;