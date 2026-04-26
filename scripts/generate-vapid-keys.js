/**
 * Generate VAPID keys for Web Push.
 * Run: node scripts/generate-vapid-keys.js
 * Then copy the printed values into .env:
 *   VAPID_PUBLIC_KEY=...
 *   VAPID_PRIVATE_KEY=...
 *   VAPID_SUBJECT=mailto:admin@das-pay.com
 */
const webpush = require('web-push');

const keys = webpush.generateVAPIDKeys();

console.log('\n  Add the following to your .env file:\n');
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:admin@das-pay.com`);
console.log('\n  Also expose the public key for the browser:\n');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}\n`);