import { useEffect, useState } from "react";
import { Bot, Check, GitBranch, LogOut, Trash2, User, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { endpoints } from "../api";
import { useAuth } from "../auth";
import { Button, Modal, Notice, shortAddress } from "../components/UI";

export function SettingsPage() {
  const { user, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState(user || null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    username: user?.username || user?.name || "",
    terminal: user?.terminal || "gmgn",
    askWhenUncertain: user?.askWhenUncertain !== false,
  });
  const [github, setGithub] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    endpoints.account.summary().then((result) => {
      if (!active) return;
      const value = result?.user || result?.account || result;
      setAccount({ ...value, connectedWalletAddress: result?.externalWallet?.address || value.connectedWalletAddress, chainId: result?.chainId || value.chainId });
      setForm({
        username: value.username || user?.username || user?.name || "",
        terminal: result?.settings?.preferredTerminal || value.terminal || "gmgn",
        askWhenUncertain: result?.settings?.confirmEveryTransaction !== false && value.askWhenUncertain !== false,
      });
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
    try {
      await endpoints.account.update({ username: form.username, terminal: form.terminal, askWhenUncertain: form.askWhenUncertain });
      await refresh();
      setSuccess("Settings saved.");
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };

  const connectWallet = async () => {
    setError("");
    if (!window.ethereum) return setError("Install an Ethereum-compatible wallet extension to continue.");
    try {
      const [address] = await window.ethereum.request({ method: "eth_requestAccounts" });
      const challenge = await endpoints.wallets.connectChallenge({ address, chainId: Number(account?.chainId || 4663) });
      const message = challenge.message || challenge.challenge;
      const signature = await window.ethereum.request({ method: "personal_sign", params: [message, address] });
      await endpoints.wallets.connectVerify({ address, signature, challengeId: challenge.id || challenge.challengeId });
      setAccount((old) => ({ ...old, connectedWalletAddress: address }));
      setSuccess("External wallet connected.");
    } catch (requestError) { setError(requestError.message || "Wallet connection was cancelled."); }
  };

  const signOut = async () => { await logout(); navigate("/login", { replace: true }); };

  const clearDeletedAccountLocalState = () => {
    try {
      localStorage.removeItem(`pan_free_credits_banner_seen:${user?.id || user?.email || "account"}`);
      localStorage.removeItem("pan_pending_email");
      localStorage.removeItem("pan_reset_email");
      sessionStorage.removeItem("pan_credit_banner_closed");
      sessionStorage.removeItem("pan_terms_accept_intent");
    } catch { /* Account deletion still succeeds if local storage is unavailable. */ }
  };

  const closeDelete = () => {
    if (deleting) return;
    setDeleteOpen(false);
    setDeleteConfirmation("");
    setDeleteError("");
  };

  const deleteAccount = async (event) => {
    event.preventDefault();
    if (deleteConfirmation !== "DELETE" || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await endpoints.account.remove(deleteConfirmation);
      clearDeletedAccountLocalState();
      await logout();
      navigate("/login", { replace: true });
    } catch (requestError) {
      setDeleteError(requestError.message || "Account deletion failed.");
      setDeleting(false);
    }
  };

  return <div className="standard-page settings-page"><header className="page-title"><div><p>ACCOUNT</p><h1>Settings</h1><span>{loading ? "Loading account details..." : "Control your profile, AI behaviour, and connected services."}</span></div><Button loading={saving} onClick={save}>Save changes</Button></header>{error ? <Notice onClose={() => setError("")}>{error}</Notice> : null}{success ? <Notice type="success" onClose={() => setSuccess("")}>{success}</Notice> : null}
    <div className="settings-layout"><div className="settings-content">
      <section className="settings-card"><div className="settings-heading"><span><User/></span><div><h2>Profile</h2><p>Your public account identity and preferred coin terminal.</p></div></div><div className="profile-settings"><div className="profile-editor"><span className="profile-avatar">{(form.username || user?.email || "P").slice(0,1).toUpperCase()}</span><label className="field"><span>Username</span><input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })}/><small>Email: {user?.email || account?.email}</small></label></div><label className="field terminal-field"><span>Default coin terminal</span><select value={form.terminal} onChange={(event) => setForm({ ...form, terminal: event.target.value })}><option value="gmgn">GMGN</option><option value="dexscreener">DexScreener</option><option value="geckoterminal">GeckoTerminal</option></select><small>View coin opens here after launch.</small></label></div></section>
      <section className="settings-card"><div className="settings-heading"><span><Bot/></span><div><h2>AI controls</h2><p>Control how PAN handles incomplete instructions.</p></div></div><label className="toggle-row toggle-row-clean"><div><strong>Ask when uncertain</strong><small>PAN asks before acting when an important project detail is missing or ambiguous.</small></div><input type="checkbox" checked={form.askWhenUncertain} onChange={(event) => setForm({ ...form, askWhenUncertain: event.target.checked })}/><span/></label></section>
      <section className="settings-card"><div className="settings-heading"><span><GitBranch/></span><div><h2>Connected services</h2><p>Wallets and services used for launches, exports, and deployment.</p></div></div><div className="connection-list"><div className="connection-row"><div><span className="connection-icon"><Wallet/></span><div><strong>{account?.connectedWalletAddress ? shortAddress(account.connectedWalletAddress) : "Connected wallet"}</strong><small>{account?.connectedWalletAddress ? "Ethereum wallet ready for launch confirmations" : "Connect MetaMask, Phantom EVM, or another compatible wallet"}</small></div></div><Button variant="secondary" onClick={connectWallet}>{account?.connectedWalletAddress ? "Reconnect" : "Connect wallet"}</Button></div><div className="connection-row"><div><span className="connection-icon"><img src={`${import.meta.env.BASE_URL}github.png`} alt="" /></span><div><strong>GitHub</strong><small>{github === null ? "Checking connection..." : github.connected ? `Connected as ${github.username || github.login || "GitHub user"}` : "Not connected"}</small></div></div>{github?.connected ? <span className="connected"><Check/>Connected</span> : <a className="button button-secondary" href={endpoints.sites.githubConnectUrl}>Connect</a>}</div></div></section>
      <Button className="settings-logout button-danger" onClick={signOut}><LogOut/>Log out</Button>
      <section className="settings-card danger-zone account-danger-zone"><div className="settings-heading"><span><Trash2/></span><div><h2>Danger zone</h2><p>Permanently remove this PAN account and all data owned by it.</p></div></div><div className="account-danger-row"><div><strong>Delete account</strong><p>Deletes your projects, chats, generated websites, stored files, settings, connections, wallet records, credit history, and remaining credits. This cannot be undone.</p></div><Button className="delete-account-button" variant="danger" onClick={() => setDeleteOpen(true)}>Delete account</Button></div></section>
    </div></div>
    {deleteOpen ? <Modal title="Delete account" subtitle="This permanently deletes your PAN account and cannot be reversed." onClose={closeDelete}><form className="modal-body delete-account-modal" onSubmit={deleteAccount}><div className="delete-account-warning"><Trash2/><div><strong>Everything owned by this account will be removed.</strong><p>Any remaining credits are forfeited. Withdraw managed-wallet ETH first, because deleting its encrypted key makes remaining funds unrecoverable. Public blockchain records and repositories already exported to GitHub are outside PAN and remain.</p></div></div>{deleteError ? <Notice>{deleteError}</Notice> : null}<label className="field"><span>Type DELETE to confirm</span><input autoFocus autoComplete="off" spellCheck={false} value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} placeholder="DELETE" disabled={deleting}/></label><div className="modal-actions"><Button type="button" variant="secondary" onClick={closeDelete} disabled={deleting}>Cancel</Button><Button type="submit" variant="danger" loading={deleting} disabled={deleteConfirmation !== "DELETE"}>Permanently delete account</Button></div></form></Modal> : null}
  </div>;
}
