import admin from "firebase-admin";
import { Pool } from "pg";
import "dotenv/config";

const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

if (!base64Key) {
  throw new Error("A variável FIREBASE_SERVICE_ACCOUNT_BASE64 não foi configurada!");
}

const decodedKey = Buffer.from(base64Key, 'base64').toString('utf-8');
const serviceAccount = JSON.parse(decodedKey);

if (serviceAccount.private_key) {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;