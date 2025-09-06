import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/routes/LaunguageContext.tsx";
import { useToast } from "@/hooks/use-toast";
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

} from "@/utils/api";


const StudentForm: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { selectedLanguage } = useLanguage();
  const [casts, setCasts] = useState<Cast[]>([]);
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [statuses, setStatuses] = useState<CurrentStatus[]>([]);
  const [religions, setReligions] = useState<Religion[]>([]);
  

  const [formData, setFormData] = useState({
    profileImage: null as File | null,
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    whatsappNumber: "",
    alternateNumber: "",
    email: "",
    gender: "",
    state: "",
    district: "",
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
    image_url: data.profileImage  || null,
    first_name: data.firstName,
    middle_name: data.middleName,
    last_name: data.lastName,
    dob: data.dateOfBirth,
    whatsapp_number: data.whatsappNumber,
    phone_number: data.alternateNumber,
    email: data.email,
    gender: data.gender,
    state: data.state,
    district: data.district,
    city: data.city,
    pin_code: data.pinCode,
    school_medium: data.schoolMedium,
    current_status_id: Number(data.currentStatus) || null,
    qualification_id: Number(data.maximumQualification) || null,
    cast_id: Number(data.casteTribe) || null,
    religion_id: Number(data.religion) || null,
  };
};


  useEffect(() => {
    const savedFormData = localStorage.getItem("studentFormData");
    if (savedFormData) {
      setFormData(JSON.parse(savedFormData));
    }
    const fetchCasts = async () => {
      try {
        const response = await getAllCasts();
        setCasts(response);
      } catch (error) {
        console.error("Error fetching casts:", error);
      }
    };
    fetchCasts();

    // Fetch qualifications
    const fetchQualifications = async () => {
      try {
        const response = await getAllQualification();
        setQualifications(response);
      } catch (error) {
        console.error("Error fetching qualifications:", error);
      }
    };
    fetchQualifications();
    // fetch statuses
    const fetchStatuses = async () => {
      try {
        const response = await getAllStatus(); // returns CurrentStatus[]
        setStatuses(response);
      } catch (error) {
        console.error("Error fetching current statuses:", error);
      }
    };
    fetchStatuses();

    // fetch religions
    const fetchReligions = async () => {
      try {
        const response = await getAllReligions(); // returns Religion[]
        setReligions(response);
      } catch (error) {
        console.error("Error fetching religions:", error);
      }
    };
    fetchReligions();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    console.log(name,value)
    const newFormData = {
      ...formData,
      [name]: value,
    };
    setFormData(newFormData);
    localStorage.setItem("studentFormData", JSON.stringify(newFormData));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newFormData = {
        ...formData,
        profileImage: file,
      };
      setFormData(newFormData);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const isFormValid = () => {
    return (
      formData.firstName &&
      formData.dateOfBirth &&
      formData.whatsappNumber &&
      formData.gender &&
      formData.state &&
      formData.district &&
      formData.city &&
      formData.pinCode &&
      formData.currentStatus &&
      formData.maximumQualification &&
      formData.schoolMedium &&
      formData.casteTribe &&
      formData.religion
    );
  };

  const handleSubmit = async () => {
  if (!isFormValid()) {
    alert("Please fill all required fields");
    return;
  }

  try {
    const apiPayload = mapFormDataToApi(formData);
    console.log("API Payload:", apiPayload);

    const response = await createStudent(apiPayload);
    console.log("Create Student Response:", response);

    localStorage.setItem("studentFormData", JSON.stringify(formData));
    navigate("/students/test-start");
  } catch (error: any) {
    console.error("Error creating student:", error);
    alert(error.message || "Failed to create student");
  }
};


  const handlePrevious = () => {
    navigate("/students/instructions");
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
          district: "जिला चुनें *",
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
          district: "जिल्हा निवडा *",
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
          district: "Select District *",
          city: "City *",
          pinCode: "Pin Code *",
          currentStatus: "Current Status *",
          maximumQualification: "Maximum Qualification *",
          schoolMedium: "School Medium *",
          casteTribe: "Caste/Tribe *",
          religion: "Religion *",
          back: "Back",
          saveContinue: "Save & Continue",
          selectState: "Select State",
          enterDistrict: "Select District",
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
        };
    }
  };

  const content = getContent();

  //   const content = getContent();
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-6">
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
                className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                📅
              </span>
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
                {content.email}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder={content.enterEmail}
              />
            </div>
          </div>
        </div>

        {/* Additional Fields */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Additional Information
          </h3>

          {/* State and District */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {content.state}
              </label>
              <div className="relative">
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">{content.selectState}</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Gujarat">Gujarat</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {content.district}
              </label>
              <div className="relative">
                {/* <select
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">{content.selectDistrict}</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Pune">Pune</option>
                  <option value="Nagpur">Nagpur</option>
                  <option value="Thane">Thane</option>
                </select> */}
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder={content.enterDistrict}
                />
              </div>
            </div>
          </div>

          {/* City and Pin Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {content.city}
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter city"
              />
              <p className="text-xs text-gray-500 mt-1">
                {content.cityExample}
              </p>
            </div>
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
              <div className="relative">
                <select
                  name="currentStatus"
                  value={formData.currentStatus}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">{content.selectOption}</option>
                  {statuses.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.current_status_name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {content.maximumQualification}
              </label>
              <div className="relative">
                <select
                  name="maximumQualification"
                  value={formData.maximumQualification}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">{content.selectQualification}</option>
                  {qualifications.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.qualification_name}
                    </option>
                  ))}
                </select>

                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* School Medium, Caste/Tribe, Religion */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {content.schoolMedium}
              </label>
              <div className="relative">
                <select
                  name="schoolMedium"
                  value={formData.schoolMedium}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Marathi">Marathi</option>
                  <option value="Other">Other</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {content.casteTribe}
              </label>
              <div className="relative">
                <select
                  name="casteTribe"
                  value={formData.casteTribe} // this will store numeric id
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">{content.selectOption}</option>

                  {casts.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.cast_name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {content.religion}
              </label>
              <div className="relative">
              
                <select
                  name="religion"
                  value={formData.religion}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">{content.selectReligion}</option>
                  {religions.map((religion) => (
                    <option key={religion.id} value={religion.id}>
                      {religion.religion_name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
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
            disabled={!isFormValid()}
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
