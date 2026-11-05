import { lazy, Suspense, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./services/firebase";
import { ensureUserSynced } from "./services/usersApi";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ConfirmDialogHost from "./components/ConfirmDialog/ConfirmDialogHost";
import Login from "./components/Login/Login";
import PageLoader from "./components/PageLoader/PageLoader";
import Toaster from "./components/Toast/Toaster";
import Home from "./Pages/Home";
import "./App.css";

const Editor = lazy(() => import("./Pages/Editor/EditorPage"));

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      // Único ponto que dispara a sincronização após o login. A Home aguarda
      // esta mesma promessa e mostra a mensagem de erro adequada.
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
    return <PageLoader />;
  }

  return (
    <BrowserRouter>
      <div className="App">
        {!user ? (
          <Login />
        ) : (
          <Suspense fallback={<PageLoader message="Carregando editor..." />}>
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

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        )}
      </div>

      <Toaster />
      <ConfirmDialogHost />
    </BrowserRouter>
  );
}

export default App;
