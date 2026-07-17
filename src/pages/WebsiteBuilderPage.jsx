import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowUpRight, Check, Code2, Download, Eye, FileCode2, FolderGit2, GitBranch, Globe2, KeyRound, LoaderCircle, Play, Plus, Rocket, Save, Server, TerminalSquare } from "lucide-react";
import { endpoints } from "../api";
import { Button, EmptyState, Modal, Notice, Skeleton } from "../components/UI";

const starterFiles = [
  { path: "frontend/index.html", language: "html", content: "<!doctype html>\n<html>\n<head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><style>body{margin:0;background:#07110b;color:#f6fff8;font:16px system-ui;display:grid;place-items:center;min-height:100vh}.card{text-align:center;padding:48px}b{color:#c6ff2e}h1{font-size:clamp(42px,8vw,84px);margin:10px}</style></head>\n<body><main class=\"card\"><b>PAN WEBSITE</b><h1>Your coin deserves a home.</h1><p>Describe the website in chat to start building.</p></main></body>\n</html>" },
  { path: "backend/server.js", language: "javascript", content: "import express from 'express';\n\nconst app = express();\napp.use(express.json());\napp.get('/api/health', (_req, res) => res.json({ status: 'ok' }));\napp.listen(process.env.PORT || 3000);\n" },
  { path: "backend/.env.example", language: "text", content: "PORT=3000\nALLOWED_ORIGINS=https://example.com\n" },
];

function normalizeSite(data) {
  const site = data?.site || data || {};
  return { id: site.id || site.siteId, name: site.name || "Untitled website", status: site.status || "draft", files: site.files?.length ? site.files : starterFiles, ...site };
}

