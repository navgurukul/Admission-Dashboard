import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  onNextScreen?: () => void;
}

const STAGE_DEFS = [
  { label: 'Start',      sub: 'Journey Begins',    stageNum: 0 },
  { label: 'Level 1',    sub: 'Screening Test',    stageNum: 1 },
  { label: 'Level 2',    sub: 'Learning Round',    stageNum: 2 },
  { label: 'Level 3',    sub: 'Culture-fit Round', stageNum: 3 },
  { label: 'Final Step', sub: 'Campus Welcome',    stageNum: 4 },
];

// SVG viewBox "0 0 400 180"
const NODE_POS = [
  { cx: 30,  cy: 146 },   // Start
  { cx: 112, cy:  96 },   // Level 1
  { cx: 195, cy: 146 },   // Level 2
  { cx: 278, cy:  96 },   // Level 3
  { cx: 360, cy: 146 },   // Final
];
const FULL_PATH = 'M 30,146 C 60,146 80,96 112,96 C 145,96 165,146 195,146 C 225,146 245,96 278,96 C 310,96 330,146 360,146';
const PATH_SEGS = [
  'M 30,146 C 60,146 80,96 112,96',
  'M 112,96 C 145,96 165,146 195,146',
  'M 195,146 C 225,146 245,96 278,96',
  'M 278,96 C 310,96 330,146 360,146',
];

// Walk duration in ms (must match CSS transition below)
const WALK_MS = 1500;

