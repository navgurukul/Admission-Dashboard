import React, { useState, useEffect } from 'react';
import { getCampusesApi, getCampusSchools } from "@/utils/api";
interface SchoolData {
  tag: string;
  title: string;
  bgClass: string;
  eligibility: string[];
  curriculum: string[];
  outcomes: string[];
  duration: string;
  location: string;
}

export const SCHOOL_DATA: SchoolData[] = [
  {
    tag: 'SOFTWARE DEVELOPMENT',
    title: 'School of Programming (SOP)',
    bgClass: 'blue-bg',
    eligibility: ['Minimum age: 16.5 years', 'Must be a Graduate', 'Family income less than 5 LPA', 'Strong interest in coding and problem solving', 'Ready to stay in a residential program'],
    curriculum: ['Programming Basics & Logical Thinking', 'Frontend: HTML, CSS, JavaScript, React', 'Backend: Node.js, Express, Databases', 'Git & GitHub', 'English Communication & Workplace Skills'],
    outcomes: ['Software Engineer', 'Full Stack Developer', 'Entry-level IT Jobs', 'Career growth in the tech industry'],
    duration: '20–24 months (Self-paced, duration may vary)',
    location: 'Various Campuses (Dantewada, Bengaluru, Pune etc.)'
  },
  {
    tag: 'OPERATIONS & MARKETING',
    title: 'School of Business (SOB)',
    bgClass: 'green-bg',
    eligibility: ['Minimum age: 16.5 years', 'Must be 12th pass', 'Family income less than 5 LPA', 'Good communication skills'],
    curriculum: ['Business Operations', 'Digital Marketing', 'Customer Coordination', 'Email Writing', 'Real-world projects'],
    outcomes: ['Marketing Associate', 'Operations Executive', 'Customer Support'],
    duration: '12–18 months',
    location: 'Bengaluru, Jashpur, Dantewada, Pune'
  },
  {
    tag: 'ACCOUNTING & TAXATION',
    title: 'School of Finance (SOF)',
    bgClass: 'orange-bg',
    eligibility: ['Minimum age: 16.5 years', 'Must be 12th pass', 'Family income less than 5 LPA', 'Interest in finance'],
    curriculum: ['Practical Accounting', 'GST & Income Tax', 'Payroll Management', 'Tally & Excel', 'Financial Reporting'],
    outcomes: ['Accounts Executive', 'Tax Associate', 'Finance Operations'],
    duration: '8–12 months',
    location: 'Pune, Maharashtra'
  },
  {
    tag: 'DEGREE PROGRAM',
    title: 'Bachelor of Computer Applications (BCA)',
    bgClass: 'purple-bg',
    eligibility: [
      'Minimum age: 16.5 years', 
      'Must be 12th pass (Any Stream)', 
      'Family income less than 5 LPA', 
      'Passionate about building a career in tech'
    ],
    curriculum: [
      'Core Computer Science Concepts', 
      'Full-Stack Web Development (MERN)', 
      'Data Structures & Algorithms', 
      'Aptitude & English Communication', 
      'Live Projects & Internships'
    ],
    outcomes: [
      'Software Development Engineer (SDE)', 
      'Full-Stack Developer', 
      'Quality Assurance (QA) Engineer',
      'Tech Consultant'
    ],
    duration: '3 Years (Full-time Residential)',
    location: 'Various Navgurukul Campuses'
  }
];



const SCHOOL_MAPPING: Record<string, { index: number; tagClass: string; label: string; icon: string }> = {
  SOP: { index: 0, tagClass: 'blue-tag', label: 'SOP', icon: '💻' },
  SOB: { index: 1, tagClass: 'green-tag', label: 'SOB', icon: '📊' },
  SOF: { index: 2, tagClass: 'orange-tag', label: 'SOF', icon: '💰' },
  BCA: { index: 3, tagClass: 'purple-tag', label: 'BCA', icon: '🎓' },
};

