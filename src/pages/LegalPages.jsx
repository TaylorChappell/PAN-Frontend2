import { Link } from "react-router-dom";
import { ArrowLeft, Cookie, FileText, ShieldCheck } from "lucide-react";

const updated = "18 July 2026";

function LegalLayout({ icon: Icon, eyebrow, title, intro, children }) {
  return <main className="legal-page">
    <header className="legal-header"><Link className="brand" to="/"><img src={`${import.meta.env.BASE_URL}PanLogo.png`} alt="" />PAN.AI</Link><Link className="legal-back" to="/"><ArrowLeft />Back to PAN</Link></header>
    <article className="legal-document"><div className="legal-title"><span><Icon /></span><small>{eyebrow}</small><h1>{title}</h1><p>{intro}</p><em>Last updated {updated}</em></div>{children}</article>
    <footer className="legal-footer"><Link to="/terms">Terms of Use</Link><Link to="/privacy">Privacy Notice</Link><Link to="/cookies">Cookie Notice</Link></footer>
  </main>;
}

export function TermsPage() {
  return <LegalLayout icon={FileText} eyebrow="PAN LEGAL" title="Terms of Use" intro="These terms govern access to PAN.AI, its project workspace, AI tools, credits, wallet features and launch integrations.">
    <section><h2>1. Accepting these terms</h2><p>By creating an account, signing in, or using PAN, you agree to these Terms of Use. You must have the legal capacity to enter this agreement and comply with any laws or age restrictions that apply to blockchain services where you live.</p></section>
    <section><h2>2. What PAN provides</h2><p>PAN provides AI-assisted tools for researching, planning, creating, launching and monitoring Robinhood Chain projects. Features may include generated text and images, websites, project files, wallet connections, credits, Pons launch preparation and third-party deployment integrations.</p></section>
    <section><h2>3. AI output and your responsibility</h2><p>AI output can be incomplete, inaccurate or unsuitable. You must review all project details, code, transactions, contracts, marketing claims and launch settings before using them. PAN does not guarantee that a project will launch successfully, remain secure, gain value or attract users.</p></section>
    <section><h2>4. No financial, legal or tax advice</h2><p>PAN is a creation and project-management tool. Nothing produced by PAN is financial, investment, legal, accounting or tax advice. Digital assets are volatile and may lose all value. You are responsible for obtaining professional advice and complying with applicable law.</p></section>
    <section><h2>5. Accounts and security</h2><p>You must provide accurate account information, protect your login credentials and connected wallets, and notify PAN through Support if you suspect unauthorised access. You are responsible for activity performed through your account unless caused by PAN's failure to use reasonable security measures.</p></section>
    <section><h2>6. Credits, $PAN and blockchain activity</h2><p>PAN credits are product usage units and are not cash or a bank balance. $PAN and ETH transactions are executed on public blockchains and may be irreversible. Fees, confirmations, token prices, liquidity and third-party availability can change. No token value, refund, buyback amount or future utility is guaranteed unless explicitly stated at the time of a transaction.</p></section>
    <section><h2>7. Your content and generated work</h2><p>You retain rights you already hold in prompts, uploads and project material. You grant PAN the limited rights needed to store, process, display and transmit that material to provide the service. You are responsible for ensuring you have permission to use uploaded names, images, brands, code and other content.</p></section>
    <section><h2>8. Acceptable use</h2><p>You must not use PAN to break the law, deceive users, impersonate others, infringe intellectual property, distribute malware, manipulate markets, evade sanctions, exploit security weaknesses or create abusive, fraudulent or misleading projects. PAN may suspend access, preserve evidence or remove content when reasonably necessary to protect users or the service.</p></section>
    <section><h2>9. Third-party services</h2><p>Robinhood Chain, Pons, Google, GitHub, Railway, wallet providers, AI providers and other integrations are independent services with their own terms. PAN is not responsible for their outages, decisions, transaction handling or content.</p></section>
    <section><h2>10. Availability and changes</h2><p>PAN may add, change, limit or remove features. Planned roadmap items are not promises of delivery. We may update these terms and require renewed acceptance when a material change is made.</p></section>
    <section><h2>11. Liability</h2><p>To the fullest extent permitted by law, PAN is provided without guarantees of uninterrupted availability, profitability or fitness for a particular launch. PAN is not liable for indirect losses, lost profits, lost token value, failed transactions or third-party failures. Nothing in these terms excludes liability that cannot legally be excluded.</p></section>
    <section><h2>12. Governing law and contact</h2><p>These terms are governed by the laws of England and Wales, subject to any mandatory consumer protections that apply where you live. Questions can be submitted through the PAN Support page.</p></section>
  </LegalLayout>;
}

export function PrivacyPage() {
  return <LegalLayout icon={ShieldCheck} eyebrow="YOUR INFORMATION" title="Privacy Notice" intro="This notice explains what PAN collects, why it is used and the choices available to you.">
    <section><h2>Information we collect</h2><p>PAN may collect account details, authentication records, project prompts, chat messages, uploaded and generated files, coin details, support conversations, wallet addresses, transaction references, connected-service identifiers, usage records, device and security logs, and operational data needed to run the service.</p></section>
    <section><h2>How we use it</h2><p>We use information to provide and secure accounts, operate AI and website tools, process credits and blockchain operations, maintain project history, prevent abuse, provide support, improve reliability and comply with legal obligations.</p></section>
    <section><h2>Legal bases</h2><p>Depending on the activity, processing is necessary to perform the service contract, meet legal obligations, protect legitimate interests such as security and fraud prevention, or act on consent where consent is specifically requested.</p></section>
    <section><h2>Who receives information</h2><p>Information may be processed by hosting, authentication, email, AI, storage, blockchain, analytics if later enabled, and connected-service providers. Public blockchain transactions and public project content can be visible permanently to anyone.</p></section>
    <section><h2>Retention and security</h2><p>We retain information only for as long as reasonably needed for the service, security, disputes and legal requirements. PAN uses access controls, encryption where appropriate, audit records and service isolation, but no online system can guarantee absolute security.</p></section>
    <section><h2>Your rights</h2><p>Depending on your location, you may have rights to access, correct, delete, restrict or object to processing, request portability, and withdraw consent where consent is used. Submit requests through PAN Support. UK users may also complain to the Information Commissioner's Office.</p></section>
    <section><h2>Updates</h2><p>This notice will be updated when PAN's data use materially changes. The current version will remain available here.</p></section>
  </LegalLayout>;
}

export function CookiesPage() {
  return <LegalLayout icon={Cookie} eyebrow="STORAGE TECHNOLOGIES" title="Cookie Notice" intro="PAN currently uses only storage that is necessary to provide and secure the service.">
    <section><h2>Necessary cookies and storage</h2><p>PAN uses authentication cookies or access-token storage to keep you signed in, protect account sessions and complete security checks. It also uses local or session storage for essential interface state such as pending verification, dismissed service notices and your selected login persistence.</p></section>
    <section><h2>No advertising cookies by default</h2><p>The current PAN application does not enable advertising or cross-site tracking cookies. Because the storage currently used is necessary to deliver requested features and account security, PAN does not show an accept or reject banner.</p></section>
    <section><h2>If optional technologies are added</h2><p>PAN will ask before enabling non-essential analytics, advertising or similar technologies where consent is required. Rejecting optional storage will be as easy as accepting it, and necessary account functions will remain available.</p></section>
    <section><h2>Browser controls</h2><p>You can remove cookies and site storage through your browser settings. Removing necessary authentication storage will sign you out and may reset interface preferences.</p></section>
  </LegalLayout>;
}
