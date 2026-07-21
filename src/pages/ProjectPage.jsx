import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { ArrowUpRight, CheckCircle2, Coins, Earth, Image as ImageIcon, LoaderCircle, MessageSquare, Paperclip, Rocket, Send, Sparkles, Upload, Wallet, X } from "lucide-react";
import { endpoints, mediaUrl } from "../api";
import { Button, Modal, Notice, Skeleton, money } from "../components/UI";
import { InlineMarkdown } from "../components/InlineMarkdown";

const blankProject = {
  id: null, name: "Untitled coin", coinName: "", ticker: "", description: "", imageUrl: "", website: "", xAccount: "", telegram: "", performance: "medium", status: "draft", messages: [],
};

const performanceModes = new Set(["low", "medium", "high", "extra_high"]);

function normalizePerformance(value) {
  return performanceModes.has(value) ? value : "medium";
}

function normalizeProject(data, fallbackPerformance = "medium") {
  const source = data?.project || data || {};
  const coin = source.coin || source.details || {};
  return {
    ...blankProject, ...source, ...coin,
    id: source.id || source.projectId,
    coinName: coin.name || source.coinName || (source.name === "Untitled coin" ? "" : source.name) || "",
    ticker: coin.ticker || source.ticker || "",
    imageUrl: coin.imageUrl || coin.image || source.imageUrl || source.image || "",
    website: coin.website || source.website || source.websiteUrl || "",
    xAccount: coin.xAccount || coin.x || source.xAccount || source.x || source.xHandle || "",
    telegram: coin.telegram || source.telegram || source.telegramHandle || "",
    performance: performanceModes.has(source.performance) ? source.performance : normalizePerformance(fallbackPerformance),
    messages: source.messages || [],
  };
}

function extractReply(data) {
  return data?.message?.content || data?.message || data?.reply || data?.content || data?.output?.text || data?.run?.message
    || (data?.website ? "I built the website in **Website Studio**. Open it to preview and edit the generated files." : "")
    || (data?.asset ? "I generated the requested image." : "")
    || "PAN finished the request.";
}

function activeRunFrom(data) {
  const runs = Array.isArray(data?.runs) ? data.runs.filter((item) => ["queued", "running"].includes(item?.status)) : [];
  const explicit = data?.activeRun && ["queued", "running"].includes(data.activeRun.status) ? data.activeRun : null;
  return runs.find((item) => item.kind === "image")
    || runs.find((item) => item.kind === "website")
    || explicit
    || runs[0]
    || null;
}

function attachmentIdentity(image) {
  return image?.assetId || image?.id || image?.url || image?.dataUrl || image?.fileName || "";
}

function imageAttachmentIdentities(messages) {
  return new Set((messages || []).flatMap((item) => (item.attachments || [])
    .filter((image) => String(image?.mimeType || "").startsWith("image/") || image?.url || image?.dataUrl)
    .map(attachmentIdentity)).filter(Boolean));
}

function hasNewAssistantImage(messages, baseline) {
  return (messages || []).some((item) => item.role === "assistant" && (item.attachments || []).some((image) => {
    const identity = attachmentIdentity(image);
    return identity && !baseline.has(identity) && (String(image?.mimeType || "").startsWith("image/") || image?.url || image?.dataUrl);
  }));
}

function mergeConversationMessages(serverMessages, localMessages) {
  const server = Array.isArray(serverMessages) ? serverMessages : [];
  const merged = [...server];
  for (const local of localMessages || []) {
    if (!local?.optimistic) continue;
    const content = String(local.content || local.message || "").trim();
    const duplicate = server.some((item) => item.role === local.role && String(item.content || item.message || "").trim() === content);
    if (!duplicate && !merged.some((item) => item.id === local.id)) merged.push(local);
  }
  return merged;
}

function imageRunFromToolResult(data) {
  const executions = Array.isArray(data?.toolExecutions) ? data.toolExecutions : [];
  for (const execution of executions) {
    if (execution?.name !== "pan_request_image" || execution.status === "failed") continue;
    let output = execution.output;
    if (typeof output === "string") {
      try { output = JSON.parse(output); } catch { output = null; }
    }
    const runId = output?.runId;
    if (runId && (output?.processing === true || output?.accepted === true || ["queued", "running"].includes(output?.status))) {
      return { id: runId, kind: "image", status: ["queued", "running"].includes(output?.status) ? output.status : "queued" };
    }
  }
  return null;
}

function activityForRun(run) {
  if (run?.kind === "website") return "website";
  if (run?.kind === "image") return "image";
  return "thinking";
}

function initialActivityForPrompt(prompt, hint) {
  if (["image", "website", "thinking"].includes(hint)) return hint;
  const value = String(prompt || "");
  const action = /\b(?:generate|create|make|design|draw|render|produce)\b/i.test(value);
  if (action && /\b(?:image|logo|art|artwork|banner|mascot|icon|illustration|picture|graphic|visual)\b/i.test(value)) return "image";
  if (action && /\b(?:website|site|landing page|web app|webpage)\b/i.test(value)) return "website";
  return "thinking";
}

