import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  ChevronRight,
  CircleDollarSign,
  Coins,
  ExternalLink,
  FileText,
  Globe2,
  Image,
  Layers3,
  LineChart,
  Menu,
  MessageSquareText,
  Network,
  Rocket,
  WandSparkles,
  X as CloseIcon,
  Zap,
} from "lucide-react";


const featureCards = [
  {
    icon: Bot,
    eyebrow: "CHAIN-NATIVE INTELLIGENCE",
    title: "An AI built around Robinhood Chain",
    copy: "PAN focuses on the ecosystem you are actually launching into, helping with the coin, positioning, creative direction and launch decisions from one conversation.",
  },
  {
    icon: Layers3,
    eyebrow: "ONE WORKSPACE",
    title: "The entire project stays connected",
    copy: "Your brief, coin details, imagery, website, launch preparation and live status all remain together instead of being scattered across unrelated tools.",
  },
  {
    icon: WandSparkles,
    eyebrow: "IDEA TO EXECUTION",
    title: "Build without wrestling with every step",
    copy: "Explain what you want in plain English. PAN turns the idea into something structured, polished and ready to move toward market.",
  },
  {
    icon: Zap,
    eyebrow: "ALWAYS IMPROVING",
    title: "A product designed to get smarter",
    copy: "PAN will keep expanding with stronger intelligence, more creative tools and deeper support for projects across Robinhood Chain.",
  },
];

const roadmap = [
  {
    phase: "LIVE NOW",
    title: "Launch workspace",
    copy: "PAN already has a deep understanding of Robinhood Chain, how launches behave and what helps coins stand out. It combines user feedback and questions with its own research tools so its knowledge keeps expanding. PAN can already plan launches, create coin visuals and build complete frontend and backend websites for projects.",
  },
  {
    phase: "NEXT",
    title: "Airdrops and marketing",
    copy: "PAN will gift free credits and $PAN tokens to people who support the project and use @PanAiApp on X. Campaigns will reward useful posts, launch content and genuine community participation.",
  },
  {
    phase: "GROWING",
    title: "Smarter market intelligence",
    copy: "We plan to hire specialists to train PAN specifically on Robinhood Chain, launch strategies, positioning and the tactics that help coins succeed. We will also make its responses faster, clearer and more useful as the model and research systems improve.",
  },
  {
    phase: "EXPANDING",
    title: "More creation tools",
    copy: "PAN will gain tools to manage social media accounts for each coin and create complete social media and marketing plans around the project's exact niche and needs. More launch, content and growth tools will continue to be added.",
  },
];

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Reveal({ className = "", children }) {
  return <div className={`home-reveal ${className}`}>{children}</div>;
}