export function WebsiteBuilderPage() {
  const { siteId } = useParams(); const navigate = useNavigate();
  const [site, setSite] = useState(null); const [selected, setSelected] = useState("frontend/index.html");
  const [view, setView] = useState("preview"); const [prompt, setPrompt] = useState(""); const [loading, setLoading] = useState(true); const [running, setRunning] = useState(false); const [error, setError] = useState("");
  const [deployOpen, setDeployOpen] = useState(false); const [envOpen, setEnvOpen] = useState(false); const [envRows, setEnvRows] = useState([{ key: "", value: "", secret: true }]); const [github, setGithub] = useState(null); const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([endpoints.sites.list(), siteId ? endpoints.sites.get(siteId) : Promise.resolve(null)]).then(([listResult, siteResult]) => {
      const existing = listResult.status === "fulfilled"
        ? (listResult.value?.sites || listResult.value?.items || (Array.isArray(listResult.value) ? listResult.value : []))
        : [];
      if (siteResult.status === "fulfilled" && siteResult.value) setSite(normalizeSite(siteResult.value));
      else if (!siteId) setSite(normalizeSite(existing[0] || {}));
      if (siteResult.status === "rejected") setError(siteResult.reason.message);
    }).finally(() => setLoading(false));
  }, [siteId]);

  useEffect(() => { if (deployOpen) endpoints.sites.githubStatus().then(setGithub).catch(() => setGithub({ connected: false })); }, [deployOpen]);

  const currentFile = site?.files?.find((file) => file.path === selected) || site?.files?.[0];
  const previewHtml = useMemo(() => site?.previewHtml || site?.files?.find((file) => /frontend\/index\.html$/.test(file.path))?.content || "", [site]);

  const ensureSite = async () => {
    if (site?.id) return site.id;
    const data = await endpoints.sites.create({ name: site?.name || "Untitled website", projectId: site?.projectId || null, template: "fullstack" });
    const created = normalizeSite(data); setSite((old) => ({ ...old, ...created })); navigate(`/builder/${created.id}`, { replace: true }); return created.id;
  };

  const run = async () => {
    if (!prompt.trim()) return; setRunning(true); setError("");
    try { const id = await ensureSite(); const data = await endpoints.sites.run(id, { prompt: prompt.trim(), mode: "fullstack" }); const next = normalizeSite(data?.site || data); setSite((old) => ({ ...old, ...next })); setPrompt(""); }
    catch (e) { setError(e.message); } finally { setRunning(false); }
  };

  const updateFile = (content) => setSite((old) => ({ ...old, files: old.files.map((file) => file.path === currentFile.path ? { ...file, content } : file) }));
  const saveFile = async () => { setRunning(true); try { const id = await ensureSite(); await endpoints.sites.run(id, { operation: "save_files", files: site.files }); } catch (e) { setError(e.message); } finally { setRunning(false); } };
  const addEnv = () => setEnvRows((old) => [...old, { key: "", value: "", secret: true }]);
  const saveEnv = async () => { setRunning(true); try { const id = await ensureSite(); await endpoints.sites.setEnv(id, { variables: envRows.filter((row) => row.key).map((row) => ({ ...row, key: row.key.trim() })) }); setEnvOpen(false); } catch (e) { setError(e.message); } finally { setRunning(false); } };
  const exportGithub = async () => { setExporting(true); try { const id = await ensureSite(); const data = await endpoints.sites.exportGithub(id, { createFrontend: true, createBackend: true, deployPages: true, railwayTemplate: true }); setGithub((old) => ({ ...old, export: data })); } catch (e) { setError(e.message); } finally { setExporting(false); } };

  if (loading) return <div className="page-loading"><Skeleton lines={7}/></div>;
  if (!site) return <EmptyState title="Website unavailable" text={error || "PAN could not load this website."} />;

  return <div className="builder-page">
    <header className="builder-header"><div><p>WEBSITE STUDIO</p><input aria-label="Website name" value={site.name} onChange={(e) => setSite({ ...site, name: e.target.value })}/><span className={`status-pill ${site.status === "published" ? "live" : "draft"}`}>{site.status}</span></div><div><Button variant="ghost" onClick={() => setEnvOpen(true)}><KeyRound/>Environment</Button><a className="button button-ghost" href={site.id ? endpoints.sites.downloadUrl(site.id) : "#"} onClick={(e) => !site.id && e.preventDefault()}><Download/>ZIP</a><Button onClick={() => setDeployOpen(true)}><Rocket/>Export & deploy</Button></div></header>
    {error ? <Notice onClose={() => setError("")}>{error}</Notice> : null}
    <div className="builder-workspace">
      <aside className="builder-chat"><div className="builder-agent"><span><SparkIcon/></span><div><small>PAN BUILDER</small><p>I can build the frontend and a limited backend. Tell me what should change and I’ll update the files and preview.</p></div></div><div className="builder-history">{site.runs?.map((runItem) => <div key={runItem.id}><small>{runItem.status}</small><p>{runItem.prompt}</p></div>)}</div><div className="builder-compose"><textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Build a token landing page with live stats…" onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run(); }}/><Button loading={running} disabled={!prompt.trim()} onClick={run}><Play/>Build</Button><small>Ctrl/⌘ + Enter to run</small></div></aside>
      <section className="builder-canvas"><div className="canvas-tabs"><div><button className={view === "preview" ? "active" : ""} onClick={() => setView("preview")}><Eye/>Preview</button><button className={view === "code" ? "active" : ""} onClick={() => setView("code")}><Code2/>Code</button></div><span>{running ? <><LoaderCircle className="spin"/>Building</> : <><Check/>Up to date</>}</span></div>{view === "preview" ? <div className="site-preview"><div className="browser-bar"><i/><i/><i/><span>{site.previewUrl || "pan-preview.local"}</span><ArrowUpRight/></div><iframe title="Website preview" sandbox="allow-scripts allow-forms allow-modals" srcDoc={previewHtml}/></div> : <div className="code-workspace"><aside>{site.files.map((file) => <button key={file.path} className={file.path === currentFile?.path ? "active" : ""} onClick={() => setSelected(file.path)}><FileCode2/>{file.path}</button>)}</aside><section><header><span>{currentFile?.path}</span><Button variant="ghost" onClick={saveFile} loading={running}><Save/>Save</Button></header><textarea spellCheck="false" value={currentFile?.content || ""} onChange={(e) => updateFile(e.target.value)} /></section></div>}</section>
    </div>
    {envOpen ? <Modal wide title="Backend environment variables" subtitle="Values are encrypted server-side and never included in GitHub exports." onClose={() => setEnvOpen(false)}><div className="modal-body"><Notice>Use Railway for demanding or always-on backends. PAN’s built-in backend is rate-limited and intended for lightweight APIs.</Notice><div className="env-table"><div><span>Name</span><span>Value</span><span>Secret</span></div>{envRows.map((row, index) => <div key={index}><input value={row.key} onChange={(e) => setEnvRows(envRows.map((item, i) => i === index ? { ...item, key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "") } : item))} placeholder="API_KEY"/><input type={row.secret ? "password" : "text"} value={row.value} onChange={(e) => setEnvRows(envRows.map((item, i) => i === index ? { ...item, value: e.target.value } : item))} placeholder="Value"/><input type="checkbox" checked={row.secret} onChange={(e) => setEnvRows(envRows.map((item, i) => i === index ? { ...item, secret: e.target.checked } : item))}/></div>)}</div><button className="text-button" onClick={addEnv}><Plus/>Add variable</button><div className="modal-actions"><Button variant="ghost" onClick={() => setEnvOpen(false)}>Cancel</Button><Button loading={running} onClick={saveEnv}>Save variables</Button></div></div></Modal> : null}
    {deployOpen ? <Modal wide title="Export and deploy" subtitle="Publish the frontend to GitHub Pages and prepare the backend for Railway." onClose={() => setDeployOpen(false)}><div className="modal-body deploy-grid"><section className="deploy-option"><span><GitBranch/></span><div><h3>GitHub repositories</h3><p>Create separate frontend and backend repositories with production configuration.</p>{github?.connected ? <small className="connected"><Check/>GitHub connected</small> : <a className="button button-secondary" href={endpoints.sites.githubConnectUrl}>Connect GitHub</a>}</div></section><section className="deploy-option"><span><Globe2/></span><div><h3>GitHub Pages</h3><p>Deploy the static frontend automatically with the correct repository base path.</p><small><Check/>Included in export</small></div></section><section className="deploy-option"><span><Server/></span><div><h3>Railway backend</h3><p>Generate a Railway-ready backend, environment template and deployment instructions.</p><small><Check/>Recommended for performance</small></div></section>{github?.export ? <Notice type="success">Repositories created successfully. Open the links returned by GitHub to finish Railway configuration.</Notice> : null}<div className="modal-actions full"><Button variant="ghost" onClick={() => setDeployOpen(false)}>Cancel</Button><Button loading={exporting} disabled={!github?.connected} onClick={exportGithub}><FolderGit2/>Create repositories</Button></div></div></Modal> : null}
  </div>;
}

function SparkIcon() { return <TerminalSquare size={18}/>; }
