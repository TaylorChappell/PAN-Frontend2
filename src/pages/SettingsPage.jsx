import { useEffect, useState } from "react";
import { Bot, Check, GitBranch, Link as LinkIcon, LogOut, MonitorUp, User, Wallet, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { endpoints } from "../api";
import { useAuth } from "../auth";
import { Button, Notice, shortAddress } from "../components/UI";

const modes = [
  { id: "low", name: "Low", text: "Quick details, summaries and simple edits", model: "Claude Haiku" },
  { id: "medium", name: "Medium", text: "Everyday project work and normal website changes", model: "Claude Sonnet" },
  { id: "high", name: "High", text: "Complex builds, debugging and longer tool runs", model: "Claude Sonnet, high effort" },
  { id: "extra_high", name: "Extra high", text: "Hard architecture and failure recovery", model: "Claude Opus" },
];

export function SettingsPage() {
  const { user, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState(user || null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ username: user?.username || user?.name || "", defaultPerformance: user?.defaultPerformance || "medium", terminal: user?.terminal || "gmgn", askWhenUncertain: user?.askWhenUncertain !== false });
  const [github, setGithub] = useState(null);

  useEffect(() => {
    let active = true;
    endpoints.account.summary().then((result) => {
      if (!active) return;
      const value = result?.account || result;
      setAccount(value);
      setForm({ username: value.username || user?.username || user?.name || "", defaultPerformance: value.defaultPerformance || "medium", terminal: value.terminal || "gmgn", askWhenUncertain: value.askWhenUncertain !== false });
    }).catch((requestError) => active && setError(requestError.message)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [user?.id, user?.name, user?.username]);

  useEffect(() => {
    let active = true;
    const loadGithub = () => endpoints.sites.githubStatus().then((value) => active && setGithub(value)).catch(() => active && setGithub({ connected: false }));
    const idleId = window.requestIdleCallback ? window.requestIdleCallback(loadGithub, { timeout: 1200 }) : window.setTimeout(loadGithub, 50);
    return () => { active = false; window.requestIdleCallback ? window.cancelIdleCallback(idleId) : window.clearTimeout(idleId); };
  }, []);

  const save = async () => {
    setSaving(true); setError(""); setSuccess("");
    try { await endpoints.account.update(form); await refresh(); setSuccess("Settings saved."); }
    catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };

  const connectWallet = async () => {
    setError("");
    if (!window.ethereum) return setError("Install an Ethereum-compatible wallet extension to continue.");
    try {
      const [address] = await window.ethereum.request({ method: "eth_requestAccounts" });
      const challenge = await endpoints.wallets.connectChallenge({ address, chain: "ethereum" });
      const message = challenge.message || challenge.challenge;
      const signature = await window.ethereum.request({ method: "personal_sign", params: [message, address] });
      await endpoints.wallets.connectVerify({ address, signature, challengeId: challenge.id || challenge.challengeId });
      setAccount((old) => ({ ...old, connectedWalletAddress: address }));
      setSuccess("External wallet connected.");
    } catch (requestError) { setError(requestError.message || "Wallet connection was cancelled."); }
  };

  const signOut = async () => { await logout(); navigate("/login", { replace: true }); };

  return <div className="standard-page settings-page"><header className="page-title"><div><p>ACCOUNT</p><h1>Settings</h1><span>{loading ? "Loading account details..." : "Control your identity, AI defaults, and connected services."}</span></div><Button loading={saving} onClick={save}>Save changes</Button></header>{error ? <Notice onClose={() => setError("")}>{error}</Notice> : null}{success ? <Notice type="success" onClose={() => setSuccess("")}>{success}</Notice> : null}
    <div className="settings-layout"><div className="settings-content">
      <section className="settings-card"><div className="settings-heading"><span><User/></span><div><h2>Profile</h2><p>Your public account identity.</p></div></div><div className="profile-editor"><span className="profile-avatar">{(form.username || user?.email || "P").slice(0,1).toUpperCase()}</span><label className="field"><span>Username</span><input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })}/><small>Email: {user?.email || account?.email}</small></label></div></section>
      <section className="settings-card"><div className="settings-heading"><span><Bot/></span><div><h2>AI performance</h2><p>Choose the default balance between capability and credit usage.</p></div></div><div className="mode-list">{modes.map((mode) => <button key={mode.id} className={form.defaultPerformance === mode.id ? "active" : ""} onClick={() => setForm({ ...form, defaultPerformance: mode.id })}><span><Zap/></span><div><strong>{mode.name}</strong><p>{mode.text}</p><small>{mode.model}</small></div><i>{form.defaultPerformance === mode.id ? <Check/> : null}</i></button>)}</div><label className="toggle-row"><div><strong>Ask when uncertain</strong><small>PAN pauses for missing or ambiguous details instead of assuming.</small></div><input type="checkbox" checked={form.askWhenUncertain} onChange={(event) => setForm({ ...form, askWhenUncertain: event.target.checked })}/><span/></label></section>
      <section className="settings-card"><div className="settings-heading"><span><Wallet/></span><div><h2>External wallet</h2><p>Use wallet confirmations to sign launches and on-chain operations.</p></div></div><div className="connection-row"><div><span className="connection-icon"><Wallet/></span><div><strong>{account?.connectedWalletAddress ? shortAddress(account.connectedWalletAddress) : "No wallet connected"}</strong><small>{account?.connectedWalletAddress ? "Ethereum wallet ready for confirmations" : "Connect MetaMask, Phantom EVM, or another compatible wallet"}</small></div></div><Button variant="secondary" onClick={connectWallet}>{account?.connectedWalletAddress ? "Reconnect" : "Connect wallet"}</Button></div></section>
      <section className="settings-card"><div className="settings-heading"><span><LinkIcon/></span><div><h2>Connected services</h2><p>Services used for exports and deployment.</p></div></div><div className="connection-row"><div><span className="connection-icon"><GitBranch/></span><div><strong>GitHub</strong><small>{github === null ? "Checking connection..." : github.connected ? `Connected as ${github.username || github.login || "GitHub user"}` : "Not connected"}</small></div></div>{github?.connected ? <span className="connected"><Check/>Connected</span> : <a className="button button-secondary" href={endpoints.sites.githubConnectUrl}>Connect</a>}</div></section>
      <section className="settings-card"><div className="settings-heading"><span><MonitorUp/></span><div><h2>Coin terminal</h2><p>Choose where View coin opens after launch.</p></div></div><label className="field"><span>Default terminal</span><select value={form.terminal} onChange={(event) => setForm({ ...form, terminal: event.target.value })}><option value="gmgn">GMGN</option><option value="dexscreener">DexScreener</option><option value="defined">Defined</option></select></label></section>
      <section className="settings-card danger-zone"><div className="settings-heading"><span><LogOut/></span><div><h2>Session</h2><p>Sign out of PAN on this device.</p></div></div><Button variant="secondary" onClick={signOut}><LogOut/>Log out</Button></section>
    </div></div>
  </div>;
}
