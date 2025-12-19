import React, { useState, useEffect } from "react";
import { useLanguage } from "../routes/LaunguageContext";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Code, Users, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import image from "@/assets/ng-logo-horizontal.png";

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
    learnMoreText: "Learn More",
    footerText: "For more queries, email at",
    footerContact: "hi@navgurukul.org",
    imageUrl: image,
    features: {
      realProjects: "Real Projects",
      community: "Community",
      mentorship: "Mentorship",
    },
  },
  hindi: {
    heading: "सॉफ्टवेयर इंजीनियरिंग छात्रवृत्ति",
    title: "नवगुरुकुल",
    subtitle: "में आपका स्वागत है",
    description:
      "एक समृद्ध शिक्षार्थी समुदाय में कोडिंग, समस्या-समाधान, और आलोचनात्मक सोच सीखें। आज ही छात्रवृत्ति परीक्षा दें और सॉफ्टवेयर इंजीनियर बनने की अपनी यात्रा शुरू करें।",
    buttonText: "शुरू करें",
    learnMoreText: "और जानें",
    footerText: "अधिक जानकारी के लिए ईमेल करें:",
    footerContact: "hi@navgurukul.org",
    imageUrl: image,
    features: {
      realProjects: "वास्तविक परियोजनाएं",
      community: "समुदाय",
      mentorship: "मार्गदर्शन",
    },
  },
  marathi: {
    heading: "सॉफ्टवेअर अभियांत्रिकी शिष्यवृत्ती",
    title: "नवगुरुकुल",
    subtitle: "मध्ये आपले स्वागत आहे",
    description:
      "कोडिंग, समस्या सोडवणे, आणि विचारशक्ती विकसित करणे यामध्ये एक समृद्ध समुदायात शिकणे. आजच शिष्यवृत्ती चाचणी द्या आणि सॉफ्टवेअर अभियंता बनण्याच्या आपल्या प्रवासाची सुरूवात करा.",
    buttonText: "सुरू करा",
    learnMoreText: "अधिक जाणून घ्या",
    footerText: "अधिक प्रश्नांसाठी, ईमेल करा:",
    footerContact: "hi@navgurukul.org",
    imageUrl: image,
    features: {
      realProjects: "वास्तविक प्रकल्प",
      community: "समुदाय",
      mentorship: "मार्गदर्शन",
    },
  },
};
const StudentLandingPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { selectedLanguage, setSelectedLanguage } = useLanguage();
  const navigate = useNavigate();
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);

  const languages = [
    { value: "english", label: "English" },
    { value: "hindi", label: "हिंदी" },
    { value: "marathi", label: "मराठी" },
  ];

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isLanguageDropdownOpen && !event.target.closest(".relative")) {
        setIsLanguageDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isLanguageDropdownOpen]);

  const handleNavigation = async () => {
    const googleUser = localStorage.getItem("user");
    const testStarted = localStorage.getItem("testStarted") === "true";
    const testCompleted = localStorage.getItem("testCompleted") === "true";
    const allowRetest = localStorage.getItem("allowRetest") === "true";

    // Case 1: Not logged in
    if (!googleUser) {
      navigate("/students/login");
      return;
    }

    try {
      // Try to get email from user data
      const parsedUser = JSON.parse(googleUser);
      const email = parsedUser.email;

      if (email) {
        // Import the API function dynamically
        const { getCompleteStudentData } = await import("@/utils/api");

        // Fetch complete student data
        const data = await getCompleteStudentData(email);

        // Get latest exam session
        const examSessions = data.data.exam_sessions || [];
        const latestExam =
          examSessions.length > 0
            ? examSessions.reduce((latest, current) =>
                new Date(current.created_at) > new Date(latest.created_at)
                  ? current
                  : latest,
              )
            : null;

        if (latestExam) {
          // Exam completed
          if (latestExam.is_passed) {
            // Get latest LR status
            const lrRounds = data.data.interview_learner_round || [];
            const latestLR =
              lrRounds.length > 0
                ? lrRounds.reduce((latest, current) =>
                    new Date(current.created_at) > new Date(latest.created_at)
                      ? current
                      : latest,
                  )
                : null;

            // Check if LR is passed
            const isLRPassed =
              latestLR?.learning_round_status?.includes("Pass");

            if (isLRPassed) {
              // LR passed - check CFR status
              const cfrRounds = data.data.interview_cultural_fit_round || [];
              const latestCFR =
                cfrRounds.length > 0
                  ? cfrRounds.reduce((latest, current) =>
                      new Date(current.created_at) > new Date(latest.created_at)
                        ? current
                        : latest,
                    )
                  : null;

              // Show result page with CFR status
              navigate("/students/final-result");
              return;
            } else {
              // Exam passed - show result page to book LR or view status
              navigate("/students/final-result");
              return;
            }
          } else {
            // Failed exam
            if (allowRetest) {
              navigate("/students/test/start");
              return;
            } else {
              navigate("/students/final-result");
              return;
            }
          }
        } else {
          // No exam session found
          if (testCompleted && !allowRetest) {
            navigate("/students/final-result");
            return;
          }

          if (testStarted || allowRetest) {
            navigate("/students/test/start");
            return;
          }

          // Not started - go to instructions
          navigate("/students/details/instructions");
        }
      }
    } catch (error) {
      console.error("Error fetching student data:", error);

      // Fallback to old logic if API fails
      if (testCompleted && !allowRetest) {
        navigate("/students/final-result");
        return;
      }

      if (testStarted || allowRetest) {
        navigate("/students/test/start");
        return;
      }

      navigate("/students/details/instructions");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-student-bg-light">
      {/* ---- Modern Navbar ---- */}
      <header className="sticky top-0 flex justify-between items-center px-4 md:px-8 lg:px-12 py-3 md:py-4 bg-card/95 border-b border-border z-50 backdrop-blur-sm">
        {/* Logo Section */}
        <div className="flex items-center space-x-2 md:space-x-3">
          <img
            src={content[selectedLanguage].imageUrl}
            alt="NavGurukul Logo"
            className="h-8 md:h-10 lg:h-12"
          />
          <span className="hidden sm:block text-lg md:text-xl font-bold text-foreground">
            {content[selectedLanguage].title}
          </span>
        </div>

        {/* Right Section - Language Selector & CTA */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Custom Language Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
              className="border border-border rounded-lg px-2 py-1.5 md:px-4 md:py-2 text-foreground text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-card hover:border-primary transition-all cursor-pointer flex items-center gap-2 min-w-[80px] md:min-w-[100px]"
            >
              <span className="font-medium">
                {languages.find((l) => l.value === selectedLanguage)?.label}
              </span>
              <svg
                className={`w-4 h-4 transition-transform ${isLanguageDropdownOpen ? "rotate-180" : ""}`}
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
            </button>

            {/* Dropdown Menu */}
            {isLanguageDropdownOpen && (
              <div className="absolute top-full mt-2 right-0 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50 min-w-[120px]">
                {languages.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => {
                      setSelectedLanguage(lang.value);
                      setIsLanguageDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      selectedLanguage === lang.value
                        ? "bg-primary text-white font-medium"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={handleNavigation}
            size="sm"
            className="hidden sm:flex student-btn text-xs md:text-sm px-3 md:px-4 shadow-md hover:shadow-lg"
          >
            {content[selectedLanguage].buttonText}
          </Button>
        </div>
      </header>

      {/* ---- Main Hero Section ---- */}
      <section className="flex-1 flex items-center py-8 md:py-12 lg:py-16 ">
        <div className="w-full px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 lg:gap-12 items-center max-w-[90rem] mx-auto px-6 md:px-12 lg:px-20">
            {/* Left Section - Content */}
            <div className="space-y-4 md:space-y-6 order-2 md:order-1">
              <div className="inline-block">
                <span className="text-primary md:rounded-full text-3xl md:text-3xl lg:text-base font-semibold">
                  {content[selectedLanguage].heading}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight text-foreground">
                {content[selectedLanguage].subtitle}{" "}
                <span className="text-primary">
                  {content[selectedLanguage].title}
                </span>
              </h1>

              <p className="text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed">
                {content[selectedLanguage].description}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2 md:pt-4">
                <Button
                  onClick={handleNavigation}
                  className="student-btn group h-11 md:h-12 px-5 md:px-6 text-sm md:text-base w-full sm:w-auto"
                >
                  {content[selectedLanguage].buttonText}
                  <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  className="h-11 md:h-12 px-5 md:px-6 text-sm md:text-base border-primary text-primary hover:bg-primary/5 w-full sm:w-auto"
                  onClick={() => {
                    window.open("https://www.navgurukul.org/", "_blank");
                  }}
                >
                  {content[selectedLanguage].learnMoreText}
                </Button>
              </div>

              {/* <div className="grid grid-cols-3 gap-2 md:gap-4 pt-4 md:pt-8">
                <div className="flex flex-col md:flex-row items-center md:items-center gap-1 md:gap-2">
                  <Code className="w-4 h-4 md:w-5 md:h-5 text-orange-500 flex-shrink-0" />
                  <span className="text-xs md:text-lg font-medium text-center md:text-left">{content[selectedLanguage].features.realProjects}</span>
                </div>
                <div className="flex flex-col md:flex-row items-center md:items-center gap-1 md:gap-2">
                  <Users className="w-4 h-4 md:w-5 md:h-5 text-orange-500 flex-shrink-0" />
                  <span className="text-xs md:text-lg font-medium text-center md:text-left">{content[selectedLanguage].features.community}</span>
                </div>
                <div className="flex flex-col md:flex-row items-center md:items-center gap-1 md:gap-2">
                  <Lightbulb className="w-4 h-4 md:w-5 md:h-5 text-orange-500 flex-shrink-0" />
                  <span className="text-xs md:text-lg font-medium text-center md:text-left">{content[selectedLanguage].features.mentorship}</span>
                </div>
              </div> */}
            </div>

            {/* Right Section - Video Carousel */}
            <div className="relative order-1 md:order-2">
              <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-3xl"></div>
              <div className="relative w-full overflow-hidden rounded-xl md:rounded-2xl shadow-xl md:shadow-2xl">
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
                    className="w-full h-auto object-cover aspect-video"
                  />
                </a>

                {/* Caption */}
                <div className="absolute bottom-0 left-0 right-0 bg-black text-white text-center py-2 md:py-3 text-lg md:text-sm lg:text-base px-2">
                  {selectedLanguage === "english"
                    ? slides[currentSlide].englishCaption
                    : selectedLanguage === "hindi"
                      ? slides[currentSlide].hindiCaption
                      : slides[currentSlide].marathiCaption}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="bg-muted text-center text-xs md:text-sm py-4 md:py-6 mt-auto px-4">
        {content[selectedLanguage].footerText}{" "}
        <a
          href={`mailto:${content[selectedLanguage].footerContact}`}
          className="text-primary hover:underline break-all md:break-normal"
        >
          {content[selectedLanguage].footerContact}
        </a>
      </footer>
    </div>
  );
};
export default StudentLandingPage;
