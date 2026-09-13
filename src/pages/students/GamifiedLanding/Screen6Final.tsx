import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Lock } from 'lucide-react';

const Screen6Final: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Confetti effect
    const scope = document.getElementById('finalScreen');
    if (!scope) return;
    
    const colors = ['#e91e63', '#d97706', '#059669', '#0284c7', '#f59e0b'];
    for (let i = 0; i < 45; i++) {
        const c = document.createElement('div');
        c.className = 'confetti';
        c.style.left = Math.random() * 100 + '%';
        c.style.background = colors[Math.floor(Math.random() * colors.length)];
        c.style.animationDelay = (Math.random() * 0.7) + 's';
        c.style.borderRadius = Math.random() > 0.5 ? '50%' : '3px';
        c.style.pointerEvents = 'none';
        c.style.zIndex = '100';
        scope.appendChild(c);
    }
    
    return () => {
      const old = scope.querySelectorAll('.confetti');
      old.forEach(o => o.remove());
    };
  }, []);

  return (
    <section id="finalScreen" className="screen active w-full h-full" data-i="5">
      <div className="w-full max-w-[820px] mx-auto bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex flex-col md:flex-row overflow-hidden text-left font-sans relative z-[101] shrink-0 my-auto">
        
        {/* Left Side */}
        <div className="flex-1 p-6 sm:p-8 md:p-12 lg:p-14 flex flex-col justify-center bg-white relative">
          
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-500 font-bold px-3 py-1.5 rounded-full text-[12px] mb-6 w-max border border-rose-100">
            <span>🚀</span>
            <span>One step away</span>
          </div>

          <h2 className="text-[24px] md:text-[28px] leading-tight font-serif text-[#0f172a] font-medium mb-4 tracking-tight">
            Your seat is almost ready
          </h2>
          
          <p className="text-[#64748b] text-[15px] mb-8 leading-relaxed max-w-[420px]">
            Everything's set up on our side. Book your free screening test and we'll take it from here — no fees, no obligation.
          </p>

          {/* Steps */}
          <div className="flex flex-col gap-3.5 mb-10">
            {/* Step 1 */}
            <div className="flex items-center justify-between border border-gray-200/60 rounded-2xl p-4 shadow-sm bg-white">
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 rounded-full bg-[#10b981] flex items-center justify-center text-white shrink-0">
                  <Check size={14} strokeWidth={4} />
                </div>
                <span className="font-bold text-[#0f172a] text-[15px]">Complete online screening test</span>
              </div>
              <span className="text-[12px] font-bold text-[#64748b]">Free · 20 min</span>
            </div>

            {/* Step 2 */}
            <div className="flex items-center justify-between border border-pink-200/60 rounded-2xl p-4 shadow-sm bg-[#fff1f2]">
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 rounded-full bg-[#e11d48] flex items-center justify-center text-white font-bold text-[13px] shrink-0">
                  2
                </div>
                <span className="font-bold text-[#0f172a] text-[15px]">Try the hands-on learning round</span>
              </div>
              <span className="text-[12px] font-bold text-[#64748b]">Up next</span>
            </div>

            {/* Step 3 */}
            <div className="flex items-center justify-between border border-gray-100 rounded-2xl p-4 bg-[#f8fafc]">
              <div className="flex items-center gap-4 opacity-60">
                <div className="w-6 h-6 rounded-full bg-[#fef3c7] flex items-center justify-center text-[#d97706] shrink-0">
                  <Lock size={14} strokeWidth={3} />
                </div>
                <span className="font-bold text-[#64748b] text-[15px]">Join the residential campus</span>
              </div>
              <span className="text-[12px] font-bold text-[#94a3b8]">Final step</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5 mt-auto">
            <button 
              onClick={() => navigate('/students/details/registration')}
              className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-pink-500/25 hover:scale-[1.02] transition-transform text-[16px]"
            >
              Book free admission test
            </button>
          </div>
          
        </div>

        {/* Right Side */}
        <div className="w-full md:w-[320px] lg:w-[340px] bg-gradient-to-br from-[#2a1c2c] to-[#1a101d] text-white p-6 sm:p-8 md:p-10 flex flex-col justify-between shrink-0 relative overflow-hidden">
          
          {/* Subtle glow effect in the top right as seen in image */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#f97316]/15 rounded-full blur-[80px] pointer-events-none transform translate-x-1/4 -translate-y-1/4"></div>

          <div className="relative z-10 mt-4">
            <h3 className="text-4xl lg:text-5xl font-serif text-[#ffedd5] mb-2 font-bold tracking-tight">2,000+</h3>
            <p className="text-[#e2e8f0] text-[15px] font-medium leading-relaxed max-w-[250px]">students who started exactly where you are now</p>
          </div>

          <div className="flex justify-center py-12 relative z-10">
            {/* Simple SVG Illustration of a waving person */}
            <svg width="120" height="120" viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Head */}
              <circle cx="50" cy="30" r="16" fill="#fcd34d" />
              {/* Hair curve */}
              <path d="M 34 30 Q 50 -2, 66 30" stroke="#1e293b" strokeWidth="2" fill="none" />
              {/* Eyes */}
              <circle cx="43" cy="28" r="2.5" fill="#1e293b" />
              <circle cx="57" cy="28" r="2.5" fill="#1e293b" />
              {/* Smile */}
              <path d="M 45 35 Q 50 42, 55 35" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" fill="none" />
              {/* Body */}
              <path d="M 30 55 Q 50 48, 70 55 L 67 100 L 33 100 Z" fill="#f97316" />
              {/* Waving Arm */}
              <path d="M 68 62 Q 85 50, 78 35" stroke="#f97316" strokeWidth="12" strokeLinecap="round" fill="none" />
              {/* Hand/Coin */}
              <circle cx="78" cy="32" r="7" fill="#fcd34d" />
            </svg>
          </div>

          <ul className="flex flex-col gap-4 text-[14px] font-medium relative z-10 mb-4">
            <li className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5 border border-white/10">
                <Check size={12} strokeWidth={3} className="text-[#e2e8f0]" />
              </div>
              <span className="text-[#cbd5e1] leading-tight pt-0.5">100% scholarship, always free</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5 border border-white/10">
                <Check size={12} strokeWidth={3} className="text-[#e2e8f0]" />
              </div>
              <span className="text-[#cbd5e1] leading-tight pt-0.5">No coding background needed</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5 border border-white/10">
                <Check size={12} strokeWidth={3} className="text-[#e2e8f0]" />
              </div>
              <span className="text-[#cbd5e1] leading-tight pt-0.5">Retake allowed if you don't clear it</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default Screen6Final;
