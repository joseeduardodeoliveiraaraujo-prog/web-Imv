import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./services/firebase";

import Login from "./components/Login/Login";
import Home from "./Pages/Home";
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
        <Home user={user} onLogout={handleLogout}/>
        ):(
        <Login />
      )}
    </div>
  );
}

export default App;
