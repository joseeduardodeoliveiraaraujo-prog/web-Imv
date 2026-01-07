import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./services/firebase";

import Login from "./components/Login/Login";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return <p>Carregando...</p>;
  }

  return (
    <div className="App">
      {user ? (
        <div className="logged">
          <h1>Usuário logado</h1>
          <button onClick={handleLogout}>Sair</button>
        </div>
      ) : (
        <Login />
      )}
    </div>
  );
}

export default App;