const BigSchoolCard = ({ schoolData, openSchoolModal }: { schoolData: any, openSchoolModal: (idx: number, cName?: string, actualSchoolId?: number) => void }) => {
  const code = getSchoolCodeFromName(schoolData.school_name || '', schoolData.school_id);
  const mapping = code ? SCHOOL_MAPPING[code] : null;
  const data = mapping ? SCHOOL_DATA[mapping.index] : null;

  let tagBg = '#f1f5f9';
  let tagColor = '#475569';
  let iconBg = '#f1f5f9';
  let iconFile = '🎓';

  if (code === 'SOP') {
    tagBg = '#e0f2fe'; tagColor = '#0284c7'; iconBg = '#e0f2fe'; iconFile = '💻';
  } else if (code === 'SOB') {
    tagBg = '#dcfce7'; tagColor = '#059669'; iconBg = '#dcfce7'; iconFile = '📊';
  } else if (code === 'SOF') {
    tagBg = '#ffedd5'; tagColor = '#ea580c'; iconBg = '#ffedd5'; iconFile = '💰';
  } else if (code === 'BCA') {
    tagBg = '#f3e8ff'; tagColor = '#7c3aed'; iconBg = '#f3e8ff'; iconFile = '🎓';
  }

  let desc = 'Explore this program for more details.';
  let displayDuration = 'Duration varies';
  if (code === 'SOF') {
    desc = 'Practical accounting, GST, income tax and Tally/Excel skills for finance-track careers.';
    displayDuration = '8–12 months';
  } else if (code === 'SOP') {
    desc = 'Learn coding from basics to full-stack web development, project by project.';
    displayDuration = '20–24 months , self-paced';
  } else if (code === 'SOB') {
    desc = 'Master business operations, marketing and management fundamentals.';
    displayDuration = '12–18 months';
  } else if (code === 'BCA') {
    desc = 'A comprehensive 3-year degree program for a successful career in tech.';
    displayDuration = '3 Years';
  }

  const title = schoolData.school_name || 'Program';
  const tagText = data ? data.tag : 'PROGRAM';
  const isOpen = schoolData.is_open;

  return (
    <div 
      onClick={() => {
        if (isOpen && mapping) openSchoolModal(mapping.index, undefined, schoolData.school_id);
      }} 
      style={{ 
        position: 'relative',
        cursor: (isOpen && mapping) ? 'pointer' : 'default', 
        width: '100%', 
        backgroundColor: isOpen
          ? code === 'SOP' ? '#eff6ff'
          : code === 'SOB' ? '#f0fdf4'
          : code === 'SOF' ? '#fff7ed'
          : '#faf5ff'
          : '#f8fafc',
        borderRadius: '16px',
        border: isOpen
          ? code === 'SOP' ? '1.5px solid #93c5fd'
          : code === 'SOB' ? '1.5px solid #6ee7b7'
          : code === 'SOF' ? '1.5px solid #fdba74'
          : '1.5px solid #c4b5fd'
          : '1px solid #cbd5e1',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: isOpen
          ? code === 'SOP' ? '0 8px 24px rgba(59,130,246,0.18)'
          : code === 'SOB' ? '0 8px 24px rgba(16,185,129,0.18)'
          : code === 'SOF' ? '0 8px 24px rgba(249,115,22,0.18)'
          : '0 8px 24px rgba(168,85,247,0.18)'
          : '0 4px 12px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        opacity: isOpen ? 1 : 0.75,
        filter: isOpen ? 'none' : 'grayscale(100%)'
      }}
      onMouseEnter={(e) => {
        if (!isOpen) return;
        e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
        e.currentTarget.style.boxShadow = code === 'SOP' ? '0 20px 40px rgba(59,130,246,0.28)'
          : code === 'SOB' ? '0 20px 40px rgba(16,185,129,0.28)'
          : code === 'SOF' ? '0 20px 40px rgba(249,115,22,0.28)'
          : '0 20px 40px rgba(168,85,247,0.28)';
        const circle = e.currentTarget.querySelector('.card-circle') as HTMLElement;
        if(circle) circle.style.transform = 'scale(1.3)';
      }}
      onMouseLeave={(e) => {
        if (!isOpen) return;
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = code === 'SOP' ? '0 8px 24px rgba(59,130,246,0.18)'
          : code === 'SOB' ? '0 8px 24px rgba(16,185,129,0.18)'
          : code === 'SOF' ? '0 8px 24px rgba(249,115,22,0.18)'
          : '0 8px 24px rgba(168,85,247,0.18)';
        const circle = e.currentTarget.querySelector('.card-circle') as HTMLElement;
        if(circle) circle.style.transform = 'scale(1)';
      }}
      role="button"
      tabIndex={0}
    >
      {/* Colored top accent bar for open cards */}
      {isOpen && (
        <div style={{
          height: '4px',
          background: code === 'SOP' ? 'linear-gradient(90deg, #0ea5e9, #6366f1)' 
            : code === 'SOB' ? 'linear-gradient(90deg, #10b981, #059669)'
            : code === 'SOF' ? 'linear-gradient(90deg, #f97316, #ef4444)'
            : 'linear-gradient(90deg, #a855f7, #7c3aed)',
          width: '100%'
        }} />
      )}
      <div 
        className="card-circle"
        style={{
          position: 'absolute',
          top: '-12px',
          right: '-12px',
          width: '40px',
          height: '40px',
          backgroundColor: iconBg,
          borderRadius: '50%',
          transition: 'all 0.2s',
          opacity: isOpen ? 0.7 : 0.3
        }} 
      />
      <div style={{ padding: '20px' }}>
        <div style={{
          backgroundColor: tagBg,
          color: tagColor,
          padding: '4px 10px',
          borderRadius: '99px',
          fontSize: '10px',
          fontWeight: '800',
          display: 'inline-block',
          marginBottom: '16px'
        }}>
          {tagText}
        </div>
        
        <div style={{
          width: '36px', height: '36px',
          backgroundColor: iconBg,
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          marginBottom: '16px'
        }}>
          {iconFile}
        </div>

        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
          {title}
        </h3>
        
        <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: '1.4', minHeight: '44px' }}>
          {desc}
        </p>
      </div>

      <div style={{ borderTop: '1px solid #f1f5f9', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#ffffff', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px' }}>
          <span style={{ color: '#e11d48' }}>📍</span> Available at this campus
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px' }}>
          <span style={{ color: '#eab308' }}>⏳</span> <span>Duration: <strong>{displayDuration.split(',')[0]}</strong>{displayDuration.includes(',') ? ',' + displayDuration.split(',')[1] : ''}</span>
        </div>
        

        {/* Status badge - view only, no apply */}
        <div style={{
          marginTop: '10px',
          width: '100%',
          padding: '8px',
          backgroundColor: isOpen ? `${iconBg}` : '#f1f5f9',
          color: isOpen ? tagColor : '#94a3b8',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: '700',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}>
          {isOpen ? <><span>✅</span> Admissions Open</> : <><span>🔒</span> Admissions Closed</>}
        </div>
      </div>
    </div>
  );
};

const getCampusStyles = (index: number) => {
  const styles = [
    { gradient: "linear-gradient(135deg, #ffedd5 0%, #ffedd5 100%)", text_color: "#0f766e", badge_bg: "#ccfbf1", badge_border: "#99f6e4" },
    { gradient: "linear-gradient(135deg, #dcfce7 0%, #ccfbf1 100%)", text_color: "#059669", badge_bg: "#dcfce7", badge_border: "#bbf7d0" },
    { gradient: "linear-gradient(135deg, #f3e8ff 0%, #e0e7ff 100%)", text_color: "#16a34a", badge_bg: "#dcfce7", badge_border: "#bbf7d0" },
    { gradient: "linear-gradient(135deg, #e0f2fe 0%, #e0f2fe 100%)", text_color: "#0f766e", badge_bg: "#ccfbf1", badge_border: "#99f6e4" },
    { gradient: "linear-gradient(135deg, #ffe4e6 0%, #ffedd5 100%)", text_color: "#0f766e", badge_bg: "#ccfbf1", badge_border: "#99f6e4" },
    { gradient: "linear-gradient(135deg, #fce7f3 0%, #fae8ff 100%)", text_color: "#db2777", badge_bg: "#fce7f3", badge_border: "#fbcfe8" }
  ];
  return styles[index % styles.length];
};

interface CampusCardProps {
  campus: { id: number; campus_name: string };
  idx: number;
  onClick: () => void;
  setHoveredCard: (idx: number | null) => void;
}

const CampusCard: React.FC<CampusCardProps> = ({ campus, idx, onClick, setHoveredCard }) => {
  const [isHovered, setIsHovered] = useState(false);
  const styles = getCampusStyles(idx);

  return (
    <div
      onMouseEnter={() => { setIsHovered(true); setHoveredCard(idx); }}
      onMouseLeave={() => { setIsHovered(false); setHoveredCard(null); }}
      onClick={onClick}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: isHovered ? '0 16px 32px rgba(0,0,0,0.16)' : '0 8px 24px rgba(0,0,0,0.12)',
        border: '1px solid #cbd5e1',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '320px',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      <div style={{
        height: '70px',
        background: styles.gradient,
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'flex-start'
      }}>
        <div style={{
          width: '24px', height: '24px', 
          backgroundColor: 'white', 
          borderRadius: '50%', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          transition: 'all 0.2s',
          transform: isHovered ? 'scale(1.1)' : 'scale(1)'
        }} />
      </div>

      <div style={{ padding: '16px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '18px', color: '#e11d48' }}>📍</span>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{campus.campus_name}</h3>
        </div>
        
        <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '16px', minHeight: '18px' }}>
          {((campus as any).state || (campus as any).region) ? (
            `${(campus as any).state || 'India'} · ${(campus as any).region || 'Campus'}`
          ) : (
            'NavGurukul Campus'
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <span style={{
            backgroundColor: (campus as any).gender === 'Boys Campus' ? '#e0f2fe' : (campus as any).gender === 'Co-ed' ? '#f3e8ff' : '#fce7f3',
            color: (campus as any).gender === 'Boys Campus' ? '#0369a1' : (campus as any).gender === 'Co-ed' ? '#7e22ce' : '#be185d',
            padding: '4px 12px',
            borderRadius: '99px',
            fontSize: '11px',
            fontWeight: '800',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>{(campus as any).gender === 'Boys Campus' ? '👦' : (campus as any).gender === 'Co-ed' ? '👦👧' : '👧'}</span> 
            {(campus as any).gender || 'Girls Campus'}
          </span>
        </div>

        <div style={{ 
          marginTop: 'auto', 
          padding: '12px', 
          backgroundColor: '#f8fafc', 
          border: '1px dashed #cbd5e1', 
          borderRadius: '12px', 
          color: '#475569', 
          fontSize: '13px', 
          fontWeight: '600',
          transition: 'all 0.2s',
          transform: isHovered ? 'scale(1.02)' : 'scale(1)'
        }}>
          Click to view available schools & courses →
        </div>
      </div>
    </div>
  );
};

interface Screen2SchoolsProps {
  onSelectSchool: (index: number) => void;
  openSchoolModal: (index: number, campusName?: string) => void;
}

const getSchoolCodeFromName = (name: string, schoolId?: number) => {
  if (!name && !schoolId) return null;
  const lower = (name || '').toLowerCase();
  // Match by name patterns
  if (lower.includes('programming') || lower.includes('sop') || lower.includes('software')) return 'SOP';
  if (lower.includes('business') || lower.includes('sob') || lower.includes('marketing') || lower.includes('operations')) return 'SOB';
  if (lower.includes('finance') || lower.includes('sof') || lower.includes('accounting') || lower.includes('taxation')) return 'SOF';
  if (lower.includes('computer') || lower.includes('bca') || lower.includes('application')) return 'BCA';
  // Match AI/tech-related names to SOP
  if (lower.includes('ai') || lower.includes('tech') || lower.includes('lab') || lower.includes('data') || lower.includes('coding')) return 'SOP';
  // Fallback by school_id (common Navgurukul IDs: SOP=1, SOB=2, SOF=3, BCA=4 — adjust if needed)
  if (schoolId) {
    if (schoolId === 1) return 'SOP';
    if (schoolId === 2) return 'SOB';
    if (schoolId === 3) return 'SOF';
    if (schoolId === 4 || schoolId === 12 || schoolId === 13) return 'BCA';
    if (schoolId === 15) return 'SOB'; // 'testing' in the example
  }
  return 'SOP'; // Default fallback so modal always opens for open schools
};

const ENRICH_DATA: Record<string, any> = {
  "Dantewada": { state: "Chhattisgarh", region: "Central", gender: "Co-ed", available_schools: ["SOF", "SOP", "SOB"] },
  "Dharamshala": { state: "Himachal Pradesh", region: "North", gender: "Boys Campus", available_schools: ["SOP", "SOB"] },
  "Himachal Campus": { state: "Himachal Pradesh", region: "North", gender: "Girls Campus", available_schools: ["BCA"] },
  "Jashpur": { state: "Chhattisgarh", region: "Central", gender: "Girls Campus", available_schools: ["SOB", "SOP"] },
  "Kishanganj": { state: "Bihar", region: "North", gender: "Girls Campus", available_schools: ["SOB", "SOP"] },
  "Pune": { state: "Maharashtra", region: "West", gender: "Girls Campus", available_schools: ["SOB", "SOF", "SOP"] },
  "Raigarh": { state: "Chhattisgarh", region: "Central", gender: "Girls Campus", available_schools: ["SOP"] },
  "Raipur": { state: "Chhattisgarh", region: "Central", gender: "Girls Campus", available_schools: ["SOP", "SOB"] },
  "Sarjapur": { state: "Karnataka", region: "South", gender: "Girls Campus", available_schools: ["SOP", "SOF"] },
  "Udaipur": { state: "Rajasthan", region: "North", gender: "Girls Campus", available_schools: ["SOB", "SOP"] }
};

const Screen2Schools = ({ onSelectSchool, openSchoolModal }: { 
  onSelectSchool: (idx: number, campusName?: string, actualSchoolId?: number) => void;
  openSchoolModal: (idx: number, campusName?: string, actualSchoolId?: number) => void;
}) => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [campuses, setCampuses] = useState<{ id: number; campus_name: string; state?: string; region?: string; available_schools?: string[] }[]>([]);
  const [selectedCampus, setSelectedCampus] = useState<{ id: number; campus_name: string } | null>(null);
  const [campusSchools, setCampusSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSchools, setLoadingSchools] = useState(false);

  useEffect(() => {
    const fetchCampuses = async () => {
      try {
        const data = await getCampusesApi();
        const enrichedData = (data || []).map((c: any) => ({
          ...c,
          ...(ENRICH_DATA[c.campus_name] || {})
        }));
        setCampuses(enrichedData);
      } catch (err) {
        console.error("Failed to fetch campuses", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampuses();
  }, []);

  const handleSelectCampus = async (campus: { id: number; campus_name: string }) => {
    setSelectedCampus(campus);
    setLoadingSchools(true);
    setCampusSchools([]);
    try {
      const response = await getCampusSchools(campus.id);
      const schoolsData = response.data || response;
      if (Array.isArray(schoolsData)) {
        setCampusSchools(schoolsData);
      }
    } catch (err) {
      console.error("Failed to fetch campus schools", err);
    } finally {
      setLoadingSchools(false);
    }
  };

  return (
    <section 
      className="screen active" 
      data-i="1" 
      style={{ 
        overflowY: 'auto', 
        overflowX: 'hidden',
        paddingTop: '80px',
        paddingBottom: '20px',
        justifyContent: 'flex-start'
      }}
    >
      <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto', position: 'relative', padding: '0 20px' }}>
        
        {!selectedCampus ? (
          <>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 style={{ 
              marginBottom: '8px', 
              fontFamily: 'serif', 
              color: '#1e293b', 
              fontSize: '42px', 
              fontWeight: 'bold',
              letterSpacing: '-0.5px'
            }}>
              Our Campus
            </h1>
            <p style={{ 
              color: '#475569', 
              fontSize: '16px', 
              maxWidth: '650px', 
              margin: '0 auto',
              lineHeight: '1.5'
            }}>
              Explore our residential campuses across India. View the programs available at each location — you can discuss and confirm your preference later with your mentor.
            </p>
          </div>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading campuses...</div>
            ) : (
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))',
                  gap: '24px',
                  width: '100%',
                  position: 'relative',
                  zIndex: 10
                }}
              >
                {campuses.map((campus, idx) => (
                  <div key={campus.id} style={{ display: 'flex', justifyContent: 'center' }}>
                    <CampusCard 
                      campus={campus} 
                      idx={idx} 
                      onClick={() => handleSelectCampus(campus)} 
                      setHoveredCard={setHoveredCard} 
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ marginBottom: '32px', marginTop: '16px' }}>
              <button 
                onClick={() => setSelectedCampus(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#475569',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                ← Choose campus / <span style={{ color: '#0f172a' }}>{selectedCampus.campus_name}</span>
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h1 style={{ 
                margin: '0 0 8px 0', 
                fontFamily: 'serif', 
                color: '#1e293b', 
                fontSize: '36px', 
                fontWeight: 'bold',
                letterSpacing: '-0.5px'
              }}>
                Programs at {selectedCampus.campus_name}
              </h1>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <span style={{
                  backgroundColor: (selectedCampus as any).gender === 'Boys Campus' ? '#e0f2fe' : (selectedCampus as any).gender === 'Co-ed' ? '#f3e8ff' : '#fce7f3',
                  color: (selectedCampus as any).gender === 'Boys Campus' ? '#0369a1' : (selectedCampus as any).gender === 'Co-ed' ? '#7e22ce' : '#be185d',
                  padding: '6px 16px',
                  borderRadius: '99px',
                  fontSize: '13px',
                  fontWeight: '800',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>{(selectedCampus as any).gender === 'Boys Campus' ? '👦' : (selectedCampus as any).gender === 'Co-ed' ? '👦👧' : '👧'}</span> 
                  {(selectedCampus as any).gender || 'Girls Campus'}
                </span>
              </div>
              <p style={{ margin: '0 auto', color: '#64748b', fontSize: '16px', maxWidth: '650px' }}>
                {loadingSchools ? 'Loading available programs...' : `${campusSchools.length} programs open for admission at this campus right now.`}
              </p>
            </div>

            {!loadingSchools && (
              campusSchools.length === 1 ? (
                // Single card — center it with flexbox
                <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '40px' }}>
                  <div style={{ width: '100%', maxWidth: '380px' }}>
                    <BigSchoolCard 
                      schoolData={campusSchools[0]} 
                      openSchoolModal={(modalIdx, cName, actualSchoolId) => openSchoolModal(modalIdx, selectedCampus.campus_name, actualSchoolId)} 
                    />
                  </div>
                </div>
              ) : (
                // Multiple cards — use grid
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', 
                  gap: '20px',
                  paddingBottom: '40px',
                  justifyItems: 'stretch'
                }}>
                  {campusSchools.map((schoolItem: any, idx: number) => (
                    <div key={schoolItem.id || schoolItem.school_id || idx} style={{ width: '100%' }}>
                      <BigSchoolCard 
                        schoolData={schoolItem} 
                        openSchoolModal={(modalIdx, cName, actualSchoolId) => openSchoolModal(modalIdx, selectedCampus.campus_name, actualSchoolId)} 
                      />
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
        
      </div>
    </section>
  );
};

export default Screen2Schools;
