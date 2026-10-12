import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Screen1Props {
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleManualStart: (e: React.FormEvent) => void;
  loading: boolean;
  googleButtonRef: React.RefObject<HTMLDivElement>;
}

const Screen1Welcome: React.FC<Screen1Props> = ({ formData, handleChange, handleManualStart, loading, googleButtonRef }) => {
  return (
    <section className="screen active" data-i="0">
      <h1 className="headline" style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}>
        Empowering India's Youth with<br /><span className="highlight-pink">World-Class Education</span>
      </h1>
      
      <p 
        className="text-[#111827] font-normal text-sm sm:text-base max-w-[550px] mx-auto mt-2 mb-4 leading-relaxed px-4"
        style={{ textShadow: "0 2px 15px rgba(255,255,255,1), 0 0 30px rgba(255,255,255,1), 0 0 8px rgba(255,255,255,0.8)" }}
      >
        Learn. Grow. Build your future. Explore free residential programs across technology, finance, business, and more.
      </p>
      
      <form onSubmit={handleManualStart} className="flex flex-col items-center gap-3 mt-5 w-full max-w-[380px] mx-auto bg-white/10 backdrop-blur-xl p-5 sm:p-6 rounded-[1.5rem] border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.15)] text-left">
        <div className="flex gap-2.5 w-full">
          <input 
            name="name" 
            placeholder="First Name" 
            value={formData.name} 
            onChange={handleChange} 
            required 
            className="w-1/2 px-3 py-2.5 rounded-xl border-2 border-gray-300 bg-white/95 focus:bg-white focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 text-gray-800 text-sm font-normal placeholder:text-gray-400 placeholder:font-normal transition-all shadow-sm"
          />
          <input 
            name="lastname" 
            placeholder="Last Name" 
            value={formData.lastname} 
            onChange={handleChange} 
            required 
            className="w-1/2 px-3 py-2.5 rounded-xl border-2 border-gray-300 bg-white/95 focus:bg-white focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 text-gray-800 text-sm font-normal placeholder:text-gray-400 placeholder:font-normal transition-all shadow-sm"
          />
        </div>
        <input 
          name="phone" 
          placeholder="10-digit Phone Number" 
          value={formData.phone} 
          onChange={handleChange} 
          required 
          type="tel"
          maxLength={10}
          className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-300 bg-white/95 focus:bg-white focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 text-gray-800 text-sm font-normal placeholder:text-gray-400 placeholder:font-normal transition-all shadow-sm"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="w-full mt-2 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-white text-base bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 shadow-[0_6px_15px_rgba(236,72,153,0.3)] hover:shadow-[0_8px_20px_rgba(236,72,153,0.5)] transform hover:-translate-y-0.5 transition-all active:scale-95 border border-pink-400/50"
        >
          {loading ? "Loading..." : "Start Journey →"}
        </button>
        
        <div className="w-full relative flex items-center justify-center my-2 opacity-80">
          <div className="border-t-2 border-white/20 w-full absolute"></div>
          <span className="bg-[#5b3252] px-3 py-0.5 rounded-full text-white/90 font-medium text-[10px] relative z-10 tracking-widest uppercase border border-white/10 shadow-sm">OR</span>
        </div>
        
        <div 
          id="google-signin-button-gamified" 
          ref={googleButtonRef} 
          className="w-full flex justify-center hover:scale-[1.02] transition-transform bg-white/5 p-1 rounded-xl border border-white/10"
        ></div>
      </form>
    </section>
  );
};

export default Screen1Welcome;
