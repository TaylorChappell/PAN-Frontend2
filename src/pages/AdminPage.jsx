import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Bot, CheckCircle2, Coins, Database, FileText, HardDrive, MessageSquare, RefreshCw, Rocket, Search, Send, ShieldCheck, Users, Wallet, XCircle } from "lucide-react";
import { endpoints } from "../api";
import { Button, Modal, Notice, Skeleton, money, shortAddress } from "../components/UI";

const tabs = [
  ["overview", "Overview", Activity],
  ["users", "Users", Users],
  ["tickets", "Support", MessageSquare],
  ["projects", "Coins", Rocket],
  ["operations", "Operations", Database],
  ["audit", "Audit", FileText],
];

function formatBytes(value = 0) {
  const bytes = Number(value) || 0;
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)) - 1);
  return `${(bytes / (1024 ** (index + 1))).toFixed(index > 0 ? 2 : 1)} ${units[index]}`;
}

function date(value) {
  if (!value) return "Not available";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Not available" : parsed.toLocaleString();
}

function liveStatus(status) {
  return ["active", "live", "succeeded", "confirmed", "completed", "ready", "published", "healthy"].includes(String(status || "").toLowerCase());
}

export function AdminPage() {
  const [tab, setTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [operations, setOperations] = useState({});
  const [logs, setLogs] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [grantUser, setGrantUser] = useState(null);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  const load = useCallback(async ({ quiet = false } = {}) => {
    quiet ? setRefreshing(true) : setLoading(true);
    setError("");
    const results = await Promise.allSettled([
      endpoints.admin.overview(), endpoints.admin.users(query), endpoints.admin.tickets(),
      endpoints.admin.projects(), endpoints.admin.operations(), endpoints.admin.audit(),
    ]);
    const failures = results.filter((result) => result.status === "rejected");
    if (results[0].status === "fulfilled") setOverview(results[0].value);
    if (results[1].status === "fulfilled") setUsers(results[1].value?.users || []);
    if (results[2].status === "fulfilled") {
      const next = results[2].value?.tickets || [];
      setTickets(next);
      setSelectedTicketId((current) => current && next.some((ticket) => ticket.id === current) ? current : next[0]?.id || null);
    }
    if (results[3].status === "fulfilled") setProjects(results[3].value?.projects || []);
    if (results[4].status === "fulfilled") setOperations(results[4].value || {});
    if (results[5].status === "fulfilled") setLogs(results[5].value?.logs || []);
    if (failures.length) setError(failures[0].reason?.message || "Some administration data could not be loaded.");
    setLoading(false); setRefreshing(false);
  }, [query]);

  useEffect(() => { load(); }, [load]);

  const metrics = overview?.metrics || {};
  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) || null;

  if (loading) return <div className="page-loading"><Skeleton lines={8}/></div>;

  return <div className="standard-page admin-page">
    <header className="page-title"><div><p>ADMINISTRATION</p><h1>PAN.AI operations</h1><span>Manage users, balances, support, coins, storage, AI usage and operational recovery.</span></div><Button variant="secondary" loading={refreshing} onClick={() => load({ quiet: true })}><RefreshCw/>Refresh</Button></header>
    {error ? <Notice onClose={() => setError("")}>{error}</Notice> : null}
    <nav className="admin-tabs">{tabs.map(([id, label, Icon]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}><Icon/>{label}</button>)}</nav>
    {tab === "overview" ? <OverviewPanel metrics={metrics} configuration={overview?.configuration || {}} requirements={overview?.requirements || {}} /> : null}
    {tab === "users" ? <UsersPanel users={users} query={query} setQuery={setQuery} search={() => load({ quiet: true })} grant={setGrantUser} /> : null}
    {tab === "tickets" ? <TicketsPanel tickets={tickets} selected={selectedTicket} select={setSelectedTicketId} reload={() => load({ quiet: true })} /> : null}
    {tab === "projects" ? <ProjectsPanel projects={projects} /> : null}
    {tab === "operations" ? <OperationsPanel data={operations} reload={() => load({ quiet: true })} /> : null}
    {tab === "audit" ? <AuditPanel logs={logs} /> : null}
    {grantUser ? <GrantModal user={grantUser} onClose={() => setGrantUser(null)} onDone={() => { setGrantUser(null); load({ quiet: true }); }} /> : null}
  </div>;
}

