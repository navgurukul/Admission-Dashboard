import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { getStudentDataByPhone, getStudentDataByEmail } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";

import Screen1Welcome from "./GamifiedLanding/Screen1Welcome";
import Screen2Schools, { SCHOOL_DATA } from "./GamifiedLanding/Screen2Schools";
import Screen3Scholarship from "./GamifiedLanding/Screen3Scholarship";
import Screen4Outcomes from "./GamifiedLanding/Screen4Outcomes";
import Screen5Roadmap from "./GamifiedLanding/Screen5Roadmap";
import Screen6Final from "./GamifiedLanding/Screen6Final";
import LeavesCanvas from "./GamifiedLanding/LeavesCanvas";
import GamifiedHud from "./GamifiedLanding/GamifiedHud";

const injectCss = (): Promise<void> => {
  const cssFiles = [
    "/gamified-assets/css/variables.css",
    "/gamified-assets/css/base.css",
    "/gamified-assets/css/components.css",
    "/gamified-assets/css/hud.css",
    "/gamified-assets/css/mentor.css",
    "/gamified-assets/css/screens.css",
  ];
  const promises = cssFiles.map((href, index) => {
    return new Promise<void>((resolve) => {
      const id = `gamified-css-${index}`;
      if (document.getElementById(id)) {
        resolve();
      } else {
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.onload = () => resolve();
        link.onerror = () => resolve();
        link.setAttribute("href", href);
        document.head.appendChild(link);
      }
    });
  });
  return Promise.all(promises).then(() => {});
};

