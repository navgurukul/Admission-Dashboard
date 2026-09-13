import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/routes/LaunguageContext.tsx";
import { useToast } from "@/hooks/use-toast";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  getAllCasts,
  Cast,
  getAllQualification,
  Qualification,
  getAllStatus,
  CurrentStatus,
  // Religion,
  // getAllReligions,
  createStudent,
  updateStudent,
  uploadProfileImage,
  getAllSchools,
  type School,
  getStudentDataByPhone,
  getCampusesApi as getAllCampuses,
  type Campus,
  getCampusSchools,
} from "@/utils/api";
import { detectHumanFace } from "@/utils/faceVerification";
import LogoutButton from "@/components/ui/LogoutButton";
import LanguageSelector from "@/components/ui/LanguageSelector";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";
import { ExternalLink, PlayCircle } from "lucide-react";
import { LearningRoundModal } from "@/components/LearningRoundModal";
import { ContextualHelpWidget } from "@/components/onboarding/ContextualHelpWidget";
import { useIsMobile } from "@/hooks/use-mobile";
import LeavesCanvas from "./GamifiedLanding/LeavesCanvas";


const injectCss = () => {
  const cssFiles = [
    "/gamified-assets/css/variables.css",
    "/gamified-assets/css/base.css",
    "/gamified-assets/css/components.css",
    "/gamified-assets/css/hud.css",
    "/gamified-assets/css/mentor.css",
    "/gamified-assets/css/screens.css",
  ];
  cssFiles.forEach((href, index) => {
    const id = `gamified-css-${index}`;
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.setAttribute("href", href);
      document.head.appendChild(link);
    }
  });
};

