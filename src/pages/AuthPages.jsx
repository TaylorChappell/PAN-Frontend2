import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { endpoints } from "../api";
import { useAuth } from "../auth";
import { Button, Notice } from "../components/UI";

function AuthLayout({ eyebrow, title, copy, children }) {
  return (
    <main className="auth-page">
      <section className="auth-art">
        <Link className="brand auth-brand" to="/"><i />PAN</Link>
        <div className="auth-pitch"><span className="eyebrow"><Sparkles size={14} />{eyebrow}</span><h1>{title}</h1><p>{copy}</p>
          <div className="auth-proof"><ShieldCheck /><div><strong>Ask first. Build with confidence.</strong><small>PAN never guesses when important project details are missing.</small></div></div>
        </div>
        <small>AI tools for the Robinhood Chain ecosystem.</small>
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

function GoogleButton() {
  return <button className="google-button" onClick={() => window.location.assign(endpoints.auth.googleUrl)}><span>G</span>Continue with Google</button>;
}

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ email: "", password: "", remember: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (user) navigate("/", { replace: true }); }, [user, navigate]);

  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setError("");
    try { await login(values); navigate("/"); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  };

  return <AuthLayout eyebrow="Welcome back" title="Build the next coin people remember." copy="Plan, design, launch and monitor your Robinhood Chain project from one focused workspace.">
    <form className="auth-form" onSubmit={submit}><div className="auth-form-heading"><h2>Sign in to PAN</h2><p>Continue your projects where you left off.</p></div>
      {error ? <Notice>{error}</Notice> : null}<GoogleButton/><div className="or"><span>or continue with email</span></div>
      <Field label="Email address" icon={Mail} type="email" autoComplete="email" required value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} placeholder="you@example.com" />
      <Field label="Password" icon={LockKeyhole} type="password" autoComplete="current-password" required value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} placeholder="Your password" />
      <div className="form-split"><label className="checkbox"><input type="checkbox" checked={values.remember} onChange={(e) => setValues({ ...values, remember: e.target.checked })}/><span />Remember me</label><Link to="/forgot-password">Forgot password?</Link></div>
      <Button type="submit" loading={loading}>Sign in</Button><p className="auth-switch">New to PAN? <Link to="/register">Create an account</Link></p>
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
  const [values, setValues] = useState({ username: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const rules = useMemo(() => passwordRules(values.password), [values.password]);
  const valid = values.username.length >= 2 && /\S+@\S+\.\S+/.test(values.email) && Object.values(rules).every(Boolean) && values.password === values.confirm;

  const submit = async (event) => {
    event.preventDefault(); if (!valid) return setError("Complete all fields and meet each password requirement.");
    setLoading(true); setError("");
    try {
      await register({ username: values.username, email: values.email, password: values.password });
      navigate("/verify-email", { state: { email: values.email } });
    } catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  };

  return <AuthLayout eyebrow="Create your workspace" title="From idea to live coin, without the busywork." copy="Your account gets dedicated payment and operational wallets, project history and secure credit accounting.">
    <form className="auth-form" onSubmit={submit}><div className="auth-form-heading"><h2>Create your PAN account</h2><p>Your email must be verified before you can sign in.</p></div>
      {error ? <Notice>{error}</Notice> : null}<GoogleButton/><div className="or"><span>or create with email</span></div>
      <Field label="Username" autoComplete="username" required value={values.username} onChange={(e) => setValues({ ...values, username: e.target.value })} placeholder="panbuilder" />
      <Field label="Email address" icon={Mail} type="email" autoComplete="email" required value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} placeholder="you@example.com" />
      <Field label="Password" icon={LockKeyhole} type="password" autoComplete="new-password" required value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} placeholder="Create a secure password" />
      <div className="password-rules">{[["letters","At least 6 letters"],["number","At least 1 number"],["symbol","At least 1 symbol"]].map(([key,text]) => <span className={rules[key] ? "met" : ""} key={key}><Check />{text}</span>)}</div>
      <Field label="Confirm password" icon={LockKeyhole} type="password" autoComplete="new-password" required value={values.confirm} onChange={(e) => setValues({ ...values, confirm: e.target.value })} placeholder="Repeat your password" />
      <Button type="submit" loading={loading} disabled={!valid}>Create account</Button><p className="auth-switch">Already registered? <Link to="/login">Sign in</Link></p>
    </form>
  </AuthLayout>;
}