export default function GamifiedLanding() {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentScreen, setCurrentScreen] = useState(() => {
    return parseInt(sessionStorage.getItem("gamifiedScreen") || "0", 10);
  });
  const [modalSchoolIndex, setModalSchoolIndex] = useState<{index: number, campusName?: string, actualSchoolId?: number} | null>(null);

  useEffect(() => {
    sessionStorage.setItem("gamifiedScreen", currentScreen.toString());
  }, [currentScreen]);

  const [cssLoaded, setCssLoaded] = useState(false);

  const {
    user: googleUser,
    isAuthenticated,
    loading: googleLoading,
    renderGoogleSignInButton,
  } = useGoogleAuth({ skipAutoNavigation: true });
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    lastname: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [hasProcessedAuth, setHasProcessedAuth] = useState(false);

  const handleExistingUserRedirect = (apiResponse: any, email?: string) => {
    const payload = (apiResponse as unknown as any)?.data ?? apiResponse ?? null;
    localStorage.setItem("studentData", JSON.stringify(payload));
    
    const profile = payload?.student ?? payload ?? null;
    const studentId = profile?.student_id ?? profile?.id;
    if (studentId) {
      localStorage.setItem("studentId", String(studentId));
    }

    localStorage.setItem("role", "student");
    localStorage.setItem("userRole", JSON.stringify("student"));

    const registrationDone = Boolean(
      profile && profile.student_id && profile.dob && profile.gender,
    );

    const examSessions = Array.isArray(payload?.exam_sessions) ? payload.exam_sessions : [];
    const testStarted = examSessions.length > 0;
    const testCompleted = examSessions.some((s: any) => testStarted || Boolean(s.is_passed));
    const allowRetest = Boolean(payload?.allow_retest ?? false);

    localStorage.setItem("registrationDone", registrationDone ? "true" : "false");
    localStorage.setItem("testStarted", testStarted ? "true" : "false");
    localStorage.setItem("testCompleted", testStarted ? "true" : "false");
    localStorage.setItem("allowRetest", allowRetest ? "true" : "false");

    toast({
      title: "Welcome Back!",
      description: "Resuming your existing journey...",
      variant: "default",
      className: "border-green-500 bg-green-50 text-green-900"
    });

    if (!registrationDone) {
      setCurrentScreen(1);
      return;
    }
    if (testStarted && !testCompleted) {
      navigate("/students/test/start");
      return;
    }
    if (testCompleted && !allowRetest) {
      navigate("/students/final-result");
      return;
    }
    navigate("/students/details/instructions", { state: { googleEmail: email } });
  };

  useEffect(() => {
    document.body.classList.remove('slide-other');
    injectCss().then(() => setCssLoaded(true));
    
    // If the user is at the very start of the journey, clear any stale student data
    if (currentScreen === 0) {
      localStorage.removeItem("studentFormData");
      localStorage.removeItem("studentId");
      localStorage.removeItem("studentApiResponse");
      localStorage.removeItem("studentName");
      localStorage.removeItem("studentData");
      localStorage.removeItem("registrationDone");
      localStorage.removeItem("testStarted");
      localStorage.removeItem("testCompleted");
    }
  }, [currentScreen]);

  useEffect(() => {
    if (cssLoaded && googleButtonRef.current && !googleLoading && !isAuthenticated && currentScreen === 0) {
      const timer = setTimeout(() => {
        renderGoogleSignInButton("google-signin-button-gamified");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [googleLoading, isAuthenticated, currentScreen, cssLoaded]);

  useEffect(() => {
    if (currentScreen === 0) {
      document.body.classList.remove('slide-other');
    } else {
      document.body.classList.add('slide-other');
    }
  }, [currentScreen]);

  useEffect(() => {
    if (hasProcessedAuth || !isAuthenticated || !googleUser) return;
    const processAuth = async () => {
      // Check if user is an Admin, User, or Team member and redirect appropriately
      const roleName = googleUser.role_name?.toUpperCase();
      const roleIdNum = Number(googleUser.role_id);
      const isTeam = roleIdNum === 3 || roleName === "TEAM";

      if (roleName === "ADMIN" || roleName === "USER" || isTeam) {
        setHasProcessedAuth(true);
        if (isTeam) {
          navigate("/donor");
        } else {
          navigate("/"); // Admin dashboard
        }
        return;
      }
      try {
        const response = await getStudentDataByEmail(googleUser.email);
        const resAny = response as any;
        if (resAny && (resAny.student || resAny.data || resAny.id)) {
          // User exists! Resume journey.
          setHasProcessedAuth(true);
          handleExistingUserRedirect(response, googleUser.email);
          return;
        }
      } catch (err: any) {
        // User does not exist, proceed to registration flow
      }

      localStorage.setItem("studentName", googleUser.name.split(" ")[0]);
      setHasProcessedAuth(true);
      setCurrentScreen((prev) => (prev === 0 ? 1 : prev)); // Only proceed to 1 if we were on 0
    };
    void processAuth();
  }, [googleUser, isAuthenticated, hasProcessedAuth]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData({ ...formData, [name]: value.replace(/\D/g, "") });
      return;
    }
    if (name === "name" || name === "lastname") {
      setFormData({ ...formData, [name]: value.replace(/[^a-zA-Z\s]/g, "") });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleManualStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phone.length !== 10) return;
    
    setLoading(true);
    try {
      // 1. API check: verify if the student already exists
      try {
        const response = await getStudentDataByPhone(formData.phone, formData.name);
        const resAny = response as any;
        if (resAny && (resAny.student || resAny.data || resAny.id)) {
          // User exists! Resume journey.
          handleExistingUserRedirect(response);
          return;
        }
      } catch (err: any) {
        // User does not exist, proceed to registration flow
      }

      localStorage.setItem("studentFormData", JSON.stringify({
        firstName: formData.name,
        lastName: formData.lastname,
        alternateNumber: formData.phone,
        middleName: ""
      }));
      localStorage.setItem("studentName", formData.name);
      setCurrentScreen(1); // Next Screen
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolSelect = (idx: number, campusName?: string, actualSchoolId?: number) => {
    try {
      let existingData = localStorage.getItem('studentFormData');
      let data = existingData ? JSON.parse(existingData) : {};
      data.initial_school_id = actualSchoolId ? actualSchoolId : (idx + 1); // fallback to idx+1
      if (campusName) {
        data.preferred_campus_id = campusName;
      }
      localStorage.setItem('studentFormData', JSON.stringify(data));
    } catch (e) {}
    setModalSchoolIndex(null);
    setCurrentScreen(2);
  };

  if (!cssLoaded) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-[#fffcf5] fixed inset-0 z-[10000]">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Loading your journey...</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      id="gamified-react-root" 
      className="w-full min-h-screen overflow-y-auto overflow-x-hidden relative text-left"
    >
      <div id="world">
        <div className="banyan-bg-layer"><div className="world-overlay"></div></div>
        <LeavesCanvas />
      </div>

      <GamifiedHud currentScreenIndex={currentScreen} onScreenChange={(idx) => setCurrentScreen(idx)} />

      {currentScreen > 0 && (
        <button className="nav-arrow" style={{left: '20px'}} onClick={() => setCurrentScreen(s => s - 1)}>‹</button>
      )}
      {currentScreen < 5 && currentScreen > 0 && (
        <button className="nav-arrow" style={{right: '20px'}} onClick={() => setCurrentScreen(s => s + 1)}>›</button>
      )}

      <div id="stage">
        {(googleLoading || (isAuthenticated && !hasProcessedAuth)) && (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#fffcf5] z-[9999] fixed inset-0">
            <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">Loading your journey...</p>
          </div>
        )}

        {currentScreen === 0 && (
          <Screen1Welcome 
            formData={formData} 
            handleChange={handleChange} 
            handleManualStart={handleManualStart} 
            loading={loading} 
            googleButtonRef={googleButtonRef} 
          />
        )}
        {currentScreen === 1 && <Screen2Schools onSelectSchool={handleSchoolSelect} openSchoolModal={(index, campusName) => setModalSchoolIndex({ index, campusName })} />}
        {currentScreen === 2 && <Screen3Scholarship />}
        {currentScreen === 3 && <Screen4Outcomes openTestimonialModal={() => {}} />}
        {currentScreen === 4 && <Screen5Roadmap onNextScreen={() => setCurrentScreen(5)} />}
        {currentScreen === 5 && <Screen6Final />}
      </div>

      {/* Legacy School Modal */}
      {/* School Modal */}
      {modalSchoolIndex !== null && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) setModalSchoolIndex(null); }}>
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative" style={{ fontFamily: 'var(--font-body)' }}>
            
            {/* Header */}
            <div 
              style={{
                background: SCHOOL_DATA[modalSchoolIndex.index].bgClass === 'blue-bg' 
                  ? 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)' 
                  : SCHOOL_DATA[modalSchoolIndex.index].bgClass === 'green-bg'
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : SCHOOL_DATA[modalSchoolIndex.index].bgClass === 'orange-bg'
                      ? 'linear-gradient(135deg, #f43f5e 0%, #f97316 100%)'
                      : 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)'
              }}
              className="p-6 text-white relative flex-shrink-0"
            >
              <button 
                onClick={() => setModalSchoolIndex(null)}
                className="absolute top-5 right-5 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                ✕
              </button>
              <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-[11px] font-bold tracking-wide mb-3" style={{backdropFilter: 'blur(4px)'}}>
                {SCHOOL_DATA[modalSchoolIndex.index].tag}
              </div>
              <h2 className="text-[26px] font-bold leading-tight" style={{fontFamily: 'serif'}}>{SCHOOL_DATA[modalSchoolIndex.index].title}</h2>
            </div>

            {/* Body */}
            <div className="p-6 pb-6 flex flex-col gap-5 text-[#334155] bg-white overflow-y-auto">
              <div className="flex flex-col md:flex-row gap-5">
                {/* Eligibility */}
                <div className="flex-1">
                  <h3 className="text-[15px] font-bold mb-3 flex items-center gap-2 text-[#1e293b]">
                    <div style={{width: '28px', height: '28px', backgroundColor: '#fce7f3', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'}}>🎯</div>
                    Eligibility
                  </h3>
                  <ul className="space-y-2">
                    {SCHOOL_DATA[modalSchoolIndex.index].eligibility.map((it, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px]">
                        <span className="text-[#f43f5e] bg-[#ffe4e6] rounded-full w-[16px] h-[16px] flex items-center justify-center text-[9px] flex-shrink-0 mt-0.5 font-bold">✓</span>
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Outcomes */}
                <div className="flex-1">
                  <h3 className="text-[15px] font-bold mb-3 flex items-center gap-2 text-[#1e293b]">
                    <div style={{width: '28px', height: '28px', backgroundColor: '#fef3c7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'}}>🏆</div>
                    Outcomes
                  </h3>
                  <ul className="space-y-2">
                    {SCHOOL_DATA[modalSchoolIndex.index].outcomes.map((it, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px]">
                        <span className="text-[#d97706] bg-[#fef3c7] rounded-full w-[16px] h-[16px] flex items-center justify-center text-[9px] flex-shrink-0 mt-0.5 font-bold">★</span>
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Curriculum focus */}
              <div>
                <h3 className="text-[15px] font-bold mb-3 flex items-center gap-2 text-[#1e293b]">
                  <div style={{width: '28px', height: '28px', backgroundColor: '#e0f2fe', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'}}>📚</div>
                  Curriculum focus
                </h3>
                <div className="flex flex-wrap gap-2">
                  {SCHOOL_DATA[modalSchoolIndex.index].curriculum.map((it, i) => (
                    <div key={i} className="px-3 py-1.5 border border-[#e2e8f0] rounded-lg text-[#334155] text-[12px] font-medium bg-[#fafaf9]">
                      {it}
                    </div>
                  ))}
                </div>
              </div>

              {/* Duration & Location Box */}
              <div className="flex flex-col sm:flex-row border border-[#fed7aa] bg-[#fffbf5] rounded-xl overflow-hidden mt-1">
                <div className="flex-1 p-4 border-b sm:border-b-0 sm:border-r border-[#fed7aa]">
                  <div className="text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-1 flex items-center gap-1.5">
                    <span className="text-[12px]">⏳</span> DURATION
                  </div>
                  <div className="text-[15px] font-bold text-[#0f172a]">
                    {SCHOOL_DATA[modalSchoolIndex.index].duration.split(',')[0].replace(' (Self-paced', '').trim()}
                    {SCHOOL_DATA[modalSchoolIndex.index].title.includes('BCA') ? ' Years' : ' months'}
                  </div>
                </div>
                <div className="flex-1 p-4">
                  <div className="text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-1 flex items-center gap-1.5">
                    <span className="text-[12px]">📍</span> LOCATION
                  </div>
                  <div className="text-[15px] font-bold text-[#0f172a]">
                    {modalSchoolIndex.campusName || SCHOOL_DATA[modalSchoolIndex.index].location.split(',')[0]}
                  </div>
                </div>
              </div>


            </div>
          </div>
        </div>
      )}
    </div>
  );
}
