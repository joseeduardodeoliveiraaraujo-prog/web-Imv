import admin from "firebase-admin";
import { Pool } from "pg"; // Nota: Módulo importado, porém não consumido de forma direta neste escopo
import "dotenv/config";

/**
 * INFRASTRUCTURE: Firebase Admin SDK Initializer
 * RESPONSIBILITY: Extrair a credencial de conta de serviço criptografada em Base64 das variáveis de ambiente,
 * tratá-la em memória e inicializar o SDK administrativo do Firebase para controle de autenticação do sistema.
 */

// Captura a string criptografada da chave de serviço do Firebase
const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

// Validação de Segurança: Interrompe a execução do servidor imediatamente se a variável de ambiente estiver ausente
if (!base64Key) {
  throw new Error("A variável FIREBASE_SERVICE_ACCOUNT_BASE64 não foi configurada!");
}

// Decodificação Base64: Converte o hash criptográfico binário de volta para a string JSON original em UTF-8
const decodedKey = Buffer.from(base64Key, 'base64').toString('utf-8');
const serviceAccount = JSON.parse(decodedKey);

// Sanitização de Caracteres: Corrige quebras de linha literais (\n) geradas por provedores de hospedagem (como a Render)
if (serviceAccount.private_key) {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

// Inicialização Oficial: Injeta o objeto de credenciais sanitizado e ativa as funções administrativas do SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;