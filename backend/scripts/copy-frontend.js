const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', '..', 'frontend', 'dist');
const dest = path.join(__dirname, '..', 'public');

if (fs.existsSync(src)) {
  fs.cpSync(src, dest, { recursive: true });
  console.log('✅ Copied frontend/dist into backend/public');
} else {
  console.warn('⚠️ frontend/dist does not exist. Please run npm run build in frontend first.');
}
