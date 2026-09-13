import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const ALUMNI_DATA = [
  {
      n: 'Ananya Singh', co: 'Zoho', domain: 'zoho.com',
      logo: "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%23ea2328'/><text x='50' y='64' text-anchor='middle' fill='%23ffffff' font-family='Arial, sans-serif' font-weight='900' font-size='30' letter-spacing='-1'>ZOHO</text></svg>",
      role: 'Full Stack Dev', pkg: '₹4.5 LPA', color: '#e91e63',
      batch: 'Batch of 2022', city: 'Chennai',
      quote: 'NavGurukul gave me hands-on peer learning and 1-on-1 mentorship. Cracking Zoho with zero prior tech background was a dream turned reality!'
  },
  {
      n: 'Rahul Kumar', co: 'Razorpay', domain: 'razorpay.com',
      logo: "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%23072654'/><path d='M25 75 L55 25 L75 25 L45 75 Z' fill='%233395ff'/><path d='M42 75 L72 25 L82 25 L52 75 Z' fill='%2300d2ff' opacity='0.85'/></svg>",
      role: 'Data Analyst', pkg: '₹4.2 LPA', color: '#d97706',
      batch: 'Batch of 2023', city: 'Bengaluru',
      quote: 'Coming from a small village with zero coding experience, NavGurukul transformed my trajectory into a fintech unicorn analyst.'
  },
  {
      n: 'Priya Sharma', co: 'Swiggy', domain: 'swiggy.com',
      logo: "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%23fc8019'/><path d='M50 20 C38 20 30 28 30 38 C30 52 50 78 50 78 C50 78 70 52 70 38 C70 28 62 20 50 20 Z M50 48 C44.5 48 40 43.5 40 38 C40 32.5 44.5 28 50 28 C55.5 28 60 32.5 60 38 C60 43.5 55.5 48 50 48 Z' fill='%23ffffff'/></svg>",
      role: 'QA Engineer', pkg: '₹3.8 LPA', color: '#059669',
      batch: 'Batch of 2022', city: 'Bengaluru',
      quote: 'The 100% scholarship residential program gave me focus, safety, and world-class training to start my engineering career.'
  },
  {
      n: 'Karan Patel', co: 'Infosys', domain: 'infosys.com',
      logo: "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%23007cc3'/><text x='50' y='64' text-anchor='middle' fill='%23ffffff' font-family='Arial, sans-serif' font-weight='900' font-size='28' letter-spacing='-1'>infosys</text></svg>",
      role: 'Backend Dev', pkg: '₹4.8 LPA', color: '#0284c7',
      batch: 'Batch of 2021', city: 'Pune',
      quote: 'NavGurukul taught me how to learn on my own. That self-learning ability is why I excel today as a senior backend engineer.'
  },
  {
      n: 'Sneha Verma', co: 'TCS', domain: 'tcs.com',
      logo: "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%23004b87'/><text x='50' y='64' text-anchor='middle' fill='%23ffffff' font-family='Arial, sans-serif' font-weight='900' font-size='34' letter-spacing='1'>TCS</text></svg>",
      role: 'Frontend Dev', pkg: '₹4.0 LPA', color: '#e91e63',
      batch: 'Batch of 2023', city: 'Mumbai',
      quote: 'Building real projects alongside passionate peers under the banyan tree vibe made learning web dev fun and fast!'
  },
  {
      n: 'Vikram Joshi', co: 'Freshworks', domain: 'freshworks.com',
      logo: "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%23111827'/><path d='M30 25 L70 25 C75 25 75 35 70 35 L45 35 L45 50 L65 50 C70 50 70 60 65 60 L45 60 L45 80 L30 80 Z' fill='%23f43f5e'/></svg>",
      role: 'Support Eng', pkg: '₹3.6 LPA', color: '#d97706',
      batch: 'Batch of 2022', city: 'Chennai',
      quote: 'From zero confidence to leading product support at Freshworks! NavGurukul truly empowers youth from underserved communities.'
  }
];

