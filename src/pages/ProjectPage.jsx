import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { ArrowUpRight, Check, Coins, Earth, Image as ImageIcon, LoaderCircle, MessageSquare, Paperclip, Rocket, Send, Sparkles, Upload, Wallet } from "lucide-react";
import { endpoints } from "../api";
import { Button, Modal, Notice, Skeleton, money } from "../components/UI";

const blankProject = {
  id: null, name: "Untitled coin", coinName: "", ticker: "", description: "", imageUrl: "", website: "", xAccount: "", telegram: "", performance: "medium", status: "draft", messages: [],
};

function normalizeProject(data) {
  const source = data?.project || data || {};
  const coin = source.coin || source.details || {};
  return {
    ...blankProject, ...source, ...coin,
    id: source.id || source.projectId,
    coinName: coin.name || source.coinName || (source.name === "Untitled coin" ? "" : source.name) || "",
    ticker: coin.ticker || source.ticker || "",
    imageUrl: coin.imageUrl || coin.image || source.imageUrl || source.image || "",
    xAccount: coin.xAccount || coin.x || source.xAccount || source.x || "",
    messages: source.messages || [],
  };
}

function extractReply(data) {
  return data?.message || data?.reply || data?.content || data?.output?.text || data?.run?.message || "PAN finished the request.";
}

function Field({ label, optional, children }) {
  return <label className="field"><span>{label}{optional ? <i>Optional</i> : <b>Required</b>}</span>{children}</label>;
}