function OverviewPanel({ metrics, configuration, requirements }) {
  const cards = [
    ["Total users", Number(metrics.users || 0).toLocaleString(), Users],
    ["Credits outstanding", Number(metrics.creditsOutstanding || 0).toLocaleString(), Coins],
    ["Credits used", Number(metrics.creditsUsed || metrics.aiCreditsCharged || 0).toLocaleString(), Bot],
    ["Open tickets", Number(metrics.openSupport || 0).toLocaleString(), MessageSquare],
    ["Projects", Number(metrics.projects || 0).toLocaleString(), Rocket],
    ["Live coins", Number(metrics.liveCoins || 0).toLocaleString(), Wallet],
    ["Storage used", formatBytes(metrics.storageUsedBytes), HardDrive],
    ["AI provider cost", money(Number(metrics.aiCostUsdMicros || 0) / 1_000_000), Activity],
  ];
  const configured = Object.entries(configuration);
  return <>
    <section className="metric-grid admin-metrics admin-metrics-wide">{cards.map(([label, value, Icon]) => <article className="metric-card" key={label}><span><Icon/></span><p>{label}</p><strong>{value}</strong></article>)}</section>
    <section className="admin-overview-grid">
      <article><div className="section-heading"><div><h2>Operational health</h2><p>Queue pressure and recoverable failures.</p></div><ShieldCheck/></div><dl><div><dt>Pending jobs</dt><dd>{Number(metrics.pendingJobs || 0).toLocaleString()}</dd></div><div><dt>Failed or dead jobs</dt><dd className={metrics.failedJobs ? "red" : "green"}>{Number(metrics.failedJobs || 0).toLocaleString()}</dd></div><div><dt>Storage capacity</dt><dd>{formatBytes(metrics.storageQuotaBytes)}</dd></div></dl></article>
      <article><div className="section-heading"><div><h2>Production configuration</h2><p>Sensitive values are never exposed here.</p></div><Database/></div><div className="configuration-grid">{configured.length ? configured.map(([key, value]) => { const requirement = requirements[key]; return <div key={key} title={requirement?.missing?.length ? `Missing: ${requirement.missing.join(", ")}` : "Configured"}><span>{key.replace(/([A-Z])/g, " $1")}{requirement?.missing?.length ? <small>Missing: {requirement.missing.join(", ")}</small> : null}</span>{value && requirement?.ready !== false ? <CheckCircle2 className="green"/> : <XCircle className="red"/>}</div>; }) : <p className="table-empty">Configuration status is unavailable.</p>}</div></article>
    </section>
  </>;
}

function UsersPanel({ users, query, setQuery, search, grant }) {
  return <section className="admin-table-card"><header><div><h2>Users and account usage</h2><p>Review credit balances, lifetime AI usage, storage and managed wallets.</p></div><form onSubmit={(event) => { event.preventDefault(); search(); }} className="search-box"><Search/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search email or username"/><button type="submit">Search</button></form></header><div className="data-table admin-scroll-table"><div className="table-head admin-users-head"><span>User</span><span>Credits</span><span>Used</span><span>Storage</span><span>Operations wallet</span><span>Verified</span><span></span></div>{users.length ? users.map((user) => {
    const wallet = user.wallets?.find((item) => item.role === "operations");
    const storagePercent = Math.min(100, (Number(user.storageUsedBytes || 0) / Number(user.storageQuotaBytes || 1)) * 100);
    return <div className="table-row admin-users-row" key={user.id}><span><i className="user-dot">{(user.username || user.email || "U")[0].toUpperCase()}</i><b>{user.username || user.name || "Unnamed"}<small>{user.email}</small></b></span><span><strong>{Number(user.creditBalance || 0).toLocaleString()}</strong></span><span>{Number(user.creditsUsed || user.aiCreditsCharged || 0).toLocaleString()}<small>{money(Number(user.aiCostUsdMicros || 0) / 1_000_000)}</small></span><span><b>{formatBytes(user.storageUsedBytes)}</b><small>of {formatBytes(user.storageQuotaBytes)}</small><i className="mini-meter"><i style={{ width: `${storagePercent}%` }}/></i></span><span className="mono">{shortAddress(wallet?.address)}</span><span><em className={`status-pill ${user.emailVerified ? "live" : "draft"}`}>{user.emailVerified ? "Verified" : "Pending"}</em></span><span><Button variant="ghost" onClick={() => grant(user)}><Coins/>Give credits</Button></span></div>;
  }) : <div className="table-empty">No users matched this search.</div>}</div></section>;
}

