import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  Check,
  ChevronRight,
  CircleDollarSign,
  Coins,
  Copy,
  ExternalLink,
  Globe2,
  Layers3,
  LineChart,
  MessageSquareText,
  Network,
  Rocket,
  WandSparkles,
  Zap,
} from "lucide-react";


const featureCards = [
  {
    icon: Bot,
    title: "An AI built around Robinhood Chain",
    copy: "PAN focuses on the ecosystem you are actually launching into, helping with the coin, positioning, creative direction and launch decisions from one conversation.",
  },
  {
    icon: Layers3,
    title: "The entire project stays connected",
    copy: "Your brief, coin details, imagery, website, launch preparation and live status all remain together instead of being scattered across unrelated tools.",
  },
  {
    icon: WandSparkles,
    title: "Build without wrestling with every step",
    copy: "Explain what you want in plain English. PAN turns the idea into something structured, polished and ready to move toward market.",
  },
  {
    icon: Zap,
    title: "A product designed to get smarter",
    copy: "PAN will keep expanding with stronger intelligence, more creative tools and deeper support for projects across Robinhood Chain.",
  },
];

const roadmap = [
  {
    title: "Launch workspace",
    copy: "PAN already has a deep understanding of Robinhood Chain, how launches behave and what helps coins stand out. It combines user feedback and questions with its own research tools so its knowledge keeps expanding. PAN can already plan launches, create coin visuals and build complete frontend and backend websites for projects.",
  },
  {
    title: "Builder incentives and community rewards",
    copy: "PAN will direct protocol revenue and fees towards incentives for customers building successful, working products with PAN. Strategic builder incentives will attract more builders to the ecosystem, creating more products, more usage and more protocol revenue.",
  },
  {
    title: "More creation tools & smarter intelligence",
    copy: "PAN will constantly improve and add more creation tools for developers, including an AI treasury assistant, analytics, marketing plans and community management tools. Its intelligence for token launches and strategies will deepen as it learns more about Robinhood Chain day by day.",
  },
  {
    title: "Airdrop & Hackathon",
    copy: "Once PAN is established within the Pons ecosystem, it will host its own hackathon to bring more advanced builders onto the platform, alongside strategic token airdrops for participants from the community.",
  },
];

const flywheelSteps = [
  { title: "More founders use PAN", icon: Network },
  { title: "More AI generations", icon: Bot },
  { title: "More platform revenue", icon: LineChart },
  { title: "More PAN acquired", icon: Coins },
  { title: "More PAN removed from circulation", icon: CircleDollarSign },
  { title: "Stronger ecosystem", icon: Layers3 },
  { title: "More founders join", icon: Rocket },
];

const PAN_CONTRACT_ADDRESS = "0xf4bd36cad0eaf5396d93f5b483a3c08dffbdbd8c";

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch { /* Fall back for browsers that expose but deny the Clipboard API. */ }
  }
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  const copied = document.execCommand("copy");
  field.remove();
  if (!copied) throw new Error("Clipboard unavailable");
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Reveal({ className = "", children, ...props }) {
  return <div className={`home-reveal ${className}`} {...props}>{children}</div>;
}

function SectionHeading({ title, copy, align = "left" }) {
  return <div className={`home-section-heading ${align === "center" ? "center" : ""}`}>
    <h2>{title}</h2>
    {copy ? <p>{copy}</p> : null}
  </div>;
}

function SocialLinks({ compact = false }) {
  const xUrl = import.meta.env.VITE_X_URL || "https://x.com/PanAIApp";
  const telegramUrl = import.meta.env.VITE_TELEGRAM_URL;
  const discordUrl = import.meta.env.VITE_DISCORD_URL;
  return <div className={`home-socials ${compact ? "compact" : ""}`}>
    <a href={xUrl} target="_blank" rel="noreferrer"><img src={`${import.meta.env.BASE_URL}X.png`} alt="" />PanAiApp<ExternalLink /></a>
    {telegramUrl ? <a href={telegramUrl} target="_blank" rel="noreferrer">Telegram<ExternalLink /></a> : null}
    {discordUrl ? <a href={discordUrl} target="_blank" rel="noreferrer">Discord<ExternalLink /></a> : null}
  </div>;
}

