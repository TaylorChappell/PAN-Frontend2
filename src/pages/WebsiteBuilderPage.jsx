import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowUpRight,
  Braces,
  Check,
  ChevronRight,
  Code2,
  Download,
  Eye,
  FileCode2,
  FileJson,
  FileText,
  Folder,
  FolderGit2,
  FolderOpen,
  KeyRound,
  LoaderCircle,
  Play,
  Plus,
  Rocket,
  Save,
} from "lucide-react";
import Prism from "prismjs";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markdown";
import { endpoints } from "../api";
import { Button, EmptyState, Modal, Notice, Skeleton } from "../components/UI";

const starterFiles = [
  {
    path: "index.html",
    language: "html",
    content: `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <meta name="theme-color" content="#07110b" />\n    <title>PAN generated website</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n`,
  },
  {
    path: "src/main.tsx",
    language: "tsx",
    content: `import React from "react";\nimport ReactDOM from "react-dom/client";\nimport { App } from "./App";\nimport "./styles.css";\n\nReactDOM.createRoot(document.getElementById("root")!).render(\n\t<React.StrictMode>\n\t\t<App />\n\t</React.StrictMode>,\n);\n`,
  },
  {
    path: "src/App.tsx",
    language: "tsx",
    content: `export function App() {\n\treturn (\n\t\t<main className="page">\n\t\t\t<section className="card">\n\t\t\t\t<span>PAN WEBSITE</span>\n\t\t\t\t<h1>Your coin deserves a home.</h1>\n\t\t\t\t<p>Describe the website in chat to start building.</p>\n\t\t\t</section>\n\t\t</main>\n\t);\n}\n`,
  },
  {
    path: "src/styles.css",
    language: "css",
    content: `:root { color-scheme: dark; font-family: Inter, system-ui, sans-serif; background: #07110b; color: #f6fff8; }\n* { box-sizing: border-box; }\nbody { margin: 0; }\n.page { min-height: 100vh; display: grid; place-items: center; padding: 32px; background: radial-gradient(circle at top, rgba(198,255,46,.08), transparent 42%), #07110b; }\n.card { max-width: 760px; text-align: center; padding: 64px 40px; }\n.card span { color: #c6ff2e; font-size: 12px; font-weight: 900; letter-spacing: .14em; }\n.card h1 { margin: 16px 0; font-size: clamp(48px, 8vw, 92px); line-height: .95; letter-spacing: -.07em; }\n.card p { color: #829087; font-size: 18px; }\n`,
  },
  {
    path: "pan-preview.html",
    language: "html",
    content: `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">\n<style>body{margin:0;background:radial-gradient(circle at top,rgba(198,255,46,.08),transparent 42%),#07110b;color:#f6fff8;font:16px Inter,system-ui;display:grid;place-items:center;min-height:100vh}.card{max-width:760px;text-align:center;padding:64px 40px}.card b{color:#c6ff2e;font-size:12px;letter-spacing:.14em}.card h1{font-size:clamp(48px,8vw,92px);line-height:.95;letter-spacing:-.07em;margin:16px 0}.card p{color:#829087;font-size:18px}</style>\n</head>\n<body><main class="card"><b>PAN WEBSITE</b><h1>Your coin deserves a home.</h1><p>Describe the website in chat to start building.</p></main></body>\n</html>`,
  },
  {
    path: "package.json",
    language: "json",
    content: `{"name":"pan-generated-site","private":true,"version":"1.0.0","type":"module","scripts":{"dev":"vite","build":"vite build","preview":"vite preview"},"dependencies":{"react":"^19.2.0","react-dom":"^19.2.0"},"devDependencies":{"@types/react":"^19.2.0","@types/react-dom":"^19.2.0","@vitejs/plugin-react":"^6.0.0","typescript":"^5.9.0","vite":"^8.0.0"}}\n`,
  },
  {
    path: "tsconfig.json",
    language: "json",
    content: `{"compilerOptions":{"target":"ES2022","useDefineForClassFields":true,"lib":["ES2022","DOM","DOM.Iterable"],"allowJs":false,"skipLibCheck":true,"esModuleInterop":true,"allowSyntheticDefaultImports":true,"strict":true,"forceConsistentCasingInFileNames":true,"module":"ESNext","moduleResolution":"Bundler","resolveJsonModule":true,"isolatedModules":true,"noEmit":true,"jsx":"react-jsx"},"include":["src"]}\n`,
  },
  {
    path: "vite.config.ts",
    language: "typescript",
    content: `import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\n\nexport default defineConfig({\n\tplugins: [react()],\n});\n`,
  },
  {
    path: "README.md",
    language: "markdown",
    content: `# PAN generated website\n\nThis project uses React, TypeScript, and Vite.\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`,
  },
];

