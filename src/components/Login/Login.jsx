import { FaUser, FaLock } from 'react-icons/fa';
import { useState } from 'react';
import "./Login.css";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../services/firebase";



const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        console.log("Usuário logado:", userCredential.user);

        if (remember) {
          localStorage.setItem(
          "user",
          JSON.stringify(userCredential.user)
          );
        }
      } 
    catch (error) {
      console.error("Erro ao logar:", error.code);
      alert("E-mail ou senha inválidos");
    }
  };

  return (
    <div className='container'>
        <form onSubmit={handleSubmit}>
            <h1>Certificado Imv</h1>
            <div>
              <input type="email" placeholder='E-mail' value={email}  onChange={(e) => setEmail(e.target.value)} required/> 
              <FaUser className='icon'/>
            </div> 
            <div>
              <input type="password" placeholder='Digite a senha' value={password} onChange={(e) => setPassword(e.target.value)} required/>
              <FaLock className='icon'/>
            </div>
            <div className='recall-forget'>
              <label >
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Lembrar da senha
              </label>
            </div>
            <button type="submit">Entrar</button>
        </form>
    </div>
  )
}

export default Login
