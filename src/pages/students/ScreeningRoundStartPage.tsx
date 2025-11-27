import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRandomQuestions as getQuestions } from "@/utils/api";
import { useLanguage } from "@/routes/LaunguageContext";
import LogoutButton from "@/components/ui/LogoutButton";

const ScreeningRoundStartPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedLanguage } = useLanguage();

  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [duration, setDuration] = useState<number>(3600);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch values when page loads
  useEffect(() => {
    const fetchData = async () => {
      try {
        const qs = await getQuestions(selectedLanguage); // pass language here
        setQuestions(qs || []);
        setQuestionCount(qs?.length || 0);
      } catch (err) {
        console.error("Error fetching exam data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedLanguage]);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs > 0 ? `${hrs} Hour${hrs > 1 ? "s" : ""}` : ""} ${mins > 0 ? `${mins} Minute${mins > 1 ? "s" : ""}` : ""}`.trim();
  };

  const getContent = () => {
    const timeText = duration ? formatDuration(duration) : "...";
    const qCount = questionCount ?? "...";

    switch (selectedLanguage) {
      case "hindi":
        return {
          heading: "एक और बात:",
          description1:
            "अब, आपसे परीक्षा में कुछ प्रश्न पूछे जाएंगे। उन्हें ध्यान से उत्तर दें।",
          description2: "लेकिन समय पर भी ध्यान रखें",
          description3: `आपको ${timeText} में ${qCount} प्रश्नों का उत्तर देना होगा`,
          buttonText: "परीक्षा शुरू करें",
        };
      case "marathi":
        return {
          heading: "आणखी एक गोष्ट:",
          description1:
            "आता, तुम्हाला परीक्षेत काही प्रश्न विचारले जातील. त्यांना काळजीपूर्वक उत्तर द्या.",
          description2: "पण वेळेवरही लक्ष ठेवा",
          description3: `तुम्हाला ${timeText} मध्ये ${qCount} प्रश्नांची उत्तरे द्यायची आहेत`,
          buttonText: "परीक्षा सुरू करा",
        };
      default:
        return {
          heading: "One More Thing:",
          description1:
            "You will be asked some questions in the test. Answer carefully.",
          description2: "But also keep an eye on time.",
          description3: `You have to answer ${qCount} questions in ${timeText}.`,
          buttonText: "START TEST",
        };
    }
  };

  const content = getContent();

  const handleStartTest = () => {
    if (!questions.length || !duration) return;
    console.log("questions", questions);

    // Navigate to TestPage with state
    localStorage.setItem("testStarted", "true");
    localStorage.setItem("testCompleted", "false");
    localStorage.setItem("allowRetest", "false"); // reset retest flag
    navigate("/students/test/section", {
      state: { questions, duration },
    });
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
      <LogoutButton />
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full flex flex-col items-center justify-center">
        <h1 className="text-2xl font-semibold mb-4">{content.heading}</h1>
        <p className="text-gray-600 mb-2">{content.description1}</p>
        <p className="text-gray-800 font-medium mb-2">{content.description2}</p>
        <p className="text-gray-800 font-semibold mb-2">
          {content.description3}
        </p>
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
