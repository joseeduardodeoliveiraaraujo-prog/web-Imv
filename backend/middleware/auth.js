import admin from "../firebaseAdmin.js";

/**
 * MIDDLEWARE: authMiddleware
 * RESPONSIBILITY: Interceptar requisições HTTP, extrair o Bearer Token do cabeçalho de autorização
 * e validar a sessão do usuário contra o Firebase Authentication antes de liberar o acesso à rota.
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Extrai o hash do token contido no cabeçalho após o prefixo "Bearer "
    const token = req.headers.authorization?.split(" ")[1];

    // Trava de Segurança: Retorna erro 401 caso o cabeçalho esteja ausente ou mal formatado
    if (!token) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    // Comunicação Assíncrona: Solicita ao SDK do Firebase a decodificação e validação criptográfica do token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Injeta os dados do usuário autenticado (UID, email, etc.) no escopo do objeto global 'req'
    req.user = decodedToken;
    
    // Libera a requisição para seguir para o próximo controlador (Controller) ou middleware na pilha
    next();

  } catch (error) {
    // Tratamento de Exceção: Bloqueia o fluxo se o token estiver expirado, revogado ou adulterado
    return res.status(401).json({ error: "Token inválido" });
  }
};

export default authMiddleware;