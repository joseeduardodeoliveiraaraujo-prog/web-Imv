import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useState } from 'react';
import "./Login.css";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../services/firebase";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      // Faz o login no Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // GERA O TOKEN 
      const token = await user.getIdToken();

      const API_URL = import.meta.env.VITE_API_URL;

      // ENVIA PARA O BACKEND COM O TOKEN
      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          //Envia o token no formato Bearer
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: user.displayName || "Sem nome",
          email: user.email,
          uid: user.uid
        })
      });

      if (!response.ok) {
        throw new Error(`Erro no servidor: ${response.status}`);
      }

      console.log("Usuário logado e sincronizado com o banco");

    } catch (error) {
      console.error("Erro ao logar:", error.code || error.message);
      alert("E-mail ou senha inválidos ou erro de conexão.");
    }
  };

  return (
    <div className='container'>
      <form onSubmit={handleSubmit}>
        <h1>Certificado Imv</h1>
        
        <div className="input-box">
          <input 
            type="email" 
            placeholder='E-mail' 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          /> 
          <FaUser className='icon right-icon'/>
        </div> 

        <div className="input-box password-box">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Digite a senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          
          {/* O container dos ícones ajuda a manter o alinhamento */}
          <div className="password-icons">
            {password && (
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            )}
            <FaLock className="icon lock-icon" />
          </div>
        </div>

        <button type="submit">Entrar</button>
      </form>
    </div>
  );
};

export default Login;