const COMPANY_POOL = [
  { co: 'Zoho', hired: '180+ hired', logo: "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='22' fill='%23ea2328'/><text x='50' y='64' text-anchor='middle' fill='%23ffffff' font-family='sans-serif' font-weight='900' font-size='28' letter-spacing='-1'>ZOHO</text></svg>" },
  { co: 'Razorpay', hired: '95+ hired', logo: "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='22' fill='%23072654'/><path d='M25 75 L55 25 L75 25 L45 75 Z' fill='%233395ff'/><path d='M42 75 L72 25 L82 25 L52 75 Z' fill='%2300d2ff' opacity='0.85'/></svg>" },
  { co: 'Swiggy', hired: '60+ hired', logo: "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='22' fill='%23fc8019'/><path d='M50 20 C38 20 30 28 30 38 C30 52 50 78 50 78 C50 78 70 52 70 38 C70 28 62 20 50 20 Z M50 48 C44.5 48 40 43.5 40 38 C40 32.5 44.5 28 50 28 C55.5 28 60 32.5 60 38 C60 43.5 55.5 48 50 48 Z' fill='%23ffffff'/></svg>" },
  { co: 'Infosys', hired: '240+ hired', logo: "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='22' fill='%23007cc3'/><text x='50' y='64' text-anchor='middle' fill='%23ffffff' font-family='sans-serif' font-weight='900' font-size='26' letter-spacing='-1'>infosys</text></svg>" },
  { co: 'TCS', hired: '310+ hired', logo: "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='22' fill='%23004b87'/><text x='50' y='64' text-anchor='middle' fill='%23ffffff' font-family='sans-serif' font-weight='900' font-size='32' letter-spacing='1'>TCS</text></svg>" },
  { co: 'Freshworks', hired: '120+ hired', logo: "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='22' fill='%23111827'/><path d='M30 25 L70 25 C75 25 75 35 70 35 L45 35 L45 50 L65 50 C70 50 70 60 65 60 L45 60 L45 80 L30 80 Z' fill='%23f43f5e'/></svg>" },
  { co: 'Wipro', hired: '150+ hired', logo: "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='22' fill='%23ffffff' stroke='%23cbd5e1' stroke-width='3'/><circle cx='36' cy='45' r='14' fill='%23e11d48'/><circle cx='64' cy='45' r='14' fill='%232563eb'/><circle cx='50' cy='62' r='14' fill='%23059669'/></svg>" },
  { co: 'HCLTech', hired: '200+ hired', logo: "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='22' fill='%2300529b'/><text x='50' y='64' text-anchor='middle' fill='%23ffffff' font-family='sans-serif' font-weight='900' font-size='28'>HCL</text></svg>" },
  { co: 'Accenture', hired: '280+ hired', logo: "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='22' fill='%23a100ff'/><path d='M25 65 L75 35 L75 48 L35 75 Z' fill='%23ffffff'/></svg>" },
  { co: 'Flipkart', hired: '80+ hired', logo: "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='22' fill='%232874f0'/><text x='50' y='66' text-anchor='middle' fill='%23ffe500' font-family='sans-serif' font-weight='900' font-size='42'>f</text></svg>" }
];

interface Screen4OutcomesProps {
  openTestimonialModal: (index: number) => void;
}