export function ProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { setProjects, reload } = useOutletContext();
  const [project, setProject] = useState(blankProject);
  const [loading, setLoading] = useState(Boolean(projectId));
  const [saving, setSaving] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [launchOpen, setLaunchOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [launch, setLaunch] = useState({ devBuyEth: "0", maxFeeEth: "", walletMode: "account", privateKey: "", acknowledge: false });
  const saveTimer = useRef(null);
  const fileInput = useRef(null);
  const feedRef = useRef(null);

  useEffect(() => {
    if (!projectId) { setProject(blankProject); setLoading(false); return; }
    setLoading(true); setError("");
    endpoints.projects.get(projectId).then((data) => setProject(normalizeProject(data))).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => { feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" }); }, [project.messages, thinking]);

  const required = useMemo(() => ({ name: Boolean(project.coinName.trim()), ticker: Boolean(project.ticker.trim()), image: Boolean(project.imageUrl) }), [project]);
  const complete = Object.values(required).filter(Boolean).length;
  const launched = project.status === "launched" || Boolean(project.contractAddress || project.tokenAddress);

  const ensureProject = async () => {
    if (project.id) return project.id;
    const data = await endpoints.projects.create({ name: project.coinName || "Untitled coin", performance: project.performance });
    const created = normalizeProject(data);
    setProject((old) => ({ ...old, ...created }));
    setProjects((old) => [created, ...old.filter((item) => item.id !== created.id)]);
    navigate(`/projects/${created.id}`, { replace: true });
    return created.id;
  };

  const persist = async (changes) => {
    setProject((old) => ({ ...old, ...changes }));
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      setSaving(true);
      try {
        const id = await ensureProject();
        await endpoints.projects.update(id, changes);
      } catch (e) { setError(e.message); }
      finally { setSaving(false); }
    }, 550);
  };

  const readImage = (file) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) return setError("Use a PNG, JPG, WebP or GIF image.");
    if (file.size > 8 * 1024 * 1024) return setError("Coin images must be under 8 MB.");
    const reader = new FileReader();
    reader.onload = () => persist({ imageUrl: reader.result, imageFileName: file.name });
    reader.readAsDataURL(file);
  };

  const send = async (text = message) => {
    const clean = text.trim(); if (!clean || thinking) return;
    setError(""); setMessage("");
    const userMessage = { id: crypto.randomUUID(), role: "user", content: clean };
    setProject((old) => ({ ...old, messages: [...old.messages, userMessage] })); setThinking(true);
    try {
      const id = await ensureProject();
      const data = await endpoints.projects.message(id, { message: clean, performance: project.performance });
      const assistantMessage = { id: data?.id || crypto.randomUUID(), role: "assistant", content: extractReply(data) };
      setProject((old) => ({ ...old, ...(data?.project ? normalizeProject(data.project) : {}), messages: [...old.messages, assistantMessage] }));
      reload();
    } catch (e) { setError(e.message); }
    finally { setThinking(false); }
  };

  const generateImage = async () => {
    if (!imagePrompt.trim()) return;
    setThinking(true); setError("");
    try {
      const id = await ensureProject();
      const data = await endpoints.images.generate({ projectId: id, prompt: imagePrompt, performance: project.performance, purpose: "coin_logo" });
      const url = data?.imageUrl || data?.image?.url || data?.url;
      if (!url) throw new Error("Image generation finished without an image URL.");
      await persist({ imageUrl: url }); setImageOpen(false);
    } catch (e) { setError(e.message); }
    finally { setThinking(false); }
  };

  const launchCoin = async () => {
    setThinking(true); setError("");
    try {
      const id = await ensureProject();
      const payload = { devBuyEth: Number(launch.devBuyEth || 0), maxFeeEth: launch.maxFeeEth ? Number(launch.maxFeeEth) : null, walletMode: launch.walletMode };
      if (launch.walletMode === "private_key") payload.privateKey = launch.privateKey;
      const data = await endpoints.projects.launch(id, payload);
      setProject((old) => ({ ...old, ...normalizeProject(data?.project || data), status: data?.status || "launching" }));
      setLaunchOpen(false); reload();
    } catch (e) { setError(e.message); }
    finally { setThinking(false); }
  };

  if (loading) return <div className="page-loading"><Skeleton lines={6} /></div>;

  return (
    <div className="project-page">
      <section className="chat-column">
        <header className="project-header"><div><h1>{project.coinName || project.name || "Untitled coin"}</h1><span className={`status-pill ${launched ? "live" : "draft"}`}>{launched ? "Live" : project.status || "Draft"}</span>{saving ? <small><LoaderCircle className="spin" />Saving</small> : null}</div><label>Performance<select value={project.performance} onChange={(e) => persist({ performance: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="extra_high">Extra high</option></select></label></header>
        {error ? <Notice onClose={() => setError("")}>{error}</Notice> : null}
        <div className="chat-feed" ref={feedRef}>
          {!project.messages.length ? <><div className="pan-message"><span className="pan-avatar"><i /></span><div><small>PAN · PROJECT AGENT</small><p>Tell me what you want to create. I’ll ask whenever an important detail is unclear.</p><p>To launch a coin, I’ll need its name, ticker and image. Website and X account are optional.</p></div></div><div className="suggestion-row"><button onClick={() => send("Help me shape the idea for my coin") }><MessageSquare />Shape my idea</button><button onClick={() => setImageOpen(true)}><Sparkles />Generate a logo</button><button onClick={() => send("Build a website for this coin") }><Earth />Build its website</button></div></> : null}
          {project.messages.map((item) => item.role === "user" ? <div className="user-message" key={item.id}>{item.content || item.message}</div> : <div className="pan-message" key={item.id}><span className="pan-avatar"><i /></span><div><small>PAN · PROJECT AGENT</small><p>{item.content || item.message}</p></div></div>)}
          {thinking ? <div className="pan-message thinking"><span className="pan-avatar"><i /></span><div><small>PAN IS THINKING</small><div className="thinking-dots"><i/><i/><i/></div></div></div> : null}
        </div>
        <div className="composer"><textarea aria-label="Message PAN" placeholder="Message PAN…" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} /><div><span><button aria-label="Attach file" onClick={() => fileInput.current?.click()}><Paperclip /></button><button aria-label="Generate image" onClick={() => setImageOpen(true)}><ImageIcon /></button><input ref={fileInput} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => readImage(e.target.files?.[0])}/></span><button className="send-button" disabled={!message.trim() || thinking} onClick={() => send()} aria-label="Send"><Send /></button></div><small>PAN asks before acting whenever important details are unclear.</small></div>
      </section>
      <aside className="details-panel">
        {launched ? <CoinStats project={project} /> : <><div className="panel-title"><div><p>PROJECT OBJECT</p><h2>Coin details</h2></div><span className="completion">{complete}/3</span></div>
          <button className={`image-upload ${project.imageUrl ? "has-image" : ""}`} onClick={() => fileInput.current?.click()}>{project.imageUrl ? <img src={project.imageUrl} alt="Coin" /> : <><Upload /><strong>Upload coin image</strong><small>PNG, JPG, WebP or GIF · required</small></>}</button>
          <div className="field-stack"><Field label="Name"><input value={project.coinName} onChange={(e) => persist({ coinName: e.target.value, name: e.target.value || "Untitled coin" })} placeholder="e.g. Neon Frog" /></Field><Field label="Ticker"><input maxLength="10" value={project.ticker} onChange={(e) => persist({ ticker: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })} placeholder="e.g. NFRG" /></Field><Field label="Description" optional><textarea maxLength="256" value={project.description || ""} onChange={(e) => persist({ description: e.target.value })} placeholder="What is this coin about?" /></Field><label className="field"><span>Network</span><div className="static-field">◆ Robinhood Chain <Check /></div></label><Field label="Website" optional><input value={project.website || ""} onChange={(e) => persist({ website: e.target.value })} placeholder="https://coin.xyz" /></Field><Field label="X account" optional><input value={project.xAccount || ""} onChange={(e) => persist({ xAccount: e.target.value })} placeholder="@coin" /></Field><Field label="Telegram" optional><input value={project.telegram || ""} onChange={(e) => persist({ telegram: e.target.value })} placeholder="coincommunity" /></Field></div>
          <div className="requirements">{Object.entries(required).map(([key, value]) => <span className={value ? "done" : ""} key={key}><i />{key === "name" ? "Name" : key === "ticker" ? "Ticker" : "Image"}</span>)}</div>
          <Button className="launch-button" disabled={complete !== 3} onClick={() => setLaunchOpen(true)}><Rocket />Launch coin</Button><small className="button-caption">{complete === 3 ? "Review launch funding and wallet" : "Complete the three required details"}</small></>}
      </aside>
      {imageOpen ? <Modal title="Generate coin artwork" subtitle="OpenAI image generation uses your selected performance level." onClose={() => setImageOpen(false)}><div className="modal-body"><label className="field"><span>Describe the image</span><textarea rows="5" value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} placeholder="A neon green frog mascot, bold coin logo, dark background…" /></label><div className="modal-actions"><Button variant="ghost" onClick={() => setImageOpen(false)}>Cancel</Button><Button loading={thinking} disabled={!imagePrompt.trim()} onClick={generateImage}><Sparkles />Generate image</Button></div></div></Modal> : null}
      {launchOpen ? <Modal title={`Launch ${project.coinName}`} subtitle="Review every value before creating the on-chain transaction." onClose={() => setLaunchOpen(false)}><div className="modal-body"><div className="launch-summary"><span>{project.imageUrl ? <img src={project.imageUrl} alt="" /> : <Coins />}</span><div><strong>{project.coinName}</strong><small>${project.ticker} · Robinhood Chain</small></div></div><div className="two-fields"><Field label="Dev buy (ETH)" optional><input type="number" min="0" step="0.001" value={launch.devBuyEth} onChange={(e) => setLaunch({ ...launch, devBuyEth: e.target.value })}/></Field><Field label="Maximum fee (ETH)" optional><input type="number" min="0" step="0.001" value={launch.maxFeeEth} onChange={(e) => setLaunch({ ...launch, maxFeeEth: e.target.value })} placeholder="Use estimate" /></Field></div><label className="field"><span>Launch wallet</span><select value={launch.walletMode} onChange={(e) => setLaunch({ ...launch, walletMode: e.target.value, privateKey: "", acknowledge: false })}><option value="account">PAN account wallet</option><option value="connected">Connected external wallet</option><option value="private_key">One-time private key</option></select></label>{launch.walletMode === "private_key" ? <><Notice>Private keys are highly sensitive. PAN must never store or log this value.</Notice><Field label="Private key"><input type="password" autoComplete="off" value={launch.privateKey} onChange={(e) => setLaunch({ ...launch, privateKey: e.target.value })} placeholder="0x…" /></Field><label className="checkbox"><input type="checkbox" checked={launch.acknowledge} onChange={(e) => setLaunch({ ...launch, acknowledge: e.target.checked })}/><span/>I understand this key will be sent once for signing.</label></> : null}<div className="modal-actions"><Button variant="ghost" onClick={() => setLaunchOpen(false)}>Cancel</Button><Button loading={thinking} disabled={launch.walletMode === "private_key" && (!launch.privateKey || !launch.acknowledge)} onClick={launchCoin}><Rocket />Confirm launch</Button></div></div></Modal> : null}
    </div>
  );
}

