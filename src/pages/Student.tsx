import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentForm from "../components/StudentForm"
import StudentLandingPage from "../pages/StudentLandingPage";
import { useLanguage } from "../context/LanguageContext";
import InterviewSlotBooking from "../pages/Student/InterviewSlotBooking";
import ScreeningRoundStartPage from "../pages/Student/ScreeningRoundStartPage";
import ScreeningResultPage from "../pages/Student/ScreeningResultPage";
import InterviewSlotPage from "../pages/Student/InterviewSlotPage";
import TestPage from "../pages/Student/TestPage";
import StudentResult from "../pages/Student/StudentResult";


// import StudentL


const Student = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const { language,setLanguage } = useLanguage();
  const [formData, setFormData] = useState({
    profileImage: null,
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
    religion: ""
  });
  const [imagePreview, setImagePreview] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        profileImage: file
      }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    console.log("Form data:", formData);
  };

  const isFormValid = () => {
    return formData.firstName && 
           formData.lastName && 
           formData.dateOfBirth && 
           formData.whatsappNumber && 
           formData.email && 
           formData.gender &&
           formData.state &&
           formData.district &&
           formData.city &&
           formData.pinCode &&
           formData.currentStatus &&
           formData.maximumQualification &&
           formData.schoolMedium &&
           formData.casteTribe &&
           formData.religion;
  };

  const handleBackToHome = () => {
    localStorage.removeItem('googleUser');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('roleAccess');
    localStorage.removeItem('privileges');
    navigate("/auth");
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Language-specific content
  const getLanguageContent = () => {
    switch (language) {
      case "Hindi":
        return {
          title: "NavGurukul Entrance Test",
          subtitle: "अपनी भाषा चुनें",
          chooseLanguage: "अपनी भाषा चुनें",
          letsGoAhead: "आगे बढ़ते हैं",
          instructionsIntro: "परीक्षा शुरू करने से पहले कृपया निम्नलिखित महत्वपूर्ण निर्देश पढ़ें। परीक्षा देते समय ये निर्देश काम आएंगे",
          instructions: [
            "पूरी परीक्षा 1 घंटे की होगी। कृपया किसी शांत स्थान पर परीक्षा दें, जहां आप बिना किसी व्यवधान के प्रश्नों का उत्तर दे सकें।",
            "परीक्षा देते समय एक नोटबुक और एक पेन अपने पास रखें। आप किसी भी रफ नोटबुक का उपयोग कर सकते हैं।",
            "परीक्षा देते समय प्रत्येक प्रश्न का उत्तर अपने फोन पर ही दें।",
            "आपको परीक्षा में नकल करने का मौका मिल सकता है, लेकिन हमें विश्वास है कि आप नकल नहीं करेंगे।"
          ],
          imReady: "मैं तैयार हूँ",
          back: "वापस",
          next: "आगे",
          signUp: "साइन अप करें",
          basicDetails: "बुनियादी विवरण",
          contactDetails: "संपर्क विवरण",
          verification: "सत्यापन",
          signIn: "साइन इन करें",
          firstName: "पहला नाम *",
          middleName: "मध्य नाम",
          lastName: "अंतिम नाम *",
          dateOfBirth: "जन्म तिथि *",
          gender: "लिंग *",
          male: "पुरुष",
          female: "महिला",
          whatsappNumber: "व्हाट्सऐप नंबर *",
          alternateNumber: "वैकल्पिक नंबर",
          email: "ईमेल पता *",
          contactInfo: "संपर्क जानकारी",
          addPhoto: "फोटो जोड़ें",
          enterFirstName: "पहला नाम दर्ज करें",
          enterMiddleName: "मध्य नाम दर्ज करें",
          enterLastName: "अंतिम नाम दर्ज करें",
          enterWhatsapp: "व्हाट्सऐप नंबर दर्ज करें",
          enterAlternate: "वैकल्पिक नंबर दर्ज करें",
          enterEmail: "ईमेल पता दर्ज करें",
          saveContinue: "सहेजें और जारी रखें",
          // Additional fields
          state: "राज्य चुनें *",
          district: "जिला चुनें *",
          city: "शहर *",
          pinCode: "पिन कोड *",
          currentStatus: "वर्तमान स्थिति *",
          maximumQualification: "अधिकतम योग्यता *",
          schoolMedium: "स्कूल माध्यम *",
          casteTribe: "जाति/जनजाति *",
          religion: "धर्म *",
          selectState: "राज्य चुनें",
          selectDistrict: "जिला चुनें",
          selectOption: "विकल्प चुनें",
          selectQualification: "योग्यता चुनें",
          selectMedium: "माध्यम चुनें",
          selectReligion: "धर्म चुनें",
          cityExample: "उदा. मुंबई",
          pinCodeExample: "उदा. 400001"
        };
      case "Marathi":
        return {
          title: "NavGurukul Entrance Test",
          subtitle: "तुमची भाषा निवडा",
          chooseLanguage: "तुमची भाषा निवडा",
          letsGoAhead: "पुढे जाऊया",
          instructionsIntro: "परीक्षा सुरू करण्यापूर्वी कृपया खालील महत्वाचे निर्देश वाचा. परीक्षा देताना हे निर्देश उपयोगी पडतील",
          instructions: [
            "संपूर्ण चाचणी 1 तासाची असेल. कृपया शांत ठिकाणी चाचणी द्या, जिथे तुम्ही कोणत्याही व्यत्ययाशिवाय प्रश्नांची उत्तरे देऊ शकता.",
            "परीक्षा देताना एक वही आणि पेन सोबत ठेवा. तुम्ही कोणतीही रफ नोटबुक वापरू शकता.",
            "परीक्षा देताना प्रत्येक प्रश्नाचे उत्तर तुमच्या फोनवरच द्या.",
            "तुम्हाला परीक्षेत फसवणूक करण्याची संधी मिळू शकते, परंतु आम्हाला विश्वास आहे की तुम्ही असे कोणतेही काम करणार नाही."
          ],
          imReady: "मी तयार आहे",
          back: "मागे",
          next: "पुढे",
          signUp: "साइन अप करा",
          basicDetails: "मूलभूत तपशील",
          contactDetails: "संपर्क तपशील",
          verification: "पडताळणी",
          signIn: "साइन इन करा",
          firstName: "पहिले नाव *",
          middleName: "मध्यम नाव",
          lastName: "आडनाव *",
          dateOfBirth: "जन्म तारीख *",
          gender: "लिंग *",
          male: "पुरुष",
          female: "स्त्री",
          whatsappNumber: "व्हाट्सअॅप नंबर *",
          alternateNumber: "पर्यायी नंबर",
          email: "ईमेल पत्ता *",
          contactInfo: "संपर्क माहिती",
          addPhoto: "फोटो जोडा",
          enterFirstName: "पहिले नाव प्रविष्ट करा",
          enterMiddleName: "मध्यम नाव प्रविष्ट करा",
          enterLastName: "आडनाव प्रविष्ट करा",
          enterWhatsapp: "व्हाट्सअॅप नंबर प्रविष्ट करा",
          enterAlternate: "पर्यायी नंबर प्रविष्ट करा",
          enterEmail: "ईमेल पत्ता प्रविष्ट करा",
          saveContinue: "जतन करा आणि सुरू ठेवा",
          // Additional fields
          state: "राज्य निवडा *",
          district: "जिल्हा निवडा *",
          city: "शहर *",
          pinCode: "पिन कोड *",
          currentStatus: "सध्याची स्थिती *",
          maximumQualification: "कमाल पात्रता *",
          schoolMedium: "शाळेचे माध्यम *",
          casteTribe: "जात/आदिवासी *",
          religion: "धर्म *",
          selectState: "राज्य निवडा",
          selectDistrict: "जिल्हा निवडा",
          selectOption: "पर्याय निवडा",
          selectQualification: "पात्रता निवडा",
          selectMedium: "माध्यम निवडा",
          selectReligion: "धर्म निवडा",
          cityExample: "उदा. पुणे",
          pinCodeExample: "उदा. 411001"
        };
      default: // English
        return {
          title: "NavGurukul Entrance Test",
          subtitle: "Select Your Language",
          chooseLanguage: "Choose your language",
          letsGoAhead: "LET'S GO AHEAD",
          instructionsIntro: "Please read the following important instructions before starting the test. These instruction will come in handy while giving the test.",
          instructions: [
            "The complete test will be of 1 hour. Please give the test in a quiet place, where you can answer the questions without any disruptions.",
            "While giving the test, keep a notebook and a pen with you. You can use any rough notebook.",
            "While giving the test, answer each question on your phone itself.",
            "You may get the chance of cheating exam, but we believe that you will not cheat."
          ],
          imReady: "I'M READY",
          back: "BACK",
          next: "NEXT",
          signUp: "Sign up",
          basicDetails: "Basic Details",
          contactDetails: "Contact Details",
          verification: "Verification",
          signIn: "Sign In",
          firstName: "First Name *",
          middleName: "Middle Name",
          lastName: "Last Name *",
          dateOfBirth: "Date of Birth *",
          gender: "Gender *",
          male: "Male",
          female: "Female",
          whatsappNumber: "WhatsApp Number *",
          alternateNumber: "Alternate Number",
          email: "Email Address *",
          contactInfo: "Contact Information",
          addPhoto: "Add Photo",
          enterFirstName: "Enter first name",
          enterMiddleName: "Enter middle name",
          enterLastName: "Enter last name",
          enterWhatsapp: "Enter WhatsApp number",
          enterAlternate: "Enter alternate number",
          enterEmail: "Enter email address",
          saveContinue: "Save & Continue",
          // Additional fields
          state: "Select State *",
          district: "Select District *",
          city: "City *",
          pinCode: "Pin Code *",
          currentStatus: "Current Status *",
          maximumQualification: "Maximum Qualification *",
          schoolMedium: "School Medium *",
          casteTribe: "Caste/Tribe *",
          religion: "Religion *",
          selectState: "Select State",
          selectDistrict: "Select District",
          selectOption: "Select Option",
          selectQualification: "Maximum Qualification",
          selectMedium: "School Medium",
          selectReligion: "Religion",
          cityExample: "Ex. Bangalore",
          pinCodeExample: "Ex. 4402xx"
        };
    }
  };

  const content = getLanguageContent();

  // Step 1: Language Selection
  // const LanguageSelection = () => (
  //   <div className="min-h-screen bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center p-4">
  //     <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
  //       <h1 className="text-3xl font-bold text-gray-800 mb-2">{content.title}</h1>
  //       <p className="text-gray-600 mb-8">{content.subtitle}</p>
        
  //       <div className="mb-8">
  //         <label className="block text-left text-gray-700 font-medium mb-2">{content.chooseLanguage}</label>
  //         <div className="relative">
  //           <select
  //             value={selectedLanguage}
  //             onChange={(e) => setSelectedLanguage(e.target.value)}
  //             className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
  //           >
  //             <option value="English">English</option>
  //             <option value="Hindi">हिंदी</option>
  //             <option value="Marathi">मराठी</option>
  //             <option value="Gujarati">ગુજરાતી</option>
  //           </select>
  //           <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
  //             <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  //             </svg>
  //           </div>
  //         </div>
  //       </div>

  //       <button
  //         onClick={nextStep}
  //         className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
  //       >
  //         {content.letsGoAhead}
  //       </button>

  //       {/* Progress Dots */}
  //       <div className="flex justify-center space-x-2 mt-8">
  //         <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
  //         <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
  //         <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
  //       </div>

  //       {/* Navigation */}
  //       <div className="flex justify-between mt-6">
  //         <button
  //           onClick={handleBackToHome}
  //           className="text-gray-600 hover:text-gray-800 flex items-center"
  //         >
  //           <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  //           </svg>
  //           {content.back}
  //         </button>
  //         <button
  //           onClick={nextStep}
  //           className="text-orange-500 hover:text-orange-600 flex items-center"
  //         >
  //           {content.next}
  //           <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  //           </svg>
  //         </button>
  //       </div>
  //     </div>
  //   </div>
  // );

  // Step 2: Instructions
  const Instructions = () => (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-4">{content.title}</h1>
        
        <p className="text-gray-600 text-center mb-8">
          {content.instructionsIntro}
        </p>

        <div className="space-y-4 mb-8">
          {content.instructions.map((instruction, index) => (
            <div key={index} className="flex items-start space-x-3">
              <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                {index + 1}
              </span>
              <p className="text-gray-700">
                {instruction}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={nextStep}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
          >
            {content.imReady}
          </button>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center space-x-2 mt-8">
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={prevStep}
            className="text-gray-600 hover:text-gray-800 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {content.back}
          </button>
          <button
            onClick={nextStep}
            className="text-orange-500 hover:text-orange-600 flex items-center"
          >
            {content.next}
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  // Render current step
  switch (currentStep) {
    case 1:
      // return <StudentLandingPage onNext={nextStep} />;
      // return <ScreeningResultPage />;
      // return <InterviewSlotPage />
      // return <TestPage />;
      // return<StudentResult />
      return <ScreeningRoundStartPage/>
    case 2:
      return <Instructions />;
    case 3:
      return <StudentForm
      content={content}
      formData={formData}
      handleInputChange={handleInputChange}
      handleImageChange={handleImageChange}
      imagePreview={imagePreview}
      prevStep={prevStep}
      handleSubmit={handleSubmit}
      isFormValid={isFormValid}
/>;
    default:
      return <StudentLandingPage onNext={nextStep} />;
  }
};

export default Student;
// components/routes


