// server.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const upload = multer();

// Enable CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json());

// Basic route - this should work
app.get('/', (req, res) => {
  res.json({ 
    message: 'Pinata Proxy Server is running!', 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: {
      hasApiKey: !!process.env.PINATA_API_KEY,
      hasSecretKey: !!process.env.PINATA_SECRET_KEY
    }
  });
});

// Test authentication
app.get('/api/pinata/test', async (req, res) => {
  try {
    console.log('Testing Pinata authentication...');
    
    if (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET_KEY) {
      return res.status(400).json({
        success: false,
        error: 'API keys not found in environment variables'
      });
    }
    
    const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
      method: 'GET',
      headers: {
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_SECRET_KEY,
      },
    });

    const result = await response.text();
    
    if (response.ok) {
      res.json({ success: true, message: 'Authentication successful!', data: result });
    } else {
      res.status(response.status).json({ success: false, error: result });
    }

  } catch (error) {
    console.error('Auth test error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload file to Pinata
app.post('/api/pinata/file', upload.single('file'), async (req, res) => {
  try {
    const { file } = req;
    
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    const pinataOptions = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', pinataOptions);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_SECRET_KEY,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pinata error:', errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const result = await response.json();
    res.json(result);

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload JSON to Pinata
app.post('/api/pinata/json', async (req, res) => {
  try {
    const jsonData = req.body;

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_SECRET_KEY,
      },
      body: JSON.stringify(jsonData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pinata error:', errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const result = await response.json();
    res.json(result);

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🎉 Server running on http://localhost:${PORT}`);
  console.log(`📍 API Keys: ${process.env.PINATA_API_KEY ? 'Present' : 'Missing'}`);
  console.log('Available routes:');
  console.log('  GET  / - Health check');
  console.log('  GET  /api/pinata/test - Test Pinata auth');
  console.log('  POST /api/pinata/file - Upload file');
  console.log('  POST /api/pinata/json - Upload JSON');
});