function CoinStats({ project }) {
  const address = project.contractAddress || project.tokenAddress;
  const [claiming, setClaiming] = useState(false); const [notice, setNotice] = useState("");
  const terminal = project.terminalUrl || `${import.meta.env.VITE_GMGN_BASE_URL || "https://gmgn.ai/eth/token"}/${address}`;
  const claim = async () => { setClaiming(true); try { await endpoints.projects.claimFees(project.id); setNotice("Creator fee claim submitted."); } catch (e) { setNotice(e.message); } finally { setClaiming(false); } };
  return <><div className="panel-title"><div><p>LIVE COIN</p><h2>Coin stats</h2></div><span className="status-pill live">Live</span></div><div className="coin-identity">{project.imageUrl ? <img src={project.imageUrl} alt="" /> : <span><Coins /></span>}<div><h3>{project.coinName}</h3><p>${project.ticker}</p></div></div>{notice ? <Notice type={notice.includes("submitted") ? "success" : "error"}>{notice}</Notice> : null}<div className="stats-list"><div><span>Market cap</span><strong>{money(project.marketCapUsd)}</strong></div><div><span>24h volume</span><strong>{money(project.volume24hUsd || project.volumeUsd)}</strong></div><div><span>Creator fees</span><strong>{money(project.creatorFeesUsd)}</strong></div><div><span>Token address</span><strong className="mono">{address ? `${address.slice(0, 8)}…${address.slice(-6)}` : "Pending"}</strong></div></div><Button variant="secondary" loading={claiming} onClick={claim}><Wallet />Claim creator fees</Button><a className="button button-primary launch-button" href={terminal} target="_blank" rel="noreferrer">View coin <ArrowUpRight /></a></>;
}
