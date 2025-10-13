import React, { useState, useEffect } from "react";
import { useLanguage } from "../routes/LaunguageContext";
import { useNavigate } from "react-router-dom";


const slides = [
  {
    id: 1,
    image: "https://img.youtube.com/vi/NC2ymm6Sots/maxresdefault.jpg",
    videoUrl: "https://youtu.be/NC2ymm6Sots",
    englishCaption: "Interview of Abhishek, Co-founder of Navgurukul",
    hindiCaption: "अभिषेक, नवगुरुकुल के सह-संस्थापक का साक्षात्कार",
    marathiCaption: "अभिषेक, नवगुरुकुलचे सह-संस्थापक यांचे मुलाखत",
  },
  {
    id: 2,
    image: "https://img.youtube.com/vi/vuSwndj5cbs/maxresdefault.jpg",
    videoUrl:
      "https://www.youtube.com/watch?time_continue=1&v=vuSwndj5cbs&embeds_referring_euri=https%3A%2F%2Fdev-admissions.navgurukul.org%2F&embeds_referring_origin=https%3A%2F%2Fdev-admissions.navgurukul.org&source_ve_path=Mjg2NjQsMjg2NjY",
    englishCaption: "Experience of Navgurukul Alumni & Graduates",
    hindiCaption: "नवगुरुकुल के पूर्व छात्रों और स्नातकों का अनुभव",
    marathiCaption: "नवगुरुकुलच्या माजी विद्यार्थ्यांचा अनुभव",
  },
  {
    id: 3,
    image: "https://img.youtube.com/vi/sfU1m8MuZ5Y/maxresdefault.jpg",
    videoUrl:
      "https://www.youtube.com/watch?v=HjqfZ-Matyk&ab_channel=NavGurukul",
    englishCaption: "Detailed explanation about Navgurukul",
    hindiCaption: "नवगुरुकुल के बारे में विस्तृत जानकारी",
    marathiCaption: "नवगुरुकुलबद्दल सविस्तर माहिती",
  },
  {
    id: 4,
    image: "https://img.youtube.com/vi/HjqfZ-Matyk/maxresdefault.jpg",
    videoUrl:
      "https://www.youtube.com/watch?v=HjqfZ-Matyk&ab_channel=NavGurukul",
    englishCaption: "2 mins introduction to NavGurukul",
    hindiCaption: "नवगुरुकुल का 2 मिनट का परिचय",
    marathiCaption: "नवगुरुकुलचा 2 मिनिटांचा परिचय",
  },
];

