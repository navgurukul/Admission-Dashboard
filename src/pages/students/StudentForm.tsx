import React, { useState, useEffect, useCallback } from "react";
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
} from "@/utils/api";
import { detectHumanFace } from "@/utils/faceVerification";
import LogoutButton from "@/components/ui/LogoutButton";
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
  const [emailError, setEmailError] = useState("");
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
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Convert camelCase → snake_case before API call
  const mapFormDataToApi = (data: typeof formData) => {
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
      cast_id: Number(data.casteTribe) || null,
      religion_id: Number(data.religion) || null,
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
        title: "Error",
        description: "Failed to load states",
        variant: "destructive",
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
        title: "Error",
        description: "Failed to load districts",
        variant: "destructive",
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
        title: "Error",
        description: "Failed to load blocks",
        variant: "destructive",
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
      });

      // Verify if image contains human face
      const isFaceDetected = await detectHumanFace(file);

      if (!isFaceDetected) {
        // Show error toast
        toast({
          variant: "destructive",
          title: content.noFaceDetected || "No Face Detected",
          description:
            content.noFaceMessage ||
            "Please upload an image with a clear human face.",
        });
        // Clear the file input
        e.target.value = "";
        return;
      }

      // Face detected - upload the image
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
          title: content.faceVerified || "Face Verified",
          description:
            content.faceVerifiedMessage || "Image uploaded successfully!",
        });
      } catch (error) {
        console.error("Error uploading image:", error);
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description:
            error instanceof Error
              ? error.message
              : "Failed to upload image. Please try again.",
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
      age >= 16.5
    );
  };

  const handleSubmit = async () => {
    const age = getAge(formData.dateOfBirth);

    if (!formData.profileImage) {
      return toast({
        title: "Profile Image Required",
        description: "Please upload a profile image.",
        variant: "destructive",
      });
    }

    if (!formData.firstName) {
      return toast({
        title: "First Name Required",
        description: "Please enter your first name.",
        variant: "destructive",
      });
    }

    if (!formData.dateOfBirth || age < 16.5) {
      return toast({
        title: "Invalid Date of Birth",
        description: "You must be at least 16.5 years old.",
        variant: "destructive",
      });
    }

    if (!formData.whatsappNumber || !/^\d{10}$/.test(formData.whatsappNumber)) {
      return toast({
        title: "Invalid WhatsApp Number",
        description: "Enter a valid 10-digit WhatsApp number.",
        variant: "destructive",
      });
    }

    if (!formData.gender) {
      return toast({
        title: "Gender Required",
        description: "Please select your gender.",
        variant: "destructive",
      });
    }

    // Validate State and Pin Code (always required)
    if (!formData.stateCode || !formData.pinCode) {
      return toast({
        title: "Address Required",
        description: "Please fill State and Pin Code.",
        variant: "destructive",
      });
    }

    // Validate District (required only if districts are available)
    if (districts.length > 0 && !formData.districtCode) {
      return toast({
        title: "District Required",
        description: "Please select a district.",
        variant: "destructive",
      });
    }

    // Validate Block (required only if blocks are available)
    if (blocks.length > 0 && !formData.blockCode) {
      return toast({
        title: "Block Required",
        description: "Please select a block.",
        variant: "destructive",
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

    try {
      const apiPayload = mapFormDataToApi(formData);
      const studentFormResponseData = await createStudent(apiPayload);

      console.log("Student API Response:", studentFormResponseData);

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
        console.log("Student ID stored:", studentId);
      } else {
        console.warn("Student ID not found in response");
      }

      toast({
        title: "Student Created",
        description: "Your registration was successful!",
        variant: "default",
      });

      navigate("/students/test/start");
    } catch (error) {
      console.error("Error creating student:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong while creating student.";
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handlePrevious = () => {
    navigate("/students/details/instructions");
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
          faceVerifiedMessage: "प्रतिमा यशस्वीरित्या अपलोड केली!",
          loading: "लोड करत आहे...",
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
          state: "Select State *",
          district: "Select District",
          block: "Select Block",
          pinCode: "Pin Code *",
          currentStatus: "Current Status *",
          maximumQualification: "Maximum Qualification *",
          schoolMedium: "School Medium *",
          casteTribe: "Caste/Tribe *",
          religion: "Religion *",
          back: "Back",
          saveContinue: "Save & Continue",
          selectState: "Select State",
          selectDistrict: "Select District",
          selectBlock: "Select Block",
          selectOption: "Select Option",
          selectQualification: "Select Qualification",
          selectMedium: "Select Medium",
          selectReligion: "Select Religion",
          enterFirstName: "Enter first name",
          enterMiddleName: "Enter middle name",
          enterLastName: "Enter last name",
          enterWhatsapp: "Enter WhatsApp number",
          enterAlternate: "Enter alternate number",
          enterEmail: "Enter email address",
          cityExample: "Ex. Bangalore",
          pinCodeExample: "Ex. 4402xx",
          verifying: "Verifying...",
          verifyingMessage: "Please wait while we verify the image...",
          noFaceDetected: "No Face Detected",
          noFaceMessage: "Please upload an image with a clear human face.",
          faceVerified: "Face Verified",
          faceVerifiedMessage: "Image uploaded successfully!",
          loading: "Loading...",
        };
    }
  };

  const content = getContent();

  return (
    <div className="min-h-screen student-gradient flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <LogoutButton />
          <h1 className="text-3xl font-bold text-gray-800 mb-2 ">
            {content.signUp}
          </h1>
        </div>

        {/* Profile Image Upload */}
        <div className="text-center">
          <div className="w-24 h-24 mx-auto border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-gray-50 relative cursor-pointer hover:border-orange-400 transition-colors">
            {!imagePreview ? (
              <>
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mb-1">
                  <span className="text-white text-sm">📷</span>
                </div>
                <span className="text-xs text-gray-500">
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {content.gender}
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === "male"}
                  onChange={handleInputChange}
                  className="text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm">{content.male}</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === "female"}
                  onChange={handleInputChange}
                  className="text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm">{content.female}</span>
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder={content.enterWhatsapp}
              />
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder={content.enterAlternate}
              />
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
                className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  location.state?.googleEmail
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                }`}
                placeholder={content.enterEmail}
              />
              {emailError && (
                <p className="text-red-500 text-sm mt-1">{emailError}</p>
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
                {districts.length > 0 && <span className="text-red-500"> *</span>}
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
                    ? "Select state first"
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
                {blocks.length > 0 && <span className="text-red-500"> *</span>}
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
                    ? "Select district first"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter pin code"
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

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={handlePrevious}
            className="px-6 py-2 bg-gray-300 text-gray-500 rounded-lg hover:bg-gray-600 transition duration-200"
          >
            {content.back}
          </button>
          <button
            onClick={handleSubmit}
            // disabled={!isFormValid()}
            className={`px-6 py-2 rounded-lg transition duration-200 ${
              isFormValid()
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {content.saveContinue}
          </button>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center space-x-2 mt-6">
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default StudentForm;
