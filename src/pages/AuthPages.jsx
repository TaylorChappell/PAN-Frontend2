import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, Sparkles, UserRound } from "lucide-react";
import { endpoints, unwrapUser } from "../api";
import { useAuth } from "../auth";
import { Button, Notice } from "../components/UI";

function AuthLayout({ eyebrow, title, copy, actions, children }) {
  return (
    <main className="auth-page">
      <section className="auth-art">
        <Link className="brand auth-brand" to="/"><img src={`${import.meta.env.BASE_URL}PanLogo.png`} alt="" />PAN.AI</Link>
        <div className="auth-pitch"><span className="eyebrow"><Sparkles size={14} />{eyebrow}</span><h1>{title}</h1><p>{copy}</p>{actions ? <div className="auth-social-actions">{actions}</div> : null}</div>
        <small>PAN.AI tools for the Robinhood Chain ecosystem. <Link to="/terms">Terms</Link> · <Link to="/privacy">Privacy</Link> · <Link to="/cookies">Cookies</Link></small>
      </section>
      <section className="auth-form-wrap">{children}</section>
    </main>
  );
}

function Field({ label, icon: Icon, type = "text", ...props }) {
  const [visible, setVisible] = useState(false);
  const password = type === "password";
  return <label className="auth-field"><span>{label}</span><div>{Icon ? <Icon size={18} /> : null}<input type={password && visible ? "text" : type} {...props} />{password ? <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? "Hide password" : "Show password"}>{visible ? <EyeOff /> : <Eye />}</button> : null}</div></label>;
}

function GoogleButton({ onClick, loading = false }) {
  return <button type="button" className="google-button" disabled={loading} onClick={onClick}>{loading ? <LoaderCircle className="spin" size={18} /> : <img src={`${import.meta.env.BASE_URL}google.png`} alt="" />}Continue with Google</button>;
}

function AuthSocialActions() {
  const xUrl = import.meta.env.VITE_X_URL || "https://x.com/PanAIApp";
  const ponsUrl = import.meta.env.VITE_PONS_TOKEN_URL || "https://pons.family";
  return <><a className="auth-social-button auth-social-pan" href={ponsUrl} target="_blank" rel="noreferrer"><img src={`${import.meta.env.BASE_URL}PanLogo.png`} alt="" />GET $PAN</a><a className="auth-social-button auth-social-x" href={xUrl} target="_blank" rel="noreferrer"><img src={`${import.meta.env.BASE_URL}X.png`} alt="" />PanAiApp</a></>;
}

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ email: "", password: "", remember: true });
  const [loading, setLoading] = useState(false); const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (user) navigate("/", { replace: true }); }, [user, navigate]);

  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setError("");
    try { await login(values); navigate("/"); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  };
  const google = async () => { setGoogleLoading(true); setError(""); try { const data = await endpoints.auth.google(); if (!data?.url) throw new Error("Google sign-in did not return an authorization URL."); window.location.assign(data.url); } catch (requestError) { setError(requestError.message); setGoogleLoading(false); } };

  return <AuthLayout eyebrow="Welcome back" title="Build the next coin people remember." copy="Plan, design, launch and monitor your Robinhood Chain project from one focused workspace." actions={<AuthSocialActions />}>
    <form className="auth-form" onSubmit={submit}><div className="auth-form-heading"><h2>Sign in to PAN.AI</h2><p>Continue your projects where you left off.</p></div>
      {error ? <Notice>{error}</Notice> : null}<GoogleButton loading={googleLoading} onClick={google}/><div className="or"><span>or continue with email</span></div>
      <Field label="Email address" icon={Mail} type="email" autoComplete="email" required value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} placeholder="you@example.com" />
      <Field label="Password" icon={LockKeyhole} type="password" autoComplete="current-password" required value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} placeholder="Your password" />
      <div className="form-split"><label className="checkbox"><input type="checkbox" checked={values.remember} onChange={(e) => setValues({ ...values, remember: e.target.checked })}/><span />Remember me</label><Link to="/forgot-password">Forgot password?</Link></div>
      <Button type="submit" loading={loading}>Sign in</Button><p className="auth-switch">New to PAN.AI? <Link to="/register">Create an account</Link></p>
    </form>
  </AuthLayout>;
}

