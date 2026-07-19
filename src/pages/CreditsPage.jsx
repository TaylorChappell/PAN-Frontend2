import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownToLine, ArrowUpRight, Check, ChevronDown, Clipboard, Coins, Gift, History, RefreshCw, Wallet } from "lucide-react";
import { endpoints } from "../api";
import { Button, Modal, Notice, Skeleton, money } from "../components/UI";

export function CreditsPage() {
  const [data, setData] = useState(null); const [wallets, setWallets] = useState([]); const [history, setHistory] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const [buyOpen, setBuyOpen] = useState(false); const [fundOpen, setFundOpen] = useState(false); const [withdrawOpen, setWithdrawOpen] = useState(false); const [method, setMethod] = useState("pan"); const [provisioning, setProvisioning] = useState(false); const [visibleHistoryCount, setVisibleHistoryCount] = useState(10);
  const [copiedAddress, setCopiedAddress] = useState("");
  const copyResetTimer = useRef(null);
  const operational = wallets.find((item) => item.role === "operations" || ["operational", "spending", "launch"].includes(item.type)) || data?.operationalWallet || {};
  const payment = wallets.find((item) => item.role === "credit_intake" || ["payment", "credits", "conversion"].includes(item.type)) || data?.paymentWallet || {};

  const load = useCallback(async (quiet = false, refreshWallets = false) => {
    if (!quiet) setLoading(true);
    const results = await Promise.allSettled([endpoints.credits.summary(refreshWallets), endpoints.credits.history()]);
    let nextData = null;
    let nextWallets = null;
    if (results[0].status === "fulfilled") {
      nextData = results[0].value;
      setData((current) => {
        const incomingPrice = Number(nextData?.panUsdPrice ?? nextData?.price?.panUsd ?? 0);
        const currentPrice = Number(current?.panUsdPrice ?? current?.price?.panUsd ?? 0);
        if (incomingPrice > 0 || currentPrice <= 0) return nextData;
        return {
          ...nextData,
          panUsdPrice: currentPrice,
          price: { ...(nextData?.price || {}), panUsd: currentPrice },
        };
      });
    }
    else setError(results[0].reason.message);
    if (nextData?.wallets) {
      nextWallets = nextData.wallets;
      setWallets(nextWallets);
    }
    if (results[1].status === "fulfilled") setHistory(results[1].value?.transactions || results[1].value?.items || (Array.isArray(results[1].value) ? results[1].value : []));
    if (nextData || nextWallets) window.dispatchEvent(new CustomEvent("pan:account-updated", { detail: { ...(nextData || {}), ...(nextWallets ? { wallets: nextWallets } : {}) } }));
    if (!quiet) setLoading(false);
  }, []);
  useEffect(() => {
    load();
    const refreshWhenVisible = () => { if (document.visibilityState === "visible") load(true); };
    const interval = window.setInterval(refreshWhenVisible, 15_000);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [load]);

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
  const operationalEth = Number(operational.ethBalance || operational.balance || data?.ethBalance || 0);
  const ethUsdPrice = Number(data?.ethUsdPrice || 0);
  const operationalUsd = ethUsdPrice > 0 ? money(operationalEth * ethUsdPrice) : "Price unavailable";
  const copy = async (text, key) => {
    await navigator.clipboard.writeText(text || "");
    setCopiedAddress(key);
    if (copyResetTimer.current) window.clearTimeout(copyResetTimer.current);
    copyResetTimer.current = window.setTimeout(() => setCopiedAddress(""), 2500);
  };
  const cappedHistory = useMemo(() => history.slice(0, 50), [history]);
  const visibleHistory = cappedHistory.slice(0, visibleHistoryCount);
  const rewardTweetUrl = `https://x.com/intent/post?text=${encodeURIComponent("I’m building on Robinhood Chain with @PanAIApp. Check out PAN.AI and join the ecosystem. #RobinhoodChain #PAN")}`;

  if (loading) return <div className="page-loading"><Skeleton lines={7}/></div>;

  return <div className="standard-page credits-page"><header className="page-title"><div><p>ACCOUNT FUNDS</p><h1>Credits & wallet</h1><span>Buy AI credits and manage withdrawable launch ETH.</span></div><Button onClick={() => setBuyOpen(true)}><Coins/>Buy credits</Button></header>{error ? <Notice onClose={() => setError("")}>{error}</Notice> : null}
    <section className="metric-grid"><article className="metric-card featured"><span><Coins/></span><p>PAN credits</p><strong>{credits.toLocaleString()}</strong><small>Used for the AI</small></article><article className="metric-card"><span><Wallet/></span><p>Withdrawable ETH</p><strong>{operationalEth.toFixed(5)} ETH</strong><small>{operationalUsd}{ethUsdPrice > 0 ? " estimated value" : ""}</small></article><article className="metric-card"><span><RefreshCw/></span><p>PAN market price</p><strong>{panPrice > 0 ? money(panPrice, 6) : "Unavailable"}</strong></article></section>
    <section className="credit-rewards"><div className="reward-icon"><Gift/></div><div><small>COMMUNITY REWARDS</small><h2>Get a chance to earn free PAN credits and $PAN</h2><p>Tweet about PAN.AI on X and include <strong>@PanAIApp</strong>. Eligible posts may receive free AI credits, $PAN tokens, or both.</p></div><a className="button reward-button" href={rewardTweetUrl} target="_blank" rel="noreferrer"><img src={`${import.meta.env.BASE_URL}X.png`} alt=""/>Post on X</a></section>
    <section className="wallet-section"><div className="section-heading"><div><h2>Fund your PAN account</h2><p>Wallet addresses stay hidden until you choose an action.</p></div>{!payment.address || !operational.address ? <Button loading={provisioning} onClick={provisionWallets}><Wallet/>Create account wallets</Button> : null}</div>{!payment.address || !operational.address ? <Notice>Your encrypted account wallets have not been provisioned yet. Create them once to enable automatic credit payments and launch funding.</Notice> : null}<div className="funding-actions"><article><span className="wallet-icon"><Coins/></span><div><small>AUTOMATIC CREDIT PAYMENTS</small><h3>Buy with PAN or ETH</h3><p>Confirmed payments award credits once and are forwarded to the PAN treasury.</p></div><Button disabled={!payment.address} onClick={() => setBuyOpen(true)}>Buy credits</Button></article><article><span className="wallet-icon"><Wallet/></span><div><small>WITHDRAWABLE LAUNCH FUNDS</small><h3>Manage operational ETH</h3><p>Top up launch fees and gas separately. ETH that is not reserved by an active operation remains withdrawable.</p></div><Button variant="secondary" disabled={!operational.address} onClick={() => setFundOpen(true)}>Manage ETH</Button></article></div></section>
    <section className="history-section"><div className="section-heading"><div><h2>Credit activity</h2><p>Your latest Credit activity.</p></div><History/></div><div className="data-table"><div className="table-head"><span>Activity</span><span>Status</span><span>Credits</span><span>Date</span></div>{visibleHistory.length ? visibleHistory.map((item) => <div className="table-row" key={item.id}><span><i className={Number(item.amount || item.credits) >= 0 ? "positive" : "negative"}>{Number(item.amount || item.credits) >= 0 ? <ArrowDownToLine/> : <ArrowUpRight/>}</i><b>{item.description || item.entryType || item.type || "Credit activity"}</b></span><span><em className={`status-pill ${item.status === "confirmed" || item.status === "completed" ? "live" : "draft"}`}>{item.status || "completed"}</em></span><span className={Number(item.amount || item.credits) >= 0 ? "green" : ""}>{Number(item.amount || item.credits) >= 0 ? "+" : ""}{Number(item.amount || item.credits || 0).toLocaleString()}</span><span>{item.createdAt || item.date ? new Date(item.createdAt || item.date).toLocaleDateString() : "Not available"}</span></div>) : <div className="table-empty">No credit activity yet.</div>}{visibleHistoryCount < cappedHistory.length ? <button className="history-show-more" onClick={() => setVisibleHistoryCount((count) => Math.min(count + 10, 50))}>Show 10 more<ChevronDown/></button> : null}</div></section>
    {buyOpen ? <Modal title="Buy PAN credits" subtitle="Buy credits with either the PAN token or ETH." onClose={() => setBuyOpen(false)}><div className="modal-body"><div className="payment-methods"><button className={method === "pan" ? "active" : ""} onClick={() => setMethod("pan")}><Coins/><strong>Pay with PAN</strong><small>Credits used for AI</small></button><button className={method === "eth" ? "active" : ""} onClick={() => setMethod("eth")}><Wallet/><strong>Pay with ETH</strong><small>Converted into credits used for AI</small></button></div><div className="deposit-address"><small>Send {method === "pan" ? data?.token?.symbol || "PAN" : "ETH"} to your credit wallet</small><code>{payment.address || "Wallet unavailable"}</code><button disabled={!payment.address} onClick={() => copy(payment.address, "payment")} className={copiedAddress === "payment" ? "copied" : ""}>{copiedAddress === "payment" ? <Check/> : <Clipboard/>}{copiedAddress === "payment" ? "Copied" : "Copy address"}</button></div><p className="automatic-payment-note"></p><div className="modal-actions"><Button variant="ghost" onClick={() => setBuyOpen(false)}>Done</Button><Button onClick={() => { setBuyOpen(false); load(false, true); }}><RefreshCw/>Refresh balance</Button></div></div></Modal> : null}
    {fundOpen ? <Modal title="Manage operational ETH" subtitle="This wallet is for launch fees, gas, and project operations. Deposits here never buy credits." onClose={() => setFundOpen(false)}><div className="modal-body"><div className="deposit-address"><small>Your operational ETH wallet</small><code>{operational.address || "Wallet unavailable"}</code><button disabled={!operational.address} onClick={() => copy(operational.address, "operational")} className={copiedAddress === "operational" ? "copied" : ""}>{copiedAddress === "operational" ? <Check/> : <Clipboard/>}{copiedAddress === "operational" ? "Copied" : "Copy address"}</button></div><div className="modal-actions"><Button variant="ghost" onClick={() => setFundOpen(false)}>Done</Button><Button onClick={() => { setFundOpen(false); setWithdrawOpen(true); }}><ArrowUpRight/>Withdraw ETH</Button></div></div></Modal> : null}
    {withdrawOpen ? <WithdrawModal wallet={operational} onClose={() => setWithdrawOpen(false)} onDone={load} /> : null}
  </div>;
}

function WithdrawModal({ wallet, onClose, onDone }) {
  const [address, setAddress] = useState(""); const [amount, setAmount] = useState(""); const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [done, setDone] = useState("");
  const available = Number(wallet.availableBalance ?? wallet.ethBalance ?? wallet.balance ?? 0);
  const submit = async () => { setLoading(true); setError(""); try { const data = await endpoints.wallets.withdraw({ walletId: wallet.id, address, amountEth: Number(amount) }); setDone(data?.transactionHash || data?.txHash || "Withdrawal submitted"); onDone(); } catch (e) { setError(e.message); } finally { setLoading(false); } };
  return <Modal title="Withdraw operational ETH" subtitle="Funds reserved by an active launch or purchase cannot be withdrawn." onClose={onClose}><div className="modal-body">{error ? <Notice>{error}</Notice> : null}{done ? <Notice type="success">{done}</Notice> : null}<label className="field"><span>Destination address</span><input value={address} onChange={(e) => setAddress(e.target.value.trim())} placeholder="0x…"/></label><label className="field"><span>Amount in ETH</span><div className="amount-input"><input type="number" min="0" max={available} step="0.0001" value={amount} onChange={(e) => setAmount(e.target.value)}/><button onClick={() => setAmount(String(available))}>MAX</button></div><small>Available: {available.toFixed(6)} ETH</small></label><div className="modal-actions"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={loading} disabled={!/^0x[a-fA-F0-9]{40}$/.test(address) || Number(amount) <= 0 || Number(amount) > available} onClick={submit}>Withdraw ETH</Button></div></div></Modal>;
}
