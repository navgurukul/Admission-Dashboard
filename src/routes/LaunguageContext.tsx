import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Language, LanguageContent } from '@/utils/student.types';

interface LanguageContextType {
  selectedLanguage: Language;
  setSelectedLanguage: (language: Language) => void;
  getLanguageContent: () => LanguageContent;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// export const useLanguage = (): LanguageContextType => {
//   const context = useContext(LanguageContext);
//   if (!context) {
//     throw new Error('useLanguage must be used within a LanguageProvider');
//   }
//   return context;
// };

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('english');

  const getLanguageContent = (): LanguageContent => {
    switch (selectedLanguage) {
      case "hindi":
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
          alreadyMember: "पहले से सदस्य हैं?",
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
      case "marathi":
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
          alreadyMember: "आधीपासून सदस्य आहात?",
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
          alreadyMember: "Already a Member?",
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

  return (
    <LanguageContext.Provider value={{
      selectedLanguage,
      setSelectedLanguage,
      getLanguageContent
    }}>
      {children}
    </LanguageContext.Provider>
  );
};