const languageByExtension = {
  html: "markup",
  htm: "markup",
  css: "css",
  js: "javascript",
  mjs: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  json: "json",
  md: "markdown",
};

function normalizeSite(data) {
  const site = data?.current || data?.site || data || {};
  return {
    id: site.id || site.siteId || null,
    projectId: site.projectId || data?.projectId || null,
    name: site.name || "Project website",
    status: site.status || "draft",
    runtime: site.runtime || "static",
    files: site.files?.length ? site.files : starterFiles,
    previewHtml: site.previewDocument || site.previewHtml || "",
    versions: data?.versions || site.versions || [],
    ...site,
  };
}

function fileLanguage(path) {
  const extension = path.split(".").pop()?.toLowerCase() || "";
  return languageByExtension[extension] || "plain";
}

function promptNeedsBackend(value) {
  return /\b(?:global|shared|multi-user|multiuser|persistent|database|backend|server-side|all users|every user|login|accounts?)\b|\b(?:store|save|sync)\b[^.]{0,50}\b(?:users?|visitors?|devices?)\b/i.test(value);
}

function fileIcon(path) {
  const extension = path.split(".").pop()?.toLowerCase();
  if (extension === "json") return <FileJson />;
  if (["ts", "tsx", "js", "jsx", "css", "html", "mjs"].includes(extension)) return <Braces />;
  return <FileText />;
}

function buildFileTree(files) {
  const root = { type: "folder", name: "", path: "", children: [] };
  for (const file of [...files].sort((left, right) => left.path.localeCompare(right.path))) {
    const parts = file.path.split("/");
    let current = root;
    parts.forEach((part, index) => {
      const path = parts.slice(0, index + 1).join("/");
      if (index === parts.length - 1) {
        current.children.push({ type: "file", name: part, path, file });
        return;
      }
      let folder = current.children.find((child) => child.type === "folder" && child.name === part);
      if (!folder) {
        folder = { type: "folder", name: part, path, children: [] };
        current.children.push(folder);
      }
      current = folder;
    });
  }
  const sortNodes = (nodes) => nodes.sort((left, right) => {
    if (left.type !== right.type) return left.type === "folder" ? -1 : 1;
    return left.name.localeCompare(right.name);
  }).forEach((node) => node.type === "folder" && sortNodes(node.children));
  sortNodes(root.children);
  return root.children;
}

function folderPaths(nodes, paths = []) {
  for (const node of nodes) {
    if (node.type === "folder") {
      paths.push(node.path);
      folderPaths(node.children, paths);
    }
  }
  return paths;
}

function FileTree({ nodes, expanded, selected, onToggle, onSelect, depth = 0 }) {
  return nodes.map((node) => {
    if (node.type === "folder") {
      const open = expanded.has(node.path);
      return <div className="file-tree-node" key={node.path}>
        <button className="folder-row" style={{ paddingLeft: 8 + depth * 14 }} onClick={() => onToggle(node.path)}>
          <ChevronRight className={open ? "open" : ""} />
          {open ? <FolderOpen /> : <Folder />}
          <span>{node.name}</span>
        </button>
        {open ? <FileTree nodes={node.children} expanded={expanded} selected={selected} onToggle={onToggle} onSelect={onSelect} depth={depth + 1} /> : null}
      </div>;
    }
    return <button className={`file-row ${selected === node.path ? "active" : ""}`} style={{ paddingLeft: 24 + depth * 14 }} onClick={() => onSelect(node.path)} key={node.path}>
      {fileIcon(node.path)}
      <span>{node.name}</span>
    </button>;
  });
}