function SectionHeading({ eyebrow, title, copy, align = "left" }) {
  return <div className={`home-section-heading ${align === "center" ? "center" : ""}`}>
    <span>{eyebrow}</span>
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
        <em>ONLINE</em>
      </div>
      <div className="hero-workspace-body">
        <aside>
          <div className="hero-mini-brand"><img src={`${base}PanLogo.png`} alt="PAN.AI" /><b>PAN.AI</b></div>
          <span className="hero-side-button"><i>+</i>New project</span>
          <small>PROJECTS</small>
          <div className="hero-project active"><img src={`${base}PanLogo.png`} alt="" /><div><b>PAN.AI</b><small>Ready to launch</small></div></div>
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
          <header><small>COIN DETAILS</small><em>Ready</em></header>
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
  const ponsUrl = import.meta.env.VITE_PONS_TOKEN_URL || "https://pons.family";
  const whitepaperUrl = import.meta.env.VITE_WHITEPAPER_URL;

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

  return <main className="home-page">
    <div className="home-noise" />
    <header className="home-nav">
      <Link className="home-brand" to="/" aria-label="PAN.AI home"><img src={`${import.meta.env.BASE_URL}PanLogo.png`} alt="" /><span>PAN.AI</span></Link>
      <nav className={menuOpen ? "open" : ""}>
        <button onClick={() => navigateSection("product")}>Product</button>
        <button onClick={() => navigateSection("why-pan")}>Why PAN</button>
        <button onClick={() => navigateSection("tokenomics")}>Tokenomics</button>
        <button onClick={() => navigateSection("roadmap")}>Roadmap</button>
        <button onClick={() => navigateSection("whitepaper")}>Whitepaper</button>
      </nav>
      <div className="home-nav-actions">
        <Link className="home-nav-cta" to="/login">Sign in</Link>
        <Link className="home-sign-in" to="/register">Sign up</Link>
      </div>
      <button className="home-menu-button" onClick={() => setMenuOpen((value) => !value)} aria-label="Toggle navigation">{menuOpen ? <CloseIcon /> : <Menu />}</button>
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
      <Reveal><SectionHeading eyebrow="BUILT FOR A BETTER LAUNCH" title="One focused AI for the whole project." copy="Most coin launches are fragmented across research, design, websites, wallets and launch tools. PAN brings the important parts into one clear workflow built around Robinhood Chain." align="center" /></Reveal>
      <div className="home-feature-grid">
        {featureCards.map(({ icon: Icon, eyebrow, title, copy }, index) => <Reveal className={`home-feature-card delay-${index + 1}`} key={title}><article><span className="home-feature-icon"><Icon /></span><small>{eyebrow}</small><h3>{title}</h3><p>{copy}</p><i className="home-card-line" /></article></Reveal>)}
      </div>
    </section>

    <section className="home-section home-workflow" id="how-it-works">
      <Reveal className="home-workflow-copy"><SectionHeading eyebrow="HOW IT WORKS" title="Go from a rough idea to a real project." copy="You do not need to arrive with every detail worked out. Start with the idea and PAN helps shape the rest." />
        <div className="home-workflow-list">
          <article><span>01</span><div><h3>Describe what you want to build</h3><p>Give PAN the concept, style, audience or even just the feeling you want the coin to have.</p></div></article>
          <article><span>02</span><div><h3>Build the project in one workspace</h3><p>Develop the identity, coin details, visual assets and website while PAN keeps everything aligned.</p></div></article>
          <article><span>03</span><div><h3>Launch through Pons</h3><p>Prepare the project for Robinhood Chain and move from draft to a live coin using PAN’s chosen launchpad.</p></div></article>
        </div>
        <Link className="home-inline-link" to="/register">Create your first project<ArrowRight /></Link>
      </Reveal>
      <Reveal className="home-workflow-graphic delay-2">
        <div className="workflow-orbit">
          <div className="workflow-core"><img src={`${import.meta.env.BASE_URL}PanLogo.png`} alt="" /><span>PAN</span></div>
          <div className="workflow-ring ring-one" />
          <div className="workflow-ring ring-two" />
          <span className="workflow-node node-one"><MessageSquareText /><b>Idea</b></span>
          <span className="workflow-node node-two"><Image /><b>Brand</b></span>
          <span className="workflow-node node-three"><Globe2 /><b>Website</b></span>
          <span className="workflow-node node-four"><Rocket /><b>Pons</b></span>
          <span className="workflow-node node-five"><LineChart /><b>Live</b></span>
        </div>
      </Reveal>
    </section>

    <section className="home-section home-pons-section">
      <Reveal className="home-pons-card">
        <div className="home-pons-copy"><span className="home-pons-icon"><Rocket /></span><div><small>CHOSEN LAUNCHPAD</small><h2>PAN launches with Pons.</h2><p>Pons is the launchpad PAN is being built around for Robinhood Chain. The goal is a cleaner path from the project workspace to a live coin, without making users stitch the process together themselves.</p><a href={ponsUrl} target="_blank" rel="noreferrer">Explore $PAN on Pons<ExternalLink /></a></div></div>
        <div className="home-chain-graphic"><span className="chain-point point-a" /><span className="chain-point point-b" /><span className="chain-point point-c" /><span className="chain-point point-d" /><i className="chain-line line-a" /><i className="chain-line line-b" /><i className="chain-line line-c" /><div><Network /><b>Robinhood Chain</b><small>Built for the ecosystem</small></div><em><Rocket /><b>Pons</b><small>Launchpad</small></em></div>
      </Reveal>
    </section>

    <section className="home-section home-tokenomics" id="tokenomics">
      <Reveal><SectionHeading eyebrow="$PAN TOKENOMICS" title="Utility that grows with the product." copy="$PAN is designed around access, usage and participation in the PAN ecosystem, not empty complexity. Exact contract and allocation details can be published transparently through the whitepaper and Pons listing." align="center" /></Reveal>
      <div className="home-token-layout">
        <Reveal className="home-token-visual">
          <div className="token-orb"><div><img src={`${import.meta.env.BASE_URL}PanLogo.png`} alt="" /><b>$PAN</b><small>ECOSYSTEM TOKEN</small></div><i className="token-ring token-ring-one" /><i className="token-ring token-ring-two" /></div>
          <span className="token-flow token-flow-one">AI usage<i /></span>
          <span className="token-flow token-flow-two">Community<i /></span>
          <span className="token-flow token-flow-three">Expansion<i /></span>
        </Reveal>
        <div className="home-token-cards">
          <Reveal className="delay-1"><article><span><CircleDollarSign /></span><div><small>CORE UTILITY</small><h3>Credits used for AI</h3><p>$PAN can be used to fund PAN credits. Whenever a user purchases credits, PAN tokens are burned or bought back, connecting product usage directly to the token.</p></div></article></Reveal>
          <Reveal className="delay-2"><article><span><Coins /></span><div><small>COMMUNITY</small><h3>Rewards participation</h3><p>Community campaigns can reward useful attention, content and participation with $PAN, credits or both.</p></div></article></Reveal>
          <Reveal className="delay-3"><article><span><Rocket /></span><div><small>LONG-TERM UTILITY</small><h3>More value as PAN expands</h3><p>As new capabilities are added, the token can support a wider set of creation, launch and project management functions.</p></div></article></Reveal>
        </div>
      </div>
    </section>

    <section className="home-section home-roadmap" id="roadmap">
      <Reveal><SectionHeading eyebrow="THE DIRECTION" title="PAN is only getting started." copy="The product will continue to expand around a simple goal: make it dramatically easier to create and operate a strong Robinhood Chain project." /></Reveal>
      <div className="home-roadmap-list">
        {roadmap.map(({ phase, title, copy }, index) => {
          const isOpen = openRoadmap === index;
          return <Reveal className={`delay-${index + 1}`} key={title}>
            <article className={isOpen ? "open" : ""}>
              <button type="button" onClick={() => setOpenRoadmap(isOpen ? -1 : index)} aria-expanded={isOpen}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><small>{phase}</small><h3>{title}</h3></div>
                {index === 0 ? <em><i />Active</em> : null}
                <ChevronRight className="roadmap-chevron" />
              </button>
              <div className="roadmap-details"><p>{copy}</p></div>
            </article>
          </Reveal>;
        })}
      </div>
    </section>

    <section className="home-section home-whitepaper" id="whitepaper">
      <Reveal>
        <SectionHeading eyebrow="PAN WHITEPAPER" title="Read the full PAN vision." copy="Explore how PAN is being built for Robinhood Chain, how $PAN connects to product usage, why Pons is the chosen launchpad and how the platform will continue to grow." align="center" />
        <div className="home-whitepaper-actions">
          {whitepaperUrl ? <a className="home-primary-cta" href={whitepaperUrl} target="_blank" rel="noreferrer">Open the whitepaper<FileText /></a> : <span className="whitepaper-coming-soon"><FileText />Whitepaper link coming soon</span>}
        </div>
      </Reveal>
    </section>

    <section className="home-final-cta">
      <div className="final-cta-glow" />
      <Reveal><img src={`${import.meta.env.BASE_URL}PanLogo.png`} alt="" /><span>PROJECT AGENT NETWORK</span><h2>Your next Robinhood Chain project starts with a conversation.</h2><p>Bring the idea. PAN helps turn it into something people can see, understand and remember.</p><div><Link className="home-primary-cta" to="/register">Start building with PAN<ArrowRight /></Link><Link className="home-secondary-cta" to="/login">Sign in</Link></div></Reveal>
    </section>

    <footer className="home-footer">
      <div><Link className="home-brand" to="/"><img src={`${import.meta.env.BASE_URL}PanLogo.png`} alt="" /><span>PAN.AI</span></Link><p>The Robinhood Chain project agent.</p></div>
      <div className="home-footer-links"><button onClick={() => scrollToSection("why-pan")}>Why PAN</button><button onClick={() => scrollToSection("tokenomics")}>Tokenomics</button><button onClick={() => scrollToSection("roadmap")}>Roadmap</button><button onClick={() => scrollToSection("whitepaper")}>Whitepaper</button></div>
      <SocialLinks compact />
      <small>© {new Date().getFullYear()} PAN.AI. Built for Robinhood Chain.</small>
    </footer>
  </main>;
}
