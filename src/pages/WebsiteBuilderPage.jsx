import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowUpRight, Check, Code2, Download, Eye, FileCode2, FolderGit2, KeyRound, LoaderCircle, Play, Plus, Rocket, Save } from "lucide-react";
import { endpoints } from "../api";
import { Button, EmptyState, Modal, Notice, Skeleton } from "../components/UI";

const starterFiles = [
  { path: "public/index.html", language: "html", content: "<!doctype html>\n<html>\n<head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><style>body{margin:0;background:#07110b;color:#f6fff8;font:16px system-ui;display:grid;place-items:center;min-height:100vh}.card{text-align:center;padding:48px}b{color:#c6ff2e}h1{font-size:clamp(42px,8vw,84px);margin:10px}</style></head>\n<body><main class=\"card\"><b>PAN WEBSITE</b><h1>Your coin deserves a home.</h1><p>Describe the website in chat to start building.</p></main></body>\n</html>" },
  { path: "server.mjs", language: "javascript", content: "import express from \"express\";\nimport rateLimit from \"express-rate-limit\";\nimport helmet from \"helmet\";\n\nconst MAX_BODY_SIZE = \"64kb\";\nconst API_WINDOW_MS = 60_000;\nconst API_REQUEST_LIMIT = 60;\nconst PORT = Number(process.env.PORT || 3000);\nconst app = express();\napp.use(helmet());\napp.use(express.json({ limit: MAX_BODY_SIZE }));\napp.use(\"/api\", rateLimit({ windowMs: API_WINDOW_MS, limit: API_REQUEST_LIMIT, standardHeaders: true, legacyHeaders: false }));\napp.get(\"/health\", (_request, response) => response.json({ status: \"ok\" }));\napp.get(\"/api/status\", (_request, response) => response.json({ online: true }));\napp.use(express.static(\"public\"));\napp.get(\"/{*splat}\", (_request, response) => response.sendFile(\"index.html\", { root: \"public\" }));\napp.listen(PORT, \"0.0.0.0\");\n" },
  { path: "package.json", language: "json", content: "{\n  \"name\": \"pan-generated-site\",\n  \"private\": true,\n  \"type\": \"module\",\n  \"scripts\": { \"start\": \"node server.mjs\" },\n  \"dependencies\": {\n    \"express\": \"^5.1.0\",\n    \"express-rate-limit\": \"^8.0.1\",\n    \"helmet\": \"^8.1.0\"\n  }\n}\n" },
  { path: "railway.json", language: "json", content: "{\n  \"$schema\": \"https://railway.com/railway.schema.json\",\n  \"deploy\": { \"startCommand\": \"npm start\", \"healthcheckPath\": \"/health\" }\n}\n" },
  { path: "env.example", language: "text", content: "# Add project environment variables in PAN or Railway.\n" },
  { path: "README.md", language: "markdown", content: "# PAN generated website\n\nDeploy this package on Railway. Configure variables from env.example in the Railway service settings.\n" },
];

function normalizeSite(data) {
  const site = data?.current || data?.site || data || {};
  return { id: site.id || site.siteId || null, projectId: site.projectId || data?.projectId || null, name: site.name || "Project website", status: site.status || "draft", runtime: site.runtime || "railway_node", files: site.files?.length ? site.files : starterFiles, previewHtml: site.previewDocument || site.previewHtml || "", versions: data?.versions || site.versions || [], ...site };
}