function projectFields(data) {
  const normalized = normalizeProject(data);
  const { messages: _messages, performance: _performance, ...fields } = normalized;
  return fields;
}

function MessageImage({ image, fallbackAlt }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const source = mediaUrl(image.url || image.dataUrl);
  return <figure className={`message-image-shell ${loaded ? "is-loaded" : ""} ${failed ? "is-failed" : ""}`}>
    {!loaded && !failed ? <span className="message-image-loading" aria-label="Loading image"><i /></span> : null}
    {!failed ? <img src={source} alt={image.fileName || fallbackAlt} onLoad={() => setLoaded(true)} onError={() => setFailed(true)} /> : null}
    {failed ? <span className="message-image-error"><ImageIcon /><small>Image could not be displayed</small></span> : null}
  </figure>;
}

function ImageGenerationSkeleton() {
  return <div className="image-generation-skeleton" role="status" aria-live="polite">
    <div className="image-generation-preview"><i /></div>
    <div><strong>Generating your image...</strong><small>It will appear here automatically when it is ready.</small></div>
  </div>;
}

function Field({ label, optional, children }) {
  return <label className="field"><span>{label}{optional ? <i>Optional</i> : <b>Required</b>}</span>{children}</label>;
}

const socialRules = {
  x: { hosts: ["x.com", "www.x.com", "twitter.com", "www.twitter.com"], base: "https://x.com", maximum: 15, label: "X account" },
  telegram: { hosts: ["t.me", "www.t.me", "telegram.me", "www.telegram.me"], base: "https://t.me", maximum: 32, label: "Telegram" },
};

function resolveSocialLink(rawValue, type) {
  const value = String(rawValue || "").trim();
  if (!value) return { url: "", error: "" };
  const rule = socialRules[type];
  let handle;
  const looksLikeUrl = /^https?:\/\//i.test(value) || /^(?:www\.)?(?:x\.com|twitter\.com|t\.me|telegram\.me)\//i.test(value);
  if (looksLikeUrl) {
    try {
      const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
      if (!rule.hosts.includes(url.hostname.toLowerCase())) return { url: "", error: `${rule.label} must use ${rule.hosts[0]}.` };
      handle = url.pathname.split("/").filter(Boolean)[0] || "";
    } catch { return { url: "", error: `${rule.label} link is invalid.` }; }
  } else {
    handle = value.replace(/^@/, "").replace(/^\/+|\/+$/g, "");
  }
  if (!new RegExp(`^[A-Za-z0-9_]{1,${rule.maximum}}$`).test(handle)) return { url: "", error: `${rule.label} handle is invalid.` };
  return { url: `${rule.base}/${handle}`, error: "" };
}

