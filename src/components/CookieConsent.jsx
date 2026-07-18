import { useState } from "react";
import { Link } from "react-router-dom";
import { Cookie } from "lucide-react";

const consentKey = "pan_optional_cookie_consent";

export function CookieConsent() {
  const optionalCookiesEnabled = String(import.meta.env.VITE_OPTIONAL_COOKIES_ENABLED || "").toLowerCase() === "true";
  const [choice, setChoice] = useState(() => localStorage.getItem(consentKey));
  if (!optionalCookiesEnabled || choice) return null;
  const choose = (value) => { localStorage.setItem(consentKey, value); setChoice(value); window.dispatchEvent(new CustomEvent("pan:cookie-consent", { detail: value })); };
  return <aside className="cookie-consent" role="dialog" aria-label="Cookie choices"><span><Cookie /></span><div><h2>Choose your cookie settings</h2><p>PAN uses necessary storage for sign-in and security. Optional analytics will only run with permission. Read the <Link to="/cookies">Cookie Notice</Link>.</p><div><button onClick={() => choose("all")}>Accept all</button><button onClick={() => choose("necessary")}>Necessary only</button><button onClick={() => choose("rejected")}>Reject optional</button></div></div></aside>;
}
