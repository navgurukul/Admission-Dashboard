import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTests } from "../../utils/TestContext";
import LogoutButton from "@/components/ui/LogoutButton";
import LanguageSelector from "@/components/ui/LanguageSelector";
import { getStudentDataByPhone, getStudentDataByEmail } from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { ADMISSIONS_EMAIL } from "@/lib/const";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";
import { useLanguage } from "@/routes/LaunguageContext";
import { ContextualHelpWidget } from "@/components/onboarding/ContextualHelpWidget";

const ScreeningResultPage: React.FC = () => {
  const { tests, setTests } = useTests();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { selectedLanguage } = useLanguage();

  // Get score, total, and isPassed from navigation state
  const { score = 0, total = 0, isPassed = false } = location.state || {};

  // Use the isPassed value from API response instead of calculating locally
  const status = isPassed ? "pass" : "fail";

  const screeningTest = tests.find((t) => t.name === "Screening Test");

  const getContent = () => {
    switch (selectedLanguage) {
      case "hindi":
        return {
          pass: {
            congratulations: "बधाई हो! 🎉",
            passedText: "आपने परीक्षा पास कर ली है",
            scoreText: "आपका स्कोर",
            thankYou: "NavGurukul कार्यक्रम में आवेदन करने के लिए धन्यवाद।",
            contactText: "हमारी प्रवेश टीम अगले चरणों के लिए आपसे संपर्क करेगी।",
            emailText: "आप हमें ईमेल भेज सकते हैं",
            resultButton: "परिणाम अनुभाग पर जाएं",
            loading: "लोड हो रहा है...",
          },
          fail: {
            sorry: "क्षमा करें!",
            failedText: "आप इस बार NavGurukul प्रारंभिक परीक्षा पास नहीं कर सके। आपने परीक्षा में",
            marksText: "अंक प्राप्त किए हैं। चिंता न करें, आप कुछ तैयारी के बाद फिर से परीक्षा दे सकते हैं।",
            studyText: "आप अधिक गणित अभ्यास के लिए इस अध्ययन गाइड का उपयोग कर सकते हैं",
            clickHere: "यहाँ क्लिक करें",
            prepare: "तैयारी करें, अभ्यास करें और पास करें",
            okButton: "ठीक है",
            loading: "लोड हो रहा है...",
          },
        };
      case "marathi":
        return {
          pass: {
            congratulations: "अभिनंदन! 🎉",
            passedText: "तुम्ही परीक्षा उत्तीर्ण केली आहे",
            scoreText: "तुमचा स्कोअर",
            thankYou: "NavGurukul कार्यक्रमासाठी अर्ज केल्याबद्दल धन्यवाद।",
            contactText: "आमची प्रवेश टीम पुढील चरणांसाठी तुमच्याशी संपर्क साधेल।",
            emailText: "तुम्ही आम्हाला ईमेल पाठवू शकता",
            resultButton: "निकाल विभागात जा",
            loading: "लोड होत आहे...",
          },
          fail: {
            sorry: "माफ करा!",
            failedText: "तुम्ही यावेळी NavGurukul प्राथमिक चाचणी उत्तीर्ण करू शकला नाही. तुम्ही चाचणीत",
            marksText: "गुण मिळवले आहेत. काळजी करू नका, तुम्ही काही तयारीनंतर पुन्हा चाचणी देऊ शकता।",
            studyText: "अधिक गणित सरावासाठी तुम्ही या अभ्यास मार्गदर्शकाचा वापर करू शकता",
            clickHere: "येथे क्लिक करा",
            prepare: "तयारी करा, सराव करा आणि उत्तीर्ण व्हा",
            okButton: "ठीक आहे",
            loading: "लोड होत आहे...",
          },
        };
      default: // English
        return {
          pass: {
            congratulations: "Congratulations! 🎉",
            passedText: "You passed the test with a score of",
            scoreText: "",
            thankYou: "Thank you for applying to NavGurukul Program.",
            contactText: "Our admission team will contact you for the next steps.",
            emailText: "You can send us a mail on",
            resultButton: "Go to Result Section",
            loading: "Loading...",
          },
          fail: {
            sorry: "Oh Sorry!",
            failedText: "You could not clear the NavGurukul Preliminary Test this time. You have scored",
            marksText: "marks in the test. Don't worry, you can give the test again after some preparation.",
            studyText: "You can use this study guide for more maths practice",
            clickHere: "Click Here",
            prepare: "Prepare, Practice and Pass",
            okButton: "OK",
            loading: "Loading...",
          },
        };
    }
  };

  const content = getContent();
  const guideText = (() => {
    switch (selectedLanguage) {
      case "hindi":
        return {
          title: "यहां अपना टेस्ट रिजल्ट देखें।",
          summary: "यहां अपना स्कोर देखें।",
          next: "अगला स्टेप देखने के लिए यहां क्लिक करें।",
          continue: "आगे बढ़ने के लिए यहां क्लिक करें।",
        };
      case "marathi":
        return {
          title: "येथे तुमचा टेस्ट निकाल पहा.",
          summary: "येथे तुमचा स्कोअर पहा.",
          next: "पुढचा टप्पा पाहण्यासाठी येथे क्लिक करा.",
          continue: "पुढे जाण्यासाठी येथे क्लिक करा.",
        };
      default:
        return {
          title: "See your test result here.",
          summary: "Check your score here.",
          next: "Click here to see the next step.",
          continue: "Click here to continue.",
        };
    }
  })();
  const screeningResultGuideSteps = status === "pass"
    ? [
        {
          id: "student-screening-result-title",
          target: '[data-onboarding="student-screening-result-title"]',
          text: guideText.title,
        },
        {
          id: "student-screening-result-summary",
          target: '[data-onboarding="student-screening-result-summary"]',
          text: guideText.summary,
        },
        {
          id: "student-screening-result-action",
          target: '[data-onboarding="student-screening-result-action"]',
          text: guideText.next,
        },
      ]
    : [
        {
          id: "student-screening-result-title",
          target: '[data-onboarding="student-screening-result-title"]',
          text: guideText.title,
        },
        {
          id: "student-screening-result-summary",
          target: '[data-onboarding="student-screening-result-summary"]',
          text: guideText.summary,
        },
        {
          id: "student-screening-result-action",
          target: '[data-onboarding="student-screening-result-action"]',
          text: guideText.continue,
        },
      ];

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Get student's phone and email from localStorage
      let phoneNumber = "";
      let email = "";
      let loginMethod: "email" | "phone" = "phone"; // Default to phone

      // Detect actual login method - Google login stores google_credential in sessionStorage
      const googleCredential = sessionStorage.getItem("google_credential");
      if (googleCredential) {
        loginMethod = "email";
      } else {
        loginMethod = "phone"; 
      }

      // 1. Check current user session
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          email = user.email || "";
          phoneNumber = user.mobile || user.phone || "";
        } catch (e) {
          console.error("Error parsing user:", e);
        }
      }

      // 2. Fallback: Try studentFormData (used after form submission)
      if (!email && !phoneNumber) {
        const savedFormData = localStorage.getItem("studentFormData");
        if (savedFormData) {
          try {
            const parsed = JSON.parse(savedFormData);
            phoneNumber = parsed.whatsappNumber || parsed.alternateNumber || parsed.phone_number || "";
            email = parsed.email || "";
          } catch (e) {
            console.error("Error parsing studentFormData:", e);
          }
        }
      }

      // 3. Fallback: Try existing student session data (cached from previous API call)
      if (!email && !phoneNumber) {
        const studentDataStr = localStorage.getItem("studentData");
        if (studentDataStr) {
          try {
            const data = JSON.parse(studentDataStr);
            const profile = data?.data?.student || data?.student || data;
            phoneNumber = profile.whatsapp_number || profile.phone_number || "";
            email = profile.email || "";
          } catch (e) { }
        }
      }

      if (!phoneNumber && !email) {
        toast({
          title: "⚠️ Identification Missing",
          description: "Could not find your phone number or email. Please login again.",
          variant: "destructive",
        });
        return;
      }

      // Call API (phone first, then email)
      let response;
      
      if (loginMethod === "email" && email) {
        // Email login (Google) - try email first
        try {
          response = await getStudentDataByEmail(email);
        } catch (emailError: any) {
          // Fallback to phone if available
          if (phoneNumber) {
            try {
              response = await getStudentDataByPhone(phoneNumber);
            } catch (phoneError: any) {
              throw emailError; // Throw original email error
            }
          } else {
            throw emailError;
          }
        }
      } else if (loginMethod === "phone" && phoneNumber) {
        // Phone login (OTP) - try phone first
        try {
          response = await getStudentDataByPhone(phoneNumber);
        } catch (phoneError: any) {
          // Fallback to email if available
          if (email) {
            try {
              response = await getStudentDataByEmail(email);
            } catch (emailError: any) {
              throw phoneError; // Throw original phone error
            }
          } else {
            throw phoneError;
          }
        }
      } else {
        // Fallback: If no identifier matches login method, try what's available
        if (phoneNumber) {
          response = await getStudentDataByPhone(phoneNumber);
        } else if (email) {
          response = await getStudentDataByEmail(email);
        }
      }

      if (!response) {
        toast({
          title: "❌ Unable to Load Data",
          description: "Failed to fetch student data",
          variant: "destructive",
          className: "border-red-500 bg-red-50 text-red-900"
        });
        return;
      }

      // Update test context with screening test status
      setTests((prev) =>
        prev.map((t) =>
          t.name === "Screening Test"
            ? { ...t, status: status === "pass" ? "Pass" : "Fail", score }
            : t,
        ),
      );

      // Check if user does not have an email address
      // The response from getByPhone can be the student object or { data: { student: ... } }
      const studentData = (response as any).data?.student || (response as any).student || response;

      // Update localStorage with fresh data for Final Result page
      localStorage.setItem("studentData", JSON.stringify(response));
      
      // Save user info for easy access in StudentResult page
      localStorage.setItem("user", JSON.stringify({
        email: studentData?.email || "",
        mobile: studentData?.phone_number || studentData?.whatsapp_number || phoneNumber || "",
        phone: studentData?.phone_number || studentData?.whatsapp_number || phoneNumber || "",
        whatsapp_number: studentData?.whatsapp_number || phoneNumber || "",
        first_name: studentData?.first_name || "",
        student_id: studentData?.student_id || studentData?.id
      }));

      // Navigate to final-result route and pass the data there
      navigate("/students/final-result", {
        state: {
          studentData: response, // Pass the API data
          fromScreening: true,
        },
      });
    } catch (error: any) {
      console.error("Error fetching student data:", error);
      toast({
        title: "❌ Unable to Load Data",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen student-bg-gradient flex items-center justify-center p-4">
      <ContextualHelpWidget
        sectionId="student-screening-result"
        sectionTitle="Screening Result"
        steps={screeningResultGuideSteps}
        demo={{
          title: "Screening result demo",
          embedUrl: "https://www.youtube.com/embed/VIDEO_ID_STUDENT_SCREENING_RESULT?rel=0",
          note: "Replace this with a short result walkthrough.",
        }}
        faqs={[
          {
            question: "What happens after this page?",
            answer: "This action takes you to the student result section for the next stage details.",
          },
          {
            question: "Will my score be saved?",
            answer: "Yes. The result flow stores the latest student data before continuing.",
          },
        ]}
        showInlineButtons={false}
        showFloatingButton={true}
        autoStartOnFirstVisit={true}
      />
      <LanguageSelector />
      <LogoutButton />
      <div className="bg-card rounded-3xl shadow-large p-10 max-w-2xl w-full flex flex-col items-center text-center">
        {status === "pass" ? (
          <>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-onboarding="student-screening-result-title">
              {content.pass.congratulations}
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-6" data-onboarding="student-screening-result-summary">
              {content.pass.passedText}{" "}
              <span className="text-primary">{score}</span> /{" "}
              <span className="text-primary">{total}</span>
            </h2>
            <p className="text-muted-foreground mb-2">
              {content.pass.thankYou}
            </p>
            <p className="text-muted-foreground mb-4">
              {content.pass.contactText}
            </p>

            <p className="text-muted-foreground mb-4">
              {content.pass.emailText}{" "}
              <a href={`mailto:${ADMISSIONS_EMAIL}`} className="text-blue-500">
                {ADMISSIONS_EMAIL}
              </a>
              .
            </p>

            {/* <div className="flex flex-col md:flex-row gap-4 mt-6 w-full justify-center">
              <a
                href="https://navgurukul.org"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-orange-50 border border-orange-500 text-orange-600 font-semibold py-3 px-6 rounded-lg hover:bg-orange-100 transition"
              >
                VISIT NAVGURUKUL
              </a>
              <a
                href="https://www.merakilearn.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-orange-50 border border-orange-500 text-orange-600 font-semibold py-3 px-6 rounded-lg hover:bg-orange-100 transition"
              >
                START CODING NOW
              </a>
            </div> */}

            {/* Button to go to results/dashboard */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              data-onboarding="student-screening-result-action"
              className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-8 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {content.pass.loading}
                </>
              ) : (
                content.pass.resultButton
              )}
            </button>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-semibold text-foreground mb-6" data-onboarding="student-screening-result-title">
              {content.fail.sorry}
            </h1>
            <p className="text-muted-foreground mb-4 text-lg" data-onboarding="student-screening-result-summary">
              {content.fail.failedText}{" "}
              <span className="font-bold">{score}</span>{" "}
              {content.fail.marksText}
            </p>
            <p className="text-muted-foreground mb-6">
              {content.fail.studyText}{" "}
              <a
                href="https://www.youtube.com/watch?v=zmPhzTk3nZs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 font-medium underline hover:text-blue-800"
              >
                {content.fail.clickHere}
              </a>
              . {content.fail.prepare}
            </p>
            <button
              onClick={handleSubmit}
              disabled={loading}
              data-onboarding="student-screening-result-action"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-8 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {content.fail.loading}
                </>
              ) : (
                content.fail.okButton
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ScreeningResultPage;
