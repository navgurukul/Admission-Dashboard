import React, { useEffect, useRef } from 'react';

const LEVEL_DATA = [
    { title: 'GURUKUL TREE', icon: '🌱' },
    { title: 'SPECIALTY TRACKS', icon: '⚡' },
    { title: '100% SCHOLARSHIP', icon: '💎' },
    { title: 'VISION & IMPACT', icon: '🌟' },
    { title: 'ADMISSION ROADMAP', icon: '🗺️' },
    { title: 'BOOK FREE TEST', icon: '🎓' }
];

interface GamifiedHudProps {
  currentScreenIndex: number;
  onScreenChange?: (index: number) => void;
}

const GamifiedHud: React.FC<GamifiedHudProps> = ({ currentScreenIndex, onScreenChange }) => {
  const xpRef = useRef(4650);
  const [xpVal, setXpVal] = React.useState(4650);
  const [targetPct, setTargetPct] = React.useState(0);
  const prevIndexRef = useRef(0);

  useEffect(() => {
    const totalScreens = 6;
    const newTargetPct = (currentScreenIndex / (totalScreens - 1)) * 100;
    setTargetPct(newTargetPct);
    
    const isForward = currentScreenIndex > prevIndexRef.current;
    
    if (isForward && currentScreenIndex > 0) {
      xpRef.current += 100;
      setXpVal(xpRef.current);
    }
    
    prevIndexRef.current = currentScreenIndex;
  }, [currentScreenIndex]);

  return (
    <div id="hud">
      <div className="hud-brand" title="NavGurukul">
        <img src="/gamified-assets/navgurukul-logo.png" alt="NavGurukul Logo" className="hud-brand-img" />
      </div>

      <div className="hud-track-wrapper">
        <div className="hud-track" id="hudTrack">
          <div className="hud-fill" id="hudFill" style={{ width: `${targetPct}%` }}></div>

          <div className="hud-checkpoints">
            {LEVEL_DATA.map((lvl, idx) => (
              <button 
                key={idx}
                className={`hud-node ${idx <= currentScreenIndex ? 'passed' : ''} ${idx === currentScreenIndex ? 'active node-burst' : ''}`} 
                style={{ left: `${(idx / 5) * 100}%` }}
                onClick={() => {
                  // Don't navigate to screen 0 (login/welcome) — only allow forward/back between screens 1-5
                  if (idx > 0 && onScreenChange) {
                    onScreenChange(idx);
                  }
                }}
                aria-label={`Go to ${lvl.title}`}
              >
                <span className="node-icon">{lvl.icon}</span>
                <span className="node-tooltip">L{idx + 1} · {lvl.title}</span>
              </button>
            ))}
          </div>

          <div className="hud-vehicle-wrapper" id="hudVehicleWrapper" style={{ left: `${targetPct}%`, transition: 'left 0.6s ease-in-out' }}>
            <div className="hud-vehicle-callout show-callout" id="hudVehicleCallout">ZOOM! 🚀</div>
            <div className="hud-vehicle" id="hudVehicle">
              <div className="vehicle-thruster">
                <span className="flame-core"></span>
                <span className="flame-outer"></span>
              </div>
              <svg className="vehicle-svg" viewBox="0 0 44 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 10L1 3C0.5 2.2 1.2 1 2.2 1H8.5L12 10H6Z" fill="#d97706" />
                <path d="M6 18L1 25C0.5 25.8 1.2 27 2.2 27H8.5L12 18H6Z" fill="#d97706" />
                <path d="M4 8C4 8 10 6 22 6C34 6 42 12 43 14C42 16 34 22 22 22C10 22 4 20 4 20V8Z" fill="url(#hullGradient)" />
                <path d="M34 8.5C38 10.5 42.5 13 43.5 14C42.5 15 38 17.5 34 19.5V8.5Z" fill="#f59e0b" />
                <path d="M12 11H28C29.1 11 30 11.9 30 13V15C30 16.1 29.1 17 28 17H12V11Z" fill="#ffffff" opacity="0.3" />
                <ellipse cx="26" cy="14" rx="7" ry="5" fill="url(#visorGradient)" stroke="#ffffff" strokeWidth="0.8" />
                <circle cx="26" cy="13" r="2.5" fill="#fef08a" />
                <path d="M23 17.5C23.8 16 25 15.5 26 15.5C27 15.5 28.2 16 29 17.5" stroke="#fef08a" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="22" y1="11.5" x2="28" y2="11.5" stroke="#ffffff" strokeLinecap="round" opacity="0.7" />
                <defs>
                  <linearGradient id="hullGradient" x1="4" y1="14" x2="43" y2="14" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#be185d" />
                    <stop offset="0.55" stopColor="#e91e63" />
                    <stop offset="1" stopColor="#ea580c" />
                  </linearGradient>
                  <linearGradient id="visorGradient" x1="19" y1="9" x2="33" y2="19" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#0284c7" />
                    <stop offset="1" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default GamifiedHud;
