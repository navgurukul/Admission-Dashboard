import React from "react";
import { useNavigate } from "react-router-dom";
import { getQuestions, getExamDuration } from "@/utils/students_api";
import { useLanguage } from "@/routes/LaunguageContext";

const ScreeningRoundStartPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedLanguage } = useLanguage();

  // to pick translations
   const getContent = () => {
    switch (selectedLanguage) {
      case "hindi":
        return {
          heading: "एक और बात:",
          description1: "अब, आपसे परीक्षा में कुछ प्रश्न पूछे जाएंगे। उन्हें ध्यान से उत्तर दें।",
          description2: "लेकिन समय पर भी ध्यान रखें",
          description3: "आपको 1 घंटे 30 मिनट में 18 प्रश्नों का उत्तर देना होगा",
          buttonText: "परीक्षा शुरू करें",
        };
      case "marathi":
        return {
          heading: "आणखी एक गोष्ट:",
          description1: "आता, तुम्हाला परीक्षेत काही प्रश्न विचारले जातील. त्यांना काळजीपूर्वक उत्तर द्या.",
          description2: "पण वेळेवरही लक्ष ठेवा",
          description3: "तुम्हाला 1 तास 30 मिनिटांत 18 प्रश्नांची उत्तरे द्यायची आहेत",
          buttonText: "परीक्षा सुरू करा",
        };
      default:
        return {
          heading: "One More Thing:",
          description1: "Now, you will be asked some questions in the test. Answer them carefully.",
          description2: "But also keep an eye on time",
          description3: "You have to answer 18 questions in 1 Hour & 30 Minutes",
          buttonText: "START TEST",
        };
    }
  };

  const content = getContent();

  const handleStartTest = async () => {
    try {
      const questions = await getQuestions();
      const duration = await getExamDuration();

      localStorage.setItem("student_test_questions", JSON.stringify(questions));
      localStorage.setItem("student_test_duration", JSON.stringify(duration));

      navigate("/students/test-section");
    } catch (err) {
      console.error("Error starting test:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full flex flex-col items-center justify-center">
        <h1 className="text-2xl font-semibold mb-4">{content.heading}</h1>
        <p className="text-gray-600 mb-2">{content.description1}</p>
        <p className="text-gray-800 font-medium mb-2">{content.description2}</p>
        <p className="text-gray-800 font-semibold mb-6">{content.description3}</p>
        <button
          onClick={handleStartTest}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition duration-200 shadow-lg"
        >
          {content.buttonText}
        </button>
      </div>
    </div>
  );
};

export default ScreeningRoundStartPage;