function editWithTab(value, start, end, reverse) {
  const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  const nextBreak = value.indexOf("\n", end);
  const lineEnd = nextBreak === -1 ? value.length : nextBreak;
  const selectedBlock = value.slice(lineStart, lineEnd);
  const lines = selectedBlock.split("\n");

  if (!reverse) {
    const replacement = lines.map((line) => `\t${line}`).join("\n");
    const beforeSelectionOffset = start - lineStart;
    return {
      value: `${value.slice(0, lineStart)}${replacement}${value.slice(lineEnd)}`,
      start: start + 1,
      end: end + lines.length,
      fallbackStart: lineStart + beforeSelectionOffset + 1,
    };
  }

  let removedBeforeStart = 0;
  let removedTotal = 0;
  const replacement = lines.map((line, index) => {
    const match = line.match(/^(\t| {1,2})/);
    const removed = match?.[0].length || 0;
    if (index === 0) removedBeforeStart = Math.min(removed, start - lineStart);
    removedTotal += removed;
    return line.slice(removed);
  }).join("\n");
  return {
    value: `${value.slice(0, lineStart)}${replacement}${value.slice(lineEnd)}`,
    start: Math.max(lineStart, start - removedBeforeStart),
    end: Math.max(lineStart, end - removedTotal),
    fallbackStart: Math.max(lineStart, start - removedBeforeStart),
  };
}

function CodeEditor({ path, value, onChange, disabled }) {
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);
  const language = fileLanguage(path || "");
  const grammar = Prism.languages[language] || Prism.languages.plain;
  const highlighted = useMemo(() => Prism.highlight(value || "", grammar, language), [grammar, language, value]);

  const syncScroll = (event) => {
    if (!highlightRef.current) return;
    highlightRef.current.scrollTop = event.currentTarget.scrollTop;
    highlightRef.current.scrollLeft = event.currentTarget.scrollLeft;
  };

  const handleKeyDown = (event) => {
    if (event.key !== "Tab") return;
    event.preventDefault();
    const target = event.currentTarget;
    const result = editWithTab(value, target.selectionStart, target.selectionEnd, event.shiftKey);
    onChange(result.value);
    requestAnimationFrame(() => {
      const editor = textareaRef.current;
      if (!editor) return;
      editor.focus();
      editor.setSelectionRange(result.start ?? result.fallbackStart, result.end ?? result.fallbackStart);
    });
  };

  return <div className={`syntax-editor language-${language}`}>
    <pre ref={highlightRef} aria-hidden="true"><code dangerouslySetInnerHTML={{ __html: `${highlighted}\n` }} /></pre>
    <textarea
      ref={textareaRef}
      aria-label={`Edit ${path || "website file"}`}
      spellCheck="false"
      value={value || ""}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={handleKeyDown}
      onScroll={syncScroll}
      disabled={disabled}
    />
  </div>;
}

