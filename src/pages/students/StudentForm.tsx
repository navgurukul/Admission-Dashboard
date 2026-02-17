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
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const schoolDetails = [
    {
      id: "SOP",
      name: "School of Programming (SOP)",
      tag: "Software Development",
      color: "blue",
      description: "A flagship residency program focused on software development. Learn HTML, CSS, React, Node.js, and build a tech career.",
      duration: "12-18 months",
      location: "Various Campuses (Dantewada, Raipur, Bengaluru, etc.)",
      eligibility: [
        "Typically 18-28 years old",
        "Youth from underserved backgrounds",
        "High logical potential (no degree required)",
        "Willingness to commit to a long-term residential program"
      ],
      curriculum: [
        "Foundational Programming & Logic",
        "Frontend: HTML/CSS, Javascript, React.js",
        "Backend: Node.js, Databases, Express",
        "Version Control: Git/GitHub",
        "Professional Skills: English, Workplace Ethics"
      ],
      outcomes: [
        "Software Engineering roles",
        "Full Stack Development",
        "Entry-level Tech positions",
        "Career mobility in the technology sector"
      ]
    },
    {
      id: "SOB",
      name: "School of Business (SOB)",
      tag: "Operations & Marketing",
      color: "emerald",
      description: "Prepare for entry-level and growth-oriented roles in business operations, digital marketing, and organizational support.",
      duration: "6-12 months",
      location: "Pune, Bengaluru, Jashpur, Dantewada",
      eligibility: [
        "Minimum 16 years old",
        "First-generation learners preferred",
        "No formal qualification required",
        "Strong reliability and communication potential"
      ],
      curriculum: [
        "Business Operations: SOP execution & Reporting",
        "Digital Marketing: SEO, Social Media, Copywriting",
        "Customer Operations: Stakeholder coordination",
        "Professional Skills: Email etiquette, Time management",
        "Direct interaction with startups & NGOs"
      ],
      outcomes: [
        "Marketing Associate",
        "Operations Executive",
        "Customer Support Specialist",
        "Business Development roles"
      ]
    },
    {
      id: "SOF",
      name: "School of Finance (SOF)",
      tag: "Accounting & Taxation",
      color: "amber",
      description: "Job-oriented alternative to commerce degrees focusing on practical accounting, finance operations, and taxation.",
      duration: "6-12 months",
      location: "Pune, Maharashtra",
      eligibility: [
        "Minimum 16 years old",
        "Youth from disadvantaged backgrounds",
        "Interest in finance/accounting",
        "Basic numeracy and reliability"
      ],
      curriculum: [
        "Practical Accounting Principles",
        "Statutory Compliance: GST, Income Tax basics",
        "Payroll Management",
        "Tools: Tally, Microsoft Excel (Advanced)",
        "Financial Reporting & Workflow"
      ],
      outcomes: [
        "Accounts Executive",
        "Tax Associate",
        "Finance Operations Specialist",
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
      description: "Formal Degree-linked residential program in partnership with Eternal University for job-readiness.",
      duration: "3 years",
      location: "Residential (Partner Campus)",
      eligibility: [
        "12th Pass (eligible for University admission)",
        "Economically disadvantaged backgrounds",
        "First-generation college students",
        "Strong intent for technical higher education"
      ],
      curriculum: [
        "Formal BCA Program (Eternal University)",
        "NavGurukul Soft-skills Training",
        "Applied Programming & Development",
        "Project-based Learning Curriculum",
        "Internship & Placement Readiness"
      ],
      outcomes: [
        "Recognized BCA Degree",
        "Enterprise Software Roles",
        "Job readiness in IT industry",
        "Higher education pathways"
      ]
    }
  ];

  // Helper component for details
  const SchoolDetailCard = ({ school }: { school: any }) => (
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

            <div className="mt-8 p-4 bg-gray-50 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">{content.duration}</span>
                <span className="font-bold text-gray-800">{school.duration}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">{content.location}</span>
                <span className="font-bold text-gray-800">{school.location}</span>
              </div>
            </div>

            <button
              onClick={() => {
                const matchedSchool = schools.find(s => s.school_name.includes(school.id));
                if (matchedSchool) {
                  handleInputChange({ target: { name: 'initial_school_id', value: String(matchedSchool.id) } } as any);
                  setSelectedSchoolInfo(null);
                }
              }}
              className="w-full mt-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg active:scale-95"
            >
              {content.applyToSchool}
            </button>
          </section>
        </div>
      </div>
    </div>
  );

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
      state: data.state, // Send NAME (e.g., "Telangana")
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
      if (processedValue && processedValue.length !== 10) {
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
      if (!validateEmail(processedValue)) {
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

    return (
      formData.profileImage &&
      formData.firstName &&
      formData.dateOfBirth &&
      formData.whatsappNumber &&
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
      (currentStep === 2 ? formData.initial_school_id : true) &&
      age >= 16.5
    );
  };

  const handleSubmit = async () => {
    const age = getAge(formData.dateOfBirth);

    if (!formData.profileImage) {
      return toast({
        title: "⚠️ Profile Image Required",
        description: "Please upload a profile image.",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900"
      });
    }

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

    if (!formData.whatsappNumber || !/^\d{10}$/.test(formData.whatsappNumber)) {
      return toast({
        title: "⚠️ Invalid WhatsApp Number",
        description: "Enter a valid 10-digit WhatsApp number.",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900"
      });
    }

    if (formData.alternateNumber && !/^\d{10}$/.test(formData.alternateNumber)) {
      return toast({
        title: "⚠️ Invalid Alternate Number",
        description: "Enter a valid 10-digit alternate number or leave it empty.",
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
          whatsappNumber: "व्हाट्सऐप नंबर *",
          alternateNumber: "वैकल्पिक नंबर",
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
          enterAlternate: "वैकल्पिक नंबर दर्ज करें",
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
          applyToSchool: "इस स्कूल के लिए आवेदन करें",
          nextStep: "अगला कदम",
          phase: "चरण",
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
          whatsappNumber: "व्हाट्सअॅप नंबर *",
          alternateNumber: "पर्यायी नंबर",
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
          enterAlternate: "पर्यायी नंबर प्रविष्ट करा",
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
          applyToSchool: "या शाळेसाठी अर्ज करा",
          nextStep: "पुढील पायरी",
          phase: "टप्पा",
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
          whatsappNumber: "WhatsApp Number *",
          alternateNumber: "Alternate Number",
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
          enterAlternate: "Enter Alternate Number",
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
          applyToSchool: "Apply to this School",
          nextStep: "Next Step",
          phase: "Phase",
        };
    }
  };

  const content = getContent();

  return (
    <div className="min-h-screen student-bg-gradient flex items-center justify-center p-4">
      <div ref={scrollContainerRef} className="bg-card rounded-2xl shadow-large p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <LanguageSelector />
          <LogoutButton />
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
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
            <div className="mb-6">
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
                    {content.alternateNumber}
                  </label>
                  <input
                    type="tel"
                    name="alternateNumber"
                    maxLength={10}
                    pattern="[0-9]{10}"
                    value={formData.alternateNumber}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={content.enterAlternate}
                  />
                  {alternateError && (
                    <p className="text-destructive text-sm mt-1">{alternateError}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {content.email} *
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
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Additional Information
              </h3>

              {/* State, District and Block */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                <span>Watch Learning Round Overview</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {schoolDetails.map((school) => {
                const isSelected = formData.initial_school_id === String(schools.find(s => s.school_name.includes(school.id))?.id);
                return (
                  <div
                    key={school.id}
                    className={`group border-2 rounded-2xl flex flex-col h-full transition-all relative overflow-hidden bg-white hover:border-primary/50 hover:shadow-xl ${isSelected ? "border-primary shadow-lg ring-1 ring-primary/20" : "border-gray-100"
                      }`}
                  >
                    {/* Interactive Overlay for Selection */}
                    <div
                      className="absolute inset-0 z-0 cursor-pointer"
                      onClick={() => {
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

                    <div className="p-6 flex flex-col h-full relative z-10">
                      <div className="flex justify-between items-start mb-4">
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
                      <p className="text-sm text-gray-600 leading-relaxed mb-6 line-clamp-3">{school.description}</p>

                      <div className="mt-auto space-y-4">
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

                        <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium">
                          <span className="flex items-center gap-1">📍 {school.location.split(',')[0]}</span>
                          <span className="flex items-center gap-1">⏳ {school.duration}</span>
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
            className="px-8 py-3 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-200 transition-all font-bold min-w-[140px]"
          >
            {content.back}
          </button>
          <button
            onClick={handleSubmit}
            className={`px-10 py-3 rounded-2xl transition-all student-btn text-white font-bold min-w-[180px] shadow-lg hover:shadow-primary/20 active:scale-95`}
          >
            {currentStep === 1 ? content.nextStep : content.saveContinue}
          </button>
        </div>

        {/* Progress Display */}
        <div className="flex flex-col items-center mt-12">
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