export function WebsiteBuilderPage() {
  const { projectId, siteId } = useParams(); const navigate = useNavigate();
  const [site, setSite] = useState(null); const [selected, setSelected] = useState("public/index.html");
  const [view, setView] = useState("preview"); const [prompt, setPrompt] = useState(""); const [loading, setLoading] = useState(true); const [running, setRunning] = useState(false); const [error, setError] = useState("");
  const [deployOpen, setDeployOpen] = useState(false); const [envOpen, setEnvOpen] = useState(false); const [envRows, setEnvRows] = useState([{ key: "", value: "", secret: true }]); const [github, setGithub] = useState(null); const [exporting, setExporting] = useState(false);
  const [deploy, setDeploy] = useState({ frontendRepo: "pan-website", backendRepo: "pan-website-backend", frontendVisibility: "public", backendVisibility: "private" });

  useEffect(() => {
    setLoading(true);
    endpoints.sites.get(projectId, siteId).then((result) => setSite(normalizeSite({ ...result, projectId }))).catch((requestError) => { setError(requestError.message); setSite(normalizeSite({ projectId })); }).finally(() => setLoading(false));
  }, [projectId, siteId]);

  useEffect(() => { if (deployOpen) endpoints.sites.githubStatus().then(setGithub).catch(() => setGithub({ connected: false })); }, [deployOpen]);
  useEffect(() => {
    if (!projectId || !site?.id || !["queued", "generating"].includes(site.status)) return undefined;
    let active = true;
    const refresh = async () => {
      try {
        const result = await endpoints.sites.get(projectId, site.id);
        if (!active) return;
        const next = normalizeSite({ ...result, projectId });
        setSite((old) => ({ ...old, ...next }));
        if (next.status === "failed") setError(next.errorMessage || "Website Studio could not complete the build.");
      } catch (requestError) {
        if (active) setError(requestError.message);
      }
    };
    const timer = window.setInterval(refresh, 1_000);
    refresh();
    return () => { active = false; window.clearInterval(timer); };
  }, [projectId, site?.id, site?.status]);
  useEffect(() => {
    if (!envOpen || !projectId) return;
    endpoints.sites.env(projectId).then((result) => setEnvRows(result?.variables?.length ? result.variables.map((item) => ({ key: item.key, value: "", secret: item.secret !== false, description: item.description || "", configured: item.configured })) : [{ key: "", value: "", secret: true }])).catch((requestError) => setError(requestError.message));
  }, [envOpen, projectId]);

  const currentFile = site?.files?.find((file) => file.path === selected) || site?.files?.[0];
  const previewHtml = useMemo(() => site?.previewHtml || site?.files?.find((file) => /(?:^|\/)index\.html$/.test(file.path))?.content || "", [site]);
  const building = running || ["queued", "generating"].includes(site?.status);

  const ensureSite = async () => {
    if (!projectId) throw new Error("A project is required for Website Studio.");
    return projectId;
  };

  const run = async () => {
    if (!prompt.trim()) return; setRunning(true); setError("");
    try { const id = await ensureSite(); const data = await endpoints.sites.run(id, { prompt: prompt.trim(), performance: "medium", runtime: site.runtime === "railway_node" ? "fullstack" : "static", basedOnVersionId: site.id || undefined }); const next = normalizeSite({ ...data, projectId }); setSite((old) => ({ ...old, ...next })); if (next.id) navigate(`/projects/${projectId}/website/${next.id}`, { replace: true }); setPrompt(""); }
    catch (e) { setError(e.message); } finally { setRunning(false); }
  };

  const updateFile = (content) => setSite((old) => ({ ...old, files: old.files.map((file) => file.path === currentFile.path ? { ...file, content } : file) }));
  const saveFile = async () => { setRunning(true); try { const id = await ensureSite(); const data = await endpoints.sites.run(id, { operation: "save_files", files: site.files, basedOnVersionId: site.id || undefined, runtime: site.runtime }); const next = normalizeSite({ ...(data?.current ? data : { current: data }), projectId }); setSite((old) => ({ ...old, ...next })); if (next.id) navigate(`/projects/${projectId}/website/${next.id}`, { replace: true }); } catch (e) { setError(e.message); } finally { setRunning(false); } };
  const addEnv = () => setEnvRows((old) => [...old, { key: "", value: "", secret: true }]);
  const saveEnv = async () => { setRunning(true); try { const id = await ensureSite(); await endpoints.sites.setEnv(id, { variables: envRows.filter((row) => row.key && (!row.configured || row.value)).map((row) => ({ key: row.key.trim(), ...(row.value ? { value: row.value } : {}), description: row.description, secret: row.secret })) }); setEnvOpen(false); } catch (e) { setError(e.message); } finally { setRunning(false); } };
  const exportGithub = async () => { setExporting(true); try { const id = await ensureSite(); if (!site.id) throw new Error("Build or save a website version before exporting."); const data = await endpoints.sites.exportGithub(id, { versionId: site.id, idempotencyKey: crypto.randomUUID(), confirmed: true, repositoryLayout: "split", frontendOwner: github.username || github.login, frontendRepo: deploy.frontendRepo, frontendVisibility: deploy.frontendVisibility, backendRepo: deploy.backendRepo, backendVisibility: deploy.backendVisibility, pagesRequested: true }); setGithub((old) => ({ ...old, export: data })); } catch (e) { setError(e.message); } finally { setExporting(false); } };

  if (loading) return <div className="page-loading"><Skeleton lines={7}/></div>;
  if (!site) return <EmptyState title="Website unavailable" text={error || "PAN could not load this website."} />;

  return <div className="builder-page">
    <header className="builder-header"><div><p>PROJECT WEBSITE</p><input aria-label="Website name" value={site.name} onChange={(e) => setSite({ ...site, name: e.target.value })}/><span className={`status-pill ${site.status === "published" || site.status === "ready" ? "live" : "draft"}`}>{site.status}</span></div><div><Button variant="ghost" onClick={() => navigate(`/projects/${projectId}`)}>Back to project</Button><Button variant="ghost" onClick={() => setEnvOpen(true)}><KeyRound/>Environment</Button><a className="button button-ghost" href={site.zipUrl ? endpoints.sites.assetUrl(site.zipUrl) : "#"} onClick={(e) => !site.zipUrl && e.preventDefault()}><Download/>ZIP</a><Button onClick={() => setDeployOpen(true)}><Rocket/>Export & deploy</Button></div></header>
    {error ? <Notice onClose={() => setError("")}>{error}</Notice> : null}
    <div className="builder-workspace">
      <aside className="builder-chat"><div className="builder-agent"><span><SparkIcon/></span><div><small>PAN BUILDER</small><p>I can build the frontend and a limited backend. Tell me what should change and I’ll update the files and preview.</p></div></div><div className="builder-history">{site.runs?.map((runItem) => <div key={runItem.id}><small>{runItem.status}</small><p>{runItem.prompt}</p></div>)}</div><div className="builder-compose"><textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Build a token landing page with live stats…" onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run(); }}/><Button loading={running} disabled={!prompt.trim()} onClick={run}><Play/>Build</Button><small>Ctrl/⌘ + Enter to run</small></div></aside>
      <section className="builder-canvas"><div className="canvas-tabs"><div><button className={view === "preview" ? "active" : ""} onClick={() => setView("preview")}><Eye/>Preview</button><button className={view === "code" ? "active" : ""} onClick={() => setView("code")}><Code2/>Code</button></div><span>{building ? <><LoaderCircle className="spin"/>Building</> : site.status === "failed" ? <>Build failed</> : <><Check/>Up to date</>}</span></div>{view === "preview" ? <div className="site-preview"><div className="browser-bar"><i/><i/><i/><span>{site.previewUrl || "pan-preview.local"}</span><ArrowUpRight/></div><iframe title="Website preview" sandbox="allow-scripts allow-forms allow-modals" srcDoc={previewHtml}/></div> : <div className="code-workspace"><aside>{site.files.map((file) => <button key={file.path} className={file.path === currentFile?.path ? "active" : ""} onClick={() => setSelected(file.path)}><FileCode2/>{file.path}</button>)}</aside><section><header><span>{currentFile?.path}</span><Button variant="ghost" onClick={saveFile} loading={running}><Save/>Save</Button></header><textarea spellCheck="false" value={currentFile?.content || ""} onChange={(e) => updateFile(e.target.value)} /></section></div>}</section>
    </div>
    {envOpen ? <Modal wide title="Backend environment variables" subtitle="Values are encrypted server-side and never included in GitHub exports." onClose={() => setEnvOpen(false)}><div className="modal-body"><Notice>Use Railway for demanding or always-on backends. PAN’s built-in backend is rate-limited and intended for lightweight APIs.</Notice><div className="env-table"><div><span>Name</span><span>Value</span><span>Secret</span></div>{envRows.map((row, index) => <div key={index}><input value={row.key} onChange={(e) => setEnvRows(envRows.map((item, i) => i === index ? { ...item, key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "") } : item))} placeholder="API_KEY"/><input type={row.secret ? "password" : "text"} value={row.value} onChange={(e) => setEnvRows(envRows.map((item, i) => i === index ? { ...item, value: e.target.value } : item))} placeholder="Value"/><input type="checkbox" checked={row.secret} onChange={(e) => setEnvRows(envRows.map((item, i) => i === index ? { ...item, secret: e.target.checked } : item))}/></div>)}</div><button className="text-button" onClick={addEnv}><Plus/>Add variable</button><div className="modal-actions"><Button variant="ghost" onClick={() => setEnvOpen(false)}>Cancel</Button><Button loading={running} onClick={saveEnv}>Save variables</Button></div></div></Modal> : null}
    {deployOpen ? <Modal wide title="Export and deploy" subtitle="Publish the frontend to GitHub Pages and prepare the backend for Railway." onClose={() => setDeployOpen(false)}><div className="modal-body deploy-grid"><section className="deploy-option"><span><img className="deploy-brand-icon" src={`${import.meta.env.BASE_URL}github.png`} alt="GitHub" /></span><div><h3>GitHub repositories</h3><p>Create separate frontend and backend repositories with production configuration.</p>{github?.connected ? <small className="connected"><Check/>GitHub connected as {github.username || github.login}</small> : <a className="button button-secondary" href={endpoints.sites.githubConnectUrl}>Connect GitHub</a>}</div></section><div className="two-fields"><label className="field"><span>Frontend repository</span><input value={deploy.frontendRepo} onChange={(event) => setDeploy({ ...deploy, frontendRepo: event.target.value.replace(/[^a-zA-Z0-9._-]/g, "") })}/></label><label className="field"><span>Backend repository</span><input value={deploy.backendRepo} onChange={(event) => setDeploy({ ...deploy, backendRepo: event.target.value.replace(/[^a-zA-Z0-9._-]/g, "") })}/></label></div><section className="deploy-option"><span><img className="deploy-brand-icon" src={`${import.meta.env.BASE_URL}github.png`} alt="GitHub" /></span><div><h3>GitHub Pages</h3><p>Deploy the static frontend automatically with the correct repository base path.</p><small><Check/>Included in export</small></div></section><section className="deploy-option"><span><img className="deploy-brand-icon" src={`${import.meta.env.BASE_URL}railway.png`} alt="Railway" /></span><div><h3>Railway backend</h3><p>Generate a Railway-ready backend, environment template and deployment instructions.</p><small><Check/>Recommended for performance</small></div></section>{github?.export ? <Notice type="success">Export queued successfully. PAN will create the repositories and GitHub Pages deployment in the background.</Notice> : null}<div className="modal-actions full"><Button variant="ghost" onClick={() => setDeployOpen(false)}>Cancel</Button><Button loading={exporting} disabled={!github?.connected || !site.id || !deploy.frontendRepo || !deploy.backendRepo} onClick={exportGithub}><FolderGit2/>Create repositories</Button></div></div></Modal> : null}
  </div>;
}

function SparkIcon() { return <img src={`${import.meta.env.BASE_URL}PanLogo.png`} alt="" />; }
