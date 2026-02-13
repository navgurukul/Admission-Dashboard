import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRandomQuestions as getQuestions, getAllQuestionSets, getQuestionsBySetName } from "@/utils/api";
import { useLanguage } from "@/routes/LaunguageContext";
import LogoutButton from "@/components/ui/LogoutButton";
import LanguageSelector from "@/components/ui/LanguageSelector";

const ScreeningRoundStartPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedLanguage } = useLanguage();

  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [duration, setDuration] = useState<number>(5400); // 90 minutes = 5400 seconds
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const studentId = localStorage.getItem("studentId") || "";

  // Fetch values when page loads
  useEffect(() => {
    const fetchData = async () => {
      try {
        // const qs = await getQuestions(selectedLanguage, studentId); // pass language here
        const school = localStorage.getItem("selectedSchool") || "";
        let qs: any[] = [];

        // Try to fetch specific set for the school first
        if (school) {
          try {
            const sets = await getAllQuestionSets();
            // Look for a set that matches the school name/code
            const targetSet = sets.find(s =>
              s.name?.toUpperCase().includes(school.toUpperCase()) ||
              s.description?.toUpperCase().includes(school.toUpperCase())
            );

            if (targetSet) {
              const setData = await getQuestionsBySetName(targetSet.name);
              // Access the questions array from the response

              const rawQuestions = setData?.data?.questions || setData?.questions || (Array.isArray(setData) ? setData : []);

              if (Array.isArray(rawQuestions) && rawQuestions.length > 0) {
                qs = rawQuestions.map((q: any) => ({
                  id: q.id,
                  question: q[`${selectedLanguage}_text`] || q.english_text || q.question,
                  options: q[`${selectedLanguage}_options`] || q.english_options || q.options,
                  difficulty_level: q.difficulty_level,
                  answer: q.answer_key ? q.answer_key[0] : 0,
                  // ensure options are parsed if they are strings
                  parsedOptions: typeof q[`${selectedLanguage}_options`] === 'string'
                    ? JSON.parse(q[`${selectedLanguage}_options`])
                    : (q[`${selectedLanguage}_options`] || [])
                })).map(q => ({
                  ...q,
                  options: q.parsedOptions.length > 0 ? q.parsedOptions : q.options
                }));
              }
            }
          } catch (e) {
            console.error("Failed to fetch specific set for school:", school, e);
          }
        }

        // Fallback to random questions if no specific set found or empty
        if (qs.length === 0) {
          qs = await getQuestions(selectedLanguage, studentId);
        }

        setQuestions(qs || []);
        setQuestionCount(qs?.length || 0);
      } catch (err) {
        console.error("Error fetching exam data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    
    // Clear any previous test progress when landing on start page
    localStorage.removeItem("student_test_progress");
  }, [selectedLanguage]);

  const formatDuration = (seconds: number, language: string) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    switch (language) {
      case "hindi":
        return `${hrs > 0 ? `${hrs} घंटा${hrs > 1 ? "" : ""}` : ""} ${mins > 0 ? `${mins} मिनट${mins > 1 ? "" : ""}` : ""}`.trim();
      case "marathi":
        return `${hrs > 0 ? `${hrs} तास${hrs > 1 ? "" : ""}` : ""} ${mins > 0 ? `${mins} मिनिट${mins > 1 ? "" : ""}` : ""}`.trim();
      default: // English
        return `${hrs > 0 ? `${hrs} Hour${hrs > 1 ? "s" : ""}` : ""} ${mins > 0 ? `${mins} Minute${mins > 1 ? "s" : ""}` : ""}`.trim();
    }
  };

  const getContent = () => {
    const timeText = duration ? formatDuration(duration, selectedLanguage) : "...";
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

    // IMPORTANT: Clear any previous test data before starting
    localStorage.removeItem("student_test_progress");
    
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
      <div className="min-h-screen flex items-center justify-center student-bg-gradient">
        <p className="text-primary-foreground text-lg">Loading test details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen student-bg-gradient flex items-center justify-center">
      <LanguageSelector />
      <LogoutButton />
      <div className="bg-card rounded-2xl shadow-large p-8 max-w-lg w-full flex flex-col items-center justify-center">
        <h1 className="text-2xl font-semibold mb-4">{content.heading}</h1>
        <p className="text-muted-foreground mb-2">{content.description1}</p>
        <p className="text-foreground font-medium mb-2">{content.description2}</p>
        <p className="text-foreground font-semibold mb-2">
          {content.description3}
        </p>
        <button
          onClick={handleStartTest}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-8 rounded-lg transition duration-200 shadow-large"
        >
          {content.buttonText}
        </button>
      </div>
    </div>
  );
};

export default ScreeningRoundStartPage;