function passwordRules(password) {
  return {
    letters: (password.match(/[a-z]/gi) || []).length >= 6,
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ username: "", email: "", password: "", confirm: "", legalAccepted: false });
  const [loading, setLoading] = useState(false); const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const rules = useMemo(() => passwordRules(values.password), [values.password]);
  const valid = values.username.length >= 2 && /\S+@\S+\.\S+/.test(values.email) && Object.values(rules).every(Boolean) && values.password === values.confirm && values.legalAccepted;

  const submit = async (event) => {
    event.preventDefault(); if (!valid) return setError("Complete all fields and meet each password requirement.");
    setLoading(true); setError("");
    try {
      sessionStorage.setItem("pan_terms_accept_intent", "1");
      const result = await register({ username: values.username, email: values.email, password: values.password });
      navigate("/verify-email", { state: { email: values.email.trim().toLowerCase(), warning: result?.emailDeliveryWarning || "" } });
    } catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  };
  const google = async () => { if (!values.legalAccepted) return setError("Accept the Terms of Use before continuing."); sessionStorage.setItem("pan_terms_accept_intent", "1"); setGoogleLoading(true); setError(""); try { const data = await endpoints.auth.google(); if (!data?.url) throw new Error("Google sign-in did not return an authorization URL."); window.location.assign(data.url); } catch (requestError) { setError(requestError.message); setGoogleLoading(false); } };

  return <AuthLayout eyebrow="Create your workspace" title="Build the next coin people remember." copy="Plan, design, launch and monitor your Robinhood Chain project from one focused workspace." actions={<AuthSocialActions />}>
    <form className="auth-form" onSubmit={submit}><div className="auth-form-heading"><h2>Create your PAN.AI account</h2><p>Your email must be verified before you can sign in.</p></div>
      {error ? <Notice>{error}</Notice> : null}<GoogleButton loading={googleLoading} onClick={google}/><div className="or"><span>or create with email</span></div>
      <Field label="Username" icon={UserRound} autoComplete="username" required value={values.username} onChange={(e) => setValues({ ...values, username: e.target.value })} placeholder="panbuilder" />
      <Field label="Email address" icon={Mail} type="email" autoComplete="email" required value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} placeholder="you@example.com" />
      <Field label="Password" icon={LockKeyhole} type="password" autoComplete="new-password" required value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} placeholder="Create a secure password" />
      <div className="password-rules">{[["letters","At least 6 letters"],["number","At least 1 number"],["symbol","At least 1 symbol"]].map(([key,text]) => <span className={rules[key] ? "met" : ""} key={key}><Check />{text}</span>)}</div>
      <Field label="Confirm password" icon={LockKeyhole} type="password" autoComplete="new-password" required value={values.confirm} onChange={(e) => setValues({ ...values, confirm: e.target.value })} placeholder="Repeat your password" />
      <label className="checkbox legal-checkbox"><input type="checkbox" checked={values.legalAccepted} onChange={(e) => setValues({ ...values, legalAccepted: e.target.checked })}/><span />I accept the <Link to="/terms" target="_blank">Terms of Use</Link> and acknowledge the <Link to="/privacy" target="_blank">Privacy Notice</Link>.</label>
      <Button type="submit" loading={loading} disabled={!valid}>Create account</Button><p className="auth-switch">Already registered? <Link to="/login">Sign in</Link></p>
    </form>
  </AuthLayout>;
}

