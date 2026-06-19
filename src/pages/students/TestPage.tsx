import React, { useEffect, useMemo, useState, useRef } from "react";
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
import { QuestionFormattedText } from "@/components/questions/QuestionFormattedText";
import { useLanguage } from "@/routes/LaunguageContext";
import {
  formatOptionDisplay,
  normalizeQuestionOptions,
  type QuestionOption,
} from "@/components/questions/questionOptionFormatting";

const STORAGE_KEY = "student_test_progress";

interface Question {
  id: number;
  question: string;
  options: QuestionOption[];
  difficulty_level: number;
  answer: number; // store the index of the correct option
}

type DisplayItem =
  | {
      type: "instruction";
      questionIndex: number;
      questionNumber: number;
      topicDetails: any;
      instruction: string;
    }
  | {
      type: "question";
      questionIndex: number;
      questionNumber: number;
      question: any;
    };

const normalizeQuestions = (inputQuestions: Question[] = []) =>
  inputQuestions.map((question) => ({
    ...question,
    options: normalizeQuestionOptions(question.options),
  }));

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  if (h > 0) {
    return `${h}h ${m}m ${s}s`;
  }
  return `${m}m ${s}s`;
};

const getQuestionTextForLanguage = (question: any, selectedLanguage: string) => {
  const languageKey = selectedLanguage?.toLowerCase?.() || selectedLanguage;
  if (question?.question_text && typeof question.question_text === "object") {
    return question.question_text[languageKey] || question.question_text.english || "";
  }
  if (question?.[`${languageKey}_text`]) return question[`${languageKey}_text`];
  if (question?.question) return question.question;
  return String(question?.question_text || "");
};

const getTopicInstructionForLanguage = (question: any, selectedLanguage: string) => {
  const languageKey = selectedLanguage?.toLowerCase?.() || selectedLanguage;
  const topicDetails = question?.topic_details;
  if (!topicDetails) return null;

  const preferredInstruction = topicDetails[`${languageKey}_instruction`];
  const fallbackInstruction =
    topicDetails.english_instruction ||
    topicDetails.hindi_instruction ||
    topicDetails.marathi_instruction ||
    null;

  const normalizedPreferred = typeof preferredInstruction === "string" ? preferredInstruction.trim() : "";
  const normalizedFallback = typeof fallbackInstruction === "string" ? fallbackInstruction.trim() : "";

  return normalizedPreferred || normalizedFallback || null;
};

const getInstructionSignature = (question: any, selectedLanguage: string) => {
  const topicDetails = question?.topic_details;
  const instruction = getTopicInstructionForLanguage(question, selectedLanguage);

  if (!instruction) return "";

  return JSON.stringify({
    topicId: topicDetails?.id ?? question?.topic ?? "",
    topicName: topicDetails?.topic ?? "",
    instruction,
  });
};

const looksLikeHtml = (value: string) => /<[^>]+>/.test(value);

const decodeHtmlEntities = (value: string) => {
  if (typeof document === "undefined") return value;

  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
};

