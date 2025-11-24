const fs = require('fs');
const path = require('path');

// Get the API_URL from environment variable
const apiUrl = process.env.API_URL || '';

console.log(`Setting API_URL to: ${apiUrl || '(empty - will use fallback logic)'}`);

// Read the environment file
const envPath = path.join(__dirname, '../src/environments/environment.ts');
let envContent = fs.readFileSync(envPath, 'utf8');

// Replace the API_URL value
envContent = envContent.replace(/API_URL: '[^']*'/, `API_URL: '${apiUrl}'`);

console.log('Updated environment.ts with API_URL:', apiUrl);

// Write back to the file
fs.writeFileSync(envPath, envContent);

console.log('Environment file updated successfully');