import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(cors());

  // Google Sheets Integration
  app.post('/api/submit', async (req, res) => {
    try {
      const {
        inquiryDate,
        employeeName,
        employeeNo,
        department,
        purpose,
        items,
        grandTotal
      } = req.body;

      // Validate required environment variables
      const credentialsBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
      const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

      if (!credentialsBase64 || !spreadsheetId) {
        return res.status(500).json({ 
          error: 'Backend not fully configured. Please set GOOGLE_SERVICE_ACCOUNT_CREDENTIALS and GOOGLE_SPREADSHEET_ID.' 
        });
      }

      // Decode Base64 credentials
      const credentials = JSON.parse(Buffer.from(credentialsBase64, 'base64').toString());

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });

      // Rows to append
      // We'll append one row per item for better reporting, or one row per form
      // Let's do one row per form for the main data, and maybe a linked sheet?
      // Or just a summarized row. Let's do a summarized row for simplicity in a "simple database".
      
      const itemSummary = items.map((i: any) => `${i.description} (x${i.quantity})`).join('\n');
      const specSummary = items.map((i: any) => i.specifications).join('\n');
      const prioritySummary = items.map((i: any) => (i.priority || 'Not set').toUpperCase()).join('\n');
      
      const kenyanTimestamp = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Nairobi',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(new Date());

      const values = [
        [
          inquiryDate,
          employeeName,
          employeeNo,
          department,
          purpose,
          itemSummary,
          specSummary,
          prioritySummary,
          grandTotal,
          kenyanTimestamp
        ]
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Sheet1!A:J',
        valueInputOption: 'RAW',
        requestBody: { values },
      });

      res.status(200).json({ success: true, message: 'Form submitted successfully to Google Sheets' });
    } catch (error: any) {
      console.error('Google Sheets Error:', error);
      res.status(500).json({ error: error.message || 'Failed to submit to Google Sheets' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