function HeroVisual() {
  const base = import.meta.env.BASE_URL;
  return <div className="home-hero-visual" aria-label="PAN project workspace preview">
    <div className="hero-glow hero-glow-one" />
    <div className="hero-glow hero-glow-two" />
    <div className="hero-workspace-card">
      <div className="hero-window-bar">
        <span><i /><i /><i /></span>
        <small>PAN PROJECT WORKSPACE</small>
      </div>
      <div className="hero-workspace-body">
        <aside>
          <div className="hero-mini-brand"><img src={`${base}PanLogo.png`} alt="PAN.AI" /><b>PAN.AI</b></div>
          <span className="hero-side-button"><i>+</i>New project</span>
          <small>PROJECTS</small>
          <div className="hero-project active"><img src={`${base}PanLogo.png`} alt="" /><div><b>PAN.AI</b></div></div>
          <div className="hero-project"><img src={`${base}robinhood.png`} alt="" /><div><b>Night Runner</b><small>Draft</small></div></div>
          <div className="hero-side-lines"><i /><i /><i /></div>
        </aside>
        <section>
          <header>
            <div><small>PAN.AI</small><b>Build a coin people remember.</b></div>
            <button className="hero-studio-button"><Globe2 />Web Studio</button>
          </header>
          <div className="hero-chat">
            <div className="hero-message user"><p>Build PAN.AI, a smart project agent that makes launching a coin simple.</p></div>
            <div className="hero-message agent"><span><img src={`${base}PanLogo.png`} alt="" /></span><div><small>PAN</small><p>PAN.AI is ready. I have shaped the project, prepared the coin details and connected the launch flow to Pons.</p></div></div>
          </div>
          <div className="hero-compose"><MessageSquareText /><span>Ask PAN to build, change or launch anything...</span><button><ArrowRight /></button></div>
        </section>
        <aside className="hero-details">
          <header><small>COIN DETAILS</small></header>
          <div className="hero-coin-image"><img src={`${base}PanLogo.png`} alt="PAN.AI coin logo" /></div>
          <label><small>COIN NAME</small><span>PAN.AI</span></label>
          <label><small>TICKER</small><span>PAN</span></label>
          <label className="hero-description-field"><small>DESCRIPTION</small><span>The AI project agent built for launching and growing memorable coin projects.</span></label>
          <label><small>X</small><span>@PanAiApp</span></label>
          <label><small>TELEGRAM</small><span>t.me/PanAiApp</span></label>
          <button className="hero-launch-button"><Rocket />Launch with Pons</button>
        </aside>
      </div>
    </div>
  </div>;
}