export function VerifyPage() {
  const location = useLocation(); const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || localStorage.getItem("pan_pending_email") || "");
  const [code, setCode] = useState(""); const [cooldown, setCooldown] = useState(60);
  const [loading, setLoading] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  useEffect(() => { if (email) localStorage.setItem("pan_pending_email", email); }, [email]);
  useEffect(() => { if (cooldown <= 0) return; const timer = setInterval(() => setCooldown((v) => v - 1), 1000); return () => clearInterval(timer); }, [cooldown]);
  const verify = async (event) => { event.preventDefault(); setLoading(true); setError(""); try { await endpoints.auth.verify({ email, code }); localStorage.removeItem("pan_pending_email"); navigate("/login", { replace: true }); } catch (e) { setError(e.message); } finally { setLoading(false); } };
  const resend = async () => { setError(""); try { await endpoints.auth.resend({ email }); setMessage("A new code was sent."); setCooldown(60); } catch (e) { setError(e.message); } };
  return <AuthLayout eyebrow="Verify your email" title="One quick security check." copy="Enter the six-digit code we sent to activate your PAN account and its wallets."><form className="auth-form verify-form" onSubmit={verify}><div className="mail-orb"><Mail /></div><div className="auth-form-heading"><h2>Check your inbox</h2><p>We sent a code to <strong>{email || "your email"}</strong>.</p></div>{error ? <Notice>{error}</Notice> : null}{message ? <Notice type="success">{message}</Notice> : null}<label className="code-field"><span>Verification code</span><input inputMode="numeric" pattern="[0-9]{6}" maxLength="6" autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" /></label><Button loading={loading} disabled={code.length !== 6}>Verify account</Button><div className="tiny-actions"><button type="button" disabled={cooldown > 0 || !email} onClick={resend}>{cooldown > 0 ? `Resend in ${cooldown}s` : "Send code again"}</button><button type="button" onClick={() => { setEmail(""); setMessage(""); }}>Change email</button></div>{!email ? <Field label="Email address" icon={Mail} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /> : null}</form></AuthLayout>;
}

export function ForgotPage() {
  const [email, setEmail] = useState(""); const [loading, setLoading] = useState(false); const [sent, setSent] = useState(false); const [error, setError] = useState("");
  const submit = async (event) => { event.preventDefault(); setLoading(true); setError(""); try { await endpoints.auth.forgot({ email }); setSent(true); } catch (e) { setError(e.message); } finally { setLoading(false); } };
  return <AuthLayout eyebrow="Account recovery" title="Get back to building." copy="We’ll send a time-limited reset link to the verified email on your account."><form className="auth-form" onSubmit={submit}><Link className="back-link" to="/login"><ArrowLeft />Back to sign in</Link><div className="auth-form-heading"><h2>Reset your password</h2><p>Enter the email associated with PAN.</p></div>{error ? <Notice>{error}</Notice> : null}{sent ? <Notice type="success">If the account exists, a reset link is on its way.</Notice> : null}<Field label="Email address" icon={Mail} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"/><Button loading={loading}>Send reset link</Button></form></AuthLayout>;
}

export function ResetPage() {
  const [params] = useSearchParams(); const navigate = useNavigate(); const token = params.get("token") || "";
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const rules = passwordRules(password); const valid = token && Object.values(rules).every(Boolean) && password === confirm;
  const submit = async (event) => { event.preventDefault(); setLoading(true); setError(""); try { await endpoints.auth.reset({ token, password }); navigate("/login", { replace: true }); } catch (e) { setError(e.message); } finally { setLoading(false); } };
  return <AuthLayout eyebrow="Choose a new password" title="Secure your PAN account." copy="Your new password must contain six letters, a number and a symbol."><form className="auth-form" onSubmit={submit}><div className="auth-form-heading"><h2>Create a new password</h2><p>This reset link can only be used once.</p></div>{!token ? <Notice>This reset link is missing its token.</Notice> : null}{error ? <Notice>{error}</Notice> : null}<Field label="New password" icon={LockKeyhole} type="password" value={password} onChange={(e) => setPassword(e.target.value)} /><Field label="Confirm password" icon={LockKeyhole} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /><Button loading={loading} disabled={!valid}>Update password</Button></form></AuthLayout>;
}
