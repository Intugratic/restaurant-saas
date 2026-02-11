// Generate QR Codes for All Tables
// Run: node scripts/generate-qr.js

const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const TABLES = [
  { id: 'T1', number: '1', capacity: 2 },
  { id: 'T2', number: '2', capacity: 4 },
  { id: 'T3', number: '3', capacity: 6 },
  { id: 'T4', number: '4', capacity: 2 },
  { id: 'T5', number: '5', capacity: 4 },
  { id: 'T6', number: '6', capacity: 8 },
  { id: 'T7', number: '7', capacity: 2 },
  { id: 'T8', number: '8', capacity: 4 },
  { id: 'T9', number: '9', capacity: 6 },
  { id: 'T10', number: '10', capacity: 4 }
];

const OUTLET_ID = 'main-outlet'; // Change this for different outlets
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function generateQRCodes() {
  const outputDir = path.join(__dirname, '..', 'public', 'qr-codes');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('🎯 Generating QR codes for all tables...\n');

  for (const table of TABLES) {
    const qrData = {
      tableId: table.id,
      tableNumber: table.number,
      outletId: OUTLET_ID,
      menuUrl: `${BASE_URL}/menu?table=${table.id}`
    };

    const qrDataString = JSON.stringify(qrData);
    const filename = `table-${table.number}.png`;
    const filepath = path.join(outputDir, filename);

    try {
      // Generate QR code
      await QRCode.toFile(filepath, qrDataString, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      console.log(`✅ Table ${table.number} - ${filename}`);
      console.log(`   Capacity: ${table.capacity} seats`);
      console.log(`   URL: ${qrData.menuUrl}\n`);

      // Also generate data URL for embedding
      const dataUrl = await QRCode.toDataURL(qrDataString);
      const htmlFile = path.join(outputDir, `table-${table.number}.html`);
      
      const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Table ${table.number} - QR Code</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      text-align: center;
      padding: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
      margin: 0;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 500px;
      margin: 0 auto;
      color: #333;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 { margin: 0 0 10px 0; }
    .table-number {
      font-size: 72px;
      font-weight: bold;
      color: #667eea;
      margin: 20px 0;
    }
    .qr-code {
      margin: 30px 0;
      padding: 20px;
      background: white;
      border-radius: 10px;
    }
    .instructions {
      font-size: 18px;
      margin: 20px 0;
      color: #666;
    }
    .capacity {
      background: #f0f0f0;
      padding: 10px;
      border-radius: 8px;
      margin-top: 20px;
    }
    @media print {
      body { background: white; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🍽️ Pizza Palace</h1>
    <div class="table-number">Table ${table.number}</div>
    <div class="qr-code">
      <img src="${dataUrl}" alt="QR Code" width="300" height="300">
    </div>
    <div class="instructions">
      📱 Scan to view menu & order
    </div>
    <div class="capacity">
      Seats ${table.capacity} guests
    </div>
  </div>
</body>
</html>
      `;
      
      fs.writeFileSync(htmlFile, html);

    } catch (error) {
      console.error(`❌ Error generating QR for Table ${table.number}:`, error);
    }
  }

  console.log('\n🎉 QR code generation complete!');
  console.log(`📁 Files saved to: ${outputDir}`);
  console.log('\n💡 Tips:');
  console.log('   - Print the HTML files for physical table displays');
  console.log('   - Use PNG files for digital signage');
  console.log('   - Test by scanning with your phone camera\n');
}

// Run the generator
generateQRCodes().catch(console.error);

// Export for use in other scripts
module.exports = { generateQRCodes, TABLES };
