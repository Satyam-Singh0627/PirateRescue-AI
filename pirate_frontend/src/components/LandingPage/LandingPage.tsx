import React from 'react';
import { RescueGlobe3D } from './RescueGlobe3D';
import { CompassRoseWatermark } from '../CompassRoseWatermark';
import '../../styles/landing.css';

interface LandingPageProps {
  onLaunchPlatform: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchPlatform }) => {
  const handleNavScroll = (e: React.MouseEvent<HTMLElement>, targetId: string) => {
    e.preventDefault();
    if (targetId === 'overview' || targetId === 'top') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
      window.history.pushState(null, '', '#');
      return;
    }

    const element = document.getElementById(targetId);
    if (element) {
      const navElement = document.querySelector('.pirate-nav-frame');
      const navHeight = navElement ? navElement.getBoundingClientRect().height : 72;
      const elementRect = element.getBoundingClientRect();
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop || 0;
      // Generous 28px buffer ensures section headers start cleanly AFTER the sticky navbar
      const targetY = elementRect.top + currentScroll - navHeight - 28;

      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: 'smooth',
      });

      try {
        window.history.pushState(null, '', `#${targetId}`);
      } catch {
        // Safe fallback
      }
    }
  };

  // Automatically scroll to target section if page loads or changes with a section hash
  React.useEffect(() => {
    const handleInitialHash = () => {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash && hash !== 'operations' && hash !== 'platform') {
        const element = document.getElementById(hash);
        if (element) {
          setTimeout(() => {
            const navElement = document.querySelector('.pirate-nav-frame');
            const navHeight = navElement ? navElement.getBoundingClientRect().height : 72;
            const elementRect = element.getBoundingClientRect();
            const currentScroll = window.pageYOffset || document.documentElement.scrollTop || 0;
            const targetY = elementRect.top + currentScroll - navHeight - 28;
            window.scrollTo({
              top: Math.max(0, targetY),
              behavior: 'smooth',
            });
          }, 120);
        }
      }
    };

    handleInitialHash();
    window.addEventListener('hashchange', handleInitialHash);
    return () => window.removeEventListener('hashchange', handleInitialHash);
  }, []);

  return (
    <div className="pirate-landing">
      {/* ── HANGING NAUTICAL OIL LANTERNS WITH FLICKERING FLAME ── */}
      <div className="hanging-lantern lantern-top-right">
        <svg className="lantern-svg" viewBox="0 0 70 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Hanging chain */}
          <line x1="35" y1="0" x2="35" y2="25" stroke="#4A3018" strokeWidth="3" strokeDasharray="4 2" />
          <circle cx="35" cy="26" r="4" stroke="#D4A758" strokeWidth="2" fill="#2E1C0F" />
          {/* Lantern Brass Cap */}
          <path d="M22 32 L48 32 L44 42 L26 42 Z" fill="#A87B32" stroke="#5E4018" strokeWidth="1.5" />
          <path d="M15 42 L55 42 L52 48 L18 48 Z" fill="#C59A45" stroke="#5E4018" strokeWidth="1.5" />
          {/* Glass Cage */}
          <path d="M18 48 L52 48 L48 94 L22 94 Z" fill="rgba(255, 210, 120, 0.2)" stroke="#5E4018" strokeWidth="2" />
          {/* Candle Flame / Warm Glow */}
          <circle cx="35" cy="74" r="16" fill="radial-gradient(circle, #FFE485 0%, #FF9900 60%, transparent 100%)" opacity="0.85" />
          <path d="M35 58 C38 66, 42 74, 35 84 C28 74, 32 66, 35 58 Z" fill="#FFEAA7" />
          <ellipse cx="35" cy="76" rx="4" ry="7" fill="#FF7675" />
          {/* Brass Base */}
          <path d="M16 94 L54 94 L58 106 L12 106 Z" fill="#A87B32" stroke="#5E4018" strokeWidth="2" />
        </svg>
      </div>

      <div className="hanging-lantern lantern-bottom-left">
        <svg className="lantern-svg" viewBox="0 0 70 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="35" y1="0" x2="35" y2="25" stroke="#4A3018" strokeWidth="3" strokeDasharray="4 2" />
          <circle cx="35" cy="26" r="4" stroke="#D4A758" strokeWidth="2" fill="#2E1C0F" />
          <path d="M22 32 L48 32 L44 42 L26 42 Z" fill="#A87B32" stroke="#5E4018" strokeWidth="1.5" />
          <path d="M15 42 L55 42 L52 48 L18 48 Z" fill="#C59A45" stroke="#5E4018" strokeWidth="1.5" />
          <path d="M18 48 L52 48 L48 94 L22 94 Z" fill="rgba(255, 210, 120, 0.2)" stroke="#5E4018" strokeWidth="2" />
          <circle cx="35" cy="74" r="16" fill="radial-gradient(circle, #FFE485 0%, #FF9900 60%, transparent 100%)" opacity="0.85" />
          <path d="M35 58 C38 66, 42 74, 35 84 C28 74, 32 66, 35 58 Z" fill="#FFEAA7" />
          <ellipse cx="35" cy="76" rx="4" ry="7" fill="#FF7675" />
          <path d="M16 94 L54 94 L58 106 L12 106 Z" fill="#A87B32" stroke="#5E4018" strokeWidth="2" />
        </svg>
      </div>

      {/* Jolly Roger Flag bottom right */}
      <div className="pirate-flag-badge">
        <span>🏴‍☠️</span>
        <span>11-09-2026</span>
      </div>

      {/* ── CARVED WOODEN TOP NAVIGATION BAR ─────────────────── */}
      <header className="pirate-nav-frame">
        <div className="pirate-nav-inner">
          {/* Brand */}
          <div 
            className="pirate-brand" 
            onClick={(e) => handleNavScroll(e, 'overview')}
            role="button"
            tabIndex={0}
            title="Return to top"
          >
            <div className="pirate-brand-emblem">
              {/* Compass Rose SVG */}
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="#8B2500" stroke="#26160A" />
              </svg>
            </div>
            <div className="pirate-brand-text">
              PIRATE RESCUE <span>- ADVENTURE &amp; RECOVERY</span>
            </div>
          </div>

          {/* Center Parchment Ribbon Tabs */}
          <nav className="pirate-nav-scroll">
            <span className="wax-seal" />
            <a href="#mission" className="pirate-nav-link" onClick={(e) => handleNavScroll(e, 'mission')}>Mission Challenge</a>
            <a href="#algorithms" className="pirate-nav-link" onClick={(e) => handleNavScroll(e, 'algorithms')}>AI Algorithms</a>
            <a href="#innovations" className="pirate-nav-link" onClick={(e) => handleNavScroll(e, 'innovations')}>Key Innovations</a>
            <span className="wax-seal" />
          </nav>

          {/* Launch Operations Kraken Button */}
          <button className="btn-launch-kraken" onClick={onLaunchPlatform}>
            <span>Launch Operations Kraken</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── MAIN PARCHMENT HERO SECTION ──────────────────────── */}
      <main id="overview" className="pirate-hero-container">
        <div className="pirate-parchment-frame" style={{ position: 'relative' }}>
          {/* 🧭 Rotating Antique Compass Rose Watermark */}
          <CompassRoseWatermark size={560} opacity={0.10} speedSeconds={50} />

          {/* Brass corner bracket rivets */}
          <div className="brass-corner-tl" />
          <div className="brass-corner-tr" />
          <div className="brass-corner-bl" />
          <div className="brass-corner-br" />

          {/* Hero Left Column */}
          <div className="pirate-hero-left">
            {/* Copper Rivet Pill */}
            <div className="copper-pill">
              <span>• FLEET LOGISTICS • CANNON TRAJECTORY SIMULATION •</span>
            </div>

            {/* Carved Main Headline */}
            <h1 className="pirate-hero-title">
              AUTONOMOUS PRIVATEER
              <span className="title-gold">RESQUE &amp; GALLEON</span>
              ROUTING
            </h1>

            {/* Thematic Narrative */}
            <p className="pirate-hero-desc">
              When storms of plunder strike the high seas, stranded souls require swift, daring navigation. PirateRescue AI commandeers high-speed sloops and armored galleons using old-map algorithms, safe-current passages, and real-time survivor bounty.
            </p>

            {/* Carved Action Buttons */}
            <div className="pirate-hero-actions">
              {/* Operations Sea Chest Button */}
              <button className="btn-sea-chest" onClick={onLaunchPlatform}>
                <div className="sea-chest-compass-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9" fill="#C59A45" stroke="#241308" />
                  </svg>
                </div>
                <div>
                  <span className="sea-chest-text-top">Operations Sea Chest</span>
                  <span className="sea-chest-text-sub">OPEN THE SEA CHEST</span>
                </div>
              </button>

              {/* Sextant Engine Button */}
              <a href="#algorithms" className="btn-sextant" onClick={(e) => handleNavScroll(e, 'algorithms')}>
                <span className="sextant-icon">🧭</span>
                <div>
                  <span className="sextant-text-top">Sextant Engine</span>
                  <span className="sextant-text-sub">CHART THE ENGINE ➔</span>
                </div>
              </a>
            </div>

            {/* Three Antique Stats Plaques */}
            <div className="pirate-stats-strip">
              {/* 960+ / SOULS COORDINATED */}
              <div className="stat-plaque">
                <div className="stat-plaque-val">960+</div>
                <div className="stat-plaque-lbl">SOULS COORDINATED</div>
                <div className="stat-plaque-icon">🪙🪙🪙</div>
              </div>

              {/* 100% / RESCUE FEASIBILITY */}
              <div className="stat-plaque">
                <div className="stat-plaque-val">100%</div>
                <div className="stat-plaque-lbl">RESCUE FEASIBILITY</div>
                <div className="stat-plaque-icon">⚓</div>
              </div>

              {/* < 400ms / SOLVE LATENCY */}
              <div className="stat-plaque">
                <div className="stat-plaque-val">&lt; 400ms</div>
                <div className="stat-plaque-lbl">SOLVE LATENCY</div>
                <div className="stat-plaque-icon">⏳</div>
              </div>
            </div>
          </div>

          {/* Hero Right Column: 3D Celestial Armillary Navigation Sphere */}
          <div className="pirate-hero-right">
            <div className="globe-3d-wrapper">
              <RescueGlobe3D />
            </div>

            {/* Celestial Navigation Pill */}
            <div className="ancient-map-pill">
              <span style={{ color: '#D4AF37' }}>✦</span>
              <span>Celestial Navigation Sphere • Drag to Orbit</span>
            </div>
          </div>
        </div>
      </main>

      {/* ── SECTION: MISSION CHALLENGE ───────────────────────── */}
      <section id="mission" className="pirate-section">
        <div className="pirate-section-header">
          <span className="pirate-section-tag">Captain&apos;s Dilemma</span>
          <h2 className="pirate-section-title">Perils of the Hurricane-Ravaged Caribbean</h2>
          <p className="pirate-section-desc">
            Navigating unchartered shoals with stranded survivors requires solving complex multi-vehicle combinatorial constraints under ruthless squalls.
          </p>
        </div>

        <div className="pirate-cards-grid">
          <div className="pirate-card">
            <div className="pirate-card-icon">🌪️</div>
            <h3>Critical Triage Priorities</h3>
            <p>
              Stranded crews and vulnerable islanders face venomous squalls and trauma. Time lost is non-linear—every hour without medical provisions multiplies the casualty toll.
            </p>
          </div>

          <div className="pirate-card">
            <div className="pirate-card-icon">⚓</div>
            <h3>Galleon Capacity &amp; Rigging</h3>
            <p>
              From agile sloops (Sea Viper: 220 souls, 34 knots) to heavy flagships (Queen Anne&apos;s Revenge: 750 souls, 21 knots), fleet dispatch must strictly balance deck limits.
            </p>
          </div>

          <div className="pirate-card">
            <div className="pirate-card-icon">🗺️</div>
            <h3>Reefs, Straits &amp; Land Barriers</h3>
            <p>
              Straight rhumb lines run aground against Cuba and Hispaniola. The fleet must tack through deep-water passages—Windward Passage, Mona Strait, and Old Bahama Channel.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION: AI ALGORITHMS ───────────────────────────── */}
      <section id="algorithms" className="pirate-section">
        <div className="pirate-section-header">
          <span className="pirate-section-tag">Mathematical Navigation</span>
          <h2 className="pirate-section-title">Three Ancient Mathematical Engines</h2>
          <p className="pirate-section-desc">
            Compare our three routing solvers—from instant greedy heuristic dispatch to multi-chromosome genetic evolutionary search.
          </p>
        </div>

        <div className="algo-scrolls-grid">
          {/* Greedy */}
          <div className="algo-scroll-card">
            <div className="algo-scroll-header">
              <span className="algo-scroll-badge">Instant Triage</span>
            </div>
            <h3>Greedy Dispatch Heuristic</h3>
            <div className="algo-scroll-meta">
              <span>Latency: ~15ms</span>
              <span>Order: O(N log N)</span>
            </div>
            <p>
              Dispatches the nearest available cutter directly to the most critical trauma signal. Rapid response for immediate localized casualties.
            </p>
            <ul className="algo-scroll-list">
              <li><span>✓</span> Sub-second response to sudden distress</li>
              <li><span>✓</span> Prioritizes extreme medical emergencies</li>
              <li><span>—</span> May yield suboptimal total voyage mileage</li>
            </ul>
          </div>

          {/* Genetic */}
          <div className="algo-scroll-card">
            <div className="algo-scroll-header">
              <span className="algo-scroll-badge">Pareto Search</span>
            </div>
            <h3>Genetic Evolutionary Solver</h3>
            <div className="algo-scroll-meta">
              <span>Latency: ~650ms</span>
              <span>150 Generations</span>
            </div>
            <p>
              Employs multi-chromosome fleet partitioning, order crossover (OX), and mutation to navigate the combinatorial NP-hard routing wilderness.
            </p>
            <ul className="algo-scroll-list">
              <li><span>✓</span> Global minimization of fleet-wide mission time</li>
              <li><span>✓</span> Multi-ship capacity constraint enforcement</li>
              <li><span>✓</span> Escapes local minima via gene mutation</li>
            </ul>
          </div>

          {/* Hybrid */}
          <div className="algo-scroll-card recommended">
            <div className="algo-scroll-header">
              <span className="algo-scroll-badge" style={{ color: '#B8863A' }}>★ RECOMMENDED</span>
            </div>
            <h3>Hybrid Metaheuristic Engine</h3>
            <div className="algo-scroll-meta">
              <span>Latency: ~380ms</span>
              <span>99.4% Efficiency</span>
            </div>
            <p>
              Seeds the initial generation with greedy triage chromosomes, then refines trajectories using genetic crossover and 2-opt edge swaps.
            </p>
            <ul className="algo-scroll-list">
              <li><span>✓</span> Highest survivor evacuation rate (up to 100%)</li>
              <li><span>✓</span> Optimal trade-off of speed &amp; route efficiency</li>
              <li><span>✓</span> Flawless zero-constraint-violation proof</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── SECTION: KEY INNOVATIONS ─────────────────────────── */}
      <section id="innovations" className="pirate-section">
        <div className="pirate-section-header">
          <span className="pirate-section-tag">Cartographic Innovation</span>
          <h2 className="pirate-section-title">Built for Real-World Sea Operations</h2>
          <p className="pirate-section-desc">
            A production-grade dispatch platform integrating mathematical optimization, Leaflet cartography, and real-time fleet telemetry.
          </p>
        </div>

        <div className="pirate-cards-grid">
          <div className="pirate-card">
            <div className="pirate-card-icon">🧭</div>
            <h3>Sea-Safe GeoRouting Corridors</h3>
            <p>
              Verified deep-water nautical waypoints guide vessels through verified passages, preventing landmass collisions with Cuba, Hispaniola, or Jamaica.
            </p>
          </div>

          <div className="pirate-card">
            <div className="pirate-card-icon">🚢</div>
            <h3>60FPS Vessel Simulation</h3>
            <p>
              Ships travel along exact route polylines with authentic top-down naval silhouettes, rotational heading bearings, and live survivor intake at 0.5x to 5x speeds.
            </p>
          </div>

          <div className="pirate-card">
            <div className="pirate-card-icon">🚨</div>
            <h3>Dynamic Distress Signal Re-Routing</h3>
            <p>
              Inject mid-voyage emergency distress signals into the operational sector. The engine instantly recalculates and adjusts fleet voyages on the fly.
            </p>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CALL TO ARMS BANNER ───────────────────────── */}
      <div className="pirate-cta-banner" style={{ position: 'relative', overflow: 'visible' }}>
        {/* Rotating Compass Rose Watermark */}
        <CompassRoseWatermark size={420} opacity={0.08} speedSeconds={60} />

        <h2 className="pirate-cta-title">Ready to Commandeer the High Seas Fleet?</h2>
        <p className="pirate-cta-desc">
          Enter the live operations coordinator: deploy the Black Pearl, Queen Anne&apos;s Revenge, and Flying Dutchman across Category-5 hurricane sectors in real time.
        </p>
        <button className="btn-cta-kraken-large" onClick={onLaunchPlatform}>
          <span>Launch Operations Kraken ➔</span>
        </button>
      </div>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="pirate-footer">
        <div>PIRATERESCUE AI · ADVENTURE &amp; RECOVERY COORDINATION SYSTEM · 17TH CENTURY MARITIME CHARTS</div>
      </footer>
    </div>
  );
};
