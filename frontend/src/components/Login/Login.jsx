import {
  FaAward,
  FaCheckCircle,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaSpinner,
} from "react-icons/fa";
import { useState } from "react";
import "./Login.css";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../services/firebase";
import { getLoginErrorMessage } from "./loginErrors";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    // Só autentica: a sincronização com o backend acontece uma única vez
    // em App (onAuthStateChanged -> ensureUserSynced).
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (loginError) {
      console.error("Erro ao logar:", loginError.code || loginError.message);
      setError(getLoginErrorMessage(loginError));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <aside className="login-brand">
          <span className="login-brand-mark">
            <FaAward aria-hidden="true" />
          </span>

          <span className="login-brand-eyebrow">Web IMV</span>
          <h1>Instituto de Medicina Veterinária</h1>
          <p className="login-brand-description">
            Crie, personalize e exporte certificados em lote com agilidade e
            consistência.
          </p>

          <ul className="login-features">
            <li>
              <FaCheckCircle aria-hidden="true" />
              Modelos personalizados
            </li>
            <li>
              <FaCheckCircle aria-hidden="true" />
              Edição de nomes em lote
            </li>
            <li>
              <FaCheckCircle aria-hidden="true" />
              Exportação em PDF e JPEG
            </li>
          </ul>

          <span className="login-brand-footer">
            Gerenciador de Certificados
          </span>
        </aside>

        <main className="login-panel">
          <div className="login-panel-heading">
            <span className="login-panel-eyebrow">Acesso restrito</span>
            <h2>Entrar na plataforma</h2>
            <p>Use suas credenciais institucionais para continuar.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label className="login-field-label" htmlFor="login-email">
                E-mail
              </label>
              <div className="login-input">
                <FaEnvelope aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  placeholder="seu.email@dominio.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label className="login-field-label" htmlFor="login-password">
                Senha
              </label>
              <div className="login-input">
                <FaLock aria-hidden="true" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="login-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <FaEyeSlash aria-hidden="true" />
                  ) : (
                    <FaEye aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="login-spinner" aria-hidden="true" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <p className="login-panel-footer">
            Ambiente seguro • Firebase Authentication
          </p>
        </main>
      </div>
    </div>
  );
};

export default Login;
