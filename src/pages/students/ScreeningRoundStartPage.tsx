import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getQuestions, getExamDuration } from "@/utils/students_api";
import { useLanguage } from "@/routes/LaunguageContext";

const ScreeningRoundStartPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedLanguage } = useLanguage();

  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null); 
  const [loading, setLoading] = useState(true);

  // Fetch values when page loads
  useEffect(() => {
    const fetchData = async () => {
      try {
        const questions = await getQuestions();
        const examDuration = await getExamDuration();

        setQuestionCount(questions?.length || 0);
        setDuration(examDuration);
      } catch (err) {
        console.error("Error fetching exam data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format duration into "X Hours Y Minutes"
  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs > 0 ? `${hrs} Hour${hrs > 1 ? "s" : ""}` : ""} ${mins > 0 ? `${mins} Minute${mins > 1 ? "s" : ""}` : ""}`;
  };

  // translations with dynamic values
  const getContent = () => {
    const timeText = duration ? formatDuration(duration) : "...";
    const qCount = questionCount ?? "...";

    switch (selectedLanguage) {
      case "hindi":
        return {
          heading: "एक और बात:",
          description1: "अब, आपसे परीक्षा में कुछ प्रश्न पूछे जाएंगे। उन्हें ध्यान से उत्तर दें।",
          description2: "लेकिन समय पर भी ध्यान रखें",
          description3: `आपको ${timeText} में ${qCount} प्रश्नों का उत्तर देना होगा`,
          buttonText: "परीक्षा शुरू करें",
        };
      case "marathi":
        return {
          heading: "आणखी एक गोष्ट:",
          description1: "आता, तुम्हाला परीक्षेत काही प्रश्न विचारले जातील. त्यांना काळजीपूर्वक उत्तर द्या.",
          description2: "पण वेळेवरही लक्ष ठेवा",
          description3: `तुम्हाला ${timeText} मध्ये ${qCount} प्रश्नांची उत्तरे द्यायची आहेत`,
          buttonText: "परीक्षा सुरू करा",
        };
      default:
        return {
          heading: "One More Thing:",
          description1: "Now, you will be asked some questions in the test. Answer them carefully.",
          description2: "But also keep an eye on time",
          description3: `You have to answer ${qCount} questions in ${timeText}`,
          buttonText: "START TEST",
        };
    }
  };

  const content = getContent();

  const handleStartTest = async () => {
    try {
      const questions = await getQuestions();
      const examDuration = await getExamDuration();

      // localStorage.setItem("student_test_questions", JSON.stringify(questions));
      // localStorage.setItem("student_test_duration", JSON.stringify(examDuration));

      navigate("/students/test-section");
    } catch (err) {
      console.error("Error starting test:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-400 to-red-500">
        <p className="text-white text-lg">Loading test details...</p>
      </div>
    );
  }

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
