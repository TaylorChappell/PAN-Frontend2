import React from "react";
import ReactDOM from "react-dom/client";
import { Navigate, Route, Routes, HashRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import { AppShell } from "./components/AppShell";
import { LoginPage, RegisterPage, VerifyPage, ForgotPage, ResetPage } from "./pages/AuthPages";
import { ProjectPage } from "./pages/ProjectPage";
import { WebsiteBuilderPage } from "./pages/WebsiteBuilderPage";
import { CreditsPage } from "./pages/CreditsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SupportPage } from "./pages/SupportPage";
import { AdminPage } from "./pages/AdminPage";
import "./styles.css";

function Protected({ children, admin = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="boot-screen"><span className="thinking-orbit" /><p>Opening PAN…</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && !user.isAdmin && user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyPage />} />
      <Route path="/forgot-password" element={<ForgotPage />} />
      <Route path="/reset-password" element={<ResetPage />} />
      <Route element={<Protected><AppShell /></Protected>}>
        <Route index element={<ProjectPage />} />
        <Route path="projects/:projectId" element={<ProjectPage />} />
        <Route path="builder" element={<WebsiteBuilderPage />} />
        <Route path="builder/:siteId" element={<WebsiteBuilderPage />} />
        <Route path="credits" element={<CreditsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="admin" element={<Protected admin><AdminPage /></Protected>} />
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
