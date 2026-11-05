const LOGIN_ERRORS = {
  "auth/invalid-credential": "E-mail ou senha inválidos.",
  "auth/wrong-password": "E-mail ou senha inválidos.",
  "auth/user-not-found": "E-mail ou senha inválidos.",
  "auth/invalid-email": "Digite um e-mail válido.",
  "auth/user-disabled": "Este acesso foi desativado. Fale com o administrador.",
  "auth/too-many-requests":
    "Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.",
  "auth/network-request-failed":
    "Sem conexão com o servidor. Verifique sua internet e tente novamente.",
};

export const getLoginErrorMessage = (error) =>
  LOGIN_ERRORS[error?.code] ?? "Não foi possível entrar. Tente novamente.";
