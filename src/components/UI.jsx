import { AlertCircle, CheckCircle2, LoaderCircle, X } from "lucide-react";

export function Button({ children, variant = "primary", loading = false, className = "", ...props }) {
  return (
    <button className={`button button-${variant} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading ? <LoaderCircle className="spin" size={17} /> : null}{children}
    </button>
  );
}

export function Notice({ type = "error", children, onClose }) {
  const Icon = type === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div className={`notice notice-${type}`} role="status">
      <Icon size={17} /><span>{children}</span>
      {onClose ? <button onClick={onClose} aria-label="Dismiss"><X size={15} /></button> : null}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="empty-state">
      {Icon ? <span className="empty-icon"><Icon size={24} /></span> : null}
      <h3>{title}</h3><p>{text}</p>{action}
    </div>
  );
}

export function Modal({ title, subtitle, children, onClose, wide = false }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <section className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <header><div><h2>{title}</h2>{subtitle ? <p>{subtitle}</p> : null}</div><button onClick={onClose} aria-label="Close"><X /></button></header>
        {children}
      </section>
    </div>
  );
}

export function Skeleton({ lines = 3 }) {
  return <div className="skeleton-stack">{Array.from({ length: lines }, (_, index) => <i key={index} />)}</div>;
}

export function money(value, digits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "$0.00";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: digits }).format(number);
}

export function shortAddress(value = "") {
  return value.length > 12 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value || "Not available";
}
