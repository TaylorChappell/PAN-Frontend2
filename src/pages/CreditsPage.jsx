import { useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpRight, Clipboard, Coins, Copy, Flame, History, RefreshCw, ShieldCheck, Wallet } from "lucide-react";
import { endpoints } from "../api";
import { Button, Modal, Notice, Skeleton, money } from "../components/UI";

export function CreditsPage() {
  const [data, setData] = useState(null); const [wallets, setWallets] = useState([]); const [history, setHistory] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const [buyOpen, setBuyOpen] = useState(false); const [fundOpen, setFundOpen] = useState(false); const [withdrawOpen, setWithdrawOpen] = useState(false); const [method, setMethod] = useState("pan"); const [provisioning, setProvisioning] = useState(false);
  const operational = wallets.find((item) => item.role === "operations" || ["operational", "spending", "launch"].includes(item.type)) || data?.operationalWallet || {};
  const payment = wallets.find((item) => item.role === "credit_intake" || ["payment", "credits", "conversion"].includes(item.type)) || data?.paymentWallet || {};

  const load = async (quiet = false) => {
    if (!quiet) setLoading(true);
    const results = await Promise.allSettled([endpoints.credits.summary(), endpoints.wallets.list(), endpoints.credits.history()]);
    if (results[0].status === "fulfilled") setData(results[0].value);
    else setError(results[0].reason.message);
    if (results[1].status === "fulfilled") setWallets(results[1].value?.wallets || results[1].value?.items || (Array.isArray(results[1].value) ? results[1].value : []));
    if (results[2].status === "fulfilled") setHistory(results[2].value?.transactions || results[2].value?.items || (Array.isArray(results[2].value) ? results[2].value : []));
    if (!quiet) setLoading(false);
  };
  useEffect(() => {
    load();
    const interval = window.setInterval(() => load(true), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const provisionWallets = async () => {
    setProvisioning(true); setError("");
    try {
      const result = await endpoints.wallets.provision();
      setWallets(result?.wallets || result?.items || (Array.isArray(result) ? result : []));
      await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setProvisioning(false); }
  };

  const credits = Number(data?.creditBalance ?? data?.credits ?? data?.balance ?? 0);
  const panPrice = Number(data?.panUsdPrice ?? data?.price?.panUsd ?? 0);
  const copy = async (text) => navigator.clipboard.writeText(text || "");

  if (loading) return <div className="page-loading"><Skeleton lines={7}/></div>;

  return <div className="standard-page credits-page"><header className="page-title"><div><p>ACCOUNT FUNDS</p><h1>Credits & wallet</h1><span>Buy AI credits and manage withdrawable launch ETH.</span></div><Button onClick={() => setBuyOpen(true)}><Coins/>Buy credits</Button></header>{error ? <Notice onClose={() => setError("")}>{error}</Notice> : null}
    <section className="metric-grid"><article className="metric-card featured"><span><Coins/></span><p>PAN credits</p><strong>{credits.toLocaleString()}</strong><small>1 burned PAN token = 1 non-withdrawable credit</small></article><article className="metric-card"><span><Wallet/></span><p>Withdrawable ETH</p><strong>{Number(operational.ethBalance || operational.balance || data?.ethBalance || 0).toFixed(5)} ETH</strong><small>{money((operational.ethBalance || data?.ethBalance || 0) * (data?.ethUsdPrice || 0))} estimated value</small></article><article className="metric-card"><span><RefreshCw/></span><p>PAN market price</p><strong>{money(panPrice, 6)}</strong><small>Backend price snapshot · refreshed every 30 seconds</small></article></section>
    <section className="wallet-section"><div className="section-heading"><div><h2>Fund your PAN account</h2><p>Wallet addresses stay hidden until you choose an action.</p></div>{!payment.address || !operational.address ? <Button loading={provisioning} onClick={provisionWallets}><Wallet/>Create account wallets</Button> : null}</div>{!payment.address || !operational.address ? <Notice>Your encrypted account wallets have not been provisioned yet. Create them once to enable automatic credit payments and launch funding.</Notice> : null}<div className="funding-actions"><article><span className="wallet-icon"><Flame/></span><div><small>AUTOMATIC CREDIT PAYMENTS</small><h3>Buy with PAN or ETH</h3><p>Send any supported payment to your private credit wallet. PAN detects it automatically, burns PAN, and adds confirmed credits.</p></div><Button disabled={!payment.address} onClick={() => setBuyOpen(true)}>Buy credits</Button></article><article><span className="wallet-icon"><Wallet/></span><div><small>WITHDRAWABLE LAUNCH FUNDS</small><h3>Manage operational ETH</h3><p>Top up launch fees and gas separately. ETH that is not reserved by an active operation remains withdrawable.</p></div><Button variant="secondary" disabled={!operational.address} onClick={() => setFundOpen(true)}>Manage ETH</Button></article></div></section>
    <section className="history-section"><div className="section-heading"><div><h2>Credit activity</h2><p>Confirmed purchases, usage, refunds and administrator adjustments.</p></div><History/></div><div className="data-table"><div className="table-head"><span>Activity</span><span>Status</span><span>Credits</span><span>Date</span></div>{history.length ? history.map((item) => <div className="table-row" key={item.id}><span><i className={Number(item.amount || item.credits) >= 0 ? "positive" : "negative"}>{Number(item.amount || item.credits) >= 0 ? <ArrowDownToLine/> : <ArrowUpRight/>}</i><b>{item.description || item.entryType || item.type || "Credit activity"}</b></span><span><em className={`status-pill ${item.status === "confirmed" || item.status === "completed" ? "live" : "draft"}`}>{item.status || "completed"}</em></span><span className={Number(item.amount || item.credits) >= 0 ? "green" : ""}>{Number(item.amount || item.credits) >= 0 ? "+" : ""}{Number(item.amount || item.credits || 0).toLocaleString()}</span><span>{item.createdAt || item.date ? new Date(item.createdAt || item.date).toLocaleDateString() : "Not available"}</span></div>) : <div className="table-empty">No credit activity yet.</div>}</div></section>
    {buyOpen ? <Modal title="Buy PAN credits" subtitle="No purchase intent is required. Send any supported amount and PAN will detect it automatically." onClose={() => setBuyOpen(false)}><div className="modal-body"><div className="payment-methods"><button className={method === "pan" ? "active" : ""} onClick={() => setMethod("pan")}><Flame/><strong>Pay with PAN</strong><small>1 whole PAN = 1 credit, permanently burned</small></button><button className={method === "eth" ? "active" : ""} onClick={() => setMethod("eth")}><Wallet/><strong>Pay with ETH</strong><small>Uniswap buyback, then confirmed PAN burn</small></button></div><div className="deposit-address"><small>Send {method === "pan" ? data?.token?.symbol || "PAN" : "ETH"} to your credit wallet</small><code>{payment.address || "Wallet unavailable"}</code><button disabled={!payment.address} onClick={() => copy(payment.address)}><Clipboard/>Copy address</button></div>{method === "pan" && data?.token?.contractAddress ? <div className="token-contract"><small>Accepted token contract</small><code>{data.token.contractAddress}</code><button onClick={() => copy(data.token.contractAddress)}><Copy/>Copy contract</button></div> : null}<Notice type="success"><ShieldCheck/>{method === "pan" ? "Use whole PAN token amounts. After the required confirmations, PAN burns the deposit and grants the same number of credits." : "PAN reserves a small amount for network gas, swaps the remainder through Uniswap, burns the PAN received, and credits the proven whole-token amount."}</Notice><p className="automatic-payment-note">Keep this window open only if you want the instructions visible. Detection continues automatically after you close it.</p><div className="modal-actions"><Button variant="ghost" onClick={() => setBuyOpen(false)}>Done</Button><Button onClick={() => { setBuyOpen(false); load(); }}><RefreshCw/>Refresh balance</Button></div></div></Modal> : null}
    {fundOpen ? <Modal title="Manage operational ETH" subtitle="This wallet is for launch fees, gas, and project operations. Deposits here never buy credits." onClose={() => setFundOpen(false)}><div className="modal-body"><div className="deposit-address"><small>Your operational ETH wallet</small><code>{operational.address || "Wallet unavailable"}</code><button disabled={!operational.address} onClick={() => copy(operational.address)}><Clipboard/>Copy address</button></div><Notice type="success"><ShieldCheck/>Unreserved ETH can be withdrawn whenever it is not being used by an active operation.</Notice><div className="modal-actions"><Button variant="ghost" onClick={() => setFundOpen(false)}>Done</Button><Button onClick={() => { setFundOpen(false); setWithdrawOpen(true); }}><ArrowUpRight/>Withdraw ETH</Button></div></div></Modal> : null}
    {withdrawOpen ? <WithdrawModal wallet={operational} onClose={() => setWithdrawOpen(false)} onDone={load} /> : null}
  </div>;
}

function WithdrawModal({ wallet, onClose, onDone }) {
  const [address, setAddress] = useState(""); const [amount, setAmount] = useState(""); const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [done, setDone] = useState("");
  const available = Number(wallet.availableBalance ?? wallet.ethBalance ?? wallet.balance ?? 0);
  const submit = async () => { setLoading(true); setError(""); try { const data = await endpoints.wallets.withdraw({ walletId: wallet.id, address, amountEth: Number(amount) }); setDone(data?.transactionHash || data?.txHash || "Withdrawal submitted"); onDone(); } catch (e) { setError(e.message); } finally { setLoading(false); } };
  return <Modal title="Withdraw operational ETH" subtitle="Funds reserved by an active launch or purchase cannot be withdrawn." onClose={onClose}><div className="modal-body">{error ? <Notice>{error}</Notice> : null}{done ? <Notice type="success">{done}</Notice> : null}<label className="field"><span>Destination address</span><input value={address} onChange={(e) => setAddress(e.target.value.trim())} placeholder="0x…"/></label><label className="field"><span>Amount in ETH</span><div className="amount-input"><input type="number" min="0" max={available} step="0.0001" value={amount} onChange={(e) => setAmount(e.target.value)}/><button onClick={() => setAmount(String(available))}>MAX</button></div><small>Available: {available.toFixed(6)} ETH</small></label><div className="modal-actions"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={loading} disabled={!/^0x[a-fA-F0-9]{40}$/.test(address) || Number(amount) <= 0 || Number(amount) > available} onClick={submit}>Withdraw ETH</Button></div></div></Modal>;
}
