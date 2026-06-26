"use client";

import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import styles from "./landing.module.css";
import Link from "next/link";

export default function LandingPage() {
  const canvasRef = useRef(null);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  useEffect(() => {
    if (!scriptsLoaded || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    const frameCount = 480;
    const currentFrame = (index) =>
      `/frames/frames_${String(index + 1).padStart(4, "0")}.jpg`;

    const images = [];
    const airship = { frame: 0 };

    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.src = currentFrame(i);
      images.push(img);
    }

    gsap.registerPlugin(ScrollTrigger);

    gsap.to(airship, {
      frame: frameCount - 1,
      snap: "frame",
      ease: "none",
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5,
      },
      onUpdate: () => render(),
    });

    const render = () => {
      const img = images[airship.frame];
      if (!img || !img.complete) return;

      const dpr = window.devicePixelRatio || 1;
      const logicalWidth = window.innerWidth;
      const logicalHeight = window.innerHeight;

      // Set internal resolution based on device pixel ratio for "HD" quality
      canvas.width = logicalWidth * dpr;
      canvas.height = logicalHeight * dpr;

      const imgWidth = img.width;
      const imgHeight = img.height;
      const ratio = Math.max(logicalWidth / imgWidth, logicalHeight / imgHeight);
      
      const newWidth = imgWidth * ratio;
      const newHeight = imgHeight * ratio;
      
      // Center the image
      const x = (logicalWidth - newWidth) / 2;
      const y = (logicalHeight - newHeight) / 2;

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.save();
      context.scale(dpr, dpr); // Scale all drawing by DPR
      context.drawImage(img, x, y, newWidth, newHeight);
      context.restore();
    };

    images[0].onload = render;
    window.addEventListener("resize", render);

    return () => {
      window.removeEventListener("resize", render);
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [scriptsLoaded]);

  return (
    <div className={styles.landing}>
      {/* ── Navbar ── */}
      <header className={styles.navbar}>
        <div className={styles.navLeft}>
          <Link href="/" className={styles.logo}>
            <span className="material-icons" style={{ color: "var(--primary-container)", fontSize: 28 }}>auto_awesome</span>
            <span>Ledge AI</span>
          </Link>
        </div>
        <nav className={styles.navLinks}>
          <Link href="/">Home</Link>
          <Link href="#">Docs</Link>
          <Link href="#">Support</Link>
        </nav>
        <div className={styles.navRight}>
          <Link href="/dashboard" className="btn-ghost">Sign In</Link>
          <Link href="/dashboard" className="btn-primary">Get Started</Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          <span className="material-icons" style={{ fontSize: 14 }}>bolt</span>
          Enterprise-Grade AI Engine
        </div>
        <h1 className={styles.heroTitle}>
          Transform Invoice<br />
          Chaos into <span className={styles.heroGradient}>AI Clarity</span>
        </h1>
        <p className={styles.heroSub}>
          The definitive ledger for high-growth enterprises. Automate invoice processing,
          detect anomalies instantly, and unlock deep financial intelligence with Ledge AI.
        </p>
        <div className={styles.heroCtas}>
          <Link href="/dashboard" className="btn-primary" style={{ padding: "14px 32px", fontSize: "1rem" }}>
            Start Analyzing
            <span className="material-icons" style={{ fontSize: 18 }}>arrow_forward</span>
          </Link>
          <Link href="#features" className="btn-ghost" style={{ padding: "14px 32px", fontSize: "1rem" }}>
            See How It Works
          </Link>
        </div>
        <div className={styles.heroGlow}></div>
      </section>

      {/* ── Features ── */}
      <section id="features" className={styles.features}>
        <p className="label" style={{ textAlign: "center", marginBottom: 8 }}>CAPABILITIES</p>
        <h2 style={{ textAlign: "center", marginBottom: 64 }}>Engineered for Precision</h2>
        <div className={`${styles.featureGrid} stagger`}>
          <div className={`glass-card ${styles.featureCard} animate-fade-in-up`}>
            <div className={styles.featureIcon}>
              <span className="material-icons">document_scanner</span>
            </div>
            <h4>Automated Data Extraction</h4>
            <p>
              Ledge AI reads and understands every line item on your invoices with 99.9% accuracy.
              No more manual entry—just pure data flow.
            </p>
          </div>
          <div className={`glass-card ${styles.featureCard} animate-fade-in-up`}>
            <div className={styles.featureIcon}>
              <span className="material-icons">shield</span>
            </div>
            <h4>Anomaly Detection</h4>
            <p>
              Stop fraud and errors before they hit your books. We catch duplicates,
              inflated amounts, and phantom vendors instantly.
            </p>
          </div>
          <div className={`glass-card ${styles.featureCard} animate-fade-in-up`}>
            <div className={styles.featureIcon}>
              <span className="material-icons">insights</span>
            </div>
            <h4>Actionable Insights</h4>
            <p>
              Move beyond spreadsheets. Get predictive cash flow analysis and vendor
              performance scores in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className={styles.testimonials}>
        <p className="label" style={{ textAlign: "center", marginBottom: 8 }}>TRUSTED BY LEADERS</p>
        <h2 style={{ textAlign: "center", marginBottom: 64 }}>The Pro Standard</h2>
        <div className={`${styles.testimonialGrid} stagger`}>
          {[
            {
              quote: "Ledge AI has completely transformed our AP workflow. What used to take a team of three now runs on autopilot with better accuracy than we ever achieved manually.",
              name: "Sarah Chen",
              role: "CFO, Apex Dynamics",
            },
            {
              quote: "The anomaly detection alone paid for the software in its first week. It caught a duplicate payment that would have cost us six figures. Essential kit.",
              name: "Marcus Webb",
              role: "Finance Director, Nova Corp",
            },
            {
              quote: "The UI is a breath of fresh air. It feels like a premium instrument rather than a clunky enterprise tool. My team actually enjoys using it every day.",
              name: "Priya Nair",
              role: "VP Finance, Orion Labs",
            },
          ].map((t, i) => (
            <div key={i} className={`${styles.testimonialCard} animate-fade-in-up`}>
              <div className={styles.quoteIcon}>"</div>
              <p className={styles.quoteText}>{t.quote}</p>
              <div className={styles.quoteAuthor}>
                <div className={styles.authorAvatar}>{t.name[0]}</div>
                <div>
                  <p className={styles.authorName}>{t.name}</p>
                  <p className={styles.authorRole}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.ctaSection}>
        <h2>Ready to master your ledger?</h2>
        <p>
          Join thousands of finance leaders who trust Ledge AI to bring clarity
          to their financial operations.
        </p>
        <div className={styles.ctaForm}>
          <input type="email" placeholder="Enter your work email" className={styles.ctaInput} />
          <button className="btn-primary" style={{ padding: "14px 28px" }}>
            Get Started Free
            <span className="material-icons" style={{ fontSize: 18 }}>arrow_forward</span>
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="page-footer">
        <p className="copyright">© 2024 Ledge AI Financial. All rights reserved.</p>
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Security</a>
          <a href="#">Status</a>
        </div>
      </footer>
      {/* ── Background Animation Canvas ── */}
      <section className={styles.canvasSection}>
        <canvas ref={canvasRef} className={styles.sequenceCanvas} />
      </section>

      {/* ── External Scripts ── */}
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js" 
        strategy="afterInteractive"
      />
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js" 
        strategy="afterInteractive"
        onLoad={() => setScriptsLoaded(true)}
      />
    </div>
  );
}