const Screen4Outcomes: React.FC<Screen4OutcomesProps> = ({ openTestimonialModal }) => {
  const [activeSlots, setActiveSlots] = useState([0, 1, 2, 3, 4, 5]);
  const [selectedAlumni, setSelectedAlumni] = useState<number | null>(null);

  useEffect(() => {
    let unassignedPool = [6, 7, 8, 9];
    
    const interval = setInterval(() => {
      if (unassignedPool.length === 0) return;
      
      setActiveSlots(prevSlots => {
        const newSlots = [...prevSlots];
        const slotIdx = Math.floor(Math.random() * newSlots.length);
        const nextCoIdx = unassignedPool.shift()!;
        const prevCoIdx = newSlots[slotIdx];
        
        unassignedPool.push(prevCoIdx);
        newSlots[slotIdx] = nextCoIdx;
        return newSlots;
      });
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="screen active" data-i="3" style={{ justifyContent: 'center', paddingTop: '40px' }}>
      {/* Ground/Air Shadow for Flying Bird */}
      <div className="bird-shadow" id="birdShadow"></div>

      {/* TOP RIGHT CORNER PERCH DOCK (Where the bird sits with the poster) */}
      <div className="perch-corner-dock">
          <div className="perched-unit is-docked" id="perchedUnit" title="Click bird to trigger flight!">
              <div className="perched-bird-sprite" id="perchedBirdImg"></div>
              <div className="poster-pill-badge" id="dockedBadge">
                  <span className="sparkle-icon">✨</span>
                  <span>100% Job Support</span>
              </div>
          </div>
      </div>

      {/* AUTONOMOUS FLYING BIRD WITH CARRIED POSTER LAYER */}
      <div className="flight-carrier-layer" id="flightLayer">
          <div className="bird-carrier" id="birdCarrier">
              {/* Bird Orientation Rig (controls yaw/facing left-right, pitch, bank) */}
              <div className="bird-orient" id="birdOrient">
                  <div className="bird-rig flapping" id="birdRig">
                      {/* 6-Frame Wing Flapping Sprite */}
                      <div className="bird-sprite" id="birdSprite"></div>
                  </div>
              </div>

              {/* Carried Poster Assembly (Hangs beneath bird's claws - NEVER inverted or mirrored!) */}
              <div className="carried-poster-assembly" id="carriedPoster">
                  <svg className="poster-tether-cables" viewBox="0 0 64 16">
                      {/* Left Claw Cable */}
                      <line x1="24" y1="2" x2="16" y2="14" className="tether-line" />
                      <circle cx="24" cy="2" r="2.5" className="tether-claw-ring" />
                      {/* Right Claw Cable */}
                      <line x1="40" y1="2" x2="48" y2="14" className="tether-line" />
                      <circle cx="40" cy="2" r="2.5" className="tether-claw-ring" />
                  </svg>
                  {/* Hanging Poster Badge */}
                  <div className="carried-poster-badge">
                      <span className="sparkle-icon">✨</span>
                      <span>100% Job Support</span>
                  </div>
              </div>
          </div>
      </div>


      <h1 className="headline" style={{ fontSize: 'clamp(24px, 3.2vw, 42px)', fontWeight: 600 }}>2,000+ dreams turned into <span className="highlight-pink">real jobs</span></h1>
      <p className="screen2-subline">Skills that opened doors. Careers that changed lives.</p>
      
      <div className="alumni-viewport">
        <div className="alumni-track" id="alumniTrack">
          {/* Double list for infinite marquee effect */}
          {[...ALUMNI_DATA, ...ALUMNI_DATA].map((a, i) => {
            const realIdx = i % ALUMNI_DATA.length;
            const initials = a.n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            
            return (
              <div key={i} className="alumni-card" onClick={() => setSelectedAlumni(realIdx)} role="button" tabIndex={0} title={`Click to view ${a.n}'s testimonial`}>
                <div className="acard-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div className="alumni-avatar" style={{ background: a.color }}>{initials}</div>
                        <div className="alumni-meta">
                            <div className="aname">{a.n}</div>
                            <div className="arole">{a.role}</div>
                        </div>
                    </div>
                    <div className="alumni-logo-wrap">
                        <img className="alumni-logo" src={`https://logo.clearbit.com/${a.domain}`} alt={a.co} onError={(e) => { e.currentTarget.src = a.logo; }} />
                    </div>
                </div>
                <div className="apkg" style={{ marginTop: '8px' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e293b' }}>{a.pkg}</span>
                </div>
                <div className="acard-quote">
                    <div style={{color: '#cbd5e1', fontSize: '2rem', lineHeight: '0.8', fontFamily: 'serif', marginTop: '5px'}}>“</div>
                    <div style={{fontStyle: 'italic', color: '#475569', marginTop: '-5px', fontWeight: '500', fontSize: '0.9rem'}}>{a.quote}</div>
                </div>
                <div className="acard-bottom">
                    <div className="acard-city">📍 {a.city}</div>
                    <div className="acard-link">View story →</div>
                </div>
            </div>
            );
          })}
        </div>
      </div>
      
      <div className="companies-strip">
        <div className="companies-label" style={{ textTransform: 'uppercase' }}>Top companies hiring NavGurukul graduates</div>
        <div className="companies-track-wrap">
          <div className="companies-track">
            {activeSlots.map((coIdx, idx) => {
              const c = COMPANY_POOL[coIdx];
              return (
                <div key={idx} className="company-slot">
                    <div className="cslot-logo-wrap">
                        <img src={c.logo} alt={c.co} />
                    </div>
                    <span className="cslot-name">{c.co}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Alumni Testimonial Modal Overlay (Portaled to body to escape #stage z-index) */}
      {selectedAlumni !== null && typeof window !== 'undefined' && document.body && 
        createPortal(
        <div className="tm-overlay open" onClick={(e) => { if (e.target === e.currentTarget) setSelectedAlumni(null); }} role="dialog" aria-modal="true" style={{ opacity: 1, pointerEvents: 'auto', position: 'fixed', inset: 0, zIndex: 99999 }}>
            <div className="tm-card" style={{ transform: 'translateY(0) scale(1)' }}>
                <button className="tm-close" onClick={() => setSelectedAlumni(null)} aria-label="Close modal">✕</button>
                <div className="tm-header">
                    <div className="tm-avatar" style={{ background: ALUMNI_DATA[selectedAlumni].color }}>
                        <span className="tm-initials">
                            {ALUMNI_DATA[selectedAlumni].n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                    </div>
                    <div className="tm-info">
                        <div className="tm-name">{ALUMNI_DATA[selectedAlumni].n}</div>
                        <div className="tm-role" style={{ color: ALUMNI_DATA[selectedAlumni].color }}>{ALUMNI_DATA[selectedAlumni].role}</div>
                        <div className="tm-city">{ALUMNI_DATA[selectedAlumni].city} • {ALUMNI_DATA[selectedAlumni].batch}</div>
                    </div>
                    <div className="tm-logo-row">
                        <div className="tm-logo-box">
                            <img className="tm-logo" src={`https://logo.clearbit.com/${ALUMNI_DATA[selectedAlumni].domain}`} alt="Company Logo" onError={(e) => { e.currentTarget.src = ALUMNI_DATA[selectedAlumni].logo; }} />
                        </div>
                        <div className="tm-co-name">{ALUMNI_DATA[selectedAlumni].co}</div>
                    </div>
                </div>
                <blockquote className="tm-quote">"{ALUMNI_DATA[selectedAlumni].quote}"</blockquote>
                <div className="tm-footer">
                    <span className="tm-pkg-tag">SECURED OFFER</span>
                    <span className="tm-pkg" style={{ color: '#d97706' }}>{ALUMNI_DATA[selectedAlumni].pkg}</span>
                </div>
            </div>
        </div>, document.body)
      }
    </section>
  );
};

export default Screen4Outcomes;
