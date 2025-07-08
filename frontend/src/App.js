// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, Container, Button, Box,
  Tab, Tabs
} from '@mui/material';
import UrlShortenerPage from './UrlShortenerPage'; // New component
import UrlStatsPage from './UrlStatsPage';     // New component
import log from 'logging-middleware/logger'; // Correct import path for local package

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

function App() {
  const [value, setValue] = useState(0); // For tab selection

  useEffect(() => {
    log("frontend", "info", "App", "App component mounted successfully.");
  }, []);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    log("frontend", "info", "App", `Mapsd to tab: ${newValue === 0 ? 'Shortener' : 'Statistics'}`);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Afford Medical URL Shortener
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
            <Tab label="Shorten URL" {...a11yProps(0)} />
            <Tab label="View Statistics" {...a11yProps(1)} />
          </Tabs>
        </Box>
        <TabPanel value={value} index={0}>
          <UrlShortenerPage />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <UrlStatsPage />
        </TabPanel>
      </Container>
    </Box>
  );
}

export default App;