const normalizeInstructionContent = (value: string) => {
  const decoded = decodeHtmlEntities(value).replace(/\u00a0/g, " ");
  return decoded
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const TestPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tests, setTests } = useTests();
  const { toast } = useToast();
  const { questions: stateQuestions, duration: stateDuration } =
    location.state || {};

  const { selectedLanguage } = useLanguage();

  const [questions, setQuestions] = useState<Question[]>(
    normalizeQuestions(stateQuestions || []),
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({}); // store selected option index
  const [timeLeft, setTimeLeft] = useState<number | null>(
    stateDuration || null,
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const isSubmitting = useRef(false); // Track submission to prevent duplicates
  const hasShownToast = useRef(false); // Track if we've shown the toast

  // ── Copy / Screenshot prevention ──────────────────────────────────────────
  useEffect(() => {
    // Block copy, cut, and select-all keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (
        (e.ctrlKey || e.metaKey) &&
        (key === "c" || key === "x" || key === "a" || key === "u")
      ) {
        e.preventDefault();
      }
      // Block PrintScreen
      if (key === "printscreen") {
        e.preventDefault();
      }
    };

    // Block right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Block copy / cut events
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
    };
    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCut);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCut);
    };
  }, []);
  // ──────────────────────────────────────────────────────────────────────────

  const displayItems = useMemo<DisplayItem[]>(() => {
    const items: DisplayItem[] = [];

    questions.forEach((question: any, questionIndex: number) => {
      const previousQuestion = questions[questionIndex - 1] as any;
      const instruction = getTopicInstructionForLanguage(question, selectedLanguage);
      const currentInstructionSignature = getInstructionSignature(
        question,
        selectedLanguage,
      );
      const previousInstructionSignature = previousQuestion
        ? getInstructionSignature(previousQuestion, selectedLanguage)
        : "";
      const shouldShowInstruction =
        Boolean(instruction) &&
        (questionIndex === 0 ||
          currentInstructionSignature !== previousInstructionSignature);

      if (shouldShowInstruction) {
        items.push({
          type: "instruction",
          questionIndex,
          questionNumber: questionIndex + 1,
          topicDetails: question?.topic_details,
          instruction,
        });
      }

      items.push({
        type: "question",
        questionIndex,
        questionNumber: questionIndex + 1,
        question,
      });
    });

    return items;
  }, [questions, selectedLanguage]);

  const currentItem = displayItems[currentIndex];
  const currentQuestion =
    currentItem?.type === "question"
      ? currentItem.question
      : currentItem
        ? (questions[currentItem.questionIndex] as any)
        : null;

  // Timer is paused while the student is on an instruction/concept screen.
  const timerPaused = currentItem?.type === "instruction";
  useEffect(() => {
    setQuestions(normalizeQuestions(stateQuestions || []));
  }, [stateQuestions]);

  // Show toast notification for refresh
  useEffect(() => {
    // Check if page was refreshed (no location state means refresh)
    if (!stateQuestions || !stateDuration) {
      if (!hasShownToast.current) {
        hasShownToast.current = true;
        
        // Show toast notification
        toast({
          title: "Test Restarted",
          description: "The page was refreshed. You'll need to start the test again from the beginning.",
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
    if (timerPaused) return; // hold the clock on concept/instruction pages
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
  }, [timeLeft, timerPaused]);

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
    if (!currentItem || currentItem.type !== "question") return;

    const qid = currentItem.question.id;
    const option = currentItem.question.options[optionIndex];
    
    // Get the option ID if it exists, otherwise use 1-based index as fallback
    const optionId = typeof option === 'object' && option?.id 
      ? option.id 
      : optionIndex + 1;
    
    setAnswers({ ...answers, [qid]: optionId });
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
      toast({
        title: "Oops! Session Expired",
        description: "Your session has expired. Please log in again to continue.",
        variant: "destructive",
      });
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
      toast({
        title: "Submission Issue",
        description: "We couldn't submit your test right now. Don't worry, your answers are safe. Please try submitting again.",
        variant: "destructive",
      });
      setShowConfirm(false);
      isSubmitting.current = false; // Reset on error to allow retry
    }
  };

  if (timeLeft === null || questions.length === 0 || !currentItem || !currentQuestion) {
    return (
      <div className="text-center mt-10 text-lg font-semibold">
        Loading test...
      </div>
    );
  }

  return (
    <div
      className="min-h-screen student-bg-gradient flex items-center justify-center p-4 select-none"
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="bg-card rounded-2xl shadow-large p-8 w-full max-w-3xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-xl text-primary">
            {currentItem.type === "instruction"
              ? "Topic Instruction"
              : `Question ${currentItem.questionNumber} / ${questions.length}`}
          </h2>
          <div className={`font-bold px-4 py-2 rounded-lg shadow-soft ${timerPaused ? "bg-muted text-muted-foreground" : "bg-destructive/10 text-destructive"}`}>
            {timerPaused ? "⏸ " : "⏳ "}{formatTime(timeLeft)}
          </div>
        </div>

        {currentItem.type === "instruction" ? (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-pink-50 p-5 shadow-sm">
            {currentItem.topicDetails?.topic && (
              <div className="mb-2 font-bold text-sm text-slate-900">
                {currentItem.topicDetails.topic}:
              </div>
            )}
            {looksLikeHtml(normalizeInstructionContent(currentItem.instruction)) ? (
              <div
                className="quill-content text-sm leading-6 text-slate-700 break-words [&_*]:break-words"
                dangerouslySetInnerHTML={{ __html: normalizeInstructionContent(currentItem.instruction) }}
              />
            ) : (
              <div className="whitespace-pre-line text-sm leading-6 text-slate-700">
                {normalizeInstructionContent(currentItem.instruction)}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Question */}
            <div className="rounded-2xl p-6 mb-6 bg-pink-50 text-slate-900 shadow-sm">
              <QuestionFormattedText
                text={getQuestionTextForLanguage(currentQuestion, selectedLanguage)}
              />
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((opt, idx) => {
                const qid = currentQuestion.id;
                const q = currentQuestion as any;
            // get question text for current language (used to detect percent questions)
                const questionTextForLang = getQuestionTextForLanguage(q, selectedLanguage);

            // pick option value for current language
                const optionForLang = (() => {
                  if (typeof opt === "string") return opt;
                  if (opt?.text) return opt.text;
                  // legacy: try language-specific options if available on question
                  const optsKey = `${selectedLanguage}_options`;
                  if (q?.[optsKey] && Array.isArray(q[optsKey]) && q[optsKey][idx]) {
                    return q[optsKey][idx];
                  }
                  return opt?.label ?? JSON.stringify(opt);
                })();

                const display = formatOptionDisplay(questionTextForLang, optionForLang);
            
            // Get the option ID for comparison
                const optionId = typeof opt === 'object' && opt?.id 
                  ? opt.id 
                  : idx + 1;

                return (
                  <label
                    key={idx}
                    className={`block border rounded-lg px-4 py-3 cursor-pointer transition ${
                      answers[qid] === optionId
                        ? "bg-secondary-purple-light border-secondary-purple text-secondary-purple font-medium shadow-md"
                        : "hover:bg-muted border-border"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${qid}`}
                      checked={answers[qid] === optionId}
                      onChange={() => handleAnswer(idx)}
                      className="hidden"
                    />
                    <span className="whitespace-pre-line text-foreground text-sm">
                      {display}
                    </span>
                  </label>
                );
              })}
            </div>
          </>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <button
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => i - 1)}
            className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium disabled:opacity-50 hover:bg-secondary/80 transition"
          >
            Previous
          </button>

          {currentIndex === displayItems.length - 1 ? (
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
              {currentItem.type === "instruction" ? "Start Question" : "Next"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestPage;