export function ProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { setProjects, account, reload } = useOutletContext();
  const accountPerformance = normalizePerformance(account?.settings?.performance);
  const accountPerformanceRef = useRef(accountPerformance);
  const [project, setProject] = useState(() => ({ ...blankProject, performance: accountPerformance }));
  const [loading, setLoading] = useState(Boolean(projectId));
  const [saving, setSaving] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [aiActivity, setAiActivity] = useState("thinking");
  const [resumedRunId, setResumedRunId] = useState(null);
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [pendingCoinImage, setPendingCoinImage] = useState(null);
  const [error, setError] = useState("");
  const [launchOpen, setLaunchOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [imagePending, setImagePending] = useState(false);
  const [launch, setLaunch] = useState({ devBuyEth: "0", feeWalletAddress: "", walletMode: "account" });
  const saveTimer = useRef(null);
  const coinImageInput = useRef(null);
  const chatImageInput = useRef(null);
  const messageInput = useRef(null);
  const feedRef = useRef(null);
  const websiteNavigationRef = useRef(false);
  const projectRef = useRef(project);
  const requestInFlightRef = useRef(null);
  const pendingImageRef = useRef(null);
  const imagePendingRef = useRef(false);

  useEffect(() => { accountPerformanceRef.current = accountPerformance; }, [accountPerformance]);
  useEffect(() => { projectRef.current = project; }, [project]);
  useEffect(() => { imagePendingRef.current = imagePending; }, [imagePending]);

  const mergeServerProject = useCallback((data) => {
    if (!data) return;
    const fields = projectFields(data);
    setProject((old) => ({ ...old, ...fields, messages: old.messages }));
    if (fields.id) {
      setProjects((old) => old.map((item) => (item.id || item.projectId) === fields.id ? { ...item, ...fields } : item));
    }
  }, [setProjects]);

  const beginImagePending = useCallback(() => {
    if (!pendingImageRef.current) {
      pendingImageRef.current = {
        startedAt: Date.now(),
        baseline: imageAttachmentIdentities(projectRef.current?.messages || []),
      };
    }
    imagePendingRef.current = true;
    setImagePending(true);
    setAiActivity("image");
  }, []);

  const finishImagePending = useCallback(() => {
    pendingImageRef.current = null;
    imagePendingRef.current = false;
    setImagePending(false);
  }, []);

  useEffect(() => {
    if (!projectId) {
      setProject({ ...blankProject, performance: accountPerformanceRef.current, messages: [] });
      requestInFlightRef.current = null;
      pendingImageRef.current = null;
      imagePendingRef.current = false;
      setImagePending(false);
      setThinking(false);
      setResumedRunId(null);
      setAiActivity("thinking");
      setPendingCoinImage(null);
      setAttachments([]);
      setMessage("");
      setError("");
      setLoading(false);
      return;
    }
    const hasLocalProject = projectRef.current?.id === projectId;
    if (!hasLocalProject) setLoading(true);
    setError("");
    endpoints.projects.get(projectId).then((data) => {
      const next = normalizeProject(data, accountPerformanceRef.current);
      const activeRun = activeRunFrom(data);
      setProject((old) => ({
        ...next,
        messages: old.id === next.id ? mergeConversationMessages(next.messages, old.messages) : next.messages,
      }));
      if (activeRun) {
        setThinking(true);
        setResumedRunId(activeRun.id || null);
        setAiActivity(activityForRun(activeRun));
        if (activeRun.kind === "image") beginImagePending();
      } else if (requestInFlightRef.current) {
        setThinking(true);
        setAiActivity(requestInFlightRef.current.activity || "thinking");
      } else if (!imagePendingRef.current) {
        setThinking(false);
        setResumedRunId(null);
        setAiActivity("thinking");
      }
      setProjects((old) => old.map((item) => (item.id || item.projectId) === next.id ? { ...item, ...projectFields(data), activeRun } : item));
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [beginImagePending, location.state?.newProjectNonce, projectId, setProjects]);

  useEffect(() => {
    setProject((old) => old.performance === accountPerformance ? old : { ...old, performance: accountPerformance });
  }, [accountPerformance]);

  useEffect(() => { feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" }); }, [project.messages, thinking]);
  useEffect(() => {
    if (!thinking || !project.id) return undefined;
    let active = true;
    const refresh = async () => {
      try {
        const latest = await endpoints.projects.summary(project.id);
        if (!active) return;
        const activeRun = activeRunFrom(latest);
        mergeServerProject(latest);
        setProjects((old) => old.map((item) => (item.id || item.projectId) === project.id ? { ...item, activeRun } : item));
        if (activeRun) {
          setAiActivity(activityForRun(activeRun));
          setResumedRunId(activeRun.id || null);
          if (activeRun.kind === "image") beginImagePending();
        } else if (resumedRunId) {
          window.clearInterval(timer);
          const completed = await endpoints.projects.get(project.id);
          if (!active) return;
          const completedProject = normalizeProject(completed, accountPerformanceRef.current);
          const completedRun = completed?.runs?.find((run) => run.id === resumedRunId);
          setProject((old) => ({ ...completedProject, messages: mergeConversationMessages(completedProject.messages, old.messages) }));
          setProjects((old) => old.map((item) => (item.id || item.projectId) === project.id ? { ...item, ...projectFields(completed), activeRun: null } : item));
          setThinking(false);
          setResumedRunId(null);
          if (!imagePendingRef.current) setAiActivity("thinking");
          if (completedRun?.status === "failed") {
            if (completedRun.kind === "image") finishImagePending();
            setError(completedRun.errorMessage || "PAN could not complete the request.");
          }
          reload();
        }
      } catch { /* The final run response still performs a source-of-truth refresh. */ }
    };
    const timer = window.setInterval(refresh, 1_500);
    return () => { active = false; window.clearInterval(timer); };
  }, [beginImagePending, finishImagePending, mergeServerProject, project.id, reload, resumedRunId, setProjects, thinking]);
  useEffect(() => {
    if (!imagePending || !project.id) return undefined;
    let active = true;
    let timer = null;
    const refreshImage = async () => {
      try {
        const latest = await endpoints.projects.get(project.id);
        if (!active) return;
        const next = normalizeProject(latest, accountPerformanceRef.current);
        const baseline = pendingImageRef.current?.baseline || new Set();
        setProject((old) => ({ ...next, messages: mergeConversationMessages(next.messages, old.messages) }));
        const runs = Array.isArray(latest?.runs) ? latest.runs : [];
        const activeImageRun = runs.find((run) => run.kind === "image" && ["queued", "running"].includes(run.status));
        const latestImageRun = runs.find((run) => run.kind === "image");
        if (hasNewAssistantImage(next.messages, baseline)) {
          finishImagePending();
          setThinking(false);
          setResumedRunId(null);
          setAiActivity("thinking");
          reload();
          return;
        }
        if (activeImageRun) {
          setAiActivity("image");
          setResumedRunId(activeImageRun.id || null);
        } else if (latestImageRun && ["failed", "cancelled"].includes(latestImageRun.status)) {
          finishImagePending();
          setThinking(false);
          setResumedRunId(null);
          setAiActivity("thinking");
          setError(latestImageRun.errorMessage || "PAN could not generate the image.");
          return;
        } else if (!requestInFlightRef.current && Date.now() - (pendingImageRef.current?.startedAt || Date.now()) > 45_000) {
          finishImagePending();
          setThinking(false);
          setResumedRunId(null);
          setAiActivity("thinking");
          setError("PAN did not start the image job. Please try the request again.");
          return;
        }
      } catch { /* Keep the visible image skeleton while a temporary refresh fails. */ }
      if (active) timer = window.setTimeout(refreshImage, 1_500);
    };
    refreshImage();
    return () => { active = false; if (timer) window.clearTimeout(timer); };
  }, [finishImagePending, imagePending, project.id, reload]);
  useEffect(() => {
    if (!project.id || project.status !== "launching") return undefined;
    let active = true;
    let timer = null;
    const refreshLaunchStatus = async () => {
      try {
        const latest = await endpoints.projects.launchStatus(project.id);
        if (!active) return;
        const fields = projectFields(latest);
        mergeServerProject(latest);
        const isLive = fields.status === "live" || Boolean(fields.contractAddress || fields.tokenAddress);
        if (isLive) {
          reload();
          return;
        }
        if (fields.status === "failed") {
          setError("The launch transaction failed. Check the operations log before trying again.");
          reload();
          return;
        }
      } catch { /* Keep the current launch state and retry while the transaction confirms. */ }
      if (active) timer = window.setTimeout(refreshLaunchStatus, 2_000);
    };
    refreshLaunchStatus();
    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [mergeServerProject, project.id, project.status, reload]);
  useEffect(() => {
    const input = messageInput.current;
    if (!input) return;
    input.style.height = "0px";
    input.style.height = `${Math.min(input.scrollHeight, 180)}px`;
    input.style.overflowY = input.scrollHeight > 180 ? "auto" : "hidden";
  }, [message]);

  const required = useMemo(() => ({ name: Boolean(project.coinName.trim()), ticker: Boolean(project.ticker.trim()), image: Boolean(project.imageUrl) }), [project]);
  const complete = Object.values(required).filter(Boolean).length;
  const resolvedX = useMemo(() => resolveSocialLink(project.xAccount, "x"), [project.xAccount]);
  const resolvedTelegram = useMemo(() => resolveSocialLink(project.telegram, "telegram"), [project.telegram]);
  const launched = project.status === "live" || project.status === "launched" || Boolean(project.contractAddress || project.tokenAddress);
  const busy = thinking || imagePending;
  const visibleActivity = imagePending ? "image" : aiActivity;

  const ensureProject = async () => {
    if (project.id) return project.id;
    const data = await endpoints.projects.create({ name: project.coinName || "Untitled coin", performance: project.performance });
    const created = normalizeProject(data);
    let hydrated = { ...created, performance: project.performance || "medium" };
    setProject((old) => ({ ...old, ...hydrated, messages: old.messages }));
    setProjects((old) => [hydrated, ...old.filter((item) => item.id !== created.id)]);
    navigate(`/projects/${created.id}`, { replace: true });

    const initialChanges = {
      name: project.coinName || project.name || "Untitled coin",
      coinName: project.coinName || "",
      ticker: project.ticker || "",
      description: project.description || "",
      website: project.website || "",
      xAccount: resolvedX.url || project.xAccount || "",
      telegram: resolvedTelegram.url || project.telegram || "",
    };
    try {
      if (pendingCoinImage) {
        const uploaded = await endpoints.assets.upload(pendingCoinImage, { projectId: created.id, kind: "logo", visibility: "public" });
        initialChanges.imageUrl = uploaded.url;
        initialChanges.imageFileName = pendingCoinImage.name;
        setPendingCoinImage(null);
      }
      await endpoints.projects.update(created.id, initialChanges);
      hydrated = { ...hydrated, ...initialChanges };
      setProject((old) => ({ ...old, ...hydrated, messages: old.messages }));
      setProjects((old) => old.map((item) => item.id === created.id ? hydrated : item));
    } catch (metadataError) {
      setError(`The project was started, but some coin details could not be saved: ${metadataError.message}`);
    }
    return created.id;
  };

  const persist = async (changes) => {
    setProject((old) => ({ ...old, ...changes }));
    if (!project.id) return;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      setSaving(true);
      try { await endpoints.projects.update(project.id, changes); }
      catch (e) { setError(e.message); }
      finally { setSaving(false); }
    }, 550);
  };

  const selectPerformance = async (performance) => {
    const next = normalizePerformance(performance);
    const previous = project.performance;
    setProject((old) => ({ ...old, performance: next }));
    try {
      const result = await endpoints.account.update({ defaultPerformance: next });
      window.dispatchEvent(new CustomEvent("pan:account-updated", { detail: result }));
    } catch (requestError) {
      setProject((old) => old.performance === next ? { ...old, performance: previous } : old);
      setError(requestError.message);
    }
  };

  const readCoinImage = async (file) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) return setError("Use a PNG, JPG, WebP or GIF image.");
    if (file.size > 8 * 1024 * 1024) return setError("Coin images must be under 8 MB.");
    setSaving(true); setError("");
    try {
      if (!project.id) {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        setPendingCoinImage(file);
        setProject((old) => ({ ...old, imageUrl: dataUrl, imageFileName: file.name }));
        return;
      }
      const result = await endpoints.assets.upload(file, { projectId: project.id, kind: "logo", visibility: "public" });
      await persist({ imageUrl: result.url, imageFileName: file.name });
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const addChatImages = async (files) => {
    const incoming = Array.from(files || []).filter((file) => file?.type?.startsWith("image/"));
    if (!incoming.length) return;
    if (attachments.length + incoming.length > 6) return setError("You can attach up to 6 images to one message.");
    const invalid = incoming.find((file) => !/^image\/(png|jpeg|webp|gif)$/.test(file.type) || file.size > 8 * 1024 * 1024);
    if (invalid) return setError("Use PNG, JPG, WebP, or GIF images under 8 MB each.");
    const read = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ id: crypto.randomUUID(), fileName: file.name || `pasted-image-${Date.now()}.png`, mimeType: file.type, size: file.size, dataUrl: reader.result });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    try { const loaded = await Promise.all(incoming.map(read)); setAttachments((old) => [...old, ...loaded]); }
    catch { setError("One of the images could not be read."); }
  };

  const handlePaste = (event) => {
    const images = Array.from(event.clipboardData?.items || []).filter((item) => item.type.startsWith("image/")).map((item) => item.getAsFile()).filter(Boolean);
    if (images.length) { event.preventDefault(); addChatImages(images); }
  };

  const send = async (text = message, activityHint = null) => {
    const clean = text.trim(); if ((!clean && !attachments.length) || thinking || imagePendingRef.current) return;
    const outgoingAttachments = attachments;
    const initialActivity = initialActivityForPrompt(clean, activityHint);
    setError(""); setMessage(""); setAttachments([]);
    const userMessage = { id: crypto.randomUUID(), role: "user", content: clean, attachments: outgoingAttachments, optimistic: true };
    requestInFlightRef.current = { userMessageId: userMessage.id, activity: initialActivity, projectId: project.id || null };
    websiteNavigationRef.current = false;
    if (initialActivity === "image") beginImagePending();
    setProject((old) => ({ ...old, messages: [...old.messages, userMessage] })); setAiActivity(initialActivity); setThinking(true);
    try {
      const id = await ensureProject();
      if (requestInFlightRef.current) requestInFlightRef.current.projectId = id;
      setProjects((old) => old.map((item) => (item.id || item.projectId) === id ? { ...item, activeRun: { id: `pending-${userMessage.id}`, projectId: id, kind: "chat", status: "queued" } } : item));
      const data = await endpoints.projects.message(id, {
        message: clean,
        performance: project.performance,
        attachments: outgoingAttachments.map(({ fileName, mimeType, size, dataUrl }) => ({ fileName, mimeType, size, dataUrl })),
        onProgress: (progress) => {
          if (progress?.run?.id && ["queued", "running"].includes(progress.run.status)) {
            setProjects((old) => old.map((item) => (item.id || item.projectId) === id ? { ...item, activeRun: progress.run } : item));
          }
          const executions = progress?.toolExecutions || [];
          const websiteActive = ["queued", "generating"].includes(progress?.website?.status)
            || executions.some((execution) => execution.name === "pan_write_website" && execution.status !== "failed");
          const imageActive = executions.some((execution) => execution.name === "pan_request_image" && execution.status !== "failed");
          if (websiteActive) {
            setAiActivity("website");
            if (!websiteNavigationRef.current) {
              websiteNavigationRef.current = true;
              navigate(`/projects/${id}/website`, { state: { followWebsiteBuild: true } });
            }
          }
          else if (imageActive) { beginImagePending(); setAiActivity("image"); }
        },
      });
      const delegatedImageRun = imageRunFromToolResult(data);
      if (delegatedImageRun) beginImagePending();

      let refreshed = null;
      try { refreshed = await endpoints.projects.get(id); }
      catch { refreshed = null; }

      if (refreshed) {
        const refreshedProject = normalizeProject(refreshed, accountPerformanceRef.current);
        const nextActiveRun = activeRunFrom(refreshed);
        const effectiveRun = nextActiveRun || delegatedImageRun;
        setProject((old) => ({ ...refreshedProject, messages: mergeConversationMessages(refreshedProject.messages, old.messages) }));
        setProjects((old) => old.map((item) => (item.id || item.projectId) === id
          ? { ...item, ...projectFields(refreshed), activeRun: effectiveRun }
          : item));
        setThinking(Boolean(effectiveRun));
        setResumedRunId(effectiveRun?.id || null);
        if (effectiveRun) {
          setAiActivity(activityForRun(effectiveRun));
          if (effectiveRun.kind === "image") beginImagePending();
        } else if (imagePendingRef.current) {
          setAiActivity("image");
        } else {
          setAiActivity("thinking");
        }
      } else {
        const generatedAsset = data?.asset?.url ? { id: data.asset.id, url: data.asset.url, fileName: data.asset.originalName || "Generated image", mimeType: data.asset.contentType || "image/png" } : null;
        const assistantMessage = { id: data?.message?.id || data?.id || crypto.randomUUID(), role: "assistant", content: extractReply(data), attachments: generatedAsset ? [generatedAsset] : [] };
        setProject((old) => ({ ...old, messages: [...old.messages, assistantMessage] }));
        setThinking(Boolean(delegatedImageRun));
        setResumedRunId(delegatedImageRun?.id || null);
        setAiActivity(imagePendingRef.current ? "image" : "thinking");
      }

      requestInFlightRef.current = null;
      reload();
      if (data?.website?.id && ["ready", "published"].includes(data.website.status)) navigate(`/projects/${id}/website/${data.website.id}`);
      else if (data?.website?.status === "failed") setError(data.website.errorMessage || "Website Studio could not complete the build.");
    } catch (e) {
      requestInFlightRef.current = null;
      const continuing = e?.status === 202 && imagePendingRef.current;
      if (!continuing) {
        setError(e.message);
        if (initialActivity === "image") finishImagePending();
      }
      setAttachments(outgoingAttachments);
      setThinking(false);
      setResumedRunId(null);
      setAiActivity(imagePendingRef.current ? "image" : "thinking");
      reload();
    }
  };

  const openWebsiteStudio = () => {
    if (!project.id) {
      setError("Send your first message to PAN before opening Website Studio.");
      messageInput.current?.focus();
      return;
    }
    navigate(`/projects/${project.id}/website`);
  };

  const generateImage = async () => {
    const prompt = imagePrompt.trim();
    if (!prompt) return;
    if (!project.id) {
      setImageOpen(false);
      setError("Send your first message to PAN before generating project artwork.");
      messageInput.current?.focus();
      return;
    }
    setImageOpen(false);
    setImagePrompt("");
    await send(`Generate a coin logo image for this project using this brief: ${prompt}`, "image");
  };

  const launchCoin = async () => {
    if (!project.id) {
      setLaunchOpen(false);
      setError("Send your first message to PAN before launching the project.");
      messageInput.current?.focus();
      return;
    }
    setThinking(true); setError("");
    try {
      const id = project.id;
      const payload = { devBuyEth: Number(launch.devBuyEth || 0), feeWalletAddress: launch.feeWalletAddress, walletMode: launch.walletMode };
      const quote = await endpoints.projects.launchPreview(id, payload);
      if (quote?.preview?.canAfford === false) throw new Error(`The operations wallet does not have enough ETH for the ${quote.preview.fees?.totalEth || "current"} ETH launch total.`);
      const data = await endpoints.projects.launch(id, payload);
      const result = data?.result || data;
      if (result?.signingRequest) {
        if (!window.ethereum) throw new Error("Open PAN in a browser with your connected wallet extension to confirm this launch.");
        const request = result.signingRequest;
        const transactionHash = await window.ethereum.request({ method: "eth_sendTransaction", params: [{ from: request.fromAddress, to: request.toAddress, data: request.data, value: `0x${BigInt(request.valueWei || "0").toString(16)}`, ...(request.gasLimit ? { gas: `0x${BigInt(request.gasLimit).toString(16)}` } : {}) }] });
        await endpoints.wallets.confirmSigningRequest(request.id, transactionHash);
      }
      setProject((old) => ({ ...old, status: "launching" }));
      setLaunchOpen(false); reload();
    } catch (e) { setError(e.message); }
    finally { setThinking(false); }
  };

  if (loading) return <div className="page-loading"><Skeleton lines={6} /></div>;

  return (
    <div className="project-page">
      <section className="chat-column">
        <header className="project-header"><div><h1>{project.coinName || project.name || "Untitled coin"}</h1><span className={`status-pill ${launched ? "live" : "draft"}`}>{launched ? "Live" : project.status || "Draft"}</span>{saving ? <small><LoaderCircle className="spin" />Saving</small> : null}</div><button className="studio-link" onClick={openWebsiteStudio}><Earth />Web Studio</button></header>
        <div className="chat-scroll-region">
          {error ? <Notice onClose={() => setError("")}>{error}</Notice> : null}
          <div className="chat-feed" ref={feedRef} role="log" aria-label="AI chat messages" aria-live="polite" tabIndex={0}>
            {!project.messages.length ? <><div className="pan-message"><span className="pan-avatar"><img src={`${import.meta.env.BASE_URL}PanLogo.png`} alt="" /></span><div><small>PAN · PROJECT AGENT</small><p>Tell me what you want to create. I’ll ask whenever an important detail is unclear.</p><p>To launch a coin, I’ll need its name, ticker and image. Website and X account are optional.</p></div></div><div className="suggestion-row"><button onClick={() => send("Help me shape the idea for my coin") }><MessageSquare />Shape my idea</button><button onClick={() => setImageOpen(true)}><Sparkles />Generate a logo</button><button onClick={openWebsiteStudio}><Earth />Build its website</button></div></> : null}
            {project.messages.map((item) => item.role === "user" ? <div className="user-message" key={item.id}>{item.content || item.message ? <p>{item.content || item.message}</p> : null}{item.attachments?.length ? <div className="message-images">{item.attachments.map((image, index) => <MessageImage key={image.id || image.url || index} image={image} fallbackAlt="Chat attachment" />)}</div> : null}</div> : <div className="pan-message" key={item.id}><span className="pan-avatar"><img src={`${import.meta.env.BASE_URL}PanLogo.png`} alt="" /></span><div><small>PAN · PROJECT AGENT</small><p><InlineMarkdown>{item.content || item.message}</InlineMarkdown></p>{item.attachments?.length ? <div className="message-images">{item.attachments.map((image, index) => <MessageImage key={image.id || image.url || index} image={image} fallbackAlt="Generated image" />)}</div> : null}</div></div>)}
            {busy ? <div className={`pan-message thinking ${visibleActivity === "website" ? "website-build-thinking" : visibleActivity === "image" ? "image-build-thinking" : ""}`}><span className="pan-avatar"><img src={`${import.meta.env.BASE_URL}PanLogo.png`} alt="" /></span><div><small>{visibleActivity === "website" ? "PAN IS BUILDING YOUR WEBSITE" : visibleActivity === "image" ? "PAN IS CREATING AN IMAGE" : resumedRunId ? "PAN IS STILL WORKING" : "PAN IS THINKING"}</small>{visibleActivity === "image" ? <ImageGenerationSkeleton /> : visibleActivity === "website" ? <p className="build-progress-copy">Build in progress. PAN is generating, validating and saving the Website Studio files.</p> : resumedRunId ? <p className="build-progress-copy">Your request is still running. You can leave this project and come back at any time.</p> : null}{visibleActivity !== "image" ? <div className="thinking-dots"><i/><i/><i/></div> : null}</div></div> : null}
          </div>
        </div>
        <div className="composer-dock"><div className="composer" onPaste={handlePaste}>{attachments.length ? <div className="attachment-strip">{attachments.map((image) => <div key={image.id}><img src={image.dataUrl} alt={image.fileName} /><button aria-label={`Remove ${image.fileName}`} onClick={() => setAttachments((old) => old.filter((item) => item.id !== image.id))}><X /></button><span>{image.fileName}</span></div>)}</div> : null}<textarea ref={messageInput} rows="1" aria-label="Message PAN" placeholder="Message PAN…" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} /><div><span><button aria-label="Attach images" title="Upload images" onClick={() => chatImageInput.current?.click()}><Paperclip /></button><button aria-label="Generate image" title="Generate image" onClick={() => setImageOpen(true)}><ImageIcon /></button><button aria-label="Open Website Studio" title="Website Studio" onClick={openWebsiteStudio}><Earth /></button><input ref={chatImageInput} hidden multiple type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => { addChatImages(e.target.files); e.target.value = ""; }}/></span><span className="composer-actions"><label>Performance<select aria-label="Performance" value={project.performance} onChange={(e) => selectPerformance(e.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="extra_high">Extra high</option></select></label><button className="send-button" disabled={(!message.trim() && !attachments.length) || busy} onClick={() => send()} aria-label="Send"><Send /></button></span></div></div></div>
      </section>
      <aside className="details-panel">
        {launched ? <CoinStats project={project} /> : <><div className="panel-title"><div><p>PROJECT OBJECT</p><h2>Coin details</h2></div><span className="completion">{complete}/3</span></div>
          <button className={`image-upload ${project.imageUrl ? "has-image" : ""}`} onClick={() => coinImageInput.current?.click()}>{project.imageUrl ? <img src={mediaUrl(project.imageUrl)} alt="Coin" /> : <><Upload /><strong>Upload coin image</strong><small>PNG, JPG, WebP or GIF · required</small></>}</button><input ref={coinImageInput} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => { readCoinImage(e.target.files?.[0]); e.target.value = ""; }}/>
          <div className="field-stack"><Field label="Name"><input value={project.coinName} onChange={(e) => persist({ coinName: e.target.value, name: e.target.value || "Untitled coin" })} placeholder="e.g. Neon Frog" /></Field><Field label="Ticker"><input maxLength="10" value={project.ticker} onChange={(e) => persist({ ticker: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })} placeholder="e.g. NFRG" /></Field><Field label="Description" optional><textarea maxLength="256" value={project.description || ""} onChange={(e) => persist({ description: e.target.value })} placeholder="What is this coin about?" /></Field><Field label="Website" optional><input value={project.website || ""} onChange={(e) => persist({ website: e.target.value })} placeholder="https://coin.xyz" /></Field><Field label="X account" optional><input value={project.xAccount || ""} onChange={(e) => persist({ xAccount: e.target.value })} onBlur={() => { if (resolvedX.url && project.xAccount !== resolvedX.url) persist({ xAccount: resolvedX.url }); }} placeholder="@PanAiApp or x.com/PanAiApp" />{project.xAccount ? <small className={`resolved-social ${resolvedX.url ? "valid" : "invalid"}`}>{resolvedX.url ? <><CheckCircle2/><a href={resolvedX.url} target="_blank" rel="noreferrer">{resolvedX.url}</a></> : resolvedX.error}</small> : null}</Field><Field label="Telegram" optional><input value={project.telegram || ""} onChange={(e) => persist({ telegram: e.target.value })} onBlur={() => { if (resolvedTelegram.url && project.telegram !== resolvedTelegram.url) persist({ telegram: resolvedTelegram.url }); }} placeholder="@coincommunity or t.me/coincommunity" />{project.telegram ? <small className={`resolved-social ${resolvedTelegram.url ? "valid" : "invalid"}`}>{resolvedTelegram.url ? <><CheckCircle2/><a href={resolvedTelegram.url} target="_blank" rel="noreferrer">{resolvedTelegram.url}</a></> : resolvedTelegram.error}</small> : null}</Field></div>
          <div className="requirements">{Object.entries(required).map(([key, value]) => <span className={value ? "done" : ""} key={key}><i />{key === "name" ? "Name" : key === "ticker" ? "Ticker" : "Image"}</span>)}</div>
          <Button className="launch-button" disabled={complete !== 3} onClick={() => setLaunchOpen(true)}><Rocket />Launch coin</Button><small className="button-caption">{complete === 3 ? "Review launch funding and wallet" : "Complete the three required details"}</small></>}
      </aside>
      {imageOpen ? <Modal title="Generate coin artwork" subtitle="OpenAI image generation uses your selected performance level." onClose={() => setImageOpen(false)}><div className="modal-body"><label className="field"><span>Describe the image</span><textarea rows="5" value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} placeholder="A neon green frog mascot, bold coin logo, dark background…" /></label><div className="modal-actions"><Button variant="ghost" onClick={() => setImageOpen(false)}>Cancel</Button><Button loading={busy} disabled={!imagePrompt.trim() || busy} onClick={generateImage}><Sparkles />Generate image</Button></div></div></Modal> : null}
      {launchOpen ? <Modal title={`Launch ${project.coinName}`} subtitle="PAN verifies the live Pons fee and developer-buy limit before creating the transaction." onClose={() => setLaunchOpen(false)}><div className="modal-body"><div className="launch-summary"><span>{project.imageUrl ? <img src={mediaUrl(project.imageUrl)} alt="" /> : <Coins />}</span><div><strong>{project.coinName}</strong><small>${project.ticker} · Robinhood Chain</small></div></div><div className="two-fields"><Field label="Dev buy (ETH)" optional><input type="number" min="0" step="0.001" value={launch.devBuyEth} onChange={(e) => setLaunch({ ...launch, devBuyEth: e.target.value })}/></Field><Field label="Creator fee wallet" optional><input value={launch.feeWalletAddress} onChange={(e) => setLaunch({ ...launch, feeWalletAddress: e.target.value.trim() })} placeholder="Defaults to launch wallet" /></Field></div><label className="field"><span>Launch wallet</span><select value={launch.walletMode} onChange={(e) => setLaunch({ ...launch, walletMode: e.target.value })}><option value="account">PAN account wallet</option><option value="connected">Connected external wallet</option></select></label>{launch.walletMode === "connected" ? <Notice>Your connected wallet will ask you to confirm the launch transaction. PAN never receives its private key.</Notice> : null}<div className="modal-actions"><Button variant="ghost" onClick={() => setLaunchOpen(false)}>Cancel</Button><Button loading={thinking} disabled={Boolean(launch.feeWalletAddress) && !/^0x[a-fA-F0-9]{40}$/.test(launch.feeWalletAddress)} onClick={launchCoin}><Rocket />Verify fee and launch</Button></div></div></Modal> : null}
    </div>
  );
}

