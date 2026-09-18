import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Practice from "./pages/Practice";
import Performance from "./pages/Performance";
import History from "./pages/History";
import Profile from "./pages/Profile";
import QuizPage from "./pages/QuizPage";
import QuizPerformance from "./pages/QuizPerformance";
import Settings from "./pages/Settings";

import GlobalStyles from "./styles/GlobalStyles";

const API = "http://localhost:5000";

function ProtectedRoute({ children }) {
  const location = useLocation();

  const [status, setStatus] =
    useState("checking");

  useEffect(() => {
    let active = true;

    async function checkLogin() {
      try {
        const response = await fetch(
          `${API}/auth/me`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data =
          await response.json();

        if (!active) return;

        if (
          response.ok &&
          data.authenticated
        ) {
          localStorage.setItem(
            "scriptlyUser",
            JSON.stringify(
              data.user
            )
          );

          setStatus(
            "authenticated"
          );
        } else {
          localStorage.removeItem(
            "scriptlyUser"
          );

          setStatus(
            "unauthenticated"
          );
        }
      } catch (error) {
        console.error(
          "Authentication check failed:",
          error
        );

        if (active) {
          setStatus("error");
        }
      }
    }

    checkLogin();

    return () => {
      active = false;
    };
  }, [location.pathname]);

  if (status === "checking") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0718",
          color: "white",
          fontSize: "16px",
        }}
      >
        Checking login...
      </div>
    );
  }

  if (
    status === "unauthenticated" ||
    status === "error"
  ) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>

      <GlobalStyles />

      <Routes>

        {/* PUBLIC */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />


        {/* PROTECTED */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/practice"
          element={
            <ProtectedRoute>
              <Practice />
            </ProtectedRoute>
          }
        />

        <Route
          path="/quiz"
          element={
            <ProtectedRoute>
              <QuizPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/performance"
          element={
            <ProtectedRoute>
              <Performance />
            </ProtectedRoute>
          }
        />

        <Route
          path="/quiz-performance"
          element={
            <ProtectedRoute>
              <QuizPerformance />
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />


        {/* FALLBACK */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;