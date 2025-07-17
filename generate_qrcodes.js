// Required modules
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const API_KEY = process.env.FLOWCODE_API_KEY;
if (!API_KEY) {
  console.error('Missing FLOWCODE_API_KEY in .env');
  process.exit(1);
}

const NUM_CODES = 400;
const URL_PREFIX = 'https://www.motocue.com/scan/';
const URL_SUFFIX = '/e/cio-2025';
const TIMESTAMP = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const OUTPUT_DIR = path.join(__dirname, 'qrcodes', `run-${TIMESTAMP}`);
const SLUGS_FILE = path.join(OUTPUT_DIR, 'slugs.txt');
const FAILED_FILE = path.join(OUTPUT_DIR, 'failed.txt');

// Ensure output directory exists
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Generate slugs
const slugs = Array.from({ length: NUM_CODES }, () => uuidv4());
fs.writeFileSync(SLUGS_FILE, slugs.join('\n'));

// Helper for exponential backoff
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createQRCode(slug, attempt = 0) {
  const url = `${URL_PREFIX}${slug}${URL_SUFFIX}`;
  try {
    const response = await axios.post(
      'https://api.flowcode.com/v1/codes',
      {
        redirectUrl: url,
        // Add any required fields for Flowcode API here
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer', // Expect image data
      }
    );
    // Save QR code image
    const imgPath = path.join(OUTPUT_DIR, `${slug}.png`);
    fs.writeFileSync(imgPath, response.data);
    console.log(`✅ Created QR for slug ${slug}`);
    return true;
  } catch (err) {
    if (err.response && err.response.status === 429) {
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt), 30000); // max 30s
      console.log(`⏳ Rate limited for slug ${slug}, backing off for ${delay}ms`);
      await sleep(delay);
      return createQRCode(slug, attempt + 1);
    } else {
      // Log failure
      fs.appendFileSync(FAILED_FILE, `${slug}\n`);
      console.log(`❌ Failed for slug ${slug}`);
      return false;
    }
  }
}

(async () => {
  for (const slug of slugs) {
    await createQRCode(slug);
  }
  console.log('All done!');
})(); 