function CoinStats({ project }) {
  const address = project.contractAddress || project.tokenAddress;
  const [claiming, setClaiming] = useState(false); const [notice, setNotice] = useState(""); const [stats, setStats] = useState(null);
  const terminal = address ? `https://gmgn.ai/robinhood/token/${address.toLowerCase()}` : "https://gmgn.ai/robinhood";
  useEffect(() => {
    let active = true;
    const load = () => endpoints.projects.stats(project.id).then((data) => active && setStats(data?.stats || null)).catch((error) => active && setNotice(error.message));
    load(); const timer = window.setInterval(load, 30_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [project.id]);
  const claim = async () => { setClaiming(true); try { await endpoints.projects.claimFees(project.id); setNotice("Creator fee claim submitted."); } catch (e) { setNotice(e.message); } finally { setClaiming(false); } };
  const creatorFeeEth = stats?.creatorFeesWethWei ? Number(BigInt(stats.creatorFeesWethWei)) / 1e18 : 0;
  return <><div className="panel-title"><div><p>LIVE COIN</p><h2>Coin stats</h2></div><span className="status-pill live">Live</span></div><div className="coin-identity">{project.imageUrl ? <img src={mediaUrl(project.imageUrl)} alt="" /> : <span><Coins /></span>}<div><h3>{project.coinName}</h3><p>${project.ticker}</p></div></div>{notice ? <Notice type={notice.includes("submitted") ? "success" : "error"}>{notice}</Notice> : null}<div className="stats-list"><div><span>Market cap</span><strong>{money(stats?.marketCapUsd)}</strong></div><div><span>24h volume</span><strong>{money(stats?.volume24hUsd)}</strong></div><div><span>Creator fees</span><strong>{creatorFeeEth.toFixed(6)} ETH</strong></div><div><span>Token address</span><strong className="mono">{address ? `${address.slice(0, 8)}…${address.slice(-6)}` : "Pending"}</strong></div></div><Button variant="secondary" loading={claiming} onClick={claim}><Wallet />Claim creator fees</Button><a className="button button-primary launch-button" href={terminal} target="_blank" rel="noreferrer">View coin <ArrowUpRight /></a></>;
}
