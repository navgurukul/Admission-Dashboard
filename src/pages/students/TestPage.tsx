import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTests } from "@/utils/TestContext";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createStudentExamSubmission } from "@/utils/api";

const STORAGE_KEY = "student_test_progress";

interface Question {
  id: number;
  question: string;
  options: string[];
  difficulty_level: number;
  answer: number; // store the index of the correct option
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const TestPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tests, setTests } = useTests();
  const { questions: stateQuestions, duration: stateDuration } =
    location.state || {};

  const [questions, setQuestions] = useState<Question[]>(stateQuestions || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({}); // store selected option index
  const [timeLeft, setTimeLeft] = useState<number | null>(
    stateDuration || null,
  );
  const [showConfirm, setShowConfirm] = useState(false);

  // Restore progress from localStorage
  useEffect(() => {
    if (!stateQuestions || !stateDuration) return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const { answers, currentIndex, examStartTime, duration } =
        JSON.parse(stored);
      const elapsed = Math.floor((Date.now() - examStartTime) / 1000);
      const remaining = duration - elapsed;

      if (remaining > 0) {
        setAnswers(answers || {});
        setCurrentIndex(currentIndex || 0);
        setTimeLeft(remaining);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } else {
      // Save initial exam info
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          answers: {},
          currentIndex: 0,
          examStartTime: Date.now(),
          duration: stateDuration,
        }),
      );
    }
  }, [stateQuestions, stateDuration]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      handleConfirmSubmit();
      return;
    }

    const timer = setInterval(
      () => setTimeLeft((t) => (t !== null ? t - 1 : 0)),
      1000,
    );
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Save progress
  useEffect(() => {
    if (timeLeft === null) return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...parsed, answers, currentIndex }),
      );
    }
  }, [answers, currentIndex, timeLeft]);

  const handleAnswer = (optionIndex: number) => {
    const qid = questions[currentIndex].id;
    setAnswers({ ...answers, [qid]: optionIndex });
  };

  const handleConfirmSubmit = () => {
    setShowConfirm(true);
  };

  const submitTest = async () => {
    setShowConfirm(false);

    // Get student ID from localStorage
    const studentId = localStorage.getItem("studentId");
    if (!studentId) {
      console.error("Student ID not found");
      alert("Error: Student ID not found. Please log in again.");
      return;
    }

    // Prepare answers in the API format
    const formattedAnswers = questions.map((q) => ({
      question_id: q.id,
      selected_answer: answers[q.id] !== undefined ? [answers[q.id]] : [],
    }));

    const submissionData = {
      student_id: Number(studentId),
      answers: formattedAnswers,
    };

    try {
      // Submit exam to API
      const response = await createStudentExamSubmission(submissionData);

      console.log("Exam submission response:", response);

      // Extract data from API response
      const { exam_session, summary } = response.data;
      const score = exam_session.obtained_marks;
      const totalPossibleScore = exam_session.total_marks;
      const passed = exam_session.is_passed;

      console.log(
        "totalPossibleScore",
        totalPossibleScore,
        "Score:",
        score,
        "Passed:",
        passed,
        "Summary:",
        summary,
      );
      localStorage.removeItem(STORAGE_KEY);

      // Update tests context
      setTests((prev) => {
        const index = prev.findIndex((t) => t.name === "Screening Test");
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            score,
            status: passed ? "Pass" : "Fail",
            action: "Completed",
          };
          return updated;
        } else {
          return [
            ...prev,
            {
              id: Date.now(),
              name: "Screening Test",
              score,
              status: passed ? "Pass" : "Fail",
              action: "Completed",
              slotBooking: { status: null },
            },
          ];
        }
      });

      localStorage.setItem("testStarted", "false");
      localStorage.setItem("testCompleted", "true");
      localStorage.setItem("allowRetest", "false");

      // Navigate to result page with API response data
      navigate("/students/test/result", {
        state: {
          score,
          total: totalPossibleScore,
          apiResponse: response.data,
          summary: summary,
          isPassed: passed,
        },
      });
    } catch (error) {
      console.error("Error submitting exam:", error);
      alert("Failed to submit exam. Please try again.");
      setShowConfirm(false);
    }
  };

  if (timeLeft === null || questions.length === 0) {
    return (
      <div className="text-center mt-10 text-lg font-semibold">
        Loading test...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary/90 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-large p-8 w-full max-w-3xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-xl text-foreground">
            Question {currentIndex + 1} / {questions.length}
          </h2>
          <div className="bg-destructive/10 text-destructive font-bold px-4 py-2 rounded-lg shadow-soft">
            ⏳ {formatTime(timeLeft)}
          </div>
        </div>

        {/* Question */}
        <div className="border border-border rounded-xl p-6 mb-6 bg-muted shadow-inner">
          <p className="text-lg font-medium text-foreground leading-relaxed">
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
                  answers[qid] === idx
                    ? "bg-accent border-ring"
                    : "hover:bg-muted border-border"
                }`}
              >
                <input
                  type="radio"
                  name={`q-${qid}`}
                  checked={answers[qid] === idx}
                  onChange={() => handleAnswer(idx)}
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
            className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium disabled:opacity-50"
          >
            Previous
          </button>

          {currentIndex === questions.length - 1 ? (
            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
              <DialogTrigger asChild>
                <button
                  className="px-6 py-2 bg-[hsl(var(--status-active))] text-primary-foreground rounded-lg font-medium shadow-soft hover:bg-[hsl(var(--status-active))]/90"
                  onClick={handleConfirmSubmit}
                >
                  Submit
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Submission</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to submit the test? You won’t be able
                    to change your answers afterwards.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex justify-end gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={submitTest}>Yes, Submit</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <button
              onClick={() => setCurrentIndex((i) => i + 1)}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium shadow-soft hover:bg-primary/90"
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