const StudentForm: React.FC = () => {
  useEffect(() => {
    injectCss();
  }, []);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { selectedLanguage } = useLanguage();
  const isMobile = useIsMobile();

  const [casts, setCasts] = useState<Cast[]>([]);
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [statuses, setStatuses] = useState<CurrentStatus[]>([]);
  // const [religions, setReligions] = useState<Religion[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedSchoolInfo, setSelectedSchoolInfo] = useState<any>(null);
  const [selectedCampusInfo, setSelectedCampusInfo] = useState<any>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [emailError, setEmailError] = useState("");
  const [alternateError, setAlternateError] = useState("");
  const [whatsappError, setWhatsappError] = useState("");
  const [schoolError, setSchoolError] = useState("");
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLearningModalOpen, setIsLearningModalOpen] = useState(false);
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  // BCA seats check removed - now driven by API is_open flag
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [formData, setFormData] = useState({
    profileImage: null as File | null,
    imageUrl: "", // Store the uploaded image URL
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    whatsappNumber: "",
    alternateNumber: "",
    email: "",
    gender: "",
    state: "",
    stateCode: "",
    district: "",
    districtCode: "",
    city: "",
    pinCode: "",
    currentStatus: "",
    maximumQualification: "",
    schoolMedium: "",
    casteTribe: "",
    religion: "",
    initial_school_id: "",
    preferred_campus_id: "",
    pursuingYear: "",
    collegeAttendanceMethod: "",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);



  const [availableSchoolsForCampus, setAvailableSchoolsForCampus] = useState<any[]>([]);

  const getAvailableCampuses = () => {
    // 1. Try to get dynamically from the createStudent API response
    try {
      const respStr = localStorage.getItem("studentApiResponse");
      if (respStr) {
        const resp = JSON.parse(respStr);
        // Check for array of campuses if backend provides it
        const dynamicCampuses = resp?.data?.campuses || resp?.data?.eligible_campuses || resp?.campuses || resp?.eligible_campuses;
        if (dynamicCampuses && Array.isArray(dynamicCampuses) && dynamicCampuses.length > 0) {
          return dynamicCampuses.map((c: any) => c.campus_name || c.name || c);
        }
        // Check if backend mapped a specific preferred_campus_id
        const prefCampusId = resp?.data?.preferred_campus_id || resp?.preferred_campus_id;
        if (prefCampusId) {
          const matchingCampus = campuses.find((c: any) => String(c.id) === String(prefCampusId));
          if (matchingCampus) {
            return [matchingCampus.campus_name];
          }
        }
      }
    } catch (e) {
      console.error("Error parsing API response for campuses", e);
    }

    // 2. Fallback to hardcoded mapping if API hasn't returned them
    const gender = formData.gender?.toLowerCase(); 
    const district = formData.district?.toLowerCase() || ''; 

    let available: string[] = [];

    if (gender === 'male') {
      available.push('Dharmshala');
      if (district.includes('dantewada')) available.push('Dantewada');
    } else if (gender === 'female') {
      available = ['Pune', 'Sarjapur', 'Kishanganj', 'Himachal Campus'];
      if (district.includes('dantewada')) available.unshift('Dantewada');
      if (district.includes('jashpur')) available.unshift('Jashpur');
    }
    
    return available;
  };

  // Auto-update preferred campus when dependencies change
  useEffect(() => {
    const available = getAvailableCampuses();
    if (formData.preferred_campus_id && !available.includes(formData.preferred_campus_id)) {
      setFormData(prev => {
        const updated = { ...prev, preferred_campus_id: '' };
        localStorage.setItem("studentFormData", JSON.stringify(updated));
        return updated;
      });
    }
  }, [formData.gender, formData.district, campuses, currentStep]);

  // Fetch courses when campus changes
  useEffect(() => {
    const fetchSchools = async () => {
      if (!formData.preferred_campus_id) {
        setAvailableSchoolsForCampus([]);
        return;
      }

      // Map string name to numeric ID
      let campusId: number | null = null;
      const searchStr = String(formData.preferred_campus_id).toLowerCase().trim();
      let matched = campuses.find(c => 
        c.campus_name.toLowerCase().trim() === searchStr || 
        c.campus_name.toLowerCase().includes(searchStr.split(' ')[0]) ||
        searchStr.includes(c.campus_name.toLowerCase().split(' ')[0])
      );
      
      if (matched) {
        campusId = matched.id;
      } else {
        const fallbackMapping = [
          { id: 2, campus_name: "Dharamshala"},
          { id: 3, campus_name: "Bangalore" },
          { id: 4, campus_name: "Sarjapur" },
          { id: 5, campus_name: "Tripura" },
          { id: 6, campus_name: "Delhi" },
          { id: 7, campus_name: "Amravati" },
          { id: 8, campus_name: "Jashpur" },
          { id: 9, campus_name: "Udaipur" },
          { id: 10, campus_name: "Dantewada" },
          { id: 11, campus_name: "Raipur" },
          { id: 12, campus_name: "Kishanganj" },
          { id: 13, campus_name: "Himachal Campus"},
          { id: 1, campus_name: "Pune" }
        ];
        
        const fallbackMatched = fallbackMapping.find(c => {
          const cName = c.campus_name.toLowerCase().trim();
          if (cName === searchStr || cName.includes(searchStr.split(' ')[0]) || searchStr.includes(cName.split(' ')[0])) return true;
          return false;
        });
        
        if (fallbackMatched) {
          campusId = fallbackMatched.id;
        }
      }

      if (campusId) {
        try {
          const response = await getCampusSchools(campusId);
          if (response.success && Array.isArray(response.data)) {
             setAvailableSchoolsForCampus(response.data);
          } else if (response.success && response.data && Array.isArray(response.data.data)) {
             setAvailableSchoolsForCampus(response.data.data); // Fallback in case of pagination wrapper
          } else {
             setAvailableSchoolsForCampus([]);
          }
        } catch (err) {
          console.error("Failed to fetch campus schools", err);
          setAvailableSchoolsForCampus([]);
        }
      } else {
         setAvailableSchoolsForCampus([]);
      }
    };

    fetchSchools();
  }, [formData.preferred_campus_id, campuses]);

  // Clear course selection if it's no longer available for the selected campus
  useEffect(() => {
    if (formData.initial_school_id && availableSchoolsForCampus.length > 0) {
      const isAvailable = availableSchoolsForCampus.some(s => 
        (String(s.school_id) === String(formData.initial_school_id) || String(s.id) === String(formData.initial_school_id)) && s.is_open === true
      );
      
      // Fallback: If it couldn't match by ID, try matching by name if it exists in the global schools list
      let isAvailableByName = false;
      if (!isAvailable) {
         const selectedSchool = schools.find(s => String(s.id) === String(formData.initial_school_id));
         if (selectedSchool) {
            isAvailableByName = availableSchoolsForCampus.some(s => s.school_name === selectedSchool.school_name && s.is_open === true);
         }
      }

      if (!isAvailable && !isAvailableByName) {
        setFormData(prev => {
          const updated = { ...prev, initial_school_id: "" };
          localStorage.setItem("studentFormData", JSON.stringify(updated));
          return updated;
        });
      }
    }
  }, [availableSchoolsForCampus, formData.initial_school_id, schools]);

  // Get school details based on selected language
  const getSchoolDetails = () => {
    switch (selectedLanguage) {
      case "hindi":
        return [
          {
            id: "SOP",
            name: "स्कूल ऑफ प्रोग्रामिंग (SOP)",
            tag: "सॉफ्टवेयर डेवलपमेंट",
            color: "blue",
            description: "एक आवासीय कार्यक्रम जहां आप कोडिंग की शुरुआत बिल्कुल शुरू से करते हैं और तकनीकी क्षेत्र में अपना करियर बनाते हैं। आप वेबसाइट और सॉफ्टवेयर एप्लिकेशन बनाना सीखेंगे।",
            duration: "20–24 महीने (स्व-गति से, अवधि भिन्न हो सकती है)",
            location: "विभिन्न परिसर (दंतेवाड़ा,बेंगलुरु,पुणे आदि)",
            eligibility: [
              "न्यूनतम आयु: 16.5 वर्ष",
              "स्नातक होना आवश्यक",
              "पारिवारिक आय 5 लाख से कम",
              "कोडिंग और समस्या समाधान में गहरी रुचि",
              "आवासीय कार्यक्रम में रहने के लिए तैयार"
            ],
            curriculum: [
              "प्रोग्रामिंग मूल बातें और तार्किक सोच",
              "फ्रंटएंड: HTML, CSS, JavaScript, React",
              "बैकएंड: Node.js, Express, डेटाबेस",
              "Git और GitHub",
              "अंग्रेजी संचार और कार्यस्थल कौशल"
            ],
            outcomes: [
              "सॉफ्टवेयर इंजीनियर",
              "फुल स्टैक डेवलपर",
              "प्रवेश स्तर IT नौकरियां",
              "तकनीकी उद्योग में करियर विकास"
            ]
          },
          {
            id: "SOB",
            name: "स्कूल ऑफ बिजनेस (SOB)",
            tag: "संचालन और विपणन",
            color: "emerald",
            description: "एक व्यावहारिक कार्यक्रम जो आपको व्यावसायिक संचालन, डिजिटल मार्केटिंग और कार्यालय प्रबंधन में नौकरियों के लिए तैयार करता है।",
            duration: "12–18 महीने (स्व-गति से, अवधि भिन्न हो सकती है)",
            location: "बेंगलुरु, जशपुर, दंतेवाड़ा,पुणे",
            eligibility: [
              "न्यूनतम आयु: 16.5 वर्ष",
              "12वीं पास होना आवश्यक",
              "पारिवारिक आय 5 लाख से कम",
              "अच्छे संचार कौशल और सीखने की इच्छा"
            ],
            curriculum: [
              "व्यावसायिक संचालन और रिपोर्टिंग",
              "डिजिटल मार्केटिंग (SEO, सोशल मीडिया, कंटेंट राइटिंग)",
              "ग्राहक और क्लाइंट समन्वय",
              "ईमेल लेखन और समय प्रबंधन",
              "स्टार्टअप और NGO के साथ वास्तविक परियोजनाएं"
            ],
            outcomes: [
              "मार्केटिंग एसोसिएट",
              "संचालन कार्यकारी",
              "ग्राहक सहायता कार्यकारी",
              "व्यवसाय विकास भूमिकाएं"
            ]
          },
          {
            id: "SOF",
            name: "स्कूल ऑफ फाइनेंस (SOF)",
            tag: "लेखा और कराधान",
            color: "amber",
            description: "एक नौकरी-उन्मुख कार्यक्रम जहां आप कंपनियों में उपयोग किए जाने वाले व्यावहारिक लेखा, कराधान और वित्त उपकरण सीखते हैं।",
            duration: "8–12 महीने (स्व-गति से, अवधि भिन्न हो सकती है)",
            location: "पुणे, महाराष्ट्र",
            eligibility: [
              "न्यूनतम आयु: 16.5 वर्ष",
              "12वीं पास होना आवश्यक",
              "पारिवारिक आय 5 लाख से कम",
              "वित्त और संख्याओं में रुचि"
            ],
            curriculum: [
              "व्यावहारिक लेखा",
              "GST और आयकर मूल बातें",
              "पेरोल प्रबंधन",
              "Tally और Advanced Excel",
              "वित्तीय रिपोर्टिंग"
            ],
            outcomes: [
              "खाता कार्यकारी",
              "कर सहयोगी",
              "वित्त संचालन कार्यकारी",
              "अनुपालन सहायक"
            ]
          },
          {
            id: "BCA",
            name: "बैचलर ऑफ कंप्यूटर एप्लीकेशन (BCA)",
            tag: "डिग्री + तकनीक",
            color: "indigo",
            description: "एटरनल यूनिवर्सिटी के साथ साझेदारी में एक आवासीय डिग्री कार्यक्रम, बारूसाहिब में स्थित। आप नौकरी-तैयार तकनीकी कौशल के साथ UGC-मान्यता प्राप्त BCA डिग्री प्राप्त करेंगे।",
            duration: "3 वर्ष (संरचित डिग्री कार्यक्रम)",
            location: "हिमाचल प्रदेश (बारूसाहिब – आवासीय परिसर)",
            eligibility: [
              "न्यूनतम आयु: 15 वर्ष",
              "12वीं पास (विश्वविद्यालय प्रवेश के लिए पात्र)",
              "पारिवारिक आय 5 लाख से कम",
              "उच्च शिक्षा और तकनीक में गहरी रुचि"
            ],
            curriculum: [
              "औपचारिक BCA डिग्री कार्यक्रम (UGC-मान्यता प्राप्त)",
              "प्रोग्रामिंग और सॉफ्टवेयर डेवलपमेंट",
              "सॉफ्ट स्किल्स और संचार प्रशिक्षण",
              "लाइव परियोजनाएं",
              "इंटर्नशिप और प्लेसमेंट की तैयारी"
            ],
            outcomes: [
              "UGC-मान्यता प्राप्त BCA डिग्री",
              "IT और सॉफ्टवेयर भूमिकाएं",
              "तकनीकी कंपनियों के लिए नौकरी-तैयार",
              "उच्च अध्ययन का विकल्प"
            ]
          }
        ];

      case "marathi":
        return [
          {
            id: "SOP",
            name: "स्कूल ऑफ प्रोग्रामिंग (SOP)",
            tag: "सॉफ्टवेअर डेव्हलपमेंट",
            color: "blue",
            description: "एक निवासी कार्यक्रम जिथे तुम्ही मूलभूत गोष्टींपासून कोडिंग शिकता आणि तंत्रज्ञान उद्योगात करिअर तयार करता। तुम्ही वेबसाइट आणि सॉफ्टवेअर अॅप्लिकेशन कसे तयार करायचे ते शिकाल.",
            duration: "20–24 महिने (स्वयं-गती, कालावधी बदलू शकतो)",
            location: "विविध कॅम्पस (दंतेवाडा, बेंगलुरु,पुणे इ.)",
            eligibility: [
              "किमान वय: 16.5 वर्षे",
              "पदवीधर असणे आवश्यक",
              "कौटुंबिक उत्पन्न 5 लाखांपेक्षा कमी",
              "कोडिंग आणि समस्या सोडवण्यात तीव्र स्वारस्य",
              "निवासी कार्यक्रमात राहण्यासाठी तयार"
            ],
            curriculum: [
              "प्रोग्रामिंग मूलभूत आणि तार्किक विचार",
              "फ्रंटएंड: HTML, CSS, JavaScript, React",
              "बॅकएंड: Node.js, Express, डेटाबेस",
              "Git आणि GitHub",
              "इंग्रजी संप्रेषण आणि कार्यस्थळ कौशल्ये"
            ],
            outcomes: [
              "सॉफ्टवेअर अभियंता",
              "फुल स्टॅक डेव्हलपर",
              "प्रवेश-स्तरीय IT नोकऱ्या",
              "तंत्रज्ञान उद्योगात करिअर वाढ"
            ]
          },
          {
            id: "SOB",
            name: "स्कूल ऑफ बिझनेस (SOB)",
            tag: "ऑपरेशन्स आणि मार्केटिंग",
            color: "emerald",
            description: "एक व्यावहारिक कार्यक्रम जो तुम्हाला व्यवसाय ऑपरेशन्स, डिजिटल मार्केटिंग आणि कार्यालय व्यवस्थापनातील नोकऱ्यांसाठी तयार करतो.",
            duration: "12–18 महिने (स्वयं-गती, कालावधी बदलू शकतो)",
            location: "पुणे, बेंगलुरु, जशपूर, दंतेवाडा",
            eligibility: [
              "किमान वय: 16.5 वर्षे",
              "12वी उत्तीर्ण असणे आवश्यक",
              "कौटुंबिक उत्पन्न 5 लाखांपेक्षा कमी",
              "चांगली संप्रेषण कौशल्ये आणि शिकण्याची इच्छा"
            ],
            curriculum: [
              "व्यवसाय ऑपरेशन्स आणि रिपोर्टिंग",
              "डिजिटल मार्केटिंग (SEO, सोशल मीडिया, कंटेंट राइटिंग)",
              "ग्राहक आणि क्लायंट समन्वय",
              "ईमेल लेखन आणि वेळ व्यवस्थापन",
              "स्टार्टअप आणि NGO सह वास्तविक प्रकल्प"
            ],
            outcomes: [
              "मार्केटिंग असोसिएट",
              "ऑपरेशन्स एक्झिक्युटिव्ह",
              "ग्राहक समर्थन एक्झिक्युटिव्ह",
              "व्यवसाय विकास भूमिका"
            ]
          },
          {
            id: "SOF",
            name: "स्कूल ऑफ फायनान्स (SOF)",
            tag: "लेखा आणि कर आकारणी",
            color: "amber",
            description: "नोकरी-केंद्रित कार्यक्रम जिथे तुम्ही कंपन्यांमध्ये वापरले जाणारे व्यावहारिक लेखा, कर आकारणी आणि वित्त साधने शिकता.",
            duration: "8–12 महिने (स्वयं-गती, कालावधी बदलू शकतो)",
            location: "पुणे, महाराष्ट्र",
            eligibility: [
              "किमान वय: 16.5 वर्षे",
              "12वी उत्तीर्ण असणे आवश्यक",
              "कौटुंबिक उत्पन्न 5 लाखांपेक्षा कमी",
              "वित्त आणि संख्यांमध्ये स्वारस्य"
            ],
            curriculum: [
              "व्यावहारिक लेखा",
              "GST आणि आयकर मूलभूत गोष्टी",
              "पेरोल व्यवस्थापन",
              "Tally आणि Advanced Excel",
              "वित्तीय अहवाल"
            ],
            outcomes: [
              "खाते एक्झिक्युटिव्ह",
              "कर सहयोगी",
              "वित्त ऑपरेशन्स एक्झिक्युटिव्ह",
              "अनुपालन सहाय्यक"
            ]
          },
          {
            id: "BCA",
            name: "बॅचलर ऑफ कॉम्प्युटर ऍप्लिकेशन्स (BCA)",
            tag: "पदवी + तंत्रज्ञान",
            color: "indigo",
            description: "एटर्नल युनिव्हर्सिटीच्या भागीदारीत एक निवासी पदवी कार्यक्रम, बारुसाहिब येथे स्थित. तुम्हाला नोकरी-तयार तांत्रिक कौशल्यांसह UGC-मान्यताप्राप्त BCA पदवी मिळेल.",
            duration: "3 वर्षे (संरचित पदवी कार्यक्रम)",
            location: "हिमाचल प्रदेश (बारुसाहिब – निवासी कॅम्पस)",
            eligibility: [
              "किमान वय: 15 वर्षे",
              "12वी उत्तीर्ण (विद्यापीठ प्रवेशासाठी पात्र)",
              "कौटुंबिक उत्पन्न 5 लाखांपेक्षा कमी",
              "उच्च शिक्षण आणि तंत्रज्ञानात तीव्र स्वारस्य"
            ],
            curriculum: [
              "औपचारिक BCA पदवी कार्यक्रम (UGC-मान्यताप्राप्त)",
              "प्रोग्रामिंग आणि सॉफ्टवेअर डेव्हलपमेंट",
              "सॉफ्ट स्किल्स आणि संप्रेषण प्रशिक्षण",
              "लाइव्ह प्रकल्प",
              "इंटर्नशिप आणि प्लेसमेंट तयारी"
            ],
            outcomes: [
              "UGC-मान्यताप्राप्त BCA पदवी",
              "IT आणि सॉफ्टवेअर भूमिका",
              "तंत्रज्ञान कंपन्यांसाठी नोकरी-तयार",
              "उच्च अभ्यासाचा पर्याय"
            ]
          }
        ];

      default: // English
        return [
          {
            id: "SOP",
            name: "School of Programming (SOP)",
            tag: "Software Development",
            color: "blue",
            description: "A residential program where you learn coding from basics and build a career in the tech industry. You will learn how to build websites and software applications.",
            duration: "20–24 months (Self-paced, duration may vary)",
            location: "Various Campuses (Dantewada, Bengaluru, Pune etc.)",
            eligibility: [
              "Minimum age: 16.5 years",
              "Must be a Graduate",
              "Family income less than 5 LPA",
              "Strong interest in coding and problem solving",
              "Ready to stay in a residential program"
            ],
            curriculum: [
              "Programming Basics & Logical Thinking",
              "Frontend: HTML, CSS, JavaScript, React",
              "Backend: Node.js, Express, Databases",
              "Git & GitHub",
              "English Communication & Workplace Skills"
            ],
            outcomes: [
              "Software Engineer",
              "Full Stack Developer",
              "Entry-level IT Jobs",
              "Career growth in the tech industry"
            ]
          },
          {
            id: "SOB",
            name: "School of Business (SOB)",
            tag: "Operations & Marketing",
            color: "emerald",
            description: "A practical program that prepares you for jobs in business operations, digital marketing, and office management.",
            duration: "12–18 months (Self-paced, duration may vary)",
            location: "Bengaluru, Jashpur, Dantewada,Pune",
            eligibility: [
              "Minimum age: 16.5 years",
              "Must be 12th pass",
              "Family income less than 5 LPA",
              "Good communication skills and willingness to learn"
            ],
            curriculum: [
              "Business Operations & Reporting",
              "Digital Marketing (SEO, Social Media, Content Writing)",
              "Customer & Client Coordination",
              "Email Writing & Time Management",
              "Real-world projects with startups & NGOs"
            ],
            outcomes: [
              "Marketing Associate",
              "Operations Executive",
              "Customer Support Executive",
              "Business Development Roles"
            ]
          },
          {
            id: "SOF",
            name: "School of Finance (SOF)",
            tag: "Accounting & Taxation",
            color: "amber",
            description: "A job-oriented program where you learn practical accounting, taxation, and finance tools used in companies.",
            duration: "8–12 months (Self-paced, duration may vary)",
            location: "Pune, Maharashtra",
            eligibility: [
              "Minimum age: 16.5 years",
              "Must be 12th pass",
              "Family income less than 5 LPA",
              "Interest in finance and numbers"
            ],
            curriculum: [
              "Practical Accounting",
              "GST & Income Tax Basics",
              "Payroll Management",
              "Tally & Advanced Excel",
              "Financial Reporting"
            ],
            outcomes: [
              "Accounts Executive",
              "Tax Associate",
              "Finance Operations Executive",
              "Compliance Assistant"
            ]
          },
          // {
          //   id: "SODA",
          //   name: "School of Digital Analytics (SODA)",
          //   tag: "Data Analysis",
          //   color: "purple",
          //   description: "Equipping learners with data literacy and analytical thinking skills to translate data into usable business insights.",
          //   duration: "6-12 months",
          //   location: "Selected Pilot Campuses",
          //   eligibility: [
          //     "Minimum 16 years old",
          //     "Analytical mindset",
          //     "Problem-solving aptitude",
          //     "No prior tech degree needed"
          //   ],
          //   curriculum: [
          //     "Data Literacy & Analytical Thinking",
          //     "Data Cleaning & Preparation",
          //     "Descriptive Statistics",
          //     "Spreadsheet Analysis: Excel & Google Sheets",
          //     "Foundational SQL for data extraction"
          //   ],
          //   outcomes: [
          //     "Data Analyst Associate",
          //     "Reporting Specialist",
          //     "Business Intelligence Assistant",
          //     "Data Support Coordinator"
          //   ]
          // },
          // {
          //   id: "SOE",
          //   name: "School of Educators (SOE)",
          //   tag: "Educator Development",
          //   color: "rose",
          //   description: "For graduates interested in educator-adjacent roles such as facilitation, mentoring, and learning support.",
          //   duration: "6-12 months",
          //   location: "Residential (Various)",
          //   eligibility: [
          //     "College graduates preferred",
          //     "Interested in education/social sector",
          //     "Underserved background profile",
          //     "Passion for mentoring and peer-learning"
          //   ],
          //   curriculum: [
          //     "Educator Mindset & Pedagogy",
          //     "Facilitation-led Learning Models",
          //     "Peer-learning Management",
          //     "Professional Discipline & Communication",
          //     "Mentoring & Student Support"
          //   ],
          //   outcomes: [
          //     "Learning Facilitator",
          //     "Educational Mentor",
          //     "Bootcamp Support Provider",
          //     "Development Sector Professional"
          //   ]
          // },
          {
            id: "BCA",
            name: "Bachelor of Computer Applications (BCA)",
            tag: "Degree + Tech",
            color: "indigo",
            description: "A residential degree program in partnership with Eternal University, located in Barusahib. You will earn a UGC-recognized BCA degree along with job-ready tech skills.",
            duration: "3 years (Structured degree program)",
            location: "Himachal Pradesh (Barusahib – Residential Campus)",
            eligibility: [
              "Minimum age: 15 years",
              "Must be 12th pass (eligible for university admission)",
              "Family income less than 5 LPA",
              "Strong interest in higher education and technology"
            ],
            curriculum: [
              "Formal BCA Degree Program (UGC-recognized)",
              "Programming & Software Development",
              "Soft Skills & Communication Training",
              "Live Projects",
              "Internship & Placement Preparation"
            ],
            outcomes: [
              "UGC-recognized BCA Degree",
              "IT & Software Roles",
              "Job-ready for tech companies",
              "Option for higher studies"
            ]
          }
        ];
    }
  };

  const schoolDetails = getSchoolDetails();

  // Helper function to check if a school is eligible based on qualification
  const isSchoolEligible = (schoolId: string) => {
    // Check age eligibility
    const age = getAge(formData.dateOfBirth);
    const ageThreshold = schoolId === 'BCA' ? 15 : 16.5;
    if (formData.dateOfBirth && age < ageThreshold) {
      return false;
    }

    if (schoolId === 'BCA' && formData.gender === 'male') {
      return false;
    }

    const qualificationId = formData.maximumQualification;
    if (!qualificationId) return true; // Show all if no qualification selected

    const qualification = qualifications.find(q => String(q.id) === qualificationId);
    if (!qualification) return true;

    const qualName = qualification.qualification_name.toLowerCase();

    // Check eligibility rules
    if (schoolId === 'SOP') {
      // SOP requires Graduate or higher (completed degree only)
      // return qualName.includes('bachelor') || qualName.includes('master') || qualName.includes('phd') || (qualName.includes('graduate') && !qualName.includes('under') && !qualName.includes('pursuing'));
      
      const isGraduate = qualName.includes('graduate') && !qualName.includes('under');
      const isPursuingCollege = qualName.includes('pursuing college');

      if (isPursuingCollege) {
        // Pursuing college: eligible only if year is 2nd/3rd/4th/Final AND attendance is "Only Exam"
        const allowedYears = ['2nd Year', '3rd Year', '4th Year', 'Final Year'];
        const isYearAllowed = allowedYears.includes(formData.pursuingYear);
        const isExamOnly = formData.collegeAttendanceMethod === 'Only Exam';
        return isYearAllowed && isExamOnly;
      }

      return isPursuingCollege || isGraduate;
    }
    return true;
  };

  // Get recommended schools count
  const getRecommendedSchools = () => {
    return schoolDetails.filter(school => isSchoolEligible(school.id));
  };

  // Helper component for details
  const SchoolDetailCard = ({ school }: { school: any }) => {
    const isEligible = isSchoolEligible(school.id);
    const hasQualification = formData.maximumQualification;
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200`}>
        <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
          <div className={`p-6 text-white flex justify-between items-start bg-gradient-to-r ${school.color === 'blue' ? 'from-blue-600 to-indigo-700' :
            school.color === 'emerald' ? 'from-emerald-600 to-teal-700' :
              school.color === 'amber' ? 'from-amber-500 to-orange-600' :
                school.color === 'purple' ? 'from-purple-600 to-fuchsia-700' :
                  school.color === 'rose' ? 'from-rose-600 to-pink-700' :
                    'from-indigo-600 to-violet-700'
            }`}>
            <div>
              <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full uppercase tracking-widest mb-2 inline-block">
                {school.tag}
              </span>
              <h2 className="text-3xl font-bold">{school.name}</h2>
            </div>
            <button
              onClick={() => setSelectedSchoolInfo(null)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 custom-scrollbar">
            <section>
              <h3 className="text-base font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">🎯</span>
                {content.eligibility}
              </h3>
              <ul className="space-y-1">
                {school.eligibility.map((item: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-600">
                    <span className="text-primary">•</span> {item}
                  </li>
                ))}
              </ul>

              <h3 className="text-base font-bold text-gray-800 mt-5 mb-2 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">📚</span>
                {content.curriculumFocus}
              </h3>
              <ul className="space-y-1">
                {school.curriculum.map((item: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-600">
                    <span className="text-primary">•</span> {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-base font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">🏆</span>
                {content.outcomes}
              </h3>
              <ul className="space-y-1">
                {school.outcomes.map((item: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-600">
                    <span className="text-primary">•</span> {item}
                  </li>
                ))}
              </ul>

              <div className="mt-5 p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                    <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center">⏳</span>
                    <span>{content.duration}</span>
                  </div>
                  <p className="font-semibold text-gray-800 text-sm pl-7">{school.duration}</p>
                </div>
                <div className="h-px bg-gray-200"></div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                    <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center">📍</span>
                    <span>{content.location}</span>
                  </div>
                  <p className="font-semibold text-gray-800 text-sm pl-7 leading-relaxed">{school.location}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!isEligible && !!hasQualification) return; 
                  
                  let isOpen = false;
                  let isPresentInCampus = false;
                  if (formData.preferred_campus_id) {
                     const campusSchool = availableSchoolsForCampus.find(s => s.school_name === school.id);
                     if (campusSchool) {
                        isPresentInCampus = true;
                        isOpen = campusSchool.is_open === true;
                     }
                  }
                  
                  if (isPresentInCampus && !isOpen) return;

                  const matchedSchool = schools.find(s => s.school_name.includes(school.id));
                  const apiSchool = availableSchoolsForCampus.find(s => s.school_name === school.id);
                  const finalId = apiSchool?.school_id || matchedSchool?.id;
                  
                  if (finalId) {
                    handleInputChange({ target: { name: 'initial_school_id', value: String(finalId) } } as any);
                    setSelectedSchoolInfo(null);
                  }
                }}
                disabled={(!isEligible && !!hasQualification) || (formData.preferred_campus_id && availableSchoolsForCampus.find(s => s.school_name === school.id)?.is_open === false)}
                className={`w-full mt-4 py-3 font-bold rounded-xl transition-all shadow-md ${
                  (!isEligible && !!hasQualification) || (formData.preferred_campus_id && availableSchoolsForCampus.find(s => s.school_name === school.id)?.is_open === false)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary/90 active:scale-95'
                }`}
              >
                {(!isEligible && !!hasQualification)
                    ? (school.id === 'BCA' && formData.gender === 'male' ? 'You are not eligible' : content.notEligible)
                    : (formData.preferred_campus_id && availableSchoolsForCampus.find(s => s.school_name === school.id)?.is_open === false)
                      ? 'Admissions Closed for this Campus'
                      : 'Apply'
                }
              </button>
            </section>
          </div>
        </div>
      </div>
    );
  };

  const CampusDetailCard = ({ campus }: { campus: any }) => {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200`}>
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
          <div className="p-6 text-white flex justify-between items-start bg-gradient-to-r from-blue-600 to-indigo-700">
            <div>
              <h2 className="text-3xl font-bold">{campus.campus_name || campus.name}</h2>
            </div>
            <button
              onClick={() => setSelectedCampusInfo(null)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="p-8 overflow-y-auto custom-scrollbar">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">🎓</span>
              {content.availableCourses || "Available Courses"}
            </h3>
            <div className="pl-11 space-y-3">
              {availableSchoolsForCampus.length > 0 ? (
                availableSchoolsForCampus.map((s, idx) => {
                   const detail = schoolDetails.find(sd => sd.id === s.school_name);
                   if (!detail) return null;
                   return (
                     <div key={idx} className={`p-3 rounded-xl border flex justify-between items-center ${s.is_open ? 'border-green-100 bg-green-50/50' : 'border-gray-200 bg-gray-50/50'}`}>
                       <span className={`font-semibold text-sm ${s.is_open ? 'text-green-800' : 'text-gray-500'}`}>
                         {detail.name}
                       </span>
                       <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.is_open ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                         {s.is_open ? 'Open' : 'Closed'}
                       </span>
                     </div>
                   );
                })
              ) : (
                <p className="text-sm text-gray-500">No courses info loaded.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleSubmit = async () => {
    const age = getAge(formData.dateOfBirth);
    const selectedSchool = schools.find(s => String(s.id) === String(formData.initial_school_id));
    const isBCASchool = selectedSchool?.school_name.includes('BCA');
    const ageThreshold = isBCASchool ? 15 : 15;

    if (currentStep === 1) {
      if (!formData.firstName) {
        return toast({ title: "⚠️ First Name Required", description: "Please enter your first name.", variant: "default", className: "border-orange-500 bg-orange-50 text-orange-900" });
      }
      if (!formData.dateOfBirth || age < ageThreshold) {
        return toast({ title: "⚠️ Invalid Date of Birth", description: `You must be at least ${ageThreshold} years old.`, variant: "default", className: "border-orange-500 bg-orange-50 text-orange-900" });
      }
      if (!formData.gender) {
        return toast({ title: "⚠️ Gender Required", description: "Please select your gender.", variant: "default", className: "border-orange-500 bg-orange-50 text-orange-900" });
      }
      setCurrentStep(2);
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (currentStep === 2) {
      if (formData.whatsappNumber && !/^\d{10}$/.test(formData.whatsappNumber)) {
        return toast({ title: "⚠️ Invalid WhatsApp Number", description: "Enter a valid 10-digit WhatsApp number or leave it empty.", variant: "default", className: "border-orange-500 bg-orange-50 text-orange-900" });
      }
      
      const hasValidAlternate = formData.alternateNumber && /^\d{10}$/.test(formData.alternateNumber);
      const hasValidWhatsapp = formData.whatsappNumber && /^\d{10}$/.test(formData.whatsappNumber);
      
      if (location.state?.googleEmail) {
        if (!hasValidAlternate) {
          return toast({ title: "⚠️ Phone Number Required", description: "Enter a valid 10-digit phone number.", variant: "default", className: "border-orange-500 bg-orange-50 text-orange-900" });
        }
      } else {
        if (!hasValidAlternate && !hasValidWhatsapp) {
          return toast({ title: "⚠️ Phone Number Required", description: "Please provide at least one valid 10-digit phone number (WhatsApp or Alternate).", variant: "default", className: "border-orange-500 bg-orange-50 text-orange-900" });
        }
        if (formData.alternateNumber && !hasValidAlternate) {
          return toast({ title: "⚠️ Invalid Phone Number", description: "Enter a valid 10-digit phone number.", variant: "default", className: "border-orange-500 bg-orange-50 text-orange-900" });
        }
      }
      
      setCurrentStep(3);
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (currentStep === 3) {
      if (!formData.pinCode || formData.pinCode.length !== 6) {
        return toast({ title: "⚠️ PIN Code Required", description: "Please enter a valid 6-digit PIN code.", variant: "default", className: "border-orange-500 bg-orange-50 text-orange-900" });
      }
      if (!formData.stateCode) {
        return toast({ title: "⚠️ Address Required", description: "Please enter a valid PIN code to auto-fill state and district.", variant: "default", className: "border-orange-500 bg-orange-50 text-orange-900" });
      }
      setCurrentStep(4);
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (currentStep === 4) {
      if (!formData.maximumQualification || !formData.schoolMedium) {
        return toast({ title: "⚠️ Education Details Required", description: "Please fill all required education fields.", variant: "default", className: "border-orange-500 bg-orange-50 text-orange-900" });
      }
      const selectedQual = qualifications.find(q => String(q.id) === formData.maximumQualification);
      const isPursuing = selectedQual?.qualification_name.toLowerCase().includes('pursuing');
      if (isPursuing) {
        if (!formData.pursuingYear || !formData.collegeAttendanceMethod) {
          return toast({ title: "⚠️ Question Required", description: "Please answer all pursuing qualification questions.", variant: "default", className: "border-orange-500 bg-orange-50 text-orange-900" });
        }
      }
      
      // --- STEP 4 SUBMIT (Create Student) ---
      try {
        const apiPayload = mapFormDataToApi(formData);
        let studentFormResponseData;
        const existingStudentId = localStorage.getItem("studentId");
        
        if (!existingStudentId) {
           studentFormResponseData = await createStudent(apiPayload);
           const payload = studentFormResponseData?.data ?? studentFormResponseData ?? null;
           const profile = payload?.student ?? payload ?? null;
           const studentId = profile?.student_id ?? profile?.id ?? payload?.id ?? null;
           
           if (studentId) {
             localStorage.setItem("studentId", studentId.toString());
           }
        } else {
           studentFormResponseData = await updateStudent(existingStudentId, apiPayload);
        }
        localStorage.setItem("studentApiResponse", JSON.stringify(studentFormResponseData));
        
        setCurrentStep(5);
        if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
      } catch (error) {
        console.error("Error creating student:", error);
        toast({ title: "❌ Registration Failed", description: getFriendlyErrorMessage(error), variant: "destructive", className: "border-red-500 bg-red-50 text-red-900" });
      }
      return;
    }

    if (currentStep === 5) {
      if (!formData.preferred_campus_id || !formData.initial_school_id) {
        return toast({ title: "⚠️ Campus & Course Required", description: "Please select both Campus and Course.", variant: "default", className: "border-orange-500 bg-orange-50 text-orange-900" });
      }

      try {
        const studentIdStr = localStorage.getItem("studentId");
        if (!studentIdStr) {
           throw new Error("Student ID missing. Please go back and try again.");
        }
        
        const apiPayload = mapFormDataToApi(formData);
        const studentFormResponseData = await updateStudent(studentIdStr, apiPayload);

        localStorage.setItem("registrationDone", "true");
        localStorage.setItem("studentFormData", JSON.stringify(formData));

        toast({ title: "✅ Registration Successful", description: "Your registration was successful!", variant: "default", className: "border-green-500 bg-green-50 text-green-900" });
        navigate("/students/test/start");
      } catch (error) {
        console.error("Error updating student:", error);
        toast({ title: "❌ Update Failed", description: getFriendlyErrorMessage(error), variant: "destructive", className: "border-red-500 bg-red-50 text-red-900" });
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      navigate("/students");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    // For name fields, allow only letters, spaces, apostrophes, and hyphens
    let processedValue = value;
    if (name === "firstName" || name === "middleName" || name === "lastName") {
      processedValue = value.replace(/[^A-Za-z\s'-]/g, "");
    }

    if (name === "whatsappNumber" || name === "alternateNumber") {
      processedValue = value.replace(/\D/g, "").slice(0, 10);
    }

    // For pin code, allow only digits and limit to 6 digits
    if (name === "pinCode") {
      processedValue = value.replace(/\D/g, "").slice(0, 6);
    }

    let newFormData = { ...formData, [name]: processedValue };

    // Handle pinCode change — auto-fill state and district via pincode API
    if (name === "pinCode") {
      if (processedValue.length === 6) {
        setIsPincodeLoading(true);
        const capturedPinCode = processedValue;
        fetch(`https://api.postalpincode.in/pincode/${capturedPinCode}`)
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data) && data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
              const record = data[0].PostOffice[0];
              const stateName = record.State || "";
              const districtName = record.District || "";
              setFormData((prev) => {
                const updatedData = {
                  ...prev,
                  pinCode: capturedPinCode,
                  state: stateName,
                  stateCode: stateName,
                  district: districtName,
                  districtCode: districtName,
                };
                localStorage.setItem("studentFormData", JSON.stringify(updatedData));
                return updatedData;
              });
            } else {
              setFormData((prev) => {
                const clearedData = {
                  ...prev,
                  pinCode: capturedPinCode,
                  state: "",
                  stateCode: "",
                  district: "",
                  districtCode: "",
                };
                localStorage.setItem("studentFormData", JSON.stringify(clearedData));
                return clearedData;
              });
              toast({
                title: "⚠️ Invalid PIN Code",
                description: "No location found for this PIN code. Please check and try again.",
                variant: "default",
                className: "border-orange-500 bg-orange-50 text-orange-900",
              });
            }
          })
          .catch(() => {
            toast({
              title: "❌ PIN Code Lookup Failed",
              description: "Unable to fetch location details. Please try again.",
              variant: "destructive",
              className: "border-red-500 bg-red-50 text-red-900",
            });
          })
          .finally(() => {
            setIsPincodeLoading(false);
          });
      } else {
        newFormData = {
          ...newFormData,
          state: "",
          stateCode: "",
          district: "",
          districtCode: "",
        };
      }
    }

    setFormData(newFormData);
    localStorage.setItem("studentFormData", JSON.stringify(newFormData));

    if (name === "alternateNumber") {
      if (processedValue && processedValue.length !== 10) {
        setAlternateError("Enter a valid 10-digit number");
      } else {
        setAlternateError("");
      }
    }

    if (name === "whatsappNumber") {
      if (processedValue && processedValue.length > 0 && processedValue.length !== 10) {
        setWhatsappError("Enter a valid 10-digit WhatsApp number");
      } else {
        setWhatsappError("");
      }
    }

    if (name === "initial_school_id") {
      if (!processedValue) {
        setSchoolError("Please select a school");
      } else {
        setSchoolError("");
      }
    }

    if (name === "email") {
      if (processedValue && !validateEmail(processedValue)) {
        setEmailError("Please enter a valid email address");
      } else {
        setEmailError("");
      }
    }
  };

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast({
        title: content.verifying || "Verifying...",
        description:
          content.verifyingMessage ||
          "Please wait while we verify the image...",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900"
      });

      const faceDetectionResult = await detectHumanFace(file);

      if (!faceDetectionResult.success) {
        toast({
          variant: "destructive",
          title: content.noFaceDetected || "❌ Face Verification Failed",
          description: faceDetectionResult.message,
          className: "border-red-500 bg-red-50 text-red-900",
          duration: 5000
        });
        e.target.value = "";
        return;
      }

      try {
        const uploadResult = await uploadProfileImage(file);

        const newFormData = {
          ...formData,
          profileImage: file,
          imageUrl: uploadResult.url,
        };
        setFormData(newFormData);

        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        toast({
          title: content.faceVerified || "✅ Face Verified",
          description:
            content.faceVerifiedMessage || "Image uploaded successfully!",
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900"
        });
      } catch (error) {
        console.error("Error uploading image:", error);
        toast({
          variant: "destructive",
          title: "❌ Upload Failed",
          description: getFriendlyErrorMessage(error),
          className: "border-red-500 bg-red-50 text-red-900"
        });
        e.target.value = "";
      }
    }
  };

  // Convert camelCase → snake_case before API call
  const mapFormDataToApi = (data: typeof formData) => {
    const partnerId = localStorage.getItem("partner_id");

    // Dynamically find the campus ID from the campuses state
    let campusId: number | null = null;
    if (data.preferred_campus_id) {
      const searchStr = String(data.preferred_campus_id).toLowerCase().trim();
      
      // Try from dynamic state first
      let matched = campuses.find(c => 
        c.campus_name.toLowerCase().trim() === searchStr || 
        c.campus_name.toLowerCase().includes(searchStr.split(' ')[0]) ||
        searchStr.includes(c.campus_name.toLowerCase().split(' ')[0])
      );
      
      if (matched) {
        campusId = matched.id;
      } else {
        // Hardcoded Fallback from known API response
        const fallbackMapping = [
          { id: 2, campus_name: "Dharamshala" },
          { id: 3, campus_name: "Bangalore" },
          { id: 4, campus_name: "Sarjapur" },
          { id: 5, campus_name: "Tripura" },
          { id: 6, campus_name: "Delhi" },
          { id: 7, campus_name: "Amravati" },
          { id: 8, campus_name: "Jashpur" },
          { id: 9, campus_name: "Udaipur" },
          { id: 10, campus_name: "Dantewada" },
          { id: 11, campus_name: "Raipur" },
          { id: 12, campus_name: "Kishanganj" },
          { id: 13, campus_name: "Himachal Campus" },
          { id: 1, campus_name: "Pune" }
        ];
        
        const fallbackMatched = fallbackMapping.find(c => {
          const cName = c.campus_name.toLowerCase().trim();
          if (cName === searchStr || cName.includes(searchStr.split(' ')[0]) || searchStr.includes(cName.split(' ')[0])) return true;
          return false;
        });
        
        if (fallbackMatched) {
          campusId = fallbackMatched.id;
        } else {
          console.warn("Could not find matching campus for:", data.preferred_campus_id);
        }
      }
    }

    const payload: any = {
      first_name: data.firstName,
      last_name: data.lastName,
      dob: data.dateOfBirth,
      email: data.email,
      gender: data.gender,
      state: data.state, 
      district: data.district, 
      pin_code: data.pinCode,
      school_medium: data.schoolMedium,
      current_status_id: Number(data.currentStatus) || null,
      qualification_id: Number(data.maximumQualification) || null,
      initial_school_id: Number(data.initial_school_id) || null,
    };

    if (data.imageUrl) payload.image_url = data.imageUrl;
    if (data.middleName) payload.middle_name = data.middleName;
    if (data.whatsappNumber) payload.whatsapp_number = data.whatsappNumber;
    if (data.alternateNumber) payload.phone_number = data.alternateNumber;
    if (data.city) payload.city = data.city;
    if (data.religion) payload.religion_id = Number(data.religion);
    if (data.casteTribe) payload.cast_id = Number(data.casteTribe);
    if (partnerId) payload.partner_id = Number(partnerId);
    if (campusId !== null) {
      payload.preferred_campus_id = campusId;
    } else if (data.preferred_campus_id) {
      payload.preferred_campus_id = data.preferred_campus_id;
    }
    if (data.pursuingYear) payload.graduation_year = data.pursuingYear;
    if (data.collegeAttendanceMethod) payload.graduation_mode = data.collegeAttendanceMethod;

    return payload;
  };

  // Steps are now unified for both mobile and desktop.
  useEffect(() => {
    // No longer need to reset step based on screen size since both use 1-4 steps
  }, [isMobile]);

  useEffect(() => {
    const savedFormData = localStorage.getItem("studentFormData");
    const googleEmail = location.state?.googleEmail;
    const savedUserStr = localStorage.getItem("user");
    
    let parsedData: any = {};
    if (savedFormData) {
      try { parsedData = JSON.parse(savedFormData); } catch (e) {}
    }
    
    let userData: any = null;
    if (savedUserStr) {
      try { userData = JSON.parse(savedUserStr); } catch (e) {}
    }

    // Merge Google User Data if missing in studentFormData
    if (userData) {
      if (!parsedData.firstName && userData.first_name) {
        parsedData.firstName = userData.first_name;
      } else if (!parsedData.firstName && userData.name) {
        const parts = userData.name.split(' ');
        parsedData.firstName = parts[0];
        if (parts.length > 1) {
           parsedData.lastName = parts.slice(1).join(' ');
        }
      }
      if (!parsedData.email && userData.email) {
        parsedData.email = userData.email;
      }
      if (!parsedData.alternateNumber && (userData.phone || userData.mobile)) {
        parsedData.alternateNumber = userData.phone || userData.mobile;
      }
    }

    if (googleEmail && !parsedData.email) {
      parsedData.email = googleEmail;
    }

    if (Object.keys(parsedData).length > 0) {
      setFormData(prev => ({ ...prev, ...parsedData }));
    }

    // Fetch initial data
    const fetchCasts = async () => {
      try {
        const response = await getAllCasts();
        setCasts(response);
      } catch (error) {
        // console.error("Error fetching casts:", error);
      }
    };
    fetchCasts();

    // Fetch qualifications
    const fetchQualifications = async () => {
      try {
        const response = await getAllQualification();
        setQualifications(response);
      } catch (error) {
        // console.error("Error fetching qualifications:", error);
      }
    };
    fetchQualifications();

    // fetch statuses
    const fetchStatuses = async () => {
      try {
        const response = await getAllStatus();
        setStatuses(response);
      } catch (error) {
        // console.error("Error fetching current statuses:", error);
      }
    };
    fetchStatuses();

    // fetch schools
    const fetchSchools = async () => {
      try {
        const response = await getAllSchools();
        setSchools(response);
      } catch (error) {
        // console.error("Error fetching schools:", error);
      }
    };
    fetchSchools();

    // fetch campuses
    const fetchCampuses = async () => {
      try {
        const campusesData = await getAllCampuses();
        setCampuses(campusesData);
      } catch (error) {
        // console.error("Error fetching campuses:", error);
      }
    };
    fetchCampuses();

  }, [location.state?.googleEmail]);

  // Calculate age in years
  const getAge = (dob: string) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    const diff = today.getTime() - birthDate.getTime();
    const age = diff / (1000 * 60 * 60 * 24 * 365.25);
    return age;
  };



  // Calculate the maximum date allowed
  const getMaxDOB = () => {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 15);
    return today.toISOString().split("T")[0];
  };

  // language-specific strings
  const getContent = () => {
    switch (selectedLanguage) {
      case "hindi":
        return {
          signUp: "साइन अप करें",
          addPhoto: "फोटो जोड़ें",
          basicDetails: "बुनियादी विवरण",
          contactInfo: "संपर्क जानकारी",
          firstName: "पहला नाम *",
          middleName: "मध्य नाम",
          lastName: "अंतिम नाम ",
          dateOfBirth: "जन्म तिथि *",
          gender: "लिंग *",
          male: "पुरुष",
          female: "महिला",
          whatsappNumber: "व्हाट्सऐप नंबर",
          alternateNumber: "फोन नंबर",
          email: "ईमेल पता ",
          state: "राज्य *",
          district: "जिला",
          city: "शहर *",
          pinCode: "पिन कोड *",
          currentStatus: "वर्तमान स्थिति *",
          maximumQualification: "अधिकतम योग्यता *",
          schoolMedium: "स्कूल माध्यम *",
          casteTribe: "जाति/जनजाति *",
          religion: "धर्म *",
          back: "वापस",
          saveContinue: "सहेजें और जारी रखें",
          other: "अन्य",
          selectState: "राज्य चुनें",
          selectDistrict: "जिला चुनें",
          selectOption: "विकल्प चुनें",
          selectQualification: "योग्यता चुनें",
          selectMedium: "माध्यम चुनें",
          selectReligion: "धर्म चुनें",
          enterFirstName: "पहला नाम दर्ज करें",
          enterMiddleName: "मध्य नाम दर्ज करें",
          enterLastName: "अंतिम नाम दर्ज करें",
          enterWhatsapp: "व्हाट्सऐप नंबर दर्ज करें",
          enterAlternate: " फोन नंबर दर्ज करें",
          enterEmail: "ईमेल पता दर्ज करें",
          cityExample: "उदा. मुंबई",
          pinCodeExample: "उदा. 400001",
          verifying: "सत्यापन हो रहा है...",
          verifyingMessage:
            "कृपया प्रतीक्षा करें जबकि हम छवि सत्यापित करते हैं...",
          noFaceDetected: "कोई चेहरा नहीं मिला",
          noFaceMessage: "कृपया स्पष्ट मानव चेहरे वाली छवि अपलोड करें।",
          faceVerified: "चेहरा सत्यापित",
          faceVerifiedMessage: "छवि सफलतापूर्वक अपलोड की गई!",
          loading: "लोड हो रहा है...",
          selectSchoolHeading: "अपना कैंपस चुनें",
          selectSchoolDescription: "कृपया वह कैंपस चुनें जिसके लिए आप आवेदन करना चाहते हैं।",
          checkDetails: "विवरण देखें",
          eligibility: "पात्रता",
          curriculumFocus: "पाठ्यक्रम फोकस",
          outcomes: "परिणाम",
          duration: "अवधि",
          location: "स्थान",
          variousCampuses: "विभिन्न परिसर",
          applyToSchool: "इस स्कूल के लिए आवेदन करें",
          nextStep: "अगला कदम",
          phase: "चरण",
          videoButtonText: "यह वीडियो देखें और यहां से परीक्षा की तैयारी करें",
          // recommendedForYou: "आपके लिए अनुशंसित",
          basedOnQualification: "आपकी योग्यता के आधार पर, हम इन स्कूलों की सिफारिश करते हैं",
          notEligible: "पात्र नहीं",
          requires: "आवश्यक है",
          pursuingYear: "कौन सा साल चल रहा है? *",
          collegeAttendanceMethod: "कॉलेज जाने का तरीका *",
          year1st: "प्रथम वर्ष (1st Year)",
          year2nd: "द्वितीय वर्ष (2nd Year)",
          year3rd: "तृतीय वर्ष (3rd Year)",
          year4th: "चतुर्थ वर्ष (4th Year)",
          yearFinal: "अंतिम वर्ष (Final Year)",
          attendanceRegular: "मैं नियमित रूप से कॉलेज जाता हूँ, प्रतिदिन कक्षाओं में उपस्थित रहता हूँ। (Regular)",
          attendancePrivate: "मैं केवल परीक्षा देने जाता हूँ और घर पर अध्ययन करता हूँ। (Private/Exam-only)",
          aboutCampus: "कैंपस के बारे में",
          campusLocation: "कैंपस का स्थान",
          availableCourses: "उपलब्ध कोर्सेज",
          createProfile: "अपनी प्रोफ़ाइल बनाएं",
          takes3Mins: "इसमें लगभग 3 मिनट लगेंगे। आप एडमिशन से पहले कभी भी विवरण संपादित कर सकते हैं।",
          addressDetails: "पते का विवरण",
          educationDetails: "शिक्षा",
          campus: "कैंपस",
          campusAndCourse: "कैंपस और कोर्स",
          preferredCampus: "पसंदीदा कैंपस *",
          preferredCourse: "पसंदीदा कोर्स *",
        };

      case "marathi":
        return {
          signUp: "साइन अप करा",
          addPhoto: "फोटो जोडा",
          basicDetails: "मूलभूत तपशील",
          contactInfo: "संपर्क तपशील",
          firstName: "पहिले नाव *",
          middleName: "मध्यम नाव",
          lastName: "आडनाव ",
          dateOfBirth: "जन्म तारीख *",
          gender: "लिंग *",
          male: "पुरुष",
          female: "स्त्री",
          whatsappNumber: "व्हाट्सअॅप नंबर",
          alternateNumber: "फोन नंबर",
          email: "ईमेल पत्ता ",
          state: "राज्य *",
          district: "जिल्हा",
          city: "शहर *",
          pinCode: "पिन कोड *",
          currentStatus: "सध्याची स्थिती *",
          maximumQualification: "कमाल पात्रता *",
          schoolMedium: "शाळेचे माध्यम *",
          casteTribe: "जात/आदिवासी *",
          religion: "धर्म *",
          back: "मागे",
          saveContinue: "जतन करा आणि सुरू ठेवा",
          other: "इतर",
          selectState: "राज्य निवडा",
          selectDistrict: "जिल्हा निवडा",
          selectOption: "पर्याय निवडा",
          selectQualification: "पात्रता निवडा",
          selectMedium: "माध्यम निवडा",
          selectReligion: "धर्म निवडा",
          enterFirstName: "पहिले नाव प्रविष्ट करा",
          enterMiddleName: "मध्यम नाव प्रविष्ट करा",
          enterLastName: "आडनाव प्रविष्ट करा",
          enterWhatsapp: "व्हाट्सअॅप नंबर प्रविष्ट करा",
          enterAlternate: "फोन नंबर प्रविष्ट करा",
          enterEmail: "ईमेल पत्ता प्रविष्ट करा",
          cityExample: "उदा. पुणे",
          pinCodeExample: "उदा. 411001",
          verifying: "पडताळणी करत आहे...",
          verifyingMessage:
            "कृपया प्रतीक्षा करा जेव्हा आम्ही प्रतिमा सत्यापित करतो...",
          noFaceDetected: "चेहरा सापडला नाही",
          noFaceMessage: "कृपया स्पष्ट मानवी चेहऱ्याची प्रतिमा अपलोड करा.",
          faceVerified: "चेहरा सत्यापित",
          faceVerifiedMessage: "प्रतिमा यशस्वीरित्या अपलोड झाली!",
          loading: "लोड करत आहे...",
          selectSchoolHeading: "तुमची शाळा निवडा",
          selectSchoolDescription: "कृपया आमच्या शाळांबद्दल माहिती वाचा आणि तुम्हाला ज्यासाठी अर्ज करायचा आहे ती निवडा.",
          checkDetails: "तपशील पहा",
          eligibility: "पात्रता",
          curriculumFocus: "अभ्यासक्रम फोकस",
          outcomes: "परिणाम",
          duration: "कालावधी",
          location: "स्थान",
          variousCampuses: "विविध कॅम्पस",
          applyToSchool: "या शाळेसाठी अर्ज करा",
          nextStep: "पुढील पायरी",
          phase: "टप्पा",
          videoButtonText: "हा व्हिडिओ पहा आणि येथून चाचणीची तयारी करा",
          // recommendedForYou: "तुमच्यासाठी शिफारस केलेले",
          basedOnQualification: "तुमच्या पात्रतेच्या आधारे, आम्ही या शाळांची शिफारस करतो",
          notEligible: "पात्र नाही",
          requires: "आवश्यक आहे",
          pursuingYear: "कोणते वर्ष सुरू आहे? *",
          collegeAttendanceMethod: "कॉलेजला जाण्याची पद्धत *",
          year1st: "पहिले वर्ष (1st Year)",
          year2nd: "दुसरे वर्ष (2nd Year)",
          year3rd: "तिसरे वर्ष (3rd Year)",
          year4th: "चौथे वर्ष (4th Year)",
          yearFinal: "अंतिम वर्ष (Final Year)",
          attendanceRegular: "मी नियमितपणे कॉलेजला जातो, रोज वर्गात हजर राहतो. (Regular)",
          attendancePrivate: "मी फक्त परीक्षा द्यायला जातो आणि घरी अभ्यास करतो. (Private/Exam-only)",
          aboutCampus: "कॅम्पस बद्दल",
          campusLocation: "कॅम्पसचे ठिकाण",
          availableCourses: "उपलब्ध कोर्सेस",
          createProfile: "तुमची प्रोफाइल तयार करा",
          takes3Mins: "यास सुमारे ३ मिनिटे लागतील. प्रवेश घेण्यापूर्वी तुम्ही हे तपशील कधीही बदलू शकता.",
          addressDetails: "पत्त्याचे तपशील",
          educationDetails: "शिक्षण",
          campus: "कॅम्पस",
          campusAndCourse: "कॅम्पस आणि कोर्स",
          preferredCampus: "पसंतीचे कॅम्पस *",
          preferredCourse: "पसंतीचे कोर्स *",
        };

      default: // English
        return {
          signUp: "Sign Up",
          addPhoto: "Add Photo",
          basicDetails: "Basic Details",
          contactInfo: "Contact Information",
          firstName: "First Name *",
          middleName: "Middle Name",
          lastName: "Last Name",
          dateOfBirth: "Date of Birth *",
          gender: "Gender *",
          male: "Male",
          female: "Female",
          whatsappNumber: "WhatsApp Number",
          alternateNumber: "Phone Number",
          email: "Email Address",
          state: "State *",
          district: "District",
          pinCode: "Pin Code *",
          currentStatus: "Current Status *",
          maximumQualification: "Maximum Qualification *",
          schoolMedium: "School Medium *",
          casteTribe: "Caste/Tribe *",
          religion: "Religion *",
          back: "Back",
          saveContinue: "Save & Continue",
          other: "Other",
          selectState: "Select State",
          selectDistrict: "Select District",
          selectOption: "Select Option",
          selectQualification: "Select Qualification",
          selectMedium: "Select Medium",
          selectReligion: "Select Religion",
          enterFirstName: "Enter First Name",
          enterMiddleName: "Enter Middle Name",
          enterLastName: "Enter Last Name",
          enterWhatsapp: "Enter WhatsApp Number",
          enterAlternate: "Enter Phone Number",
          enterEmail: "Enter Email Address",
          cityExample: "Ex. Bangalore",
          pinCodeExample: "Ex. 4402xx",
          verifying: "Verifying...",
          verifyingMessage: "Please wait while we verify the image...",
          noFaceDetected: "No Face Detected",
          noFaceMessage: "Please upload an image with a clear human face.",
          faceVerified: "✅ Face Verified",
          faceVerifiedMessage: "Image uploaded successfully!",
          loading: "Loading...",
          selectSchoolHeading: "Select Your Campus",
          selectSchoolDescription: "Please select the campus you want to apply for.",
          checkDetails: "Check Details",
          eligibility: "Eligibility",
          curriculumFocus: "Curriculum focus",
          outcomes: "Outcomes",
          duration: "Duration",
          location: "Location",
          variousCampuses: "Various Campuses",
          applyToSchool: "Apply to this School",
          nextStep: "Next Step",
          phase: "Phase",
          videoButtonText: "Watch this video and Prepare for the test from here",
          // recommendedForYou: "Recommended for You",
          // basedOnQualification: "Based on your qualification, we recommend these schools",
          notEligible: "Not Eligible",
          requires: "Requires",
          pursuingYear: "Which year is going on? *",
          collegeAttendanceMethod: "College Attendance Method *",
          year1st: "1st Year",
          year2nd: "2nd Year",
          year3rd: "3rd Year",
          year4th: "4th Year",
          yearFinal: "Final Year",
          attendanceRegular: "I go to college regularly, attend classes daily.",
          attendancePrivate: "I only go to write exams and study at home.",
          aboutCampus: "About Campus",
          campusLocation: "Campus Location",
          availableCourses: "Available Courses",
          createProfile: "Create your profile",
          takes3Mins: "Takes about 3 minutes. You can edit these details anytime before you enroll.",
          addressDetails: "Address Details",
          educationDetails: "Education",
          campus: "Campus",
          campusAndCourse: "Campus & Course",
          preferredCampus: "Preferred Campus *",
          preferredCourse: "Preferred Course *",
        };
    }
  };

  const content = getContent();
  const formGuideText = (() => {
    switch (selectedLanguage) {
      case "hindi":
        return {
          header1: "आगे बढ़ने के लिए यह फॉर्म भरें।",
          basic: "यहां अपनी बेसिक जानकारी भरें।",
          contact: "यहां फोन और ईमेल भरें।",
          addition: "यहां अतिरिक्त जानकारी भरें।",
          nextStep: "अगले स्टेप के लिए यहां क्लिक करें।",
          header2: "यह स्कूल चुनने का स्टेप है।",
          options: "यहां सभी स्कूल विकल्प देखें।",
          card: "अप्लाई करने के लिए स्कूल कार्ड चुनें।",
          submit: "सेव करके आगे बढ़ने के लिए यहां क्लिक करें।",
        };
      case "marathi":
        return {
          header1: "पुढे जाण्यासाठी हा फॉर्म भरा.",
          basic: "येथे तुमची मूलभूत माहिती भरा.",
          contact: "येथे फोन आणि ईमेल भरा.",
          addition: "येथे अतिरिक्त माहिती भरा.",
          nextStep: "पुढच्या स्टेपसाठी येथे क्लिक करा.",
          header2: "ही शाळा निवडीची पायरी आहे.",
          options: "येथे सर्व शाळांचे पर्याय पहा.",
          card: "अर्ज करण्यासाठी शाळेचे कार्ड निवडा.",
          submit: "जतन करून पुढे जाण्यासाठी येथे क्लिक करा.",
        };
      default:
        return {
          header1: "Fill this form to continue.",
          basic: "Add your basic details here.",
          contact: "Add your phone and email here.",
          addition: "Fill additional details here.",
          nextStep: "Click here for the next step.",
          header2: "This is the school selection step.",
          options: "See all school options here.",
          card: "Click a school card to apply.",
          submit: "Click here to save and continue.",
        };
    }
  })();
  const studentFormGuideSteps = currentStep === 1
    ? [
        {
          id: "student-form-header",
          target: '[data-onboarding="student-form-header"]',
          text: formGuideText.header1,
        },
        {
          id: "student-form-basic",
          target: '[data-onboarding="student-form-basic"]',
          text: formGuideText.basic,
        },
        {
          id: "student-form-contact",
          target: '[data-onboarding="student-form-contact"]',
          text: formGuideText.contact,
        },
        {
          id: "student-addition-information",
          target: '[data-onboarding="student-form-addition"]',
          text: formGuideText.addition,
        },
        {
          id: "student-form-school-step",
          target: '[data-onboarding="student-form-school-step"]',
          text: formGuideText.nextStep,
        },
      ]
    : [
        {
          id: "student-form-header",
          target: '[data-onboarding="student-form-header"]',
          text: formGuideText.header2,
        },
        
        {
          id: "student-form-school-options",
          target: '[data-onboarding="student-form-school-options"]',
          text: formGuideText.options,
        },
        {
          id: "student-form-school-card",
          target: '[data-onboarding="student-form-school-card"]',
          text: formGuideText.card,
        },
        {
          id: "student-form-submit",
          target: '[data-onboarding="student-form-submit"]',
          text: formGuideText.submit,
        },
      ];

  return (
    <div className="h-screen overflow-y-auto font-sans relative flex flex-col bg-transparent">
      <div id="world">
        <LeavesCanvas />
      </div>
      {/* Top Navbar */}
      <header className="relative z-50 flex items-center justify-between px-6 py-4 md:px-10">
        <div className="flex items-center gap-2">
          <img src="/gamified-assets/navgurukul-logo.png" alt="Navgurukul Logo" className="h-6 sm:h-8 object-contain" />
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <LanguageSelector inline />
          <LogoutButton inline />
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center pt-2 px-4 pb-6 w-full max-w-4xl mx-auto">
        <style>{`
          /* Form Inputs Styling */
          input[type="text"], input[type="email"], input[type="tel"], input[type="date"], input[type="number"], select, textarea {
             border: 1.5px solid #e2e8f0 !important;
             border-radius: 10px !important;
             background-color: white !important;
             box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) !important;
             transition: all 0.2s ease-in-out !important;
          }
          input[type="text"]:focus, input[type="email"]:focus, input[type="tel"]:focus, input[type="date"]:focus, input[type="number"]:focus, select:focus, textarea:focus {
             border-color: #ec4899 !important;
             box-shadow: 0 0 0 4px rgba(236, 72, 153, 0.1) !important;
             outline: none !important;
          }
          /* Combobox trigger buttons */
          [role="combobox"] {
             border-radius: 10px !important;
             border: 1.5px solid #e2e8f0 !important;
             background-color: white !important;
             box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) !important;
             transition: all 0.2s ease-in-out !important;
          }
          [role="combobox"][data-state="open"] {
             border-color: #ec4899 !important;
             box-shadow: 0 0 0 4px rgba(236, 72, 153, 0.1) !important;
          }
        `}</style>
        {!isMobile && (
          <ContextualHelpWidget
            sectionId="student-registration-form"
            sectionTitle="Student Registration"
            steps={studentFormGuideSteps}
            demo={{
              title: "Student registration demo",
              embedUrl: "https://www.youtube.com/embed/VIDEO_ID_STUDENT_REGISTRATION?rel=0",
              note: "Replace this with a short registration walkthrough.",
            }}
            faqs={[
              {
                question: "What should I complete on this page?",
                answer: "Complete your basic details first, then choose the school or program that fits you.",
              },
              {
                question: "Can I continue in parts?",
                answer: "The form saves progress in local storage while you fill the student details.",
              },
            ]}
            showInlineButtons={false}
            showFloatingButton={!selectedSchoolInfo && !isLearningModalOpen}
            autoStartOnFirstVisit={true}
          />
        )}

        {/* Stepper */}
        <div className="flex items-center gap-2 sm:gap-4 mb-5 w-full justify-center overflow-x-auto px-2">
          {[
            { id: 1, label: content.basicDetails || "Basic Details" },
            { id: 2, label: content.contactInfo || "Contact Info" },
            { id: 3, label: content.addressDetails || "Address Details" },
            { id: 4, label: content.educationDetails || "Education" },
            { id: 5, label: content.campus || "Campus" }
          ].map((step, idx, arr) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-2 shrink-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${currentStep === step.id ? 'border-pink-500 text-pink-600 bg-pink-50/50' : currentStep > step.id ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-gray-200 text-gray-400 bg-white'}`}>
                  {currentStep > step.id ? "✓" : step.id}
                </div>
                <span className={`text-xs font-semibold hidden md:block ${currentStep === step.id ? 'text-pink-600' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
              {idx < arr.length - 1 && (
                <div className={`h-[1px] w-6 sm:w-12 ${currentStep > step.id ? 'bg-pink-500' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Title */}
        <div className="text-center mb-5">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-1">{content.createProfile || "Create your profile"}</h1>
          <p className="text-gray-500 text-xs md:text-sm">{content.takes3Mins || "Takes about 3 minutes. You can edit these details anytime before you enroll."}</p>
        </div>

        {/* Form Card */}
        <div ref={scrollContainerRef} className="w-full bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-200/50 p-5 sm:p-8 mb-4 relative">

        {currentStep === 1 && (
          <>
            {/* Profile Image Upload */}
            <div className="flex flex-col md:flex-row items-center gap-4 mb-4 border-b border-gray-100 pb-4">
              <div className={`w-16 h-16 shrink-0 rounded-full flex flex-col items-center justify-center relative cursor-pointer transition-all duration-300 border-2 border-dashed ${imagePreview ? 'border-pink-400 bg-white shadow-sm' : 'border-gray-200 bg-pink-50/20 hover:border-pink-300 hover:bg-pink-50'}`}>
                {!imagePreview ? (
                  <div className="flex flex-col items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : (
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-full p-1"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Upload Profile Photo"
                />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-sm font-bold text-gray-800 mb-0.5">
                  Add a profile photo <span className="text-teal-500 font-semibold">(optional)</span>
                </h3>
                {/* <p className="text-xs text-gray-500">
                  Helps your mentors recognise you at orientation. JPG or PNG, under 5MB.
                </p> */}
              </div>
            </div>

            {/* --- BASIC DETAILS SECTION --- */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                </div>
                <h2 className="text-base md:text-lg font-bold text-gray-900 tracking-tight" data-onboarding="student-form-basic">
                  {content.basicDetails}
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 md:gap-3 mb-2 md:mb-3">
                {/* Name Fields */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-medium text-gray-600 mb-1">
                    {content.firstName}
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full p-2 text-[13px] placeholder:text-gray-400 h-9"
                    placeholder={content.enterFirstName}
                  />
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs font-medium text-gray-600 mb-1">
                    {content.middleName}
                  </label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    className="w-full p-2 text-[13px] placeholder:text-gray-400 h-9"
                    placeholder={content.enterMiddleName}
                  />
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs font-medium text-gray-600 mb-1">
                    {content.lastName}
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full p-2 text-[13px] placeholder:text-gray-400 h-9"
                    placeholder={content.enterLastName}
                  />
                </div>
              </div>

              {/* Date of Birth and Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 mb-1">
                <div>
                  <label className="block text-[11px] sm:text-xs font-medium text-gray-600 mb-1">
                    {content.dateOfBirth}
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      max={getMaxDOB()}
                      className="w-full p-2 pr-10 text-[13px] placeholder:text-gray-400 h-9"
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="block text-[11px] sm:text-xs font-medium text-gray-600 mb-1">
                    {content.gender}
                  </label>
                  <div className="flex items-center gap-2">
                    <label className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border-[1.5px] cursor-pointer transition-all ${formData.gender === 'male' ? 'border-pink-500 bg-pink-50 text-pink-700 font-bold shadow-[0_0_0_2px_rgba(236,72,153,0.1)]' : 'border-gray-200 bg-white/70 hover:border-pink-300 text-gray-600 font-medium'}`}>
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={formData.gender === "male"}
                        onChange={handleInputChange}
                        className="hidden"
                      />
                      <span className={`w-3 h-3 rounded-full border-[1.5px] flex items-center justify-center ${formData.gender === 'male' ? 'border-pink-500' : 'border-gray-300'}`}>
                         {formData.gender === 'male' && <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>}
                      </span>
                      <span className="text-xs">{content.male}</span>
                    </label>

                    <label className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border-[1.5px] cursor-pointer transition-all ${formData.gender === 'female' ? 'border-pink-500 bg-pink-50 text-pink-700 font-bold shadow-[0_0_0_2px_rgba(236,72,153,0.1)]' : 'border-gray-200 bg-white/70 hover:border-pink-300 text-gray-600 font-medium'}`}>
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={formData.gender === "female"}
                        onChange={handleInputChange}
                        className="hidden"
                      />
                      <span className={`w-3 h-3 rounded-full border-[1.5px] flex items-center justify-center ${formData.gender === 'female' ? 'border-pink-500' : 'border-gray-300'}`}>
                         {formData.gender === 'female' && <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>}
                      </span>
                      <span className="text-xs">{content.female}</span>
                    </label>

                    <label className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border-[1.5px] cursor-pointer transition-all ${formData.gender === 'other' ? 'border-pink-500 bg-pink-50 text-pink-700 font-bold shadow-[0_0_0_2px_rgba(236,72,153,0.1)]' : 'border-gray-200 bg-white/70 hover:border-pink-300 text-gray-600 font-medium'}`}>
                      <input
                        type="radio"
                        name="gender"
                        value="other"
                        checked={formData.gender === "other"}
                        onChange={handleInputChange}
                        className="hidden"
                      />
                      <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${formData.gender === 'other' ? 'border-pink-500' : 'border-gray-300'}`}>
                         {formData.gender === 'other' && <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>}
                      </span>
                      <span className="text-sm">{content.other}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {currentStep === 2 && (
          <>
            {/* --- CONTACT INFORMATION SECTION --- */}
            <div className="mb-4 animate-in fade-in slide-in-from-right-4" data-onboarding="student-form-contact">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                </div>
                <h2 className="text-base md:text-lg font-bold text-gray-900 tracking-tight">
                  {content.contactInfo}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 mb-1">
                <div>
                  <label className="block text-[11px] sm:text-xs font-medium text-gray-600 mb-1">
                    {content.whatsappNumber}
                  </label>
                  <input
                    type="tel"
                    name="whatsappNumber"
                    maxLength={10}
                    pattern="[0-9]{10}"
                    value={formData.whatsappNumber}
                    onChange={handleInputChange}
                    className="w-full p-2 text-[13px] placeholder:text-gray-400 h-9"
                    placeholder={content.enterWhatsapp}
                  />
                  {whatsappError && (
                    <p className="text-destructive text-[10px] sm:text-xs mt-1 font-medium">{whatsappError}</p>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs font-medium text-gray-600 mb-1">
                    {content.alternateNumber}{location.state?.googleEmail ? ' *' : ''}
                  </label>
                  <input
                    type="tel"
                    name="alternateNumber"
                    maxLength={10}
                    pattern="[0-9]{10}"
                    value={formData.alternateNumber}
                    onChange={handleInputChange}
                    disabled={!!formData.alternateNumber && !location.state?.googleEmail}
                    className={`w-full p-2 text-[13px] placeholder:text-gray-400 h-9 ${(formData.alternateNumber && !location.state?.googleEmail) ? 'bg-gray-100 cursor-not-allowed opacity-80' : ''}`}
                    placeholder={content.enterAlternate}
                  />
                  {alternateError && (
                    <p className="text-destructive text-[10px] sm:text-xs mt-1 font-medium">{alternateError}</p>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs font-medium text-gray-600 mb-1">
                    {content.email}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!!location.state?.googleEmail}
                    className={`w-full p-2 text-[13px] placeholder:text-gray-400 h-9 ${location.state?.googleEmail ? "bg-gray-100 cursor-not-allowed opacity-80" : ""}`}
                    placeholder={content.enterEmail}
                  />
                  {emailError && (
                    <p className="text-destructive text-[10px] sm:text-xs mt-1 font-medium">{emailError}</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {currentStep === 3 && (
          <>
            {/* --- ADDRESS DETAILS SECTION --- */}
            <div className="mb-4 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                </div>
                <h2 className="text-base md:text-lg font-bold text-gray-900 tracking-tight">
                  Address Details
                </h2>
              </div>

              {/* PIN Code, District and State */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 mb-1">
                <div>
                  <label className="block text-[11px] sm:text-xs font-medium text-gray-600 mb-1">
                    {content.pinCode}
                  </label>
                  <input
                    type="text"
                    name="pinCode"
                    value={formData.pinCode}
                    onChange={handleInputChange}
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    className="w-full p-2 text-[13px] placeholder:text-gray-400 h-9"
                    placeholder="Enter PIN code"
                  />
                  <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-wide">
                    {content.pinCodeExample}
                  </p>
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs font-medium text-gray-600 mb-1">
                    {content.district}
                  </label>
                  <input
                    type="text"
                    value={isPincodeLoading ? "Loading..." : formData.district}
                    readOnly
                    disabled
                    className="w-full p-2 text-[13px] h-9 bg-gray-100/80 cursor-not-allowed text-gray-600 placeholder:text-gray-400 opacity-80"
                    placeholder="Auto-filled from PIN code"
                  />
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1">
                    {content.state}
                  </label>
                  <input
                    type="text"
                    value={isPincodeLoading ? "Loading..." : formData.state}
                    readOnly
                    disabled
                    className="w-full p-2 text-[13px] h-9 bg-gray-100/80 cursor-not-allowed text-gray-600 placeholder:text-gray-400 opacity-80"
                    placeholder="Auto-filled from PIN code"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {currentStep === 4 && (
          <>
            {/* --- EDUCATION SECTION --- */}
            <div className="mb-4 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.22 4.621 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" /></svg>
                </div>
                <h2 className="text-base md:text-lg font-bold text-gray-900 tracking-tight">
                  Education Details
                </h2>
              </div>

              {/* Maximum Qualification & School Medium */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 mb-2 md:mb-3">
                <div>
                  <label className="block text-[11px] sm:text-xs font-medium text-gray-600 mb-1">
                    {content.maximumQualification}
                  </label>
                  <Combobox
                    options={qualifications?.filter((item) => item.qualification_name.toLowerCase() !== '10th pass').map((item) => ({
                      value: String(item.id),
                      label: item.qualification_name,
                    })) || []}
                    value={formData.maximumQualification}
                    onValueChange={(value) => {
                      handleInputChange({ target: { name: 'maximumQualification', value } } as any);
                    }}
                    placeholder={content.selectQualification}
                    searchPlaceholder="Search..."
                    emptyText="No qualification found."
                    className="h-9 w-full border-gray-300 rounded-xl text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs font-medium text-gray-600 mb-1">
                    {content.schoolMedium}
                  </label>
                  <Combobox
                    options={[
                      { value: "English", label: "English" },
                      { value: "Hindi", label: "Hindi" },
                      { value: "Marathi", label: "Marathi" },
                      { value: "Other", label: "Other" },
                    ]}
                    value={formData.schoolMedium}
                    onValueChange={(value) => {
                      handleInputChange({ target: { name: 'schoolMedium', value } } as any);
                    }}
                    placeholder={content.selectMedium}
                    searchPlaceholder="Search..."
                    emptyText="No medium found."
                    className="h-9 w-full border-gray-300 rounded-xl text-[13px]"
                  />
                </div>
              </div>

              {/* Conditional Graduation Fields */}
              {qualifications.find(q => String(q.id) === formData.maximumQualification)?.qualification_name.toLowerCase().includes('pursuing') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 mb-2 md:mb-3 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="block text-[11px] sm:text-xs font-medium text-gray-600 mb-1">
                      {content.pursuingYear}
                    </label>
                    <Combobox
                      options={[
                        { value: "1st Year", label: content.year1st },
                        { value: "2nd Year", label: content.year2nd },
                        { value: "3rd Year", label: content.year3rd },
                        { value: "4th Year", label: content.year4th },
                        { value: "Final Year", label: content.yearFinal },
                      ]}
                      value={formData.pursuingYear}
                      onValueChange={(value) => {
                        handleInputChange({ target: { name: 'pursuingYear', value } } as any);
                      }}
                      placeholder={content.selectOption}
                      searchPlaceholder="Search..."
                      emptyText="No option found."
                      className="h-9 w-full border-gray-300 rounded-xl text-[13px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] sm:text-xs font-medium text-gray-600 mb-1">
                      {content.collegeAttendanceMethod}
                    </label>
                    <Combobox
                      options={[
                        { value: "Regular", label: content.attendanceRegular },
                        { value: "Only Exam", label: content.attendancePrivate },
                      ]}
                      value={formData.collegeAttendanceMethod}
                      onValueChange={(value) => {
                        handleInputChange({ target: { name: 'collegeAttendanceMethod', value } } as any);
                      }}
                      placeholder={content.selectOption}
                      searchPlaceholder="Search..."
                      emptyText="No option found."
                      className="h-9 w-full border-gray-300 rounded-xl text-[13px]"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {currentStep === 5 && (
          <>
            {/* --- CAMPUS & COURSE SECTION --- */}
            <div className="mb-4 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.22 4.621 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" /></svg>
                </div>
                <h2 className="text-base md:text-lg font-bold text-gray-900 tracking-tight">
                  {content.campusAndCourse || "Campus & Course"}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                {/* Selected Campus First */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] sm:text-xs font-medium text-gray-600">
                      {content.preferredCampus || "Preferred Campus *"}
                    </label>
                    {formData.preferred_campus_id && (
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          // Just pass the selected campus name to the modal
                          setSelectedCampusInfo({ name: formData.preferred_campus_id });
                        }} 
                        className="text-[10px] sm:text-[11px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md font-semibold flex items-center gap-1 transition-colors"
                      >
                        ℹ️ {content.aboutCampus || "About Campus"}
                      </button>
                    )}
                  </div>
                  <Combobox
                    options={getAvailableCampuses().map((campusName) => ({
                      value: campusName,
                      label: campusName,
                    }))}
                    value={formData.preferred_campus_id}
                    onValueChange={(value) => {
                      handleInputChange({ target: { name: 'preferred_campus_id', value } } as any);
                    }}
                    placeholder="Select Campus"
                    searchPlaceholder="Search..."
                    emptyText="No campus found."
                    className="h-9 w-full border-gray-300 rounded-xl text-[13px]"
                  />
                </div>

                {/* Selected Course Second */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] sm:text-xs font-medium text-gray-600">
                      {content.preferredCourse || "Preferred Course *"}
                    </label>
                    {formData.initial_school_id && (
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.preventDefault();
                          const selectedSch = schools.find(sch => String(sch.id) === String(formData.initial_school_id));
                          const detail = schoolDetails.find(sd => selectedSch && (selectedSch.school_name.includes(sd.id) || sd.id.includes(selectedSch.school_name)));
                          if (detail) setSelectedSchoolInfo(detail);
                        }} 
                        className="text-[10px] sm:text-[11px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md font-semibold flex items-center gap-1 transition-colors"
                      >
                        ℹ️ About Course
                      </button>
                    )}
                  </div>
                  <Combobox
                    options={availableSchoolsForCampus.map(s => {
                       const detail = schoolDetails.find(sd => sd.id === s.school_name);
                       if (detail && isSchoolEligible(detail.id)) {
                           // Use s.school_id if available, fallback to matching global schools by name
                           const matched = schools.find(sch => sch.id === s.school_id || sch.school_name.includes(detail.id));
                           const isOpen = s.is_open === true;
                           return {
                             value: String(s.school_id || (matched ? matched.id : s.id)),
                             label: detail.name,
                             disabled: !isOpen,
                             subLabel: !isOpen ? (selectedLanguage === 'hindi' ? "इस कैंपस के लिए एडमिशन बंद हैं" : "Admissions Closed for this Campus") : undefined
                           };
                       }
                       return null;
                    }).filter(Boolean) as any[]}
                    value={String(formData.initial_school_id)}
                    onValueChange={(value) => {
                      handleInputChange({ target: { name: 'initial_school_id', value } } as any);
                    }}
                    placeholder="Select Course"
                    searchPlaceholder="Search..."
                    emptyText="No course found."
                    className="h-9 w-full border-gray-300 rounded-xl text-[13px]"
                  />
                </div>
              </div>
            </div>
          </>
        )}



        <div className="h-px bg-gray-100 my-4 w-full" />

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-2">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevious}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50 active:scale-95"
            >
              <span>&larr;</span> {content.back}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/students")}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50 active:scale-95"
            >
              <span>&larr;</span> {content.back}
            </button>
          )}
          
          <button
            type="button"
            onClick={handleSubmit}
            data-onboarding={currentStep === 5 ? "student-form-submit" : "student-form-school-step"}
            className="rounded-xl bg-pink-500 hover:bg-pink-600 px-8 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95"
          >
            {currentStep === 1 ? `Next: ${content.contactInfo || "Contact Info"}` : 
             currentStep === 2 ? `Next: Address Details` :
             currentStep === 3 ? `Next: Education` :
             currentStep === 4 ? `Next: Campus` :
             currentStep === 5 ? content.saveContinue : (selectedLanguage === 'hindi' ? 'आगे' : content.nextStep)}
          </button>
        </div>
        </div>
      </main>

      {/* Learning Round Modal */}
      <LearningRoundModal
        isOpen={isLearningModalOpen}
        onClose={() => setIsLearningModalOpen(false)}
        videoUrl="https://www.youtube.com/watch?v=8IbSWrh8DsY"
        title="Learning Round Overview"
        description="Watch this video to understand how the learning round works and what to expect."
      />

      {/* School Details Modal */}
      {selectedSchoolInfo && <SchoolDetailCard school={selectedSchoolInfo} />}

      {/* Campus Details Modal */}
      {selectedCampusInfo && <CampusDetailCard campus={selectedCampusInfo} />}
    </div>
  );
};

export default StudentForm;
