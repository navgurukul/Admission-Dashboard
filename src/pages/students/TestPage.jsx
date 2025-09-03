import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getQuestions, getExamDuration } from "../../api/questionApi";

const TestPage = () => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null); 
  const navigate = useNavigate();

  // Fetch questions + duration
  useEffect(() => {
    const fetchData = async () => {
      const qs = await getQuestions();
      const duration = await getExamDuration();
      setQuestions(qs);
      setTimeLeft(duration);
    };
    fetchData();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      submitTest();
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAnswer = (option) => {
    setAnswers({ ...answers, [currentIndex]: option });
  };

  const submitTest = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.answer) score += 1;
    });
    navigate("/students/test-result", { state: { score, total: questions.length } });
  };

  if (timeLeft === null || questions.length === 0) {
    return <div className="text-center mt-10 text-lg font-semibold">Loading test...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-xl">
            Question {currentIndex + 1} / {questions.length}
          </h2>
          <div className="bg-red-100 text-red-600 font-bold px-4 py-2 rounded-lg shadow">
            ⏳ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
          </div>
        </div>

        {/* Question Box */}
        <div className="border border-gray-300 rounded-xl p-6 mb-6 bg-gray-50 shadow-inner">
          <p className="text-lg font-medium text-gray-800 leading-relaxed">
            {questions[currentIndex].question}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {questions[currentIndex].options.map((opt, idx) => (
            <label
              key={idx}
              className={`block border rounded-lg px-4 py-3 cursor-pointer transition ${
                answers[currentIndex] === opt
                  ? "bg-blue-100 border-blue-500"
                  : "hover:bg-gray-100 border-gray-300"
              }`}
            >
              <input
                type="radio"
                name={`q-${currentIndex}`}
                checked={answers[currentIndex] === opt}
                onChange={() => handleAnswer(opt)}
                className="hidden"
              />
              {opt}
            </label>
          ))}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <button
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => i - 1)}
            className="px-6 py-2 bg-gray-300 rounded-lg font-medium disabled:opacity-50"
          >
            Previous
          </button>
          {currentIndex === questions.length - 1 ? (
            <button
              onClick={submitTest}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium shadow hover:bg-green-700"
            >
              Submit
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex((i) => i + 1)}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium shadow hover:bg-orange-600"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestPage;