function TicketsPanel({ tickets, selected, select, reload }) {
  const [reply, setReply] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const submit = async () => { if (!selected || !reply.trim()) return; setWorking(true); setError(""); try { await endpoints.admin.replyTicket(selected.id, reply.trim()); setReply(""); await reload(); } catch (requestError) { setError(requestError.message); } finally { setWorking(false); } };
  const close = async () => { if (!selected || !window.confirm("Close this support ticket?")) return; setWorking(true); setError(""); try { await endpoints.admin.closeTicket(selected.id); await reload(); } catch (requestError) { setError(requestError.message); } finally { setWorking(false); } };
  return <section className="ticket-layout admin-ticket-layout"><aside className="ticket-list"><header><h2>Support tickets</h2><span>{tickets.filter((ticket) => ticket.status !== "closed").length} open</span></header>{tickets.map((ticket) => <button key={ticket.id} className={selected?.id === ticket.id ? "active" : ""} onClick={() => select(ticket.id)}><span className={`ticket-icon ${ticket.status === "closed" ? "closed" : ""}`}><MessageSquare/></span><div><strong>{ticket.subject}</strong><p>{ticket.ownerEmail}</p><small>{date(ticket.updatedAt)}</small></div><em>{ticket.status?.replaceAll("_", " ")}</em></button>)}</aside><div className="ticket-thread">{selected ? <><header><div><h2>{selected.subject}</h2><em className={`status-pill ${selected.status === "closed" ? "draft" : "live"}`}>{selected.status?.replaceAll("_", " ")}</em><small>{selected.ownerEmail} · opened {date(selected.createdAt)}</small></div>{selected.status !== "closed" ? <Button variant="ghost" onClick={close} loading={working}>Close ticket</Button> : null}</header>{error ? <Notice>{error}</Notice> : null}<div className="thread-feed">{selected.messages?.length ? selected.messages.map((message) => <article key={message.id} className={message.senderRole === "admin" ? "admin-message" : "customer-message"}><small>{message.senderRole === "admin" ? "PAN.AI ADMIN" : "USER"}</small><p>{message.body}</p><time>{date(message.createdAt)}</time></article>) : <p className="thread-empty">No messages in this ticket.</p>}</div>{selected.status === "closed" ? <div className="closed-thread"><CheckCircle2/>This ticket is closed</div> : <div className="thread-compose"><textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Reply to this user"/><Button loading={working} disabled={!reply.trim()} onClick={submit}><Send/>Reply</Button></div>}</> : <div className="empty-state"><MessageSquare/><h3>Select a support ticket</h3><p>Choose a ticket to read its full history and reply.</p></div>}</div></section>;
}

function ProjectsPanel({ projects }) {
  return <section className="admin-table-card"><header><div><h2>Projects and launched coins</h2><p>Review ownership, launch status and contract addresses.</p></div></header><div className="data-table admin-scroll-table"><div className="table-head admin-project-head"><span>Project</span><span>Owner</span><span>Status</span><span>Contract</span><span>Updated</span></div>{projects.length ? projects.map((project) => <div className="table-row admin-project-row" key={project.id}><span><b>{project.name}<small>{project.ticker ? `$${project.ticker}` : "No ticker"}</small></b></span><span>{project.ownerEmail || project.ownerId}</span><span><em className={`status-pill ${liveStatus(project.status) ? "live" : "draft"}`}>{project.status}</em></span><span className="mono">{shortAddress(project.contractAddress)}</span><span>{date(project.updatedAt)}</span></div>) : <div className="table-empty">No projects have been created.</div>}</div></section>;
}

function OperationsPanel({ data, reload }) {
  const groups = useMemo(() => ({
    events: data.events || [], jobs: data.jobs || [], ai: data.runs || [], purchases: data.intents || [], conversions: data.conversions || [], deployments: data.deployments || [],
  }), [data]);
  const [group, setGroup] = useState("events");
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");
  const runAction = async (action, id) => { setWorkingId(id); setError(""); try { await endpoints.admin.operationAction(action, id); await reload(); } catch (requestError) { setError(requestError.message); } finally { setWorkingId(""); } };
  return <section className="admin-table-card"><header><div><h2>Operational controls</h2><p>Inspect and recover jobs, conversions, AI executions and deployments.</p></div><select className="admin-filter" value={group} onChange={(event) => setGroup(event.target.value)}>{Object.entries(groups).map(([key, items]) => <option key={key} value={key}>{key[0].toUpperCase() + key.slice(1)} ({items.length})</option>)}</select></header>{error ? <Notice>{error}</Notice> : null}<div className="operation-list">{groups[group].length ? groups[group].map((item) => <OperationRow key={item.id} item={item} group={group} working={workingId === item.id} action={runAction}/>) : <div className="table-empty">No {group} records.</div>}</div></section>;
}

function OperationRow({ item, group, working, action }) {
  const status = item.status || item.severity || (item.acknowledgedAt ? "acknowledged" : "open");
  const title = item.type || item.kind || item.eventType || item.provider || `${group.slice(0, -1)} record`;
  const detail = item.lastError || item.errorMessage || item.message || item.ownerEmail || item.frontendRepo || item.model || item.requestedAmountDisplay || item.id;
  let control = null;
  if (group === "events" && !item.acknowledgedAt) control = ["acknowledge_event", "Acknowledge"];
  if (group === "jobs" && ["failed", "dead"].includes(item.status)) control = ["retry_job", "Retry"];
  if (group === "jobs" && ["queued", "leased"].includes(item.status)) control = ["cancel_job", "Cancel"];
  if (group === "ai" && ["queued", "running"].includes(item.status)) control = ["cancel_ai_run", "Cancel"];
  if (group === "purchases" && ["awaiting_payment", "detected", "converting"].includes(item.status)) control = ["cancel_purchase_intent", "Cancel"];
  if (group === "conversions" && ["failed", "requires_review"].includes(item.status)) control = ["retry_conversion", "Retry"];
  return <article><span className={`operation-icon ${status}`}>{["failed", "dead", "critical", "error"].includes(status) ? <AlertTriangle/> : <Activity/>}</span><div><strong>{String(title).replaceAll("_", " ")}</strong><p>{detail}</p><small>{date(item.updatedAt || item.lastSeenAt || item.createdAt)}{item.chargedCredits ? ` · ${Number(item.chargedCredits).toLocaleString()} credits` : ""}</small></div><em className={`status-pill ${liveStatus(status) ? "live" : "draft"}`}>{String(status).replaceAll("_", " ")}</em>{control ? <Button variant="ghost" loading={working} onClick={() => action(control[0], item.id)}>{control[1]}</Button> : <span/>}</article>;
}

function AuditPanel({ logs }) {
  return <section className="admin-table-card"><header><div><h2>Audit history</h2><p>Administrator and security-sensitive application actions.</p></div></header><div className="data-table admin-scroll-table"><div className="table-head admin-audit-head"><span>Action</span><span>Actor</span><span>Target</span><span>Entity</span><span>Date</span></div>{logs.length ? logs.map((log) => <div className="table-row admin-audit-row" key={log.id}><span><b>{log.action}</b></span><span className="mono">{shortAddress(log.actorUserId)}</span><span className="mono">{shortAddress(log.targetUserId)}</span><span>{log.entityType || "application"}</span><span>{date(log.createdAt)}</span></div>) : <div className="table-empty">No audit records.</div>}</div></section>;
}

function GrantModal({ user, onClose, onDone }) {
  const [amount, setAmount] = useState(""); const [reason, setReason] = useState(""); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const submit = async () => { setLoading(true); setError(""); try { await endpoints.admin.grant(user.id, Number(amount), reason.trim()); onDone(); } catch (requestError) { setError(requestError.message); } finally { setLoading(false); } };
  return <Modal title="Give user credits" subtitle={`${user.username || user.email} currently has ${Number(user.creditBalance || 0).toLocaleString()} credits.`} onClose={onClose}><div className="modal-body">{error ? <Notice>{error}</Notice> : null}<label className="field"><span>Credits to add</span><input type="number" min="1" max="10000000" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="1000"/></label><label className="field"><span>Internal reason</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why are these credits being granted?"/></label><div className="modal-actions"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={loading} disabled={!Number.isSafeInteger(Number(amount)) || Number(amount) <= 0 || reason.trim().length < 4} onClick={submit}>Give credits</Button></div></div></Modal>;
}
