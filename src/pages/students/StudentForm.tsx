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
  Religion,
  getAllReligions,
  createStudent,
  getAllStates,
  getDistrictsByState,
  getBlocksByDistrict,
  uploadProfileImage,
  getAllSchools,
  type School,
} from "@/utils/api";
import { detectHumanFace } from "@/utils/faceVerification";
import LogoutButton from "@/components/ui/LogoutButton";
import LanguageSelector from "@/components/ui/LanguageSelector";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";
import { ExternalLink, PlayCircle } from "lucide-react";
import { LearningRoundModal } from "@/components/LearningRoundModal";
import { ContextualHelpWidget } from "@/components/onboarding/ContextualHelpWidget";
interface State {
  id: string;
  state_name: string;
  state_code: string;
}

interface District {
  id: string;
  district_name: string;
  district_code: string;
  state_code: string;
}

interface Block {
  id: string;
  block_name: string;
  district_code?: string; // Optional since it might not be in all responses
}

const StudentForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { selectedLanguage } = useLanguage();

  const [casts, setCasts] = useState<Cast[]>([]);
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [statuses, setStatuses] = useState<CurrentStatus[]>([]);
  const [religions, setReligions] = useState<Religion[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolInfo, setSelectedSchoolInfo] = useState<any>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [emailError, setEmailError] = useState("");
  const [alternateError, setAlternateError] = useState("");
  const [whatsappError, setWhatsappError] = useState("");
  const [schoolError, setSchoolError] = useState("");
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLearningModalOpen, setIsLearningModalOpen] = useState(false);
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  const [loadingStates, setLoadingStates] = useState({
    states: false,
    districts: false,
    blocks: false,
  });

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
    block: "",
    blockCode: "",
    city: "",
    pinCode: "",
    currentStatus: "",
    maximumQualification: "",
    schoolMedium: "",
    casteTribe: "",
    religion: "",
    initial_school_id: "",
    pursuingYear: "",
    collegeAttendanceMethod: "",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
              "न्यूनतम आयु: 16.5 वर्ष",
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
              "किमान वय: 16.5 वर्षे",
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
              "Minimum age: 16.5 years",
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
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
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

          <div className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8 custom-scrollbar">
            <section>
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">🎯</span>
                {content.eligibility}
              </h3>
              <ul className="space-y-2">
                {school.eligibility.map((item: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-600">
                    <span className="text-primary">•</span> {item}
                  </li>
                ))}
              </ul>

              <h3 className="text-lg font-bold text-gray-800 mt-8 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">📚</span>
                {content.curriculumFocus}
              </h3>
              <ul className="space-y-2">
                {school.curriculum.map((item: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-600">
                    <span className="text-primary">•</span> {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">🏆</span>
                {content.outcomes}
              </h3>
              <ul className="space-y-2">
                {school.outcomes.map((item: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-600">
                    <span className="text-primary">•</span> {item}
                  </li>
                ))}
              </ul>

              <div className="mt-8 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl space-y-4">
                <div className="space-y-2">
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
                  if (!isEligible && !!hasQualification) return; // Disable if not eligible
                  const matchedSchool = schools.find(s => s.school_name.includes(school.id));
                  if (matchedSchool) {
                    handleInputChange({ target: { name: 'initial_school_id', value: String(matchedSchool.id) } } as any);
                    setSelectedSchoolInfo(null);
                  }
                }}
                disabled={!isEligible && !!hasQualification}
                className={`w-full mt-8 py-4 font-bold rounded-xl transition-all shadow-lg ${!isEligible && !!hasQualification
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary/90 active:scale-95'
                  }`}
              >
                {!isEligible && !!hasQualification ? (school.id === 'BCA' && formData.gender === 'male' ? 'You are not eligible' : content.notEligible) : content.applyToSchool}
              </button>
            </section>
          </div>
        </div>
      </div>
    );
  };

  // Convert camelCase → snake_case before API call
  const mapFormDataToApi = (data: typeof formData) => {
    const partnerId = localStorage.getItem("partner_id");

    return {
      image_url: data.imageUrl || null,
      first_name: data.firstName,
      middle_name: data.middleName,
      last_name: data.lastName,
      dob: data.dateOfBirth,
      whatsapp_number: data.whatsappNumber,
      phone_number: data.alternateNumber,
      email: data.email,
      gender: data.gender,
      state: data.stateCode, 
      district: data.district, // Send NAME (e.g., "Hyderabad")
      block: data.block, // Send NAME (e.g., "Asifnagar")
      city: data.city,
      pin_code: data.pinCode,
      school_medium: data.schoolMedium,
      current_status_id: Number(data.currentStatus) || null,
      qualification_id: Number(data.maximumQualification) || null,
      religion_id: Number(data.religion) || null,
      partner_id: partnerId ? Number(partnerId) : null,
      initial_school_id: Number(data.initial_school_id) || null,
      graduation_year: data.pursuingYear || null,
      graduation_mode: data.collegeAttendanceMethod || null,
    };
  };

  // Fetch all states on component mount
  const fetchStates = async () => {
    try {
      setLoadingStates((prev) => ({ ...prev, states: true }));
      const response = await getAllStates();

      // Handle different possible response structures
      let statesData: State[] = [];

      if (Array.isArray(response)) {
        // If response is directly an array
        statesData = response;
      } else if (response && Array.isArray(response.data)) {
        // If response has data property that is an array
        statesData = response.data;
      } else if (response && response.states) {
        // If response has states property
        statesData = response.states;
      } else if (response && response.result) {
        // If response has result property
        statesData = response.result;
      }

      setStates(statesData || []);
    } catch (error) {
      // console.error("Error fetching states:", error);
      toast({
        title: "❌ Unable to Load States",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900"
      });
      setStates([]);
    } finally {
      setLoadingStates((prev) => ({ ...prev, states: false }));
    }
  };

  // Fetch districts when state is selected
  const fetchDistricts = async (stateCode: string) => {
    if (!stateCode) {
      setDistricts([]);
      setBlocks([]);
      return;
    }

    try {
      setLoadingStates((prev) => ({ ...prev, districts: true }));
      const response = await getDistrictsByState(stateCode);
      // Handle different possible response structures
      let districtsData: District[] = [];

      if (Array.isArray(response)) {
        districtsData = response;
      } else if (response && Array.isArray(response.data)) {
        districtsData = response.data;
      } else if (response && response.districts) {
        districtsData = response.districts;
      } else if (response && response.result) {
        districtsData = response.result;
      }
      setDistricts(districtsData || []);
    } catch (error) {
      console.error("Error fetching districts:", error);
      toast({
        title: "❌ Unable to Load Districts",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900"
      });
      setDistricts([]);
    } finally {
      setLoadingStates((prev) => ({ ...prev, districts: false }));
    }
  };

  // Fetch blocks when district is selected
  const fetchBlocks = async (districtCode: string) => {
    if (!districtCode) {
      setBlocks([]);
      return;
    }

    try {
      setLoadingStates((prev) => ({ ...prev, blocks: true }));
      const response = await getBlocksByDistrict(districtCode);
      // Handle different possible response structures
      let blocksData: Block[] = [];

      if (Array.isArray(response)) {
        blocksData = response;
      } else if (response && Array.isArray(response.data)) {
        blocksData = response.data;
      } else if (response && response.blocks) {
        blocksData = response.blocks;
      } else if (response && response.result) {
        blocksData = response.result;
      }

      setBlocks(blocksData || []);
    } catch (error) {
      // console.error("Error fetching blocks:", error);
      toast({
        title: "❌ Unable to Load Blocks",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900"
      });
      setBlocks([]);
    } finally {
      setLoadingStates((prev) => ({ ...prev, blocks: false }));
    }
  };

  useEffect(() => {
    const savedFormData = localStorage.getItem("studentFormData");
    const googleEmail = location.state?.googleEmail;

    if (savedFormData) {
      const parsedData = JSON.parse(savedFormData);
      // If Google email is present and email is not already set, use Google email
      if (googleEmail && !parsedData.email) {
        parsedData.email = googleEmail;
      }
      setFormData(parsedData);
      // If state was previously selected, fetch its districts
      if (parsedData.stateCode) {
        fetchDistricts(parsedData.stateCode);
      }

      // If district was previously selected, fetch its blocks
      if (parsedData.districtCode) {
        fetchBlocks(parsedData.districtCode);
      }
    } else if (googleEmail) {
      // If no saved form data but Google email exists, set it
      setFormData((prev) => ({ ...prev, email: googleEmail }));
    }

    // Fetch initial data
    fetchStates();

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

    // fetch religions
    const fetchReligions = async () => {
      try {
        const response = await getAllReligions();
        setReligions(response);
      } catch (error) {
        // console.error("Error fetching religions:", error);
      }
    };
    fetchReligions();

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

  }, [location.state?.googleEmail]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    // For name fields, allow only letters, spaces, apostrophes, and hyphens
    let processedValue = value;
    if (name === "firstName" || name === "middleName" || name === "lastName") {
      processedValue = value.replace(/[^A-Za-z\s'-]/g, "");
    }

    // For phone fields, strip non-digit characters and limit to 10 digits
    if (name === "whatsappNumber" || name === "alternateNumber") {
      processedValue = value.replace(/\D/g, "").slice(0, 10);
    }

    // For pin code, allow only digits and limit to 6 digits
    if (name === "pinCode") {
      processedValue = value.replace(/\D/g, "").slice(0, 6);
    }

    let newFormData = { ...formData, [name]: processedValue };
    // Handle state change
    if (name === "stateCode") {
      const selectedState = states.find((state) => state.state_code === processedValue);
      newFormData = {
        ...newFormData,
        stateCode: processedValue,
        state: selectedState?.state_name || "",
        district: "",
        districtCode: "",
        block: "",
        blockCode: "",
      };
      setDistricts([]);
      setBlocks([]);
      if (processedValue) {
        fetchDistricts(processedValue);
      }
    }

    // Handle district change
    if (name === "districtCode") {
      const selectedDistrict = districts.find(
        (district) => district.district_code === processedValue,
      );
      newFormData = {
        ...newFormData,
        districtCode: processedValue,
        district: selectedDistrict?.district_name || "",
        block: "",
        blockCode: "",
      };
      setBlocks([]);
      if (processedValue) {
        fetchBlocks(processedValue);
      }
    }

    // Handle block change
    if (name === "blockCode") {
      const selectedBlock = blocks.find((block) => String(block.id) === processedValue);
      newFormData = {
        ...newFormData,
        blockCode: processedValue,
        block: selectedBlock?.block_name || "",
      };
    }

    setFormData(newFormData);
    localStorage.setItem("studentFormData", JSON.stringify(newFormData));

    // Live validation for alternate and whatsapp numbers
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

    // Live email validation
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
      // Show loading toast
      toast({
        title: content.verifying || "Verifying...",
        description:
          content.verifyingMessage ||
          "Please wait while we verify the image...",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900"
      });

      // Verify if image contains human face
      const faceDetectionResult = await detectHumanFace(file);

      if (!faceDetectionResult.success) {
        // Show error toast with specific message
        toast({
          variant: "destructive",
          title: content.noFaceDetected || "❌ Face Verification Failed",
          description: faceDetectionResult.message,
          className: "border-red-500 bg-red-50 text-red-900",
          duration: 5000
        });
        // Clear the file input
        e.target.value = "";
        return;
      }

      // Face detected successfully - upload the image
      try {
        const uploadResult = await uploadProfileImage(file);

        // Update form data with uploaded image URL
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

        // Show success toast
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
        // Clear the file input
        e.target.value = "";
      }
    }
  };

  // Calculate age in years
  const getAge = (dob: string) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    const diff = today.getTime() - birthDate.getTime();
    const age = diff / (1000 * 60 * 60 * 24 * 365.25);
    return age;
  };

  const isFormValid = () => {
    const age = getAge(formData.dateOfBirth);

    // District is mandatory only if districts are available
    const districtRequired = districts.length > 0 ? formData.districtCode : true;

    // Block is mandatory only if blocks are available
    const blockRequired = blocks.length > 0 ? formData.blockCode : true;

    // Alternate number is mandatory when user logged in via email
    const alternateRequired = location.state?.googleEmail ? formData.alternateNumber : true;

    return (
      // formData.profileImage &&
      formData.firstName &&
      formData.dateOfBirth &&
      (formData.whatsappNumber || formData.alternateNumber || formData.email) &&
      formData.gender &&
      formData.stateCode &&
      districtRequired &&
      blockRequired &&
      formData.pinCode &&
      formData.currentStatus &&
      formData.maximumQualification &&
      formData.schoolMedium &&
      formData.casteTribe &&
      formData.religion &&
      alternateRequired &&
      (currentStep === 2 ? formData.initial_school_id : true) &&
      age >= 16.5 &&
      // Conditional fields for pursuing graduation
      (qualifications.find(q => String(q.id) === formData.maximumQualification)?.qualification_name.toLowerCase().includes('pursuing') ? 
        formData.pursuingYear && formData.collegeAttendanceMethod : true)
    );
  };

  const handleSubmit = async () => {
    const age = getAge(formData.dateOfBirth);

    // if (!formData.profileImage) {
    //   return toast({
    //     title: "⚠️ Profile Image Required",
    //     description: "Please upload a profile image.",
    //     variant: "default",
    //     className: "border-orange-500 bg-orange-50 text-orange-900"
    //   });
    // }

    if (!formData.firstName) {
      return toast({
        title: "⚠️ First Name Required",
        description: "Please enter your first name.",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900"
      });
    }

    if (!formData.dateOfBirth || age < 16.5) {
      return toast({
        title: "⚠️ Invalid Date of Birth",
        description: "You must be at least 16.5 years old.",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900"
      });
    }

    if (formData.whatsappNumber && !/^\d{10}$/.test(formData.whatsappNumber)) {
      return toast({
        title: "⚠️ Invalid WhatsApp Number",
        description: "Enter a valid 10-digit WhatsApp number or leave it empty.",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900"
      });
    }

    // Alternate number validation - mandatory when logged in via email
    if (location.state?.googleEmail) {
      if (!formData.alternateNumber) {
        return toast({
          title: "⚠️ Phone Number Required",
          description: "Please enter your phone number.",
          variant: "default",
          className: "border-orange-500 bg-orange-50 text-orange-900"
        });
      }
      if (!/^\d{10}$/.test(formData.alternateNumber)) {
        return toast({
          title: "⚠️ Invalid Phone Number",
          description: "Enter a valid 10-digit phone number.",
          variant: "default",
          className: "border-orange-500 bg-orange-50 text-orange-900"
        });
      }
    } else if (formData.alternateNumber && !/^\d{10}$/.test(formData.alternateNumber)) {
      return toast({
        title: "⚠️ Invalid Phone Number",
        description: "Enter a valid 10-digit phone number.",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900"
      });
    }

    if (!formData.gender) {
      return toast({
        title: "⚠️ Gender Required",
        description: "Please select your gender.",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900"
      });
    }

    // Validate State and Pin Code (always required)
    if (!formData.stateCode || !formData.pinCode) {
      return toast({
        title: "⚠️ Address Required",
        description: "Please fill State and Pin Code.",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900"
      });
    }

    // Validate District (required only if districts are available)
    if (districts.length > 0 && !formData.districtCode) {
      return toast({
        title: "⚠️ District Required",
        description: "Please select a district.",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900"
      });
    }

    // Validate Block (required only if blocks are available)
    if (blocks.length > 0 && !formData.blockCode) {
      return toast({
        title: "⚠️ Block Required",
        description: "Please select a block.",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900"
      });
    }

    if (
      !formData.currentStatus ||
      !formData.maximumQualification ||
      !formData.schoolMedium ||
      !formData.casteTribe ||
      !formData.religion
    ) {
      return toast({
        title: "Additional Info Required",
        description: "Please fill all required additional fields.",
        variant: "destructive",
      });
    }

    // Validate pursuing graduation fields
    const selectedQual = qualifications.find(q => String(q.id) === formData.maximumQualification);
    const isPursuing = selectedQual?.qualification_name.toLowerCase().includes('pursuing');

    if (isPursuing) {
      if (!formData.pursuingYear) {
        return toast({
          title: "⚠️ Question Required",
          description: "Please select which year is going on.",
          variant: "default",
          className: "border-orange-500 bg-orange-50 text-orange-900"
        });
      }
      if (!formData.collegeAttendanceMethod) {
        return toast({
          title: "⚠️ Question Required",
          description: "Please select your college attendance method.",
          variant: "default",
          className: "border-orange-500 bg-orange-50 text-orange-900"
        });
      }
    }

    if (currentStep === 1) {
      setCurrentStep(2);
      // Scroll the container to top
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    if (!formData.initial_school_id) {
      setSchoolError("Please select a school.");
      return toast({
        title: "⚠️ School Selection Required",
        description: "Please select your preferred school.",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900"
      });
    }

    try {
      const apiPayload = mapFormDataToApi(formData);
      const studentFormResponseData = await createStudent(apiPayload);

      // console.log("Student API Response:", studentFormResponseData);

      // Store registration status
      localStorage.setItem("registrationDone", "true");

      // Store the complete API response
      localStorage.setItem(
        "studentApiResponse",
        JSON.stringify(studentFormResponseData),
      );

      // Store form data
      localStorage.setItem("studentFormData", JSON.stringify(formData));

      // Extract and store studentId from response
      // Handle different possible response structures
      let studentId = null;
      if (studentFormResponseData?.id) {
        studentId = studentFormResponseData.id;
      } else if (studentFormResponseData?.data?.id) {
        studentId = studentFormResponseData.data.id;
      } else if (studentFormResponseData?.student?.id) {
        studentId = studentFormResponseData.student.id;
      }

      if (studentId) {
        localStorage.setItem("studentId", studentId.toString());
        // console.log("Student ID stored:", studentId);
      } else {
        console.warn("Student ID not found in response");
      }

      toast({
        title: "✅ Registration Successful",
        description: "Your registration was successful!",
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900"
      });

      navigate("/students/test/start");
    } catch (error) {
      console.error("Error creating student:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong while creating student.";
      toast({
        title: "❌ Registration Failed",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900"
      });
    }
  };

  const handlePrevious = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/students/details/instructions");
    }
  };
  // Calculate the maximum date allowed
  const getMaxDOB = () => {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 16);
    today.setMonth(today.getMonth() - 6);
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
          state: "राज्य चुनें *",
          district: "जिला चुनें",
          block: "ब्लॉक चुनें",
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
          selectBlock: "ब्लॉक चुनें",
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
          selectSchoolHeading: "अपना स्कूल चुनें",
          selectSchoolDescription: "कृपया हमारे स्कूलों के बारे में जानकारी पढ़ें और वह चुनें जिसके लिए आप आवेदन करना चाहते हैं।",
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
          state: "राज्य निवडा *",
          district: "जिल्हा निवडा",
          block: "ब्लॉक निवडा",
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
          selectBlock: "ब्लॉक निवडा",
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
          block: "Block",
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
          selectBlock: "Select Block",
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
          selectSchoolHeading: "Select Your School",
          selectSchoolDescription: "Please go through the information about our schools and select the one you'd like to apply for.",
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
    <div className="min-h-screen student-bg-gradient flex justify-center p-4 pt-20 md:pt-24 relative">
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
      <LanguageSelector />
      <LogoutButton className="shadow-lg" />
      <div ref={scrollContainerRef} className={`bg-card rounded-2xl shadow-large p-6 w-full overflow-y-auto relative ${currentStep === 1 ? 'max-w-6xl' : 'max-w-7xl'} max-h-[85vh]`}>
        {/* Header */}
        <div className="text-center mb-6" data-onboarding="student-form-header">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 ">
            {currentStep === 1 ? content.signUp : content.selectSchoolHeading}
          </h1>
        </div>

        {currentStep === 1 ? (
          <>
            {/* Profile Image Upload */}
            <div className="text-center">
              <div className="w-24 h-24 mx-auto border-2 border-dashed border-input rounded-xl flex flex-col items-center justify-center bg-muted relative cursor-pointer hover:border-primary transition-colors">
                {!imagePreview ? (
                  <>
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mb-1">
                      <span className="text-primary-foreground text-sm">📷</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {content.addPhoto}
                    </span>
                  </>
                ) : (
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-xl"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Section Title */}
            <h2 className="text-xl font-semibold text-gray-800 mb-4" data-onboarding="student-form-basic">
              {content.basicDetails}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Name Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {content.firstName}
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:prime"
                  placeholder={content.enterFirstName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {content.middleName}
                </label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={content.enterMiddleName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {content.lastName}
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={content.enterLastName}
                />
              </div>
            </div>

            {/* Date of Birth and Gender */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {content.dateOfBirth}
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    max={getMaxDOB()}
                    className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {content.gender}
                </label>
                <div className="flex items-center h-12 space-x-6">
                  <label className="flex items-center space-x-2.5 cursor-pointer group">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={formData.gender === "male"}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-primary focus:ring-primary accent-primary cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">
                      {content.male}
                    </span>
                  </label>
                  <label className="flex items-center space-x-2.5 cursor-pointer group">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={formData.gender === "female"}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-primary focus:ring-primary accent-primary cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">
                      {content.female}
                    </span>
                  </label>
                  <label className="flex items-center space-x-2.5 cursor-pointer group">
                    <input
                      type="radio"
                      name="gender"
                      value="other"
                      checked={formData.gender === "other"}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-primary focus:ring-primary accent-primary cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">
                      {content.other}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="mb-4" data-onboarding="student-form-contact">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {content.contactInfo}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {content.whatsappNumber}
                  </label>
                  <input
                    type="tel"
                    name="whatsappNumber"
                    maxLength={10}
                    pattern="[0-9]{10}"
                    value={formData.whatsappNumber}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={content.enterWhatsapp}
                  />
                  {whatsappError && (
                    <p className="text-destructive text-sm mt-1">{whatsappError}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${(formData.alternateNumber && !location.state?.googleEmail) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder={content.enterAlternate}
                  />
                  {alternateError && (
                    <p className="text-destructive text-sm mt-1">{alternateError}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {content.email}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!!location.state?.googleEmail}
                    className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${location.state?.googleEmail
                      ? "bg-gray-100 cursor-not-allowed"
                      : ""
                      }`}
                    placeholder={content.enterEmail}
                  />
                  {emailError && (
                    <p className="text-destructive text-sm mt-1">{emailError}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Fields */}
            <div className="mb-4" data-onboarding="student-form-addition">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Additional Information
              </h3>

              {/* State, District and Block */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {content.state}
                  </label>
                  <Combobox
                    options={states?.map((state) => ({
                      value: state.state_code,
                      label: state.state_name,
                    })) || []}
                    value={formData.stateCode}
                    onValueChange={(value) => {
                      handleInputChange({ target: { name: 'stateCode', value } } as any);
                    }}
                    placeholder={loadingStates.states ? content.loading : content.selectState}
                    searchPlaceholder="Search state..."
                    emptyText="No state found."
                    disabled={loadingStates.states}
                    className="h-12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {content.district}
                    {districts.length > 0 && <span className="text-destructive"> *</span>}
                  </label>
                  <Combobox
                    options={districts?.map((district) => ({
                      value: district.district_code,
                      label: district.district_name,
                    })) || []}
                    value={formData.districtCode}
                    onValueChange={(value) => {
                      handleInputChange({ target: { name: 'districtCode', value } } as any);
                    }}
                    placeholder={
                      loadingStates.districts
                        ? content.loading
                        : !formData.stateCode
                          ? "Please select a state first"
                          : content.selectDistrict
                    }
                    searchPlaceholder="Search district..."
                    emptyText="No district found."
                    disabled={loadingStates.districts || !formData.stateCode}
                    className="h-12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {content.block}
                    {blocks.length > 0 && <span className="text-destructive"> *</span>}
                  </label>
                  <Combobox
                    options={blocks?.map((block) => ({
                      value: String(block.id), // Use id as value, like ApplicantModal
                      label: block.block_name,
                    })) || []}
                    value={formData.blockCode}
                    onValueChange={(value) => {
                      handleInputChange({ target: { name: 'blockCode', value } } as any);
                    }}
                    placeholder={
                      loadingStates.blocks
                        ? content.loading
                        : !formData.districtCode
                          ? "Please select a district first"
                          : blocks.length === 0
                            ? "No blocks available"
                            : content.selectBlock
                    }
                    searchPlaceholder="Search block..."
                    emptyText="No block found."
                    disabled={loadingStates.blocks || !formData.districtCode}
                    className="h-12"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {content.pinCode}
                  </label>
                  <input
                    type="text"
                    name="pinCode"
                    value={formData.pinCode}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter PIN code"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {content.pinCodeExample}
                  </p>
                </div>
              </div>

              {/* Current Status and Maximum Qualification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {content.currentStatus}
                  </label>
                  <Combobox
                    options={statuses?.map((item) => ({
                      value: String(item.id),
                      label: item.current_status_name,
                    })) || []}
                    value={formData.currentStatus}
                    onValueChange={(value) => {
                      handleInputChange({ target: { name: 'currentStatus', value } } as any);
                    }}
                    placeholder={content.selectOption}
                    searchPlaceholder="Search..."
                    emptyText="No option found."
                    className="h-12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {content.maximumQualification}
                  </label>
                  <Combobox
                    options={qualifications?.map((item) => ({
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
                    className="h-12"
                  />
                </div>
              </div>

              {/* Conditional Graduation Fields */}
              {qualifications.find(q => String(q.id) === formData.maximumQualification)?.qualification_name.toLowerCase().includes('pursuing') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="h-12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="h-12"
                    />
                  </div>
                </div>
              )}

              {/* School Medium, Caste/Tribe, Religion */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="h-12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {content.casteTribe}
                  </label>
                  <Combobox
                    options={casts?.map((item) => ({
                      value: String(item.id),
                      label: item.cast_name,
                    })) || []}
                    value={formData.casteTribe}
                    onValueChange={(value) => {
                      handleInputChange({ target: { name: 'casteTribe', value } } as any);
                    }}
                    placeholder={content.selectOption}
                    searchPlaceholder="Search caste..."
                    emptyText="No caste found."
                    className="h-12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {content.religion}
                  </label>
                  <Combobox
                    options={religions?.map((religion) => ({
                      value: String(religion.id),
                      label: religion.religion_name,
                    })) || []}
                    value={formData.religion}
                    onValueChange={(value) => {
                      handleInputChange({ target: { name: 'religion', value } } as any);
                    }}
                    placeholder={content.selectReligion}
                    searchPlaceholder="Search religion..."
                    emptyText="No religion found."
                    className="h-12"
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-gray-600 mb-3">
                {content.selectSchoolDescription}
              </p>
              <button
                onClick={() => setIsLearningModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white student-btn rounded-xl shadow-lg hover:shadow-primary/20 active:scale-95 transition-all"
              >
                <PlayCircle className="w-4 h-4" />
                <span>{content.videoButtonText}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-onboarding="student-form-school-options">
              {schoolDetails.map((school) => {
                const isSelected = formData.initial_school_id === String(schools.find(s => s.school_name.includes(school.id))?.id);
                const isEligible = isSchoolEligible(school.id);
                const hasQualification = formData.maximumQualification;

                return (
                  <div
                    key={school.id}
                    data-onboarding="student-form-school-card"
                    className={`group border-2 rounded-2xl flex flex-col h-full transition-all relative overflow-hidden bg-white hover:border-primary/50 hover:shadow-xl ${isSelected ? "border-primary shadow-lg ring-1 ring-primary/20" :
                      isEligible && hasQualification ? "border-green-200" : "border-gray-100"
                      } ${!isEligible && hasQualification ? "opacity-75" : ""
                      }`}
                  >
                    {/* Interactive Overlay for Selection */}
                    <div
                      className={`absolute inset-0 z-0 ${!isEligible && hasQualification ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      onClick={() => {
                        if (!isEligible && hasQualification) return; // Disable click if not eligible
                        const matchedSchool = schools.find(s => s.school_name.includes(school.id));
                        if (matchedSchool) {
                          handleInputChange({ target: { name: 'initial_school_id', value: String(matchedSchool.id) } } as any);
                        }
                      }}
                    />

                    {/* Top Decoration */}
                    <div className={`h-2 w-full bg-gradient-to-r ${school.color === 'blue' ? 'from-blue-400 to-blue-600' :
                      school.color === 'emerald' ? 'from-emerald-400 to-emerald-600' :
                        school.color === 'amber' ? 'from-amber-400 to-amber-600' :
                          school.color === 'purple' ? 'from-purple-400 to-purple-600' :
                            school.color === 'rose' ? 'from-rose-400 to-rose-600' :
                              'from-indigo-400 to-indigo-600'
                      }`} />

                    <div className="p-7 flex flex-col h-full relative z-10">
                      <div className="flex justify-between items-start mb-5">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${school.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                          school.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                            school.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                              school.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                                school.color === 'rose' ? 'bg-rose-100 text-rose-700' :
                                  'bg-indigo-100 text-indigo-700'
                          }`}>
                          {school.tag}
                        </span>
                        {isSelected && (
                          <div className="bg-primary text-white rounded-full p-1 shadow-sm">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          </div>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-primary transition-colors">{school.name}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed mb-6 line-clamp-5">{school.description}</p>

                      <div className="mt-auto space-y-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSchoolInfo(school);
                          }}
                          className="text-primary text-sm font-bold flex items-center gap-1.5 hover:underline decoration-2 underline-offset-4"
                        >
                          {content.checkDetails}
                          <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </button>

                        <div className="grid grid-cols-1 gap-2 pt-2 border-t border-gray-100">
                          <div
                            className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newExpanded = new Set(expandedLocations);
                              if (newExpanded.has(school.id)) {
                                newExpanded.delete(school.id);
                              } else {
                                newExpanded.add(school.id);
                              }
                              setExpandedLocations(newExpanded);
                            }}
                          >
                            <span className="text-base">📍</span>
                            <span className="text-xs text-gray-600 font-medium">
                              {expandedLocations.has(school.id)
                                ? school.location
                                : (school.id !== 'BCA'
                                  ? content.variousCampuses
                                  : school.location
                                )
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-base">⏳</span>
                            <span className="text-xs text-gray-600 font-medium">{school.duration.split('(')[0].trim()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedSchoolInfo && <SchoolDetailCard school={selectedSchoolInfo} />}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-12">
          <button
            onClick={handlePrevious}
            className="px-8 py-3 bg-white border-2 border-purple-400 text-purple-600 rounded-2xl hover:bg-purple-50 transition-all font-bold min-w-[140px]"
          >
            {content.back}
          </button>
          <button
            onClick={handleSubmit}
            data-onboarding={currentStep === 1 ? "student-form-school-step" : "student-form-submit"}
            className={`px-6 py-3 rounded-2xl transition-all student-btn text-white font-bold min-w-[140px] shadow-lg hover:shadow-primary/20 active:scale-95`}
          >
            {currentStep === 1 ? content.nextStep : content.saveContinue}
          </button>
        </div>

        {/* Progress Display */}
        <div className="flex flex-col items-center mt-8">
          <div className="flex space-x-3 mb-3">
            <div className={`w-16 h-2 rounded-full transition-all duration-500 ${currentStep === 1 ? 'bg-primary shadow-sm shadow-primary/30' : 'bg-primary/20'}`}></div>
            <div className={`w-16 h-2 rounded-full transition-all duration-500 ${currentStep === 2 ? 'bg-primary shadow-sm shadow-primary/30' : 'bg-gray-100'}`}></div>
          </div>
          <span className="text-[10px] text-gray-400 font-bold tracking-[0.2em] uppercase">
            {content.phase} {currentStep} of 2
          </span>
        </div>
      </div>

      {/* Learning Round Modal */}
      <LearningRoundModal
        isOpen={isLearningModalOpen}
        onClose={() => setIsLearningModalOpen(false)}
        videoUrl="https://www.youtube.com/watch?v=8IbSWrh8DsY"
        title="Learning Round Overview"
        description="Watch this video to understand how the learning round works and what to expect."
      />
    </div >
  );
};

export default StudentForm;
