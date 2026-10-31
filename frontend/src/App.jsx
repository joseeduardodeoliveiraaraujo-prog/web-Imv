import { lazy, Suspense, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./services/firebase";
import { ensureUserSynced } from "./services/usersApi";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./components/Login/Login";
import Home from "./Pages/Home";
import "./App.css";

const Editor = lazy(() => import("./Pages/Editor/EditorPage"));


function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        ensureUserSynced(currentUser).catch((error) => {
          console.error("Erro ao salvar usuário:", error);
        });
      }

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
        <Suspense fallback={<p>Carregando...</p>}>
          <Routes>
            <Route
              path="/"
              element={<Home user={user} onLogout={handleLogout} />}
            />

            <Route
              path="/editor/:id"
              element={<Editor user={user} />}
            />

            {/* abrir projeto salvo */}
            <Route
              path="/project/:id"
              element={<Editor user={user} />}
            />

            {/* segurança extra */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      )}
    </div>
  </BrowserRouter>
);
}

export default App;
