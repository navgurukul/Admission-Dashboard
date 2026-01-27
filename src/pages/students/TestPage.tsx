import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
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
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "student_test_progress";

interface Question {
  id: number;
  question: string;
  options: Array<string | { id?: number; text?: string; label?: string }>;
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
  const { toast } = useToast();
  const { questions: stateQuestions, duration: stateDuration } =
    location.state || {};

  const [questions, setQuestions] = useState<Question[]>(stateQuestions || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({}); // store selected option index
  const [timeLeft, setTimeLeft] = useState<number | null>(
    stateDuration || null,
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const isSubmitting = useRef(false); // Track submission to prevent duplicates
  const hasShownToast = useRef(false); // Track if we've shown the toast

  // Show toast notification for refresh
  useEffect(() => {
    // Check if page was refreshed (no location state means refresh)
    if (!stateQuestions || !stateDuration) {
      if (!hasShownToast.current) {
        hasShownToast.current = true;
        
        // Show toast notification
        toast({
          title: "Test Session Interrupted",
          description: "Your test session was interrupted due to page refresh. All progress has been reset.",
          variant: "destructive",
          duration: 3000,
        });
      }
    }
  }, [stateQuestions, stateDuration, toast]);

  // If no state, redirect immediately
  if (!stateQuestions || !stateDuration) {
    
    return <Navigate to="/students/test/start" replace />;
  }

  // console.log("✅ Normal test page load - state exists");
  // console.log("📊 Received duration:", stateDuration, "seconds =", stateDuration / 60, "minutes");

  // Restore progress from localStorage
  useEffect(() => {
    if (!stateQuestions || !stateDuration) return;

    const stored = localStorage.getItem(STORAGE_KEY);
    // console.log("📦 Checking stored test progress:", stored);
    
    if (stored) {
      try {
        const { answers, currentIndex, examStartTime, duration } = JSON.parse(stored);
        const elapsed = Math.floor((Date.now() - examStartTime) / 1000);
        const remaining = duration - elapsed;
        
        // console.log("⏱️ Time calculation:", {
        //   examStartTime: new Date(examStartTime).toLocaleString(),
        //   duration,
        //   elapsed,
        //   remaining
        // });

        // Check if this is old data (more than 5 seconds old means it's from a previous session)
        if (elapsed > 5) {
          // console.log("🚫 Detected OLD test data (elapsed > 5s), clearing and starting fresh");
          localStorage.removeItem(STORAGE_KEY);
          
          // Create fresh session
          const freshTestData = {
            answers: {},
            currentIndex: 0,
            examStartTime: Date.now(),
            duration: stateDuration,
          };
          
          // console.log("🆕 Creating NEW test session (after clearing old):", {
          //   startTime: new Date(freshTestData.examStartTime).toLocaleString(),
          //   duration: freshTestData.duration,
          //   durationInMinutes: freshTestData.duration / 60
          // });
          
          localStorage.setItem(STORAGE_KEY, JSON.stringify(freshTestData));
          setTimeLeft(stateDuration); // Set full duration
          return;
        }

        if (remaining > 0) {
          // console.log("♻️ Restoring previous progress (recent session)");
          setAnswers(answers || {});
          setCurrentIndex(currentIndex || 0);
          setTimeLeft(remaining);
        } else {
          // console.log("⏰ Time expired, clearing storage");
          localStorage.removeItem(STORAGE_KEY);
          setTimeLeft(stateDuration); // Reset to full duration
        }
      } catch (error) {
        // console.error("❌ Error parsing stored data:", error);
        localStorage.removeItem(STORAGE_KEY);
        setTimeLeft(stateDuration); // Reset to full duration
      }
    } else {
      // Save initial exam info with FRESH start time
      const freshTestData = {
        answers: {},
        currentIndex: 0,
        examStartTime: Date.now(),
        duration: stateDuration,
      };
      // console.log("🆕 Creating NEW test session:", {
      //   startTime: new Date(freshTestData.examStartTime).toLocaleString(),
      //   duration: freshTestData.duration,
      //   durationInMinutes: freshTestData.duration / 60
      // });
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(freshTestData));
      setTimeLeft(stateDuration); // Set full duration
    }
  }, [stateQuestions, stateDuration]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      // Auto-submit when timer reaches 0 (only once)
      if (!isSubmitting.current) {
        isSubmitting.current = true;
        submitTest();
      }
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
    
    // Prevent duplicate submissions
    if (isSubmitting.current) {
      return;
    }
    isSubmitting.current = true;

    // Get student ID from localStorage
    const studentId = localStorage.getItem("studentId");
    if (!studentId) {
      console.error("Student ID not found");
      alert("Error: Student ID not found. Please log in again.");
      isSubmitting.current = false;
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

      // console.log("Exam submission response:", response);

      // Extract data from API response
      const { exam_session, summary } = response.data;
      const score = exam_session.obtained_marks;
      const totalPossibleScore = exam_session.total_marks;
      const passed = exam_session.is_passed;

      // console.log(
      //   "totalPossibleScore",
      //   totalPossibleScore,
      //   "Score:",
      //   score,
      //   "Passed:",
      //   passed,
      //   "Summary:",
      //   summary,
      // );
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
      isSubmitting.current = false; // Reset on error to allow retry
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
    <div className="min-h-screen student-bg-gradient flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-large p-8 w-full max-w-3xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-xl text-primary">
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
            const display =
              typeof opt === "string"
                ? opt
                : opt?.text ?? opt?.label ?? JSON.stringify(opt);

            return (
              <label
                key={idx}
                className={`block border rounded-lg px-4 py-3 cursor-pointer transition ${
                  answers[qid] === idx
                    ? "bg-secondary-purple-light border-secondary-purple text-secondary-purple font-medium shadow-md"
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
                {display}
              </label>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <button
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => i - 1)}
            className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium disabled:opacity-50 hover:bg-secondary/80 transition"
          >
            Previous
          </button>

          {currentIndex === questions.length - 1 ? (
            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
              <DialogTrigger asChild>
                <button
                  className="px-6 py-2 bg-secondary-purple hover:bg-secondary-purple/90 text-white rounded-lg font-medium shadow-soft transition"
                  onClick={handleConfirmSubmit}
                >
                  Submit Test
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
                  <Button onClick={submitTest} className="bg-secondary-purple hover:bg-secondary-purple/90">Yes, Submit</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <button
              onClick={() => setCurrentIndex((i) => i + 1)}
              className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium shadow-soft transition"
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
