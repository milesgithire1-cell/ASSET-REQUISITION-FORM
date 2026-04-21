import { google } from 'googleapis';

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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

    const itemSummary = items.map((i: any) => `${i.description} (x${i.quantity})`).join(', ');
    
    // Format timestamp
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
        grandTotal,
        kenyanTimestamp
      ]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:H',
      valueInputOption: 'RAW',
      requestBody: { values },
    });

    return res.status(200).json({ success: true, message: 'Form submitted successfully to Google Sheets' });
  } catch (error: any) {
    console.error('Google Sheets Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to submit to Google Sheets' });
  }
}
