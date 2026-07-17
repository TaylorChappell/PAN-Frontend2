import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Coins, LifeBuoy, Menu, MoreHorizontal, Pencil, Plus, Settings, ShieldCheck, Trash2, X } from "lucide-react";
import { endpoints } from "../api";
import { useAuth } from "../auth";
import { Button, Modal, Notice } from "./UI";

function projectArray(data) {
  return data?.projects || data?.items || (Array.isArray(data) ? data : []);
}

function balanceFrom(data, user) {
  return Number(data?.creditBalance ?? data?.credits?.balance ?? data?.credits ?? data?.balance ?? user?.creditBalance ?? user?.credits ?? 0);
}

function accountPayload(data) {
  return data?.account ? { ...data, ...data.account } : data;
}

export function AppShell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const studioMode = /^\/projects\/[^/]+\/website(?:\/|$)/.test(location.pathname);
  const freeCreditsBannerKey = `pan_free_credits_banner_seen:${user?.id || user?.email || "account"}`;
  const [projects, setProjects] = useState([]);
  const [account, setAccount] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bannerClosed, setBannerClosed] = useState(sessionStorage.getItem("pan_credit_banner_closed") === "1");
  const [freeCreditsBannerSeen, setFreeCreditsBannerSeen] = useState(localStorage.getItem(freeCreditsBannerKey) === "1");
  const [projectMenu, setProjectMenu] = useState(null);
  const [projectAction, setProjectAction] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [projectWorking, setProjectWorking] = useState(false);
  const [error, setError] = useState("");

  const mergeAccount = useCallback((value) => {
    if (!value) return;
    setAccount((old) => ({ ...(old || {}), ...(accountPayload(value) || {}) }));
  }, []);

  const refreshAccount = useCallback(async () => {
    const result = await endpoints.credits.summary();
    mergeAccount(result);
    return result;
  }, [mergeAccount]);

  const reload = useCallback(async () => {
    const [projectResult, accountResult, creditResult] = await Promise.allSettled([
      endpoints.projects.list(), endpoints.account.summary(), endpoints.credits.summary(),
    ]);
    if (projectResult.status === "fulfilled") setProjects(projectArray(projectResult.value));
    if (accountResult.status === "fulfilled") mergeAccount(accountResult.value);
    if (creditResult.status === "fulfilled") mergeAccount(creditResult.value);
  }, [mergeAccount]);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible" && location.pathname !== "/credits") refreshAccount().catch(() => {});
    };
    const receiveAccountUpdate = (event) => mergeAccount(event.detail);
    const timer = window.setInterval(refreshWhenVisible, 5_000);
    window.addEventListener("focus", refreshWhenVisible);
    window.addEventListener("pan:account-updated", receiveAccountUpdate);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshWhenVisible);
      window.removeEventListener("pan:account-updated", receiveAccountUpdate);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [location.pathname, mergeAccount, refreshAccount]);
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const createProject = () => {
    setError("");
    navigate("/", { state: { newProjectNonce: crypto.randomUUID() } });
  };

  const creditBalance = balanceFrom(account, user);
  const operationsWallet = account?.wallets?.find((wallet) => wallet.role === "operations");
  const ethBalance = operationsWallet?.ethBalance ?? account?.ethBalance ?? account?.wallet?.ethBalance ?? user?.ethBalance ?? 0;
  const banner = useMemo(() => {
    if (!freeCreditsBannerSeen) return { kind: "free", text: "New to PAN.AI?", cta: "Get free credits here" };
    if (bannerClosed || creditBalance > 20) return null;
    return creditBalance <= 0
      ? { kind: "balance", text: "You’re out of PAN credits.", cta: "Buy credits to keep building" }
      : { kind: "balance", text: `You’re running low with ${creditBalance.toLocaleString()} credits left.`, cta: "Top up credits" };
  }, [bannerClosed, creditBalance, freeCreditsBannerSeen]);

  const dismissBanner = () => {
    if (banner?.kind === "free") {
      setFreeCreditsBannerSeen(true);
      localStorage.setItem(freeCreditsBannerKey, "1");
      return;
    }
    setBannerClosed(true);
    sessionStorage.setItem("pan_credit_banner_closed", "1");
  };

  const name = user?.name || user?.username || user?.email || "PAN user";
  const avatar = user?.image || user?.avatarUrl || user?.picture;

  const openProjectAction = (action, project) => {
    setProjectMenu(null);
    setProjectAction({ action, project });
    setProjectName(project.name || project.coinName || "Untitled coin");
  };

  const finishProjectAction = async () => {
    const id = projectAction?.project?.id || projectAction?.project?.projectId;
    if (!id) return;
    setProjectWorking(true); setError("");
    try {
      if (projectAction.action === "rename") {
        const name = projectName.trim();
        if (!name) return;
        await endpoints.projects.update(id, { name });
        setProjects((old) => old.map((item) => (item.id || item.projectId) === id ? { ...item, name } : item));
      } else {
        await endpoints.projects.remove(id);
        setProjects((old) => old.filter((item) => (item.id || item.projectId) !== id));
        if (location.pathname.includes(id)) navigate("/");
      }
      setProjectAction(null);
    } catch (requestError) { setError(requestError.message); }
    finally { setProjectWorking(false); }
  };

  return (
    <div className={`app-shell ${studioMode ? "studio-mode" : ""}`}>
      <button className="mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu /></button>
      {sidebarOpen ? <button className="mobile-overlay" onClick={() => setSidebarOpen(false)} aria-label="Close menu" /> : null}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <div className="brand-row"><Link to="/" className="brand"><img src={`${import.meta.env.BASE_URL}PanLogo.png`} alt="" />PAN.AI</Link><button className="mobile-close" onClick={() => setSidebarOpen(false)}><X /></button></div>
          <Button className="new-project" onClick={createProject}><Plus size={18} />New project</Button>
          {error ? <Notice onClose={() => setError("")}>{error}</Notice> : null}
          <p className="side-label">PROJECTS</p>
          <nav className="project-list">
            {projects.slice(0, 12).map((project) => {
              const id = project.id || project.projectId;
              return <div className="project-list-item" key={id} onContextMenu={(event) => { event.preventDefault(); setProjectMenu({ id, x: event.clientX, y: event.clientY, project }); }}>
                <NavLink to={`/projects/${id}`}>
                  <span>{(project.name || project.coinName || "U").slice(0, 1).toUpperCase()}</span>
                  <div><b>{project.name || project.coinName || "Untitled coin"}</b><small>{project.status || "Draft"}</small></div>
                </NavLink>
                <button className="project-more" aria-label="Project options" onClick={(event) => { const rect = event.currentTarget.getBoundingClientRect(); setProjectMenu({ id, x: rect.right, y: rect.bottom, project }); }}><MoreHorizontal /></button>
              </div>;
            })}
            {!projects.length ? <small className="no-projects">Your projects will appear here.</small> : null}
          </nav>
        </div>
        <div className="sidebar-bottom">
          <nav className="side-nav">
            <NavLink to="/credits"><Coins />Credits & wallet</NavLink>
            <NavLink to="/settings"><Settings />Settings</NavLink>
            <NavLink to="/support"><LifeBuoy />Support</NavLink>
            {(account?.isAdmin || user?.isAdmin || user?.role === "admin") ? <NavLink to="/admin"><ShieldCheck />Admin</NavLink> : null}
          </nav>
          <Link to="/credits" className="account-card">
            {avatar ? <img src={avatar} alt="" referrerPolicy="no-referrer" /> : <span className="avatar">{name.slice(0, 1).toUpperCase()}</span>}
            <span><strong>{creditBalance.toLocaleString()} credits</strong><small>{Number(ethBalance).toFixed(4)} ETH available</small></span>
          </Link>
        </div>
      </aside>
      <main className="app-main">
        {banner ? <div className="credit-banner"><Coins size={17} /><span>{banner.text}</span><Link to="/credits" onClick={dismissBanner}>{banner.cta}</Link><button onClick={dismissBanner}><X size={16} /></button></div> : null}
        <Outlet context={{ projects, setProjects, account, reload }} />
      </main>
      {projectMenu ? <><button className="context-menu-backdrop" aria-label="Close project menu" onClick={() => setProjectMenu(null)} /><div className="project-context-menu" style={{ left: Math.min(projectMenu.x, window.innerWidth - 180), top: Math.min(projectMenu.y, window.innerHeight - 110) }}><button onClick={() => openProjectAction("rename", projectMenu.project)}><Pencil />Rename</button><button className="danger" onClick={() => openProjectAction("delete", projectMenu.project)}><Trash2 />Delete</button></div></> : null}
      {projectAction ? <Modal title={projectAction.action === "rename" ? "Rename project" : "Delete project"} subtitle={projectAction.action === "delete" ? "This permanently removes the conversation, uploaded images, generated files, website data, environment variables, exports, and queued work for this project." : "Choose a name that is easy to find in project history."} onClose={() => !projectWorking && setProjectAction(null)}><div className="modal-body">{projectAction.action === "rename" ? <label className="field"><span>Project name</span><input autoFocus maxLength="80" value={projectName} onChange={(event) => setProjectName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") finishProjectAction(); }} /></label> : <Notice>Deletion cannot be undone.</Notice>}<div className="modal-actions"><Button variant="ghost" onClick={() => setProjectAction(null)}>Cancel</Button><Button className={projectAction.action === "delete" ? "button-danger" : ""} loading={projectWorking} disabled={projectAction.action === "rename" && !projectName.trim()} onClick={finishProjectAction}>{projectAction.action === "rename" ? "Save name" : "Delete project"}</Button></div></div></Modal> : null}
    </div>
  );
}
