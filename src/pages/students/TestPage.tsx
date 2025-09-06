import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getQuestions, getExamDuration } from "@/utils/students_api";

const STORAGE_KEY = "student_test_progress";

interface Question {
  id: number;
  question: string;
  options: string[];
  answer: string;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const TestPage = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const navigate = useNavigate();

  // Restore progress from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const { answers, currentIndex, examStartTime, duration } = JSON.parse(stored);

      const elapsed = Math.floor((Date.now() - examStartTime) / 1000);
      const remaining = duration - elapsed;

      if (remaining > 0) {
        setAnswers(answers || {});
        setCurrentIndex(currentIndex || 0);
        setTimeLeft(remaining);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Instead of fetching, read from localStorage
  useEffect(() => {
    const qs = JSON.parse(localStorage.getItem("student_test_questions") || "[]");
    const duration = JSON.parse(localStorage.getItem("student_test_duration") || "1800");
    setQuestions(qs);
    setTimeLeft(duration);

    // If no stored time, start new exam
    setTimeLeft((prev) => {
      if (prev === null) {
        const startTime = Date.now();
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            answers: {},
            currentIndex: 0,
            examStartTime: startTime,
            duration,
          })
        );
        return duration;
      }
      return prev;
    });
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      submitTest();
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => (t !== null ? t - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Save progress on change
  useEffect(() => {
    if (timeLeft === null) return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...parsed,
          answers,
          currentIndex,
        })
      );
    }
  }, [answers, currentIndex, timeLeft]);

  const handleAnswer = (option: string) => {
    const qid = questions[currentIndex].id;
    setAnswers({ ...answers, [qid]: option });
  };

  const submitTest = () => {
    if (!window.confirm("Are you sure you want to submit the test?")) return;

    let score = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.answer) score += 1;
    });

    localStorage.removeItem(STORAGE_KEY);

    navigate("/students/test-result", {
      state: { score, total: questions.length },
    });
  };

  if (timeLeft === null || questions.length === 0) {
    return (
      <div className="text-center mt-10 text-lg font-semibold">
        Loading test...
      </div>
    );
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
            ⏳ {formatTime(timeLeft)}
          </div>
        </div>

        {/* Question */}
        <div className="border border-gray-300 rounded-xl p-6 mb-6 bg-gray-50 shadow-inner">
          <p className="text-lg font-medium text-gray-800 leading-relaxed">
            {questions[currentIndex].question}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {questions[currentIndex].options.map((opt, idx) => {
            const qid = questions[currentIndex].id;
            return (
              <label
                key={idx}
                className={`block border rounded-lg px-4 py-3 cursor-pointer transition ${
                  answers[qid] === opt
                    ? "bg-blue-100 border-blue-500"
                    : "hover:bg-gray-100 border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name={`q-${qid}`}
                  checked={answers[qid] === opt}
                  onChange={() => handleAnswer(opt)}
                  className="hidden"
                />
                {opt}
              </label>
            );
          })}
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
