import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { CodeXml, Coins, LifeBuoy, LogOut, Menu, Plus, Settings, ShieldCheck, X } from "lucide-react";
import { endpoints } from "../api";
import { useAuth } from "../auth";
import { Button, Notice, shortAddress } from "./UI";

function projectArray(data) {
  return data?.projects || data?.items || (Array.isArray(data) ? data : []);
}

function balanceFrom(data, user) {
  return Number(data?.creditBalance ?? data?.credits ?? data?.balance ?? user?.creditBalance ?? user?.credits ?? 0);
}

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const [account, setAccount] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bannerClosed, setBannerClosed] = useState(sessionStorage.getItem("pan_credit_banner_closed") === "1");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    const [projectResult, accountResult, creditResult] = await Promise.allSettled([
      endpoints.projects.list(), endpoints.account.summary(), endpoints.credits.summary(),
    ]);
    if (projectResult.status === "fulfilled") setProjects(projectArray(projectResult.value));
    if (accountResult.status === "fulfilled") setAccount(accountResult.value?.account || accountResult.value);
    if (creditResult.status === "fulfilled") setAccount((old) => ({ ...(old || {}), ...(creditResult.value || {}) }));
  }, []);

  useEffect(() => { reload(); }, [reload, location.pathname]);
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const createProject = async () => {
    setCreating(true); setError("");
    try {
      const data = await endpoints.projects.create({ name: "Untitled coin", performance: "medium" });
      const project = data?.project || data;
      setProjects((old) => [project, ...old]);
      navigate(`/projects/${project.id || project.projectId}`);
    } catch (requestError) { setError(requestError.message); }
    finally { setCreating(false); }
  };

  const creditBalance = balanceFrom(account, user);
  const ethBalance = account?.ethBalance ?? account?.wallet?.ethBalance ?? user?.ethBalance ?? 0;
  const banner = useMemo(() => {
    if (bannerClosed || creditBalance > 20) return null;
    return creditBalance <= 0
      ? { text: "You’re out of PAN credits.", cta: "Buy credits to keep building" }
      : { text: `You’re running low with ${creditBalance.toLocaleString()} credits left.`, cta: "Top up credits" };
  }, [bannerClosed, creditBalance]);

  const name = user?.name || user?.username || user?.email || "PAN user";
  const avatar = user?.avatarUrl || user?.picture;

  return (
    <div className="app-shell">
      <button className="mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu /></button>
      {sidebarOpen ? <button className="mobile-overlay" onClick={() => setSidebarOpen(false)} aria-label="Close menu" /> : null}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <div className="brand-row"><Link to="/" className="brand"><i />PAN</Link><button className="mobile-close" onClick={() => setSidebarOpen(false)}><X /></button></div>
          <Button className="new-project" onClick={createProject} loading={creating}><Plus size={18} />New project</Button>
          {error ? <Notice onClose={() => setError("")}>{error}</Notice> : null}
          <p className="side-label">PROJECTS</p>
          <nav className="project-list">
            {projects.slice(0, 12).map((project) => (
              <NavLink key={project.id || project.projectId} to={`/projects/${project.id || project.projectId}`}>
                <span>{(project.name || project.coinName || "U").slice(0, 1).toUpperCase()}</span>
                <div><b>{project.name || project.coinName || "Untitled coin"}</b><small>{project.status || "Draft"}</small></div>
              </NavLink>
            ))}
            {!projects.length ? <small className="no-projects">Your projects will appear here.</small> : null}
          </nav>
        </div>
        <div className="sidebar-bottom">
          <nav className="side-nav">
            <NavLink to="/builder"><CodeXml />Website studio</NavLink>
            <NavLink to="/credits"><Coins />Credits & wallet</NavLink>
            <NavLink to="/settings"><Settings />Settings</NavLink>
            <NavLink to="/support"><LifeBuoy />Support</NavLink>
            {(user?.isAdmin || user?.role === "admin") ? <NavLink to="/admin"><ShieldCheck />Admin</NavLink> : null}
          </nav>
          <div className="account-card">
            {avatar ? <img src={avatar} alt="" referrerPolicy="no-referrer" /> : <span className="avatar">{name.slice(0, 1).toUpperCase()}</span>}
            <Link to="/credits"><strong>{creditBalance.toLocaleString()} credits</strong><small>{Number(ethBalance).toFixed(4)} ETH · {shortAddress(account?.walletAddress || user?.walletAddress)}</small></Link>
            <button onClick={async () => { await logout(); navigate("/login"); }} aria-label="Log out"><LogOut /></button>
          </div>
        </div>
      </aside>
      <main className="app-main">
        {banner ? <div className="credit-banner"><Coins size={17} /><span>{banner.text}</span><Link to="/credits">{banner.cta}</Link><button onClick={() => { setBannerClosed(true); sessionStorage.setItem("pan_credit_banner_closed", "1"); }}><X size={16} /></button></div> : null}
        <Outlet context={{ projects, setProjects, account, reload }} />
      </main>
    </div>
  );
}