const content = {
  english: {
    heading: "Software Engineering Scholarship",
    title: "Navgurukul",
    subtitle: "Welcome to",
    description:
      "Learn coding, problem-solving, and critical thinking in a thriving community of learners. Take the scholarship test today and begin your journey towards becoming a software engineer.",
    buttonText: "Get Started",
    footerText: "For more queries, email at",
    footerContact: "hi@navgurukul.org",
    imageUrl: "https://admissions.navgurukul.org/assets/logo.71054d69.png",
  },
  hindi: {
    heading: "सॉफ्टवेयर इंजीनियरिंग छात्रवृत्ति",
    title: "नवगुरुकुल",
    subtitle: "में आपका स्वागत है",
    description:
      "एक समृद्ध शिक्षार्थी समुदाय में कोडिंग, समस्या-समाधान, और आलोचनात्मक सोच सीखें। आज ही छात्रवृत्ति परीक्षा दें और सॉफ्टवेयर इंजीनियर बनने की अपनी यात्रा शुरू करें।",
    buttonText: "शुरू करें",
    footerText: "अधिक जानकारी के लिए ईमेल करें:",
    footerContact: "hi@navgurukul.org",
    imageUrl: "https://admissions.navgurukul.org/assets/logo.71054d69.png",
  },
  marathi: {
    heading: "सॉफ्टवेअर अभियांत्रिकी शिष्यवृत्ती",
    title: "नवगुरुकुल",
    subtitle: "मध्ये आपले स्वागत आहे",
    description:
      "कोडिंग, समस्या सोडवणे, आणि विचारशक्ती विकसित करणे यामध्ये एक समृद्ध समुदायात शिकणे. आजच शिष्यवृत्ती चाचणी द्या आणि सॉफ्टवेअर अभियंता बनण्याच्या आपल्या प्रवासाची सुरूवात करा.",
    buttonText: "सुरू करा",
    footerText: "अधिक प्रश्नांसाठी, ईमेल करा:",
    footerContact: "hi@navgurukul.org",
    imageUrl: "https://admissions.navgurukul.org/assets/logo.71054d69.png",
  },
};
const StudentLandingPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { selectedLanguage, setSelectedLanguage } = useLanguage(); 
  const navigate = useNavigate();

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, []);

  // Load saved language
  useEffect(() => {
    const savedLang = localStorage.getItem("selectedLanguage");
    if (savedLang) {
  setSelectedLanguage(savedLang);
}
  }, [setSelectedLanguage]);



  // Save language on change
  useEffect(() => {
    if (selectedLanguage) {
      localStorage.setItem("selectedLanguage", selectedLanguage);
    }
  }, [selectedLanguage]);

  const handleNavigation = () => {
  const studentId = localStorage.getItem("studentId");
  const testStarted = localStorage.getItem("testStarted") === "true";
  const testCompleted = localStorage.getItem("testCompleted") === "true";
  const allowRetest = localStorage.getItem("allowRetest") === "true";

  // Case 1: Not logged in
  if (!studentId) {
    navigate("/students/login");
    return;
  }

  // Case 2: Test already completed and retest not allowed
  if (testCompleted && !allowRetest) {
    navigate("/students/final-result");
    return;
  }

  // Case 3: Test in progress or retest allowed
  if (testStarted || allowRetest) {
    navigate("/students/test/start");
    return;
  }

  // Case 4: Logged in but not started
  navigate("/students/details/instructions");
};



  return (
    <div className="min-h-screen flex flex-col">
      {/* ---- Top Navbar ---- */}
      <header className="flex justify-between items-center px-6 py-4 shadow">
        <div className="flex items-center space-x-2">
          <img
            src={content[selectedLanguage].imageUrl}
            alt="NavGurukul Logo"
            className="h-10"
          />
        </div>

        <div className="flex items-center space-x-4">
         <select
  value={selectedLanguage}
  onChange={(e) => setSelectedLanguage(e.target.value)} // no `as any`
  className="border rounded px-3 py-1 text-gray-700"
>
  <option value="english">English</option>
  <option value="marathi">Marathi</option>
  <option value="hindi">Hindi</option>
</select>

        </div>
      </header>

      {/* ---- Main Content ---- */}
      <main className="flex flex-col items-center flex-1 px-6 py-12">
        <h1 className="text-2xl md:text-3xl font-semibold mb-8 text-center">
          {content[selectedLanguage].heading}
        </h1>

        <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-12 w-full max-w-6xl">
          <div className="flex justify-center px-8 md:px-10">
            <div className="relative w-full overflow-hidden rounded-lg shadow-2xl">
              <a
                href={slides[currentSlide].videoUrl}
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src={slides[currentSlide].image}
                  alt={
                    selectedLanguage === "english"
                      ? slides[currentSlide].englishCaption
                      : selectedLanguage === "hindi"
                      ? slides[currentSlide].hindiCaption
                      : slides[currentSlide].marathiCaption
                  }
                  className="w-full h-60 object-cover"
                />
              </a>

              {/* Caption */}
              <div className="absolute bottom-0 left-0 right-0  bg-opacity-50 text-white text-center py-3 text-base">
                {selectedLanguage === "english"
                  ? slides[currentSlide].englishCaption
                  : selectedLanguage === "hindi"
                  ? slides[currentSlide].hindiCaption
                  : slides[currentSlide].marathiCaption}
              </div>
            </div>
          </div>

          {/* ---- Right Section ---- */}
          <div className="mt-10 md:mt-0 md:ml-10 flex flex-col justify-center text-center bg-white p-6">
            <h1 className="text-3xl md:text-3xl font-bold text-gray-900 mb-6 leading-tight">
              {content[selectedLanguage].subtitle}{" "}
              <span className="text-orange-500">{content[selectedLanguage].title}</span>
            </h1>

            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              {content[selectedLanguage].description}
            </p>

            <div>
              <button
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg shadow-md"
                onClick={() => handleNavigation()}
              >
                {content[selectedLanguage].buttonText}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ---- Footer ---- */}
      <footer className="bg-gray-100 text-center text-sm py-4">
        {content[selectedLanguage].footerText}{" "}
        <a
          href={`mailto:${content[selectedLanguage].footerContact}`}
          className="text-blue-600"
        >
          {content[selectedLanguage].footerContact}
        </a>
      </footer>
    </div>
  );
};
export default StudentLandingPage;