export function VerifyPage() {
  const location = useLocation(); const navigate = useNavigate();
  const { refresh, setUser } = useAuth();
  const [email, setEmail] = useState(location.state?.email || localStorage.getItem("pan_pending_email") || "");
  const [code, setCode] = useState(""); const [cooldown, setCooldown] = useState(60);
  const [loading, setLoading] = useState(false); const [resending, setResending] = useState(false);
  const [error, setError] = useState(location.state?.warning || "");
  useEffect(() => { if (email) localStorage.setItem("pan_pending_email", email.trim().toLowerCase()); }, [email]);
  useEffect(() => { if (cooldown <= 0) return; const timer = setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000); return () => clearInterval(timer); }, [cooldown]);
  const verify = async (event) => {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const result = await endpoints.auth.verify({ email: email.trim().toLowerCase(), code });
      localStorage.removeItem("pan_pending_email");
      const verifiedUser = unwrapUser(result);
      if (verifiedUser) setUser(verifiedUser);
      else await refresh();
      if (sessionStorage.getItem("pan_terms_accept_intent") === "1") {
        await endpoints.account.acceptTerms();
        sessionStorage.removeItem("pan_terms_accept_intent");
      }
      navigate("/", { replace: true });
    } catch (requestError) {
      setError(requestError.data?.code === "INVALID_OTP" ? "That code is invalid or has expired. Use the latest PAN code in your inbox, or send the code again." : requestError.message);
    } finally { setLoading(false); }
  };
  const resend = async () => {
    setError(""); setResending(true);
    try {
      const result = await endpoints.auth.resend({ email: email.trim().toLowerCase() });
      setCooldown(Math.max(1, Number(result?.retryAfter) || 60));
    } catch (requestError) {
      const retryAfter = Number(requestError.data?.retryAfter);
      if (Number.isFinite(retryAfter) && retryAfter > 0) setCooldown(Math.ceil(retryAfter));
      setError(requestError.message);
    } finally { setResending(false); }
  };
  return <AuthLayout eyebrow="Verify your email" title="One quick security check." copy="Enter the six-digit code we sent to activate your PAN account and its wallets."><form className="auth-form verify-form" onSubmit={verify}><div className="mail-orb"><Mail /></div><div className="auth-form-heading"><h2>Check your inbox</h2><p>We sent a code to <strong>{email || "your email"}</strong>.</p></div>{error ? <Notice>{error}</Notice> : null}<label className="code-field"><span>Verification code</span><input inputMode="numeric" pattern="[0-9]{6}" maxLength="6" autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" /></label><Button loading={loading} disabled={code.length !== 6}>Verify account</Button><div className="tiny-actions"><button type="button" disabled={resending || cooldown > 0 || !email} onClick={resend}>{resending ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Send code again"}</button><button type="button" onClick={() => { setEmail(""); setError(""); setCooldown(0); }}>Change email</button></div>{!email ? <Field label="Email address" icon={Mail} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /> : null}</form></AuthLayout>;
}

export function ForgotPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(""); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const submit = async (event) => { event.preventDefault(); setLoading(true); setError(""); try { await endpoints.auth.forgot({ email }); localStorage.setItem("pan_reset_email", email); navigate("/reset-password", { state: { email } }); } catch (e) { setError(e.message); } finally { setLoading(false); } };
  return <AuthLayout eyebrow="Account recovery" title="Get back to building." copy="We’ll send a six-digit reset code to the verified email on your account."><form className="auth-form" onSubmit={submit}><Link className="back-link" to="/login"><ArrowLeft />Back to sign in</Link><div className="auth-form-heading"><h2>Reset your password</h2><p>Enter the email associated with PAN.</p></div>{error ? <Notice>{error}</Notice> : null}<Field label="Email address" icon={Mail} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"/><Button loading={loading}>Send reset code</Button></form></AuthLayout>;
}

export function ResetPage() {
  const location = useLocation(); const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || localStorage.getItem("pan_reset_email") || "");
  const [code, setCode] = useState(""); const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const rules = passwordRules(password); const valid = /\S+@\S+\.\S+/.test(email) && code.length === 6 && Object.values(rules).every(Boolean) && password === confirm;
  const submit = async (event) => { event.preventDefault(); setLoading(true); setError(""); try { await endpoints.auth.reset({ email, code, password }); localStorage.removeItem("pan_reset_email"); navigate("/login", { replace: true }); } catch (e) { setError(e.message); } finally { setLoading(false); } };
  return <AuthLayout eyebrow="Choose a new password" title="Secure your PAN account." copy="Enter the six-digit reset code and choose a new password."><form className="auth-form" onSubmit={submit}><div className="auth-form-heading"><h2>Create a new password</h2><p>Use the code sent to your verified email.</p></div>{error ? <Notice>{error}</Notice> : null}<Field label="Email address" icon={Mail} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /><label className="code-field"><span>Reset code</span><input inputMode="numeric" pattern="[0-9]{6}" maxLength="6" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" /></label><Field label="New password" icon={LockKeyhole} type="password" value={password} onChange={(e) => setPassword(e.target.value)} /><Field label="Confirm password" icon={LockKeyhole} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /><Button loading={loading} disabled={!valid}>Update password</Button></form></AuthLayout>;
}
