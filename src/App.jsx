import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./services/firebase";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";


import Login from "./components/Login/Login";
import Home from "./Pages/Home";
import Editor from "./Pages/Editor"
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
  <BrowserRouter>
    <div className="App">
      {!user ? (
        <Login />
      ) : (
        <Routes>
          <Route 
            path="/" 
            element={<Home user={user} onLogout={handleLogout} />} 
          />

          <Route 
            path="/editor/:id" 
            element={<Editor user={user} />} 
          />

          {/* segurança extra */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      )}
    </div>
  </BrowserRouter>
);
}

export default App;
