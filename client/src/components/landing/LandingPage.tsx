import { useState, useEffect } from "react";
import Logo from "./Logo";
import {
  GitBranch,
  CheckCircle2,
  Flag,
  Code2,
  Shield,
  Star,
  Users,
  Activity,
  Award,
  Clock,
  Sparkles,
  Zap,
  Check,
  ChevronUp,
} from "lucide-react";
import confetti from "canvas-confetti";
import { motion } from "motion/react";
import GitCanvasBackground from "./GitCanvasBackground";
import LiveActivityTicker from "./LiveActivityTicker";
import AnimatedStat from "./AnimatedStat";
import "./landing.css";

interface LandingPageProps {
  onSignIn: () => void;
  onGetStarted: () => void;
}

export default function LandingPage({
  onSignIn,
  onGetStarted,
}: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#0891b2', '#0284c7', '#10b981', '#f59e0b'],
      });
    } catch {
      // fallback
    }
  };

  const handleGetStarted = () => {
    triggerCelebration();
    onGetStarted();
  };

  // Synchronize documentElement & body background to moderate light landing theme
  useEffect(() => {
    const prevDocBg = document.documentElement.style.backgroundColor;
    const prevBodyBg = document.body.style.backgroundColor;
    const prevBodyColor = document.body.style.color;

    document.documentElement.style.backgroundColor = "#eaf4f7";
    document.body.style.backgroundColor = "#eaf4f7";
    document.body.style.color = "#0f2a33";

    return () => {
      document.documentElement.style.backgroundColor = prevDocBg;
      document.body.style.backgroundColor = prevBodyBg;
      document.body.style.color = prevBodyColor;
    };
  }, []);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress =
        docHeight > 0
          ? Math.min(100, Math.max(0, (scrollY / docHeight) * 100))
          : 0;

      setScrolled(scrollY > 20);
      setScrollProgress(progress);
      setShowBackToTop(scrollY > 350);

      // Section spy for highlighting current nav link
      const sectionIds = [
        "features",
        "how-it-works",
        "stats",
        "testimonials",
        "pricing",
      ];
      let found = "";
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 140 && rect.bottom >= 140) {
            found = `#${id}`;
            break;
          }
        }
      }
      setActiveSection(found);

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(handleScroll);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#stats", label: "Stats" },
    { href: "#testimonials", label: "Testimonials" },
    { href: "#pricing", label: "Pricing" },
  ];

  const features = [
    {
      id: "feat-gitea",
      tag: "Self-Hosted Git",
      title: "Gitea Integration",
      description:
        "Zero-config repository provisioning. Every project gets a dedicated Gitea repo with webhook telemetry, SSH keys, and commit history.",
      icon: <GitBranch />,
      highlights: [
        "Automatic repo creation",
        "Real-time webhook sync",
        "SSH & Personal tokens",
      ],
    },
    {
      id: "feat-milestones",
      tag: "Project Lifecycle",
      title: "Milestone Submission Engine",
      description:
        "Structured progress stages with deliverables, deadlines, and direct file uploads. Keep teams on track with velocity analytics.",
      icon: <Flag />,
      highlights: [
        "Multi-phase deliverables",
        "Due date reminders",
        "S3 artifact storage",
      ],
    },
    {
      id: "feat-grading",
      tag: "Evaluation",
      title: "Supervisor Grading & Rubrics",
      description:
        "Comprehensive evaluation matrices with code quality checklists, letter grades, and threaded inline feedback boards.",
      icon: <Award />,
      highlights: [
        "Custom grading rubrics",
        "Letter & percentage marks",
        "Inline feedback discussion",
      ],
    },
    {
      id: "feat-sandbox",
      tag: "Interactive Execution",
      title: "Live In-Browser Code Sandbox",
      description:
        "Judge0-powered compilation container supporting 10+ languages (Python, TypeScript, C++, Java, Rust, Go) directly in the browser.",
      icon: <Code2 />,
      highlights: [
        "Isolated Linux runners",
        "Instant stdout / stderr",
        "Multi-language templates",
      ],
    },
    {
      id: "feat-collaboration",
      tag: "Team Dynamics",
      title: "Peer Group Management",
      description:
        "Invite classmates from the same academic batch, assign project ownership roles, and collaborate with synchronized permissions.",
      icon: <Users />,
      highlights: [
        "Batch peer search",
        "Role delegation (Lead/Member)",
        "Collaborative workspace",
      ],
    },
    {
      id: "feat-governance",
      tag: "Administration",
      title: "Academic Governance & Audits",
      description:
        "Manage degree courses, academic batches, CSV student bulk imports, platform audit streams, and Gitea instance health.",
      icon: <Shield />,
      highlights: [
        "Course & Batch cascades",
        "Audit log telemetry",
        "Gitea latency diagnostics",
      ],
    },
  ];

  const steps = [
    {
      step: "01",
      color: "#22d3ee",
      title: "Set Up Your Academic Batches",
      description:
        "Admins register degree courses and academic batches, invite faculty guides and students, and configure Gitea server webhooks.",
      icon: <Users size={22} />,
    },
    {
      step: "02",
      color: "#0ea5e9",
      title: "Create Capstone Projects & Milestones",
      description:
        "Define project deliverables, assign project supervisors, configure grading rubrics, and invite batch team members.",
      icon: <Flag size={22} />,
    },
    {
      step: "03",
      color: "#10b981",
      title: "Students Code & Commit",
      description:
        "Students clone repositories, push git commits from VS Code/terminal, and submit milestone artifacts without manual uploads.",
      icon: <GitBranch size={22} />,
    },
    {
      step: "04",
      color: "#f59e0b",
      title: "Automated Feedback & Capstone Defense",
      description:
        "Faculty evaluate milestone progress, test code in sandboxes, deliver threaded feedback, and assign final capstone grades.",
      icon: <Award size={22} />,
    },
  ];

  const stats = [
    { value: "500+", label: "Institutions", color: "#22d3ee", icon: "🏛️" },
    {
      value: "50,000+",
      label: "Active Students",
      color: "#0ea5e9",
      icon: "👨‍💻",
    },
    {
      value: "2.4M+",
      label: "Git Commits Tracked",
      color: "#10b981",
      icon: "🌿",
    },
    {
      value: "97.4%",
      label: "On-Time Milestone Rate",
      color: "#f59e0b",
      icon: "🎯",
    },
  ];

  const testimonials = [
    {
      quote:
        "GiteaForge LMS brought our final-year capstone reviews into the 21st century. Being able to inspect live commit feeds and evaluate code in-browser cut our review time in half.",
      name: "Dr. Eleanor Davis",
      role: "Head of Computer Science, Tech University",
      avatar: "👩‍🏫",
    },
    {
      quote:
        "No more emailing ZIP files! Having our Gitea repo connected directly to project milestones meant my team could focus on writing clean code and shipping features.",
      name: "Alex Chen",
      role: "Final Year CSE Student",
      avatar: "👨‍🎓",
    },
    {
      quote:
        "The academic batch management and system audit logs give our university complete transparency during accreditation audits. It is rock solid.",
      name: "Prof. Marcus Vance",
      role: "Dean of Engineering & Academic Affairs",
      avatar: "👨‍💼",
    },
  ];

  const plans = [
    {
      id: "plan-free",
      name: "Academic Community",
      price: "$0",
      period: "forever",
      description:
        "Ideal for individual student teams and small classroom pilots.",
      color: "#22d3ee",
      features: [
        "Up to 5 Projects",
        "Gitea Git repository sync",
        "Milestone submissions",
        "In-browser Code Sandbox",
        "Community discussions",
      ],
      popular: false,
    },
    {
      id: "plan-pro",
      name: "Department Pro",
      price: isAnnual ? "$39" : "$49",
      period: isAnnual ? "per month, billed annually" : "per month",
      description:
        "Complete capstone governance for university engineering departments.",
      color: "#06b6d4",
      features: [
        "Unlimited Degree Courses & Batches",
        "Gitea webhook synchronization",
        "Supervisor rubric grading checklists",
        "Judge0 Multi-language compiler",
        "Team member management",
        "Export CSV & Audit trail",
      ],
      popular: true,
    },
    {
      id: "plan-enterprise",
      name: "Campus Enterprise",
      price: "Custom",
      period: "annual billing",
      description:
        "Dedicated instance deployment for universities with SSO & custom branding.",
      color: "#10b981",
      features: [
        "Unlimited Everything",
        "Self-hosted Gitea cluster support",
        "SAML 2.0 / LDAP SSO integration",
        "Custom domain & university branding",
        "Dedicated SLA support",
        "Custom grading pipelines",
      ],
      popular: false,
    },
  ];

  const scrollToSection = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      const navElement = document.getElementById("navbar");
      const navHeight = navElement ? navElement.offsetHeight : 80;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navHeight;
      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="landing-root">
      {/* Animated Git Star-Nodes Background across entire landing page */}
      <GitCanvasBackground />

      {/* ================= SCROLL PROGRESS BAR ================= */}
      <div
        className="lnd-scroll-progress"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />

      {/* ================= NAVBAR ================= */}
      <nav
        id="navbar"
        className={`lnd-navbar ${scrolled ? "lnd-navbar--scrolled" : ""}`}
      >
        <div className="lnd-navbar__inner landing-container">
          <div
            className="lnd-navbar__logo"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <div className="lnd-navbar__logo-icon">
              <Logo size={38} />
            </div>
            <span className="lnd-navbar__logo-text">
              GiteaForge <span className="lnd-navbar__logo-lms">LMS</span>
            </span>
          </div>

          <ul className="lnd-navbar__links">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={(e) => scrollToSection(e, link.href)}
                  className={`lnd-navbar__link ${activeSection === link.href ? "lnd-navbar__link--active" : ""}`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="lnd-navbar__actions">
            <button onClick={onSignIn} className="btn-lnd btn-lnd--ghost">
              Sign In
            </button>
            <button onClick={onGetStarted} className="btn-lnd btn-lnd--primary">
              Get Started Free
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className={`lnd-navbar__hamburger ${menuOpen ? "lnd-navbar__hamburger--open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {/* Mobile dropdown */}
        <div
          className={`lnd-navbar__mobile ${menuOpen ? "lnd-navbar__mobile--open" : ""}`}
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => {
                setMenuOpen(false);
                scrollToSection(e, link.href);
              }}
              className={`lnd-navbar__mobile-link ${activeSection === link.href ? "lnd-navbar__mobile-link--active" : ""}`}
            >
              {link.label}
            </a>
          ))}
          <div className="lnd-navbar__mobile-actions">
            <button
              onClick={() => {
                setMenuOpen(false);
                onSignIn();
              }}
              className="btn-lnd btn-lnd--ghost"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onGetStarted();
              }}
              className="btn-lnd btn-lnd--primary"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* ================= HERO SECTION ================= */}
      <section className="hero relative">
        <div className="hero__bg">
          <div className="hero__orb hero__orb--1" />
          <div className="hero__orb hero__orb--2" />
          <div className="hero__orb hero__orb--3" />
          <div className="hero__grid" />
        </div>

        <div className="landing-container hero__inner relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="hero__content"
          >
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="landing-badge">
                <span className="badge__dot" />
                <span>v2.0 • Academic Git LMS</span>
              </div>
              <LiveActivityTicker />
            </div>

            <h1 className="hero__title">
              {/* Bridge classroom learning with <br /> */}
              Engineering Project Lifecycle & <br />
              {/* <span className="gradient-text">real-world Git workflows</span> */}
              <span className="gradient-text">Evaluation Platform</span>
            </h1>

            <p className="hero__subtitle">
              The project management & evaluation platform designed for modern
              engineering education.
            </p>

            <p className="hero__body">
              Automate Git repository management, track student milestone
              deliverables, evaluate code quality with custom supervisor
              rubrics, and run multi-language code in sandbox containers.
            </p>

            <div className="hero__cta">
              <button
                onClick={handleGetStarted}
                className="btn-lnd btn-lnd--primary btn-lnd--lg"
              >
                <Sparkles size={18} /> Get Started Free
              </button>
              <button
                onClick={onSignIn}
                className="btn-lnd btn-lnd--outline btn-lnd--lg"
              >
                Sign In to Portal
              </button>
            </div>

            <div className="hero__trust">
              <div className="hero__trust-item">
                <CheckCircle2 size={16} className="text-[#10b981]" />
                <span>Zero configuration for students</span>
              </div>
              <div className="hero__trust-item">
                <CheckCircle2 size={16} className="text-[#10b981]" />
                <span>Free for educators</span>
              </div>
              <div className="hero__trust-item">
                <CheckCircle2 size={16} className="text-[#10b981]" />
                <span>Gitea Webhook Telemetry</span>
              </div>
            </div>
          </motion.div>

          {/* Visual: Live Dashboard Preview with Telemetry Chips */}
          <div className="hero__visual relative">
            <div className="hero__dashboard-wrapper">
              <div className="hero__chip hero__chip--1">
                <div className="hero__chip-icon">🌿</div>
                <div>
                  <div className="hero__chip-label">Live Git Commits</div>
                  <div className="hero__chip-value">+248 today</div>
                </div>
              </div>

              <div className="hero__chip hero__chip--2">
                <div className="hero__chip-icon">⭐</div>
                <div>
                  <div className="hero__chip-label">Milestone Pass Rate</div>
                  <div className="hero__chip-value">97.4%</div>
                </div>
              </div>

              <div className="hero__chip hero__chip--3">
                <div className="hero__chip-icon">👥</div>
                <div>
                  <div className="hero__chip-label">Active Batch Students</div>
                  <div className="hero__chip-value">1,204</div>
                </div>
              </div>

              <img
                src="/dashboard.jpg"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
                alt="GiteaForge LMS Dashboard Preview"
                className="hero__dashboard-img"
              />
              <div className="hero__dashboard-glow" />
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURES SECTION ================= */}
      <section id="features" className="features">
        <div className="landing-container">
          <div className="section-header">
            <div className="landing-badge">
              <Zap size={13} /> Powerful Features
            </div>
            <h2 className="section-title">
              Everything required for <br />
              <span className="gradient-text">
                academic software engineering
              </span>
            </h2>
            <p className="section-subtitle">
              From day one project setup to final capstone grading, GiteaForge
              streamlines every step of the academic lifecycle.
            </p>
          </div>

          <div className="features__grid">
            {features.map((f, idx) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="feature-card"
              >
                <div className="feature-card__icon-wrapper">{f.icon}</div>
                <div className="feature-card__tag">{f.tag}</div>
                <h3 className="feature-card__title">{f.title}</h3>
                <p className="feature-card__desc">{f.description}</p>
                <ul className="feature-card__highlights">
                  {f.highlights.map((h) => (
                    <li key={h} className="feature-card__highlight">
                      <Check size={14} className="text-[#22c55e]" /> {h}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section id="how-it-works" className="hiw">
        <div className="landing-container">
          <div className="section-header">
            <div className="landing-badge">
              <Clock size={13} /> Seamless Workflow
            </div>
            <h2 className="section-title">
              From setup to capstone grading <br />
              <span className="gradient-text">in four simple steps</span>
            </h2>
            <p className="section-subtitle">
              Designed to get university departments operational with zero
              friction.
            </p>
          </div>

          <div className="hiw__steps">
            {steps.map((s, idx) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: idx * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="hiw__step"
                style={{ "--step-color": s.color } as any}
              >
                <div className="hiw__step-number">{s.step}</div>
                <div className="hiw__step-icon">{s.icon}</div>
                <h3 className="hiw__step-title">{s.title}</h3>
                <p className="hiw__step-desc">{s.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= STATS SECTION ================= */}
      <section id="stats" className="stats">
        <div className="landing-container">
          <div className="section-header">
            <div className="landing-badge">
              <Activity size={13} /> Platform Telemetry
            </div>
            <h2 className="section-title">
              Trusted by <span className="gradient-text">thousands</span> of
              educators & students
            </h2>
          </div>

          <div className="stats__grid">
            {stats.map((st) => (
              <AnimatedStat
                key={st.label}
                value={st.value}
                label={st.label}
                color={st.color}
                icon={st.icon}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section id="testimonials" className="testimonials">
        <div className="landing-container">
          <div className="section-header">
            <div className="landing-badge">
              <Star size={13} /> Testimonials
            </div>
            <h2 className="section-title">
              Loved by educators & students <br />
              <span className="gradient-text">
                across engineering institutions
              </span>
            </h2>
          </div>

          <div className="testimonials__grid">
            {testimonials.map((t, idx) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: idx * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="testimonial-card"
              >
                <div className="flex gap-1 text-[#f59e0b]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill="#f59e0b" />
                  ))}
                </div>
                <p className="testimonial-card__quote">"{t.quote}"</p>
                <div className="testimonial-card__author">
                  <div className="testimonial-card__avatar">{t.avatar}</div>
                  <div>
                    <div className="testimonial-card__name">{t.name}</div>
                    <div className="testimonial-card__role">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PRICING ================= */}
      <section id="pricing" className="pricing">
        <div className="landing-container">
          <div className="section-header">
            <div className="landing-badge">
              <Award size={13} /> Transparent Pricing
            </div>
            <h2 className="section-title">
              Simple plans for{" "}
              <span className="gradient-text">every academic institution</span>
            </h2>
            <p className="section-subtitle">
              Start free. Scale seamlessly with full department and campus
              governance.
            </p>
          </div>

          {/* Monthly / Annual Billing Toggle */}
          <div className="pricing-toggle-container">
            <span className={`pricing-toggle-label ${!isAnnual ? "active" : ""}`}>
              Monthly
            </span>
            <button
              type="button"
              className={`pricing-toggle-switch ${isAnnual ? "active" : ""}`}
              onClick={() => setIsAnnual(!isAnnual)}
              aria-label="Toggle annual or monthly pricing"
            >
              <div className="pricing-toggle-handle" />
            </button>
            <span className={`pricing-toggle-label ${isAnnual ? "active" : ""}`}>
              Annual Billing <span className="pricing-discount-pill">Save 20%</span>
            </span>
          </div>

          <div className="pricing__grid">
            {plans.map((p, idx) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: idx * 0.1 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className={`pricing-card ${p.popular ? "pricing-card--popular" : ""}`}
                style={{ "--plan-color": p.color } as any}
              >
                {p.popular && (
                  <div className="pricing-card__badge">
                    ★ Most Popular for Universities
                  </div>
                )}

                <div className="pricing-card__header">
                  <h3 className="pricing-card__name">{p.name}</h3>
                  <p className="pricing-card__desc">{p.description}</p>
                  <div className="pricing-card__price">
                    <span className="pricing-card__amount">{p.price}</span>
                    <span className="pricing-card__period">/{p.period}</span>
                  </div>
                </div>

                <ul className="pricing-card__features">
                  {p.features.map((f) => (
                    <li key={f} className="pricing-card__feature">
                      <Check size={15} /> {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={p.price === "$0" ? handleGetStarted : onGetStarted}
                  className={`btn-lnd btn-lnd--lg ${p.popular ? "btn-lnd--primary" : "btn-lnd--outline"}`}
                >
                  {p.price === "$0"
                    ? "Get Started Free"
                    : p.price === "Custom"
                      ? "Contact Campus Sales"
                      : "Start Department Trial"}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA SECTION ================= */}
      <section className="cta-section">
        <div className="landing-container">
          <div className="cta-section__card">
            <div className="cta-section__icon">🚀</div>
            <h2 className="cta-section__title">
              Ready to modernize <br />
              <span className="gradient-text">
                your academic Git workflows?
              </span>
            </h2>
            <p className="cta-section__subtitle">
              Join leading universities using GiteaForge LMS for transparent,
              automated, and engaging engineering project evaluation.
            </p>
            <div className="cta-section__actions">
              <button
                onClick={handleGetStarted}
                className="btn-lnd btn-lnd--primary btn-lnd--lg"
              >
                <Sparkles size={18} /> Get Started Free
              </button>
              <button
                onClick={onSignIn}
                className="btn-lnd btn-lnd--outline btn-lnd--lg"
              >
                Sign In to Portal
              </button>
            </div>
            <p className="cta-section__note">
              No credit card required • Free forever for academic institutions
            </p>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="lnd-footer">
        <div className="lnd-footer__top">
          <div className="landing-container lnd-footer__inner">
            <div className="lnd-footer__brand">
              <div className="lnd-footer__logo">
                <Logo size={36} />
                <span className="lnd-footer__logo-text">
                  GiteaForge <span className="lnd-navbar__logo-lms">LMS</span>
                </span>
              </div>
              <p className="lnd-footer__tagline">
                Engineering Project Lifecycle & Evaluation Platform with real-world Git workflows. The project management & evaluation platform designed for modern engineering education.
              </p>
            </div>

            <div className="lnd-footer__links">
              <div>
                <h4 className="lnd-footer__col-title">Platform</h4>
                <ul className="lnd-footer__col-links">
                  <li>
                    <a href="#features" className="lnd-footer__link">
                      Gitea Repos
                    </a>
                  </li>
                  <li>
                    <a href="#features" className="lnd-footer__link">
                      Milestone Engine
                    </a>
                  </li>
                  <li>
                    <a href="#features" className="lnd-footer__link">
                      Supervisor Grading
                    </a>
                  </li>
                  <li>
                    <a href="#features" className="lnd-footer__link">
                      Code Sandbox
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="lnd-footer__col-title">Portals</h4>
                <ul className="lnd-footer__col-links">
                  <li>
                    <button
                      onClick={onSignIn}
                      className="lnd-footer__link text-left"
                    >
                      Student Portal
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={onSignIn}
                      className="lnd-footer__link text-left"
                    >
                      Supervisor Portal
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={onSignIn}
                      className="lnd-footer__link text-left"
                    >
                      Admin Governance
                    </button>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="lnd-footer__col-title">Resources</h4>
                <ul className="lnd-footer__col-links">
                  <li>
                    <a href="#" onClick={onSignIn} className="lnd-footer__link">
                      Documentation
                    </a>
                  </li>
                  <li>
                    <a href="#" onClick={onSignIn} className="lnd-footer__link">
                      API Reference
                    </a>
                  </li>
                  <li>
                    <a href="#" onClick={onSignIn} className="lnd-footer__link">
                      Webhook Specs
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="lnd-footer__col-title">Academic</h4>
                <ul className="lnd-footer__col-links">
                  <li>
                    <a href="#" onClick={onSignIn} className="lnd-footer__link">
                      For Universities
                    </a>
                  </li>
                  <li>
                    <a href="#" onClick={onSignIn} className="lnd-footer__link">
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="#" onClick={onSignIn} className="lnd-footer__link">
                      Terms of Service
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="lnd-footer__bottom">
          <div className="landing-container lnd-footer__bottom-inner">
            <p className="lnd-footer__copy">
              © {new Date().getFullYear()} GiteaForge LMS. All rights reserved.
            </p>
            <p className="lnd-footer__credit">
              Academic Platform • Built with ❤️ for Engineering
              Education
            </p>
          </div>
        </div>
      </footer>

      {/* ================= FLOATING BACK TO TOP BUTTON ================= */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`lnd-back-to-top ${showBackToTop ? "lnd-back-to-top--visible" : ""}`}
        aria-label="Back to top"
        title="Back to top"
      >
        <ChevronUp size={22} />
        <svg
          className="lnd-back-to-top__ring"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray="125.6"
            strokeDashoffset={125.6 - (125.6 * scrollProgress) / 100}
          />
        </svg>
      </button>
    </div>
  );
}