const Screen5Roadmap: React.FC<Props> = ({ onNextScreen }) => {
  const [stage,       setStage]       = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStage,  setModalStage]  = useState(1);
  const [isWalking,   setIsWalking]   = useState(false);
  const walkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const name        = localStorage.getItem('studentName') || 'Friend';
  const nameInitial = name.charAt(0).toUpperCase();

  // ── Node index Asha stands on ───────────────────────────────────────────
  const ashaIdx = stage; // Goes 0 to 4 directly

  // ── Status helper ────────────────────────────────────────────────────────
  const getNodeStatus = (stageNum: number): 'completed' | 'inprogress' | 'locked' => {
    if (stageNum <= stage)      return 'completed';
    if (stageNum === stage + 1) return 'inprogress';
    return 'locked';
  };

  // ── Walk + advance (sets isWalking, waits WALK_MS, then opens modal) ────
  const advanceWithWalk = (newStage: number) => {
    if (walkTimer.current) clearTimeout(walkTimer.current);
    setIsWalking(true);
    setStage(newStage);
    walkTimer.current = setTimeout(() => {
      setIsWalking(false);
      setModalStage(newStage);
      setIsModalOpen(true);
    }, WALK_MS);
  };

  const handleNext = () => {
    if (stage < 4) {
      advanceWithWalk(stage + 1);
    } else if (onNextScreen) {
      onNextScreen();
    }
  };

  const handleInstantNext = () => {
    if (stage < 4) {
      const newStage = stage + 1;
      setStage(newStage);
      setModalStage(newStage);
      setIsModalOpen(true);
    } else if (onNextScreen) {
      onNextScreen();
    }
  };

  const handleNodeClick = (stageNum: number) => {
    if (stageNum === 0) return; // Start node has no modal
    if (stageNum <= stage) {
      // Revisit completed — open modal instantly (no walk)
      setModalStage(stageNum);
      setIsModalOpen(true);
    } else if (stageNum === stage + 1) {
      // Next available — walk to it
      advanceWithWalk(stageNum);
    }
    // locked → ignore
  };

  // ── Messages / CTA labels ────────────────────────────────────────────────
  const messages = [
    `Aao ${name}! <b style="color:#be185d">Level 1: Screening Test (ST)</b> explore karein! 🚀`,
    `Awesome ${name}! <b style="color:#be185d">Level 1 (Screening Test)</b> cleared! Advance to Level 2! 💻`,
    `Great job ${name}! <b style="color:#be185d">Level 2 (Learning Round)</b> unlocked! Move to Level 3! 🤝`,
    `Fantastic ${name}! <b style="color:#be185d">Level 3 (Culture-Fit Round)</b> complete! Welcome to Campus! 🎓`,
    `Congratulations ${name}! You reached <b style="color:#be185d">Campus Welcome</b>! Book your free test! 🎉`,
  ];
  const ctaLabels = [
    'Unlock Next Milestone →',
    'Unlock Next Milestone →',
    'Unlock Next Milestone →',
    'Unlock Campus Welcome →',
    'Finish Roadmap →',
  ];

  // ── Modal data — identical to original ──────────────────────────────────
  const getModalData = (stg: number) => {
    switch (stg) {
      case 1: return {
        badge: 'LEVEL 1 QUEST', title: 'Level 1: Screening Test (ST)',
        sub: '⛺ Stage 1 Quest • Online Aptitude & Mindset Test',
        msg: `Namaste ${name}! Aap Screening Test (ST) ke tent par pauch gaye ho! Yahan aapka basic problem-solving and logical aptitude check hota hai.`,
        btn: 'Walk to Level 2 (Learning Round) →',
        cards: [
          { icon: '📋', title: 'Test Me Kya Hota Hai?',  desc: 'Screening Test ek simple online test hai jisme Basic Math, Logical Reasoning aur English ke simple interactive questions hote hain.' },
          { icon: '⏱️', title: 'Duration & Mode',         desc: 'Yeh test 60 se 90 minutes ka hota hai. Aap ise apne mobile phone ya cyber cafe / laptop se ghar baithe aasani se de sakte ho.' },
          { icon: '💡', title: 'Prior Coding Required?',  desc: 'Bilkul nahi! Zero coding experience wale students bhi is test ko easily crack kar sakte hain. Hum sirf aapki seekhne ki chhah (curiosity) dekhte hain.' },
          { icon: '🏆', title: 'Treasure Secret Tip',     desc: 'Questions ko dhyaan se padhein, basic maths ki practice karein, aur bina kisi pressure ke confidence ke saath test attempt karein!' },
        ],
      };
      case 2: return {
        badge: 'LEVEL 2 QUEST', title: 'Level 2: Learning Round (LR)',
        sub: '⛺ Stage 2 Quest • 5-7 Days Practical Learning Tryout',
        msg: `Awesome ${name}! Aap Learning Round (LR) Tech Cottage me aa gaye ho. Yahan aap real tech environment me seekh ke dikhate ho!`,
        btn: 'Walk to Level 3 (Culture-Fit Round) →',
        cards: [
          { icon: '💻', title: 'Learning Round Kya Hai?', desc: 'Yeh 5 se 7 dino ka ek online practical workshop hota hai jahan aapko real self-learning assignments aur problem-solving tasks milte hain.' },
          { icon: '👥', title: 'Peer & Mentor Support',   desc: 'Aap akele nahi seekhte! NavGurukul ke mentors aur fellow aspirants ke saath milkar team work aur doubt solving hoti hai.' },
          { icon: '🔍', title: 'What We Evaluate?',       desc: 'Hum check karte hain ki aap tough problems me kaise struggle karke solution dhoondhte ho aur kitne dedicatedly daily attend karte ho.' },
          { icon: '🏆', title: 'Treasure Secret Tip',     desc: 'Doubts poochne me kabhi mat hichkichao! Mentors se baatchat karo aur daily submission complete karo.' },
        ],
      };
      case 3: return {
        badge: 'LEVEL 3 QUEST', title: 'Level 3: Culture-Fit Round (CFR)',
        sub: '🤝 Stage 3 Quest • 1-on-1 Personal Interaction',
        msg: `Shabaash ${name}! Welcome to Culture-Fit Round (CFR) Gazebo! Yeh ek friendly 1-on-1 conversation hai jahan hum aapke future goals ke baare me baat karte hain.`,
        btn: 'Walk to Campus Welcome →',
        cards: [
          { icon: '🗣️', title: 'CFR Me Kya Hota Hai?',        desc: 'Yeh ek friendly 1-on-1 interview / conversation hoti hai NavGurukul team members aur alumni ke saath.' },
          { icon: '🏫', title: 'Residential Program Alignment', desc: 'NavGurukul 1-2 saal ka 100% free residential campus program hai. Hum aapke background, motivation aur campus rules ke baare me discuss karte hain.' },
          { icon: '❤️', title: 'Family Support & Commitment',   desc: 'Aapki family ki permission aur aapka 100% commitment towards your tech career verify kiya jaata hai.' },
          { icon: '🏆', title: 'Treasure Secret Tip',           desc: 'Dil se aur imandari se baat karein. Apne dreams aur challenges clear btaiye. Authenticity is key!' },
        ],
      };
      case 4: return {
        badge: 'FINAL DESTINATION', title: 'Final Destination: Campus Welcome',
        sub: '🎓 Final Stage Quest • 100% Free Residential Campus Life',
        msg: `Badhai Ho ${name}! Aap NavGurukul Campus Gate pauch gaye ho! Yahan se aapka fully funded tech journey start hota hai!`,
        btn: 'Book Admission Test Now 🎉',
        cards: [
          { icon: '💻', title: 'Free Laptop & Accommodation',     desc: 'Campus aate hi aapko personalized coding laptop, comfortable hostel room aur 3 nutritious meals daily 100% free milte hain.' },
          { icon: '📚', title: 'Industry-Ready Specialty Tracks', desc: 'Software Engineering (SOP), Business Operations (SOB), Finance (SOF), ya UI/UX Design (SOD) me practical skills seekhein.' },
          { icon: '💼', title: '100% Guaranteed Job Placement',   desc: 'Zoho, Swiggy, Razorpay, Infosys jaise top tech companies me 3.5 - 8 LPA tak ki job lagne tak placement support.' },
          { icon: '🎉', title: 'Ready to Start?',                 desc: 'Abhi Screening Test ke liye register karein aur apne life-changing tech journey ki shuruat karein!' },
        ],
      };
      default: return { badge: '', title: '', sub: '', msg: '', btn: '', cards: [] };
    }
  };

  const modalData = getModalData(modalStage);

  // ── Asha position (% of SVG wrapper) ────────────────────────────────────
  // left% = cx / viewBoxW,  top% = (cy - nodeRadius) / viewBoxH
  // transform: translate(-50%, -100%) anchors her feet at the point
  const ashaLeftPct  = (NODE_POS[ashaIdx].cx / 400) * 100;
  const ashaTopPct   = ((NODE_POS[ashaIdx].cy - 14) / 180) * 100;

  // Badge colour helper
  const badgeStyle = (status: string): React.CSSProperties => {
    if (status === 'completed')  return { background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0' };
    if (status === 'inprogress') return { background: '#fce7f3', color: '#be185d', border: '1px solid #fbcfe8' };
    return { background: '#f1f5f9', color: '#94a3b8', border: '1px solid #e2e8f0' };
  };

  return (
    <section className="screen active" data-i="4">

      {/* Sprite keyframes — no CSS file dependency */}
      <style>{`
        @keyframes s5rWalkSprite {
          from { background-position: 0px 0; }
          to   { background-position: -480px 0; }
        }
        @keyframes s5rWalkBob {
          0%   { margin-top: 0px; }
          25%  { margin-top: -4px; }
          50%  { margin-top: 0px; }
          75%  { margin-top: -4px; }
          100% { margin-top: 0px; }
        }
        @keyframes s5rIdleFloat {
          0%   { margin-top: 0px; }
          100% { margin-top: -3px; }
        }
      `}</style>

      {/* Title */}
      <h1 className="headline">
        Your 4-step{' '}
        <span className="highlight-pink s5-underline">Admission Journey</span>
      </h1>
      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px auto 10px', textAlign: 'center', maxWidth: 520, padding: '0 12px', lineHeight: 1.4 }}>
        From screening test to campus welcome — here's exactly what's next.
      </p>

      {/* ── Roadmap Card ── */}
      <div style={{
        width: '100%', maxWidth: 660, margin: '0 auto',
        background: '#fff', borderRadius: 20,
        border: '1.5px solid #f1f5f9',
        boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
        padding: '14px 14px 6px',
        flexShrink: 0,
      }}>
        {/* Labels row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4, marginBottom: 6 }}>
          {STAGE_DEFS.filter(d => d.stageNum !== 0).map((def, idx) => {
            const status = getNodeStatus(def.stageNum);
            return (
              <button
                key={idx}
                onClick={() => handleNodeClick(def.stageNum)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 2, background: 'none', border: 'none',
                  cursor: status !== 'locked' ? 'pointer' : 'default',
                  padding: '4px 2px', textAlign: 'center',
                  opacity: status === 'locked' ? 0.5 : 1,
                }}
              >
                <span style={{
                  ...badgeStyle(status),
                  display: 'inline-block', fontSize: '0.56rem', fontWeight: 700,
                  padding: '2px 6px', borderRadius: 20, whiteSpace: 'nowrap', lineHeight: 1.5,
                }}>
                  {status === 'completed'  ? '✓ Completed'  : ''}
                  {status === 'inprogress' ? '• In progress' : ''}
                  {status === 'locked'     ? 'Locked'        : ''}
                </span>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: status === 'locked' ? '#94a3b8' : '#1e293b', lineHeight: 1.2 }}>
                  {def.label}
                </span>
                <span style={{ fontSize: '0.62rem', fontWeight: 600, color: '#64748b', lineHeight: 1.1 }}>
                  {def.sub}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── SVG + Asha overlay wrapper ── */}
        <div style={{ position: 'relative', width: '100%' }}>

          {/* SVG wave path */}
          <svg
            viewBox="0 0 400 180"
            preserveAspectRatio="xMidYMid meet"
            style={{ width: '100%', height: 'auto', display: 'block' }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="s5rGradInline" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#e91e63" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>

            {/* Full dashed background path */}
            <path d={FULL_PATH} fill="none" stroke="#e2e8f0" strokeWidth="3" strokeDasharray="6 4" />

            {/* Coloured progress segments */}
            {PATH_SEGS.map((seg, i) =>
              stage > i ? (
                <path key={i} d={seg} fill="none" stroke="url(#s5rGradInline)" strokeWidth="3.5" strokeLinecap="round" />
              ) : null
            )}

            {/* Stage node circles */}
            {STAGE_DEFS.map((def, idx) => {
              const { cx, cy } = NODE_POS[idx];
              const status = getNodeStatus(def.stageNum);
              return (
                <g key={idx}
                  style={{ cursor: status !== 'locked' && def.stageNum !== 0 ? 'pointer' : 'default' }}
                  onClick={() => handleNodeClick(def.stageNum)}
                >
                  {def.stageNum === 0 ? (
                    <>
                      <circle cx={cx} cy={cy} r="14" fill="#16a34a" />
                      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="12">🏁</text>
                    </>
                  ) : status === 'completed' && (
                    <>
                      <circle cx={cx} cy={cy} r="14" fill="#e91e63" />
                      <text x={cx} y={cy + 5} textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="sans-serif">✓</text>
                    </>
                  )}
                  {def.stageNum !== 0 && status === 'inprogress' && (
                    <>
                      <circle cx={cx} cy={cy} r="14" fill="white" stroke="#e91e63" strokeWidth="3" />
                      <circle cx={cx} cy={cy} r="5"  fill="#e91e63" />
                    </>
                  )}
                  {def.stageNum !== 0 && status === 'locked' && (
                    <>
                      <circle cx={cx} cy={cy} r="14" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
                      <text x={cx} y={cy + 4} textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">🔒</text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>

          {/* ── Asha girl — absolutely positioned over SVG ── */}
          <div
            style={{
              position: 'absolute',
              left: `${ashaLeftPct}%`,
              top:  `${ashaTopPct}%`,
              transform: 'translate(-50%, -100%)',
              pointerEvents: 'none',
              zIndex: 5,
              transition: `left ${WALK_MS}ms linear, top ${WALK_MS}ms linear`,
            }}
          >
            {/* Inner div: sprite + bob animation (separate from position) */}
            <div style={{
              width:  60,
              height: 113,
              backgroundImage: isWalking
                ? `url('/gamified-assets/css/asha_walk/asha_walk_strip.png')`
                : `url('/gamified-assets/css/asha_walk/asha_idle.png')`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: '0 0',
              backgroundSize: isWalking ? '480px 113px' : '60px 113px',
              filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.28))',
              animation: isWalking
                ? `s5rWalkSprite 0.9s steps(8) infinite, s5rWalkBob 0.45s ease-in-out infinite`
                : `s5rIdleFloat 2s ease-in-out infinite alternate`,
            }} />
          </div>
        </div>
      </div>

      {/* ── Bottom Info Card (Layout matches screenshot) ── */}
      <div style={{
        width: '100%', maxWidth: 600, margin: '16px auto 0',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        flexShrink: 0,
      }}>
        {/* Pill Container */}
        <div style={{
          width: '100%',
          background: '#fffdfa', border: '1.5px solid #e2e8f0',
          borderRadius: 30, padding: '6px 6px 6px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
        }}>
          <p
            style={{ fontSize: '0.82rem', color: '#1e293b', margin: 0, flex: 1, fontWeight: 500, lineHeight: 1.3 }}
            dangerouslySetInnerHTML={{ __html: messages[stage] }}
          />
          <button
            onClick={handleNext}
            disabled={isWalking}
            style={{
              padding: '8px 16px', flexShrink: 0,
              background: '#e91e63', color: '#fff',
              fontWeight: 700, fontSize: '0.75rem', border: 'none', borderRadius: 20,
              cursor: isWalking ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {isWalking ? 'Walking...' : 'Tap to Walk →'}
          </button>
        </div>

        {/* Main CTA underneath */}
        <button
          onClick={() => { if (onNextScreen) onNextScreen(); }}
          style={{
            padding: '12px 28px',
            background: 'linear-gradient(135deg,#e91e63 0%,#d97706 100%)',
            color: '#fff', fontWeight: 800, fontSize: '0.9rem',
            border: 'none', borderRadius: 24, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(233,30,99,0.3)',
            transition: 'background 0.3s',
          }}
        >
          {ctaLabels[stage]}
        </button>
      </div>

      {/* ── Modal Portal — state & logic 100% unchanged ── */}
      {isModalOpen &&
        typeof window !== 'undefined' &&
        document.body &&
        createPortal(
          <div
            className="sq-overlay open"
            style={{ display: 'flex', position: 'fixed', inset: 0, zIndex: 99999 }}
            onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
          >
            <div className="sq-card">
              <button className="sq-close" onClick={() => setIsModalOpen(false)}>✕</button>
              <div className="sq-header">
                <div className="sq-badge">{modalData.badge}</div>
                <h2 className="sq-title">{modalData.title}</h2>
                <div className="sq-subtitle">{modalData.sub}</div>
              </div>
              <div className="sq-body">
                <div className="sq-avatar-col">
                  <div className="sq-avatar-frame">
                    <img src="/gamified-assets/mentor-avatar2.png" alt="Guide Asha" className="sq-avatar-img" />
                    <div className="sq-avatar-pulse"></div>
                  </div>
                  <div className="sq-avatar-name">Guide Asha 🧭</div>
                  <div className="sq-speech-bubble">{modalData.msg}</div>
                </div>
                <div className="sq-details-col">
                  <div className="sq-sections-grid">
                    {modalData.cards.map((c: any, i: number) => (
                      <div key={i} className="sq-sec-card">
                        <div className="sq-sec-header">
                          <span className="sq-sec-icon">{c.icon}</span>
                          <span className="sq-sec-title">{c.title}</span>
                        </div>
                        <p className="sq-sec-text">{c.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="sq-footer">
                <button className="sq-secondary-btn" onClick={() => setIsModalOpen(false)}>Explore Map 🗺️</button>
                <button className="sq-primary-btn" onClick={() => { setIsModalOpen(false); handleNext(); }}>
                  {modalData.btn}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
};

export default Screen5Roadmap;
