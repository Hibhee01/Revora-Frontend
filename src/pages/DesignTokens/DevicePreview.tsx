import { useEffect, useRef } from "react";
import "./DevicePreview.css";

interface DevicePreviewProps {
  surface: "light" | "dark";
}

export function DevicePreview({ surface }: DevicePreviewProps) {
  const mobileRef = useRef<HTMLDivElement>(null);
  const tabletRef = useRef<HTMLDivElement>(null);
  const desktopRef = useRef<HTMLDivElement>(null);

  // Sync scrolling
  useEffect(() => {
    const frames = [mobileRef.current, tabletRef.current, desktopRef.current].filter(Boolean) as HTMLDivElement[];
    
    let isSyncingLeftScroll = false;
    
    const handleScroll = (e: Event) => {
      if (isSyncingLeftScroll) return;
      
      const target = e.target as HTMLDivElement;
      const scrollRatio = target.scrollTop / (target.scrollHeight - target.clientHeight);
      
      isSyncingLeftScroll = true;
      
      frames.forEach((frame) => {
        if (frame !== target && frame.scrollHeight > frame.clientHeight) {
          frame.scrollTop = scrollRatio * (frame.scrollHeight - frame.clientHeight);
        }
      });
      
      window.requestAnimationFrame(() => {
        isSyncingLeftScroll = false;
      });
    };

    frames.forEach((frame) => frame.addEventListener("scroll", handleScroll));
    return () => {
      frames.forEach((frame) => frame.removeEventListener("scroll", handleScroll));
    };
  }, []);

  const SamplePage = () => (
    <div className="dp-sample-page">
      <header className="dp-header glass-card">
        <h3 className="dp-title">Sample App</h3>
        <nav className="dp-nav">
          <span>Home</span>
          <span>Settings</span>
        </nav>
      </header>
      <main className="dp-main">
        <section className="dp-hero">
          <h1 style={{ fontSize: "var(--font-size-3xl)", fontWeight: "var(--font-weight-bold)" }}>
            Welcome Back
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: "var(--spacing-sm)" }}>
            This is a preview of how design tokens apply across devices.
          </p>
          <button className="dp-primary-btn" style={{ marginTop: "var(--spacing-lg)" }}>
            Get Started
          </button>
        </section>
        
        <div className="dp-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="dp-card glass-card">
              <div className="dp-card-icon" />
              <h4 className="dp-card-title">Feature {i}</h4>
              <p className="dp-card-desc">
                Responsive design tokens in action.
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );

  return (
    <section className="dt-device-preview" aria-label="Device Theme Preview">
      <div className="dt-preview-header">
        <h2 className="dt-section-title">Responsive Theme Preview</h2>
        <p className="dt-page-subtitle">Scroll one frame to sync across all devices.</p>
      </div>
      
      <div className="dt-devices-container">
        {/* Mobile Frame */}
        <div className="dt-device-frame dt-mobile">
          <div className="dt-device-chrome">
            <span className="dt-camera" />
            <span className="dt-speaker" />
          </div>
          <div className="dt-device-viewport" ref={mobileRef} tabIndex={0} aria-label="Mobile Preview">
            <SamplePage />
          </div>
        </div>

        {/* Tablet Frame */}
        <div className="dt-device-frame dt-tablet">
          <div className="dt-device-chrome">
            <span className="dt-camera" />
          </div>
          <div className="dt-device-viewport" ref={tabletRef} tabIndex={0} aria-label="Tablet Preview">
            <SamplePage />
          </div>
        </div>

        {/* Desktop Frame */}
        <div className="dt-device-frame dt-desktop">
          <div className="dt-device-chrome dt-desktop-chrome">
            <div className="dt-window-controls">
              <span className="dt-dot close" />
              <span className="dt-dot minimize" />
              <span className="dt-dot maximize" />
            </div>
            <div className="dt-address-bar">example.com</div>
          </div>
          <div className="dt-device-viewport" ref={desktopRef} tabIndex={0} aria-label="Desktop Preview">
            <SamplePage />
          </div>
        </div>
      </div>
    </section>
  );
}
