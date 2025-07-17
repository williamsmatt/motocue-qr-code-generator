# QR code generator

This script generates 400 unique QR codes using the Flowcode API, each redirecting to a unique URL for the Motocue + CIO 2025 event.

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure API Key:**

   Create a `.env` file in the project root with:

   ```env
   FLOWCODE_API_KEY=your_flowcode_api_key_here
   ```

3. **Run the script:**

   ```bash
   npm start
   ```

## Output

- QR code images are saved in `qrcodes/run-[timestamp]/` as `[slug].png`.
- `slugs.txt`: All generated slugs (one per line).
- `failed.txt`: Any slugs for which the API call failed.

## Notes
- The script handles Flowcode API rate limiting (429 errors) with exponential backoff.
- Uses `axios` for HTTP requests and `uuid` for slug generation.

## Important: .env File

Make sure to add `.env` to your `.gitignore` file to avoid committing sensitive API keys or credentials to version control. 