export function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openRoadmap, setOpenRoadmap] = useState(0);
  const [contractCopyStatus, setContractCopyStatus] = useState("idle");
  const ponsUrl = import.meta.env.VITE_PONS_TOKEN_URL || "https://pons.family";

  useEffect(() => {
    const items = [...document.querySelectorAll(".home-reveal")];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const navigateSection = (id) => {
    setMenuOpen(false);
    scrollToSection(id);
  };

  const copyContractAddress = async () => {
    try {
      await copyText(PAN_CONTRACT_ADDRESS);
      setContractCopyStatus("copied");
      window.setTimeout(() => setContractCopyStatus("idle"), 1800);
    } catch {
      setContractCopyStatus("failed");
      window.setTimeout(() => setContractCopyStatus("idle"), 1800);
    }
  };

  return <main className="home-page">
    <div className="home-noise" />
    <header className="home-nav">
      <Link className="home-brand" to="/" aria-label="PAN.AI home"><img src={`${import.meta.env.BASE_URL}PanLogo.png`} alt="" /><span>PAN.AI</span></Link>
      <nav className={menuOpen ? "open" : ""}>
        <div className="home-mobile-nav-label">Explore PAN</div>
        <button onClick={() => navigateSection("product")}><span>01</span>Product</button>
        <button onClick={() => navigateSection("why-pan")}><span>02</span>Why PAN</button>
        <button onClick={() => navigateSection("tokenomics")}><span>03</span>Tokenomics</button>
        <button onClick={() => navigateSection("roadmap")}><span>04</span>Roadmap</button>
        <div className="home-mobile-nav-actions"><Link to="/login" onClick={() => setMenuOpen(false)}>Sign in</Link><Link to="/register" onClick={() => setMenuOpen(false)}>Start building<ArrowRight /></Link></div>
      </nav>
      <div className="home-nav-actions">
        <Link className="home-nav-cta" to="/login">Sign in</Link>
        <Link className="home-sign-in" to="/register">Sign up</Link>
      </div>
      <button className={`home-menu-button ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen((value) => !value)} aria-label="Toggle navigation" aria-expanded={menuOpen}><span className="menu-glyph" aria-hidden="true"><i /><i /><i /></span></button>
    </header>

    <section className="home-hero" id="product">
      <div className="home-hero-copy">
        <h1>Build the next coin <em>people remember.</em></h1>
        <p>PAN is a Robinhood Chain-specific AI that helps turn an idea into a complete coin project, from the concept and visuals to the website, Pons launch and live project workspace.</p>
        <div className="home-hero-actions">
          <Link className="home-primary-cta" to="/register">Start building<ArrowRight /></Link>
          <button className="home-secondary-cta" onClick={() => scrollToSection("how-it-works")}><span><Bot /></span>See how PAN works</button>
        </div>
        <div className="home-hero-meta">
          <div><span><img src={`${import.meta.env.BASE_URL}robinhood.png`} alt="Robinhood" /></span><p><b>Robinhood-native</b><small>Focused on one ecosystem</small></p></div>
          <div><span><img src={`${import.meta.env.BASE_URL}pons.png`} alt="Pons" /></span><p><b>Launching with Pons</b><small>Chosen launchpad</small></p></div>
        </div>
      </div>
      <HeroVisual />
    </section>


    <section className="home-section home-intro" id="why-pan">
      <Reveal><SectionHeading title="One focused AI for the whole project." copy="Most coin launches are fragmented across research, design, websites, wallets and launch tools. PAN brings the important parts into one clear workflow built around Robinhood Chain." align="center" /></Reveal>
      <div className="home-feature-grid">
        {featureCards.map(({ icon: Icon, title, copy }, index) => <Reveal className={`home-feature-card delay-${index + 1}`} key={title}><article><span className="home-feature-icon"><Icon /></span><h3>{title}</h3><p>{copy}</p><i className="home-card-line" /></article></Reveal>)}
      </div>
    </section>

    <section className="home-section home-workflow" id="how-it-works">
      <Reveal className="home-workflow-copy"><SectionHeading title="Go from a rough idea to a real project." copy="You do not need to arrive with every detail worked out. Start with the idea and PAN helps shape the rest." />
        <div className="home-workflow-list">
          <article><span>01</span><div><h3>Describe what you want to build</h3><p>Give PAN the concept, style, audience or even just the feeling you want the coin to have.</p></div></article>
          <article><span>02</span><div><h3>Build the project in one workspace</h3><p>Develop the identity, coin details, visual assets and website while PAN keeps everything aligned.</p></div></article>
          <article><span>03</span><div><h3>Launch through Pons</h3><p>Prepare the project for Robinhood Chain and move from draft to a live coin using PAN’s chosen launchpad.</p></div></article>
        </div>
        <Link className="home-inline-link" to="/register">Create your first project<ArrowRight /></Link>
      </Reveal>
    </section>

    <section className="home-section home-pons-section">
      <Reveal className="home-pons-card">
        <div className="home-pons-copy"><span className="home-pons-icon"><Rocket /></span><div><h2>PAN launches with Pons.</h2><p>Pons is the launchpad PAN is being built around for Robinhood Chain. The goal is a cleaner path from the project workspace to a live coin, without making users stitch the process together themselves.</p><a href={ponsUrl} target="_blank" rel="noreferrer">Explore $PAN on Pons<ExternalLink /></a></div></div>
      </Reveal>
    </section>

    <section className="home-section home-tokenomics" id="tokenomics">
      <Reveal><SectionHeading title="The flywheel keeps growing" copy="A flywheel to assure returns to investors and to builders using PAN." align="center" /></Reveal>
      <Reveal className="home-contract-reveal">
        <button className={`home-contract-card ${contractCopyStatus}`} type="button" onClick={copyContractAddress} aria-label={`Copy PAN contract address ${PAN_CONTRACT_ADDRESS}`}>
          <span className="home-contract-mark"><img src={`${import.meta.env.BASE_URL}PanLogo.png`} alt="" /></span>
          <span className="home-contract-details"><strong>$PAN contract</strong><code>{PAN_CONTRACT_ADDRESS}</code></span>
          <span className="home-contract-action" aria-live="polite">{contractCopyStatus === "copied" ? <><Check />Copied</> : contractCopyStatus === "failed" ? <>Try again</> : <><Copy />Copy</>}</span>
        </button>
      </Reveal>
      <div className="home-flywheel-layout">
        <Reveal className="home-flywheel-copy">
          <article><span><CircleDollarSign /></span><div><strong>50%</strong><p>of protocol revenue will be used for buybacks of the $PAN token.</p></div></article>
          <article><span><Coins /></span><div><strong>35%</strong><p>of protocol revenue will fund builder incentives, competitions and community events.</p></div></article>
          <p>Attract builders to build with PAN, grow the PAN ecosystem and strategically acquire the main token using protocol revenue.</p>
        </Reveal>
        <Reveal className="home-flywheel-visual delay-2">
          <div className="flywheel-core"><img src={`${import.meta.env.BASE_URL}PanLogo.png`} alt="" /><b>PAN</b></div>
          <div className="flywheel-track" />
          <div className="flywheel-energy-ring" aria-hidden="true" />
          {flywheelSteps.map(({ title, icon: Icon }, index) => <button type="button" className={`flywheel-step flywheel-step-${index + 1}`} style={{ "--pulse-delay": `${index * 2}s` }} aria-label={`Step ${index + 1}: ${title}`} aria-describedby={`flywheel-tooltip-${index + 1}`} key={title}>
            <span className="flywheel-step-number">{index + 1}</span>
            <Icon />
            <span className="flywheel-step-tooltip" id={`flywheel-tooltip-${index + 1}`} role="tooltip"><strong>{title}</strong></span>
          </button>)}
        </Reveal>
      </div>
    </section>

    <section className="home-section home-roadmap" id="roadmap">
      <Reveal><SectionHeading title="PAN is only getting started." copy="The product will continue to expand around a simple goal: make it dramatically easier to create and operate a strong Robinhood Chain project." /></Reveal>
      <div className="home-roadmap-list">
        {roadmap.map(({ title, copy }, index) => {
          const isOpen = openRoadmap === index;
          return <Reveal className={`delay-${index + 1}`} key={title}>
            <article className={isOpen ? "open" : ""}>
              <button type="button" onClick={() => setOpenRoadmap(isOpen ? -1 : index)} aria-expanded={isOpen}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{title}</h3></div>
                {index === 0 ? <em><i />Active</em> : null}
                <ChevronRight className="roadmap-chevron" />
              </button>
              <div className="roadmap-details"><p>{copy}</p></div>
            </article>
          </Reveal>;
        })}
      </div>
    </section>

    <section className="home-section home-hive-section">
      <Reveal className="home-hive-copy"><SectionHeading title="Every builder makes PAN smarter." copy="PAN works like a shared hive: every serious project adds new questions, patterns and real product feedback. As the builder community expands, PAN can improve its tools and intelligence for the whole ecosystem without exposing private project data." />
        <div className="home-hive-points"><p><strong>More builders</strong><span>More real launch and product use cases enter the ecosystem.</span></p><p><strong>Better intelligence</strong><span>PAN learns which tools, workflows and strategies builders actually need.</span></p><p><strong>A stronger hive</strong><span>Better capabilities attract the next wave of founders and products.</span></p></div>
      </Reveal>
      <Reveal className="home-hive-visual delay-2" aria-label="PAN beehive learning model">
        <div className="hive-cell hive-cell-1"><Bot /><span>Shared AI</span></div>
        <div className="hive-cell hive-cell-2"><Rocket /><span>Launches</span></div>
        <div className="hive-cell hive-cell-3"><LineChart /><span>Signals</span></div>
        <div className="hive-cell hive-cell-4"><Globe2 /><span>Products</span></div>
        <div className="hive-cell hive-cell-5"><MessageSquareText /><span>Feedback</span></div>
        <div className="hive-cell hive-cell-6"><WandSparkles /><span>New tools</span></div>
      </Reveal>
    </section>

    <section className="home-final-cta">
      <div className="final-cta-glow" />
      <Reveal><img src={`${import.meta.env.BASE_URL}PanLogo.png`} alt="" /><h2>Your next Robinhood Chain project starts with a conversation.</h2><p>Bring the idea. PAN helps turn it into something people can see, understand and remember.</p><div><Link className="home-primary-cta" to="/register">Start building with PAN<ArrowRight /></Link><Link className="home-secondary-cta" to="/login">Sign in</Link></div></Reveal>
    </section>

    <footer className="home-footer">
      <div><Link className="home-brand" to="/"><img src={`${import.meta.env.BASE_URL}PanLogo.png`} alt="" /><span>PAN.AI</span></Link><p>The Robinhood Chain project agent.</p></div>
      <div className="home-footer-links"><Link to="/terms">Terms</Link><Link to="/privacy">Privacy</Link><Link to="/cookies">Cookies</Link></div>
      <SocialLinks compact />
      <small>© {new Date().getFullYear()} PAN.AI. Built for Robinhood Chain.</small>
    </footer>
  </main>;
}