export function WebsiteBuilderPage() {
  const { projectId, siteId } = useParams();
  const navigate = useNavigate();
  const [site, setSite] = useState(null);
  const [selected, setSelected] = useState("src/App.tsx");
  const [expanded, setExpanded] = useState(new Set(["src"]));
  const [view, setView] = useState("preview");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [deployOpen, setDeployOpen] = useState(false);
  const [envOpen, setEnvOpen] = useState(false);
  const previewFrameRef = useRef(null);
  const [envRows, setEnvRows] = useState([{ key: "", value: "", description: "", secret: true, configured: false }]);
  const [github, setGithub] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [deploy, setDeploy] = useState({ frontendRepo: "pan-website", backendRepo: "pan-website-backend", frontendVisibility: "public", backendVisibility: "private" });

  useEffect(() => {
    setLoading(true);
    endpoints.sites.get(projectId, siteId)
      .then((result) => setSite(normalizeSite({ ...result, projectId })))
      .catch((requestError) => { setError(requestError.message); setSite(normalizeSite({ projectId })); })
      .finally(() => setLoading(false));
  }, [projectId, siteId]);

  const filePathKey = useMemo(() => (site?.files || []).map((file) => file.path).sort().join("\n"), [site?.files]);
  useEffect(() => {
    const paths = filePathKey.split("\n").filter(Boolean);
    if (!paths.length) return;
    const tree = buildFileTree(paths.map((path) => ({ path })));
    setExpanded(new Set(folderPaths(tree)));
    setSelected((current) => paths.includes(current) ? current : paths.find((path) => path === "src/App.tsx") || paths[0]);
  }, [filePathKey]);

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
    if (!projectId || (!envOpen && !["ready", "published"].includes(site?.status))) return undefined;
    let active = true;
    endpoints.sites.env(projectId).then((result) => {
      if (!active) return;
      setEnvRows(result?.variables?.length
        ? result.variables.map((item) => ({ key: item.key, value: "", secret: item.secret !== false, description: item.description || "", configured: Boolean(item.configured), source: item.source }))
        : [{ key: "", value: "", description: "", secret: true, configured: false }]);
    }).catch((requestError) => {
      if (active && envOpen) setError(requestError.message);
    });
    return () => { active = false; };
  }, [envOpen, projectId, site?.id, site?.status]);
  useEffect(() => {
    if (!projectId || !site?.id) return undefined;
    const handlePreviewRequest = async (event) => {
      if (event.source !== previewFrameRef.current?.contentWindow || event.data?.type !== "pan-preview-request") return;
      const source = event.source;
      const requestId = event.data.requestId;
      try {
        const body = await endpoints.sites.previewRequest(projectId, { versionId: site.id, method: event.data.method, path: event.data.path, body: event.data.body });
        source?.postMessage({ type: "pan-preview-response", requestId, status: 200, body }, "*");
      } catch (requestError) {
        source?.postMessage({ type: "pan-preview-response", requestId, status: requestError.status || 500, body: requestError.data || { error: requestError.message } }, "*");
      }
    };
    window.addEventListener("message", handlePreviewRequest);
    return () => window.removeEventListener("message", handlePreviewRequest);
  }, [projectId, site?.id]);

  const currentFile = site?.files?.find((file) => file.path === selected) || site?.files?.[0];
  const fileTree = useMemo(() => buildFileTree(site?.files || []), [site?.files]);
  const previewHtml = useMemo(() => site?.previewHtml || site?.files?.find((file) => file.path === "pan-preview.html")?.content || site?.files?.find((file) => /(?:^|\/)index\.html$/.test(file.path))?.content || "", [site]);
  const building = running || ["queued", "generating"].includes(site?.status);
  const definedEnvironment = envRows.filter((row) => row.key);
  const missingEnvironment = definedEnvironment.filter((row) => !row.configured);

  const ensureSite = async () => {
    if (!projectId) throw new Error("A project is required for Website Studio.");
    return projectId;
  };

  const run = async () => {
    if (!prompt.trim()) return;
    setRunning(true);
    setError("");
    try {
      const id = await ensureSite();
      const fullstack = site.runtime === "railway_node" || promptNeedsBackend(prompt);
      const data = await endpoints.sites.run(id, {
        prompt: `${prompt.trim()}\n\nBuild the frontend in React with TypeScript. If backend functionality is needed, implement the backend in TypeScript. Never fabricate dynamic counts or metrics, and do not use em dashes anywhere in the website.`,
        performance: "medium",
        runtime: fullstack ? "fullstack" : "static",
        basedOnVersionId: site.id || undefined,
      });
      const next = normalizeSite({ ...data, projectId });
      setSite((old) => ({ ...old, ...next }));
      if (next.id) navigate(`/projects/${projectId}/website/${next.id}`, { replace: true });
      setPrompt("");
    } catch (requestError) { setError(requestError.message); }
    finally { setRunning(false); }
  };

  const updateFile = (content) => {
    if (!currentFile) return;
    setSite((old) => ({ ...old, files: old.files.map((file) => file.path === currentFile.path ? { ...file, content } : file) }));
  };
  const saveFile = async () => {
    setRunning(true);
    try {
      const id = await ensureSite();
      const data = await endpoints.sites.run(id, { operation: "save_files", files: site.files, basedOnVersionId: site.id || undefined, runtime: site.runtime });
      const next = normalizeSite({ ...(data?.current ? data : { current: data }), projectId });
      setSite((old) => ({ ...old, ...next }));
      if (next.id) navigate(`/projects/${projectId}/website/${next.id}`, { replace: true });
    } catch (requestError) { setError(requestError.message); }
    finally { setRunning(false); }
  };
  const addEnv = () => setEnvRows((old) => [...old, { key: "", value: "", description: "", secret: true, configured: false }]);
  const saveEnv = async () => {
    setRunning(true);
    try {
      const id = await ensureSite();
      const variables = envRows.filter((row) => row.key).map((row) => ({ key: row.key.trim(), ...(row.value ? { value: row.value } : {}), description: row.description, secret: row.secret }));
      if (variables.length) await endpoints.sites.setEnv(id, { variables });
      const savedKeys = new Set(envRows.filter((row) => row.key && (row.configured || row.value)).map((row) => row.key.trim()));
      setEnvRows((old) => old.map((row) => ({ ...row, value: "", configured: row.configured || savedKeys.has(row.key.trim()) })));
      setEnvOpen(false);
    } catch (requestError) { setError(requestError.message); }
    finally { setRunning(false); }
  };
  const exportGithub = async () => {
    setExporting(true);
    try {
      const id = await ensureSite();
      if (!site.id) throw new Error("Build or save a website version before exporting.");
      const data = await endpoints.sites.exportGithub(id, { versionId: site.id, idempotencyKey: crypto.randomUUID(), confirmed: true, repositoryLayout: "split", frontendOwner: github.username || github.login, frontendRepo: deploy.frontendRepo, frontendVisibility: deploy.frontendVisibility, backendRepo: deploy.backendRepo, backendVisibility: deploy.backendVisibility, pagesRequested: true });
      setGithub((old) => ({ ...old, export: data }));
    } catch (requestError) { setError(requestError.message); }
    finally { setExporting(false); }
  };

  if (loading) return <div className="page-loading"><Skeleton lines={7} /></div>;
  if (!site) return <EmptyState title="Website unavailable" text={error || "PAN could not load this website."} />;

  return <div className="builder-page">
    <header className="builder-header"><div><p>PROJECT WEBSITE</p><input aria-label="Website name" value={site.name} onChange={(event) => setSite({ ...site, name: event.target.value })}/><span className={`status-pill ${site.status === "published" || site.status === "ready" ? "live" : "draft"}`}>{building ? "building" : site.status}</span></div><div><Button variant="ghost" onClick={() => navigate(`/projects/${projectId}`)}>Back to project</Button><Button variant="ghost" onClick={() => setEnvOpen(true)}><KeyRound/>Environment</Button><a className="button button-ghost" href={site.zipUrl ? endpoints.sites.assetUrl(site.zipUrl) : "#"} onClick={(event) => !site.zipUrl && event.preventDefault()}><Download/>ZIP</a><Button onClick={() => setDeployOpen(true)}><Rocket/>Export & deploy</Button></div></header>
    {error ? <Notice onClose={() => setError("")}>{error}</Notice> : null}
    <div className="builder-workspace">
      <aside className="builder-chat">
        <div className="builder-agent"><span><SparkIcon/></span><div><small>PAN BUILDER</small><p>Websites use React and TypeScript by default. When a backend is needed, PAN generates it in TypeScript too.</p><em>REACT + TYPESCRIPT</em></div></div>
        <div className="builder-history">
          {building ? <div className="builder-progress-card"><LoaderCircle className="spin"/><span><small>BUILD IN PROGRESS</small><p>PAN is generating, validating and saving the complete folder structure.</p></span></div> : null}
          {definedEnvironment.length ? <div className="builder-env-card">
            <header><span><KeyRound/></span><div><small>ENVIRONMENT SETUP</small><strong>{missingEnvironment.length ? `${missingEnvironment.length} value${missingEnvironment.length === 1 ? "" : "s"} required` : "All values configured"}</strong></div></header>
            <p>These exact variables must be configured before the features that use them will work.</p>
            <div className="builder-env-list">{definedEnvironment.map((row) => <div key={row.key}><code>{row.key}</code><span>{row.description || "Add the value supplied by this feature’s provider."}</span><em className={row.configured ? "configured" : "required"}>{row.configured ? "Configured" : "Value required"}</em></div>)}</div>
            <Button variant="secondary" onClick={() => setEnvOpen(true)}><KeyRound/>{missingEnvironment.length ? "Set required values" : "Review variables"}</Button>
          </div> : null}
          {site.runs?.map((runItem) => <div key={runItem.id}><small>{runItem.status}</small><p>{runItem.prompt}</p></div>)}
        </div>
        <div className="builder-compose"><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Build a responsive token landing page with live stats…" onKeyDown={(event) => { if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) run(); }}/><Button loading={running} disabled={!prompt.trim() || building} onClick={run}><Play/>Build</Button><small>Ctrl/⌘ + Enter to run</small></div>
      </aside>
      <section className="builder-canvas">
        <div className="canvas-tabs"><div><button className={view === "preview" ? "active" : ""} onClick={() => setView("preview")}><Eye/>Preview</button><button className={view === "code" ? "active" : ""} onClick={() => setView("code")}><Code2/>Code</button></div><span>{building ? <><LoaderCircle className="spin"/>Build in progress</> : site.status === "failed" ? <>Build failed</> : <><Check/>Up to date</>}</span></div>
        {view === "preview" ? <div className="site-preview"><div className="browser-bar"><i/><i/><i/><span>{site.previewUrl || (site.runtime === "railway_node" ? "pan-preview.local · backend bridge active" : "pan-preview.local")}</span><ArrowUpRight/></div><iframe ref={previewFrameRef} title="Website preview" sandbox="allow-scripts allow-forms allow-modals" srcDoc={previewHtml}/>{building ? <div className="preview-building-overlay"><LoaderCircle className="spin"/><strong>Building website</strong><small>The preview will refresh when validation finishes.</small></div> : null}</div> : <div className="code-workspace">
          <aside className="code-file-tree"><header><span>EXPLORER</span><small>{site.files.length} files</small></header><FileTree nodes={fileTree} expanded={expanded} selected={currentFile?.path} onToggle={(path) => setExpanded((old) => { const next = new Set(old); if (next.has(path)) next.delete(path); else next.add(path); return next; })} onSelect={setSelected}/></aside>
          <section><header><span><FileCode2 />{currentFile?.path}</span><div><small>{fileLanguage(currentFile?.path || "").toUpperCase()}</small><Button variant="ghost" onClick={saveFile} loading={running}><Save/>Save</Button></div></header><CodeEditor path={currentFile?.path} value={currentFile?.content || ""} onChange={updateFile} disabled={!currentFile || building}/><footer><span>Tab to indent</span><span>Shift + Tab to outdent</span><span>{currentFile?.content?.split("\n").length || 0} lines</span></footer></section>
        </div>}
      </section>
    </div>
    {envOpen ? <Modal wide title="Environment setup" subtitle="PAN encrypts saved values. Secrets are never included in GitHub exports or downloaded ZIP files." onClose={() => setEnvOpen(false)}><div className="modal-body">
      <Notice>Use Railway for demanding or always-on backends. PAN’s built-in backend is rate-limited and intended for lightweight APIs.</Notice>
      <section className="env-setup-steps"><h3>How to make the generated site work</h3><ol><li>Read <strong>What to enter</strong> for each variable, then obtain that value from the named provider.</li><li>Paste each value below and save it in PAN. A configured secret stays hidden; enter it again only when replacing it.</li><li>When deploying, open <strong>Railway → Service → Variables</strong>, add the same exact names and values, then redeploy. GitHub and ZIP exports keep placeholders only.</li></ol></section>
      <div className="env-table">
        <div><span>Name</span><span>What to enter</span><span>Value</span><span>Secret</span></div>
        {envRows.map((row, index) => <div key={`${row.key}-${index}`}>
          <input aria-label={`Environment variable ${index + 1} name`} value={row.key} onChange={(event) => setEnvRows(envRows.map((item, itemIndex) => itemIndex === index ? { ...item, key: event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "") } : item))} placeholder="API_KEY"/>
          <div className="env-description"><textarea aria-label={`${row.key || `Variable ${index + 1}`} instructions`} value={row.description} onChange={(event) => setEnvRows(envRows.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item))} placeholder="Where to get this value and its expected format"/><small className={row.configured ? "configured" : "required"}>{row.configured ? "Configured" : "Value required"}</small></div>
          <input aria-label={`${row.key || `Variable ${index + 1}`} value`} type={row.secret ? "password" : "text"} value={row.value} onChange={(event) => setEnvRows(envRows.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.target.value } : item))} placeholder={row.configured ? "Configured — enter only to replace" : "Paste required value"}/>
          <label className="env-secret"><input type="checkbox" checked={row.secret} onChange={(event) => setEnvRows(envRows.map((item, itemIndex) => itemIndex === index ? { ...item, secret: event.target.checked } : item))}/><span>Secret</span></label>
        </div>)}
      </div>
      <button className="text-button" onClick={addEnv}><Plus/>Add variable</button>
      <div className="modal-actions"><Button variant="ghost" onClick={() => setEnvOpen(false)}>Cancel</Button><Button loading={running} onClick={saveEnv}>Save variables</Button></div>
    </div></Modal> : null}
    {deployOpen ? <Modal wide title="Export and deploy" subtitle="Publish the frontend to GitHub Pages and prepare the backend for Railway." onClose={() => setDeployOpen(false)}><div className="modal-body deploy-grid"><section className="deploy-option"><span><img className="deploy-brand-icon" src={`${import.meta.env.BASE_URL}github.png`} alt="GitHub" /></span><div><h3>GitHub repositories</h3><p>Create separate frontend and backend repositories with production configuration.</p>{github?.connected ? <small className="connected"><Check/>GitHub connected as {github.username || github.login}</small> : <a className="button button-secondary" href={endpoints.sites.githubConnectUrl}>Connect GitHub</a>}</div></section><div className="two-fields"><label className="field"><span>Frontend repository</span><input value={deploy.frontendRepo} onChange={(event) => setDeploy({ ...deploy, frontendRepo: event.target.value.replace(/[^a-zA-Z0-9._-]/g, "") })}/></label><label className="field"><span>Backend repository</span><input value={deploy.backendRepo} onChange={(event) => setDeploy({ ...deploy, backendRepo: event.target.value.replace(/[^a-zA-Z0-9._-]/g, "") })}/></label></div><section className="deploy-option"><span><img className="deploy-brand-icon" src={`${import.meta.env.BASE_URL}github.png`} alt="GitHub" /></span><div><h3>GitHub Pages</h3><p>Deploy the static frontend automatically with the correct repository base path.</p><small><Check/>Included in export</small></div></section><section className="deploy-option"><span><img className="deploy-brand-icon" src={`${import.meta.env.BASE_URL}railway.png`} alt="Railway" /></span><div><h3>Railway backend</h3><p>Generate a Railway-ready TypeScript backend, environment template and deployment instructions.</p><small><Check/>Recommended for performance</small></div></section>{github?.export ? <Notice type="success">Export queued successfully. PAN will create the repositories and GitHub Pages deployment in the background.</Notice> : null}<div className="modal-actions full"><Button variant="ghost" onClick={() => setDeployOpen(false)}>Cancel</Button><Button loading={exporting} disabled={!github?.connected || !site.id || !deploy.frontendRepo || !deploy.backendRepo} onClick={exportGithub}><FolderGit2/>Create repositories</Button></div></div></Modal> : null}
  </div>;
}

function SparkIcon() { return <img src={`${import.meta.env.BASE_URL}PanLogo.png`} alt="" />; }
