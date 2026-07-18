import React from "react";
import ReactDOM from "react-dom/client";
import { Navigate, Route, Routes, HashRouter, useLocation, useOutletContext } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import { AppShell } from "./components/AppShell";
import { LoginPage, RegisterPage, VerifyPage, ForgotPage, ResetPage } from "./pages/AuthPages";
import { HomePage } from "./pages/HomePage";
import { ProjectPage } from "./pages/ProjectPage";
import { WebsiteBuilderPage } from "./pages/WebsiteBuilderPage";
import { CreditsPage } from "./pages/CreditsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SupportPage } from "./pages/SupportPage";
import { AdminPage } from "./pages/AdminPage";
import "./styles.css";

function BootScreen() {
  return <div className="boot-screen"><span className="thinking-orbit" /><p>Opening PAN…</p></div>;
}

function WorkspaceGateway() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <BootScreen />;
  if (!user) {
    if (location.pathname === "/") return <HomePage />;
    return <Navigate to="/login" replace />;
  }
  return <AppShell />;
}

function AdminProtected({ children }) {
  const { user, loading } = useAuth();
  const shell = useOutletContext();
  if (loading) return <BootScreen />;
  if (!user) return <Navigate to="/login" replace />;
  const isAdmin = Boolean(shell?.account?.isAdmin || user.isAdmin || user.role === "admin");
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}


function normalizeDirectRoute() {
  if (window.location.hash) return;
  const base = String(import.meta.env.BASE_URL || "/");
  const basePath = base === "/" ? "" : base.replace(/\/$/, "");
  const pathname = window.location.pathname;
  if (basePath && !pathname.startsWith(basePath)) return;
  const routePath = basePath ? pathname.slice(basePath.length) || "/" : pathname;
  const normalizedRoute = routePath.length > 1 ? routePath.replace(/\/+$/, "") : routePath;
  const appRoute = /^\/(?:admin|login|register|verify-email|forgot-password|reset-password|credits|settings|support|projects(?:\/.*)?)$/;
  if (!appRoute.test(normalizedRoute)) return;
  const target = `${basePath || ""}/#${normalizedRoute}${window.location.search}`;
  window.history.replaceState(null, "", target);
}

normalizeDirectRoute();

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyPage />} />
      <Route path="/forgot-password" element={<ForgotPage />} />
      <Route path="/reset-password" element={<ResetPage />} />
      <Route path="/" element={<WorkspaceGateway />}>
        <Route index element={<ProjectPage />} />
        <Route path="projects/:projectId" element={<ProjectPage />} />
        <Route path="projects/:projectId/website" element={<WebsiteBuilderPage />} />
        <Route path="projects/:projectId/website/:siteId" element={<WebsiteBuilderPage />} />
        <Route path="builder" element={<Navigate to="/" replace />} />
        <Route path="builder/:siteId" element={<Navigate to="/" replace />} />
        <Route path="credits" element={<CreditsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="admin" element={<AdminProtected><AdminPage /></AdminProtected>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider><App /></AuthProvider>
    </HashRouter>
  </React.StrictMode>,
);
