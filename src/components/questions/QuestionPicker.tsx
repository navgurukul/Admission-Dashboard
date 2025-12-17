import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect, useMemo } from "react";
import { getQuestionsBySetType } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";

interface QuestionPickerProps {
  activeSet: any; // activeSet.type should be "A", "B", etc.
  onClose: () => void;
  onSave: (selected: any[]) => void;
  difficultyLevel?: { id: number; name: string; points: number }[];
}

export function QuestionPicker({
  activeSet,
  onClose,
  onSave,
  difficultyLevel,
}: QuestionPickerProps) {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<any[]>([]);
  const [selected, setSelected] = useState<any[]>(activeSet.questions || []);
  const [searchText, setSearchText] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch Set + Remaining questions
  useEffect(() => {
    if (!activeSet?.name) return; // exit if type is missing

    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const mainSet = await getQuestionsBySetType(activeSet.name);
        const remainingSet = await getQuestionsBySetType("Remaining");
        const mergedQuestions = [
          ...(mainSet.data || []),
          ...(remainingSet.data || []),
        ];
        setQuestions(mergedQuestions);
        setSelected(activeSet.questions || []);
      } catch (err) {
        console.error("Failed to fetch questions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [activeSet]);

  const toggle = (q: any) => {
    setSelected((prev) => {
      const exists = prev.find((item) => item.id === q.id);

      // If deselecting, allow it
      if (exists) return prev.filter((item) => item.id !== q.id);

      // If selecting, check constraints
      // 1. Check total questions limit (18)
      if (prev.length >= 18) {
        toast({
          title: "⚠️ Maximum Questions Reached",
          description: "You cannot select more than 18 questions.",
          variant: "destructive",
          className: "border-orange-500 bg-orange-50 text-orange-900",
        });
        return prev;
      }

      // 2. Check total marks limit (36)
      const currentMarks = prev.reduce((sum, question) => {
        const diffName = difficultyMap[question.difficulty_level]?.name.toLowerCase();
        const marks = diffName === "easy" ? 1 : diffName === "medium" ? 2 : diffName === "hard" ? 3 : 0;
        return sum + marks;
      }, 0);

      const newQuestionDiffName = difficultyMap[q.difficulty_level]?.name.toLowerCase();
      const newQuestionMarks = newQuestionDiffName === "easy" ? 1 : newQuestionDiffName === "medium" ? 2 : newQuestionDiffName === "hard" ? 3 : 0;

      if (currentMarks + newQuestionMarks > 36) {
        toast({
          title: "⚠️ Maximum Marks Exceeded",
          description: `Adding this question would exceed 36 marks. Current: ${currentMarks} marks.`,
          variant: "destructive",
          className: "border-orange-500 bg-orange-50 text-orange-900",
        });
        return prev;
      }

      return [...prev, q];
    });
  };

  const difficultyMap = Array.isArray(difficultyLevel)
    ? difficultyLevel.reduce(
      (acc, d) => {
        acc[d.id] = d;
        return acc;
      },
      {} as Record<number, { id: number; name: string; points: number }>,
    )
    : {};

  const getDifficultyColor = (diffId: number) => {
    const diffName = difficultyMap[diffId]?.name || "Unknown";
    switch (diffName.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "hard":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // Use fetched questions for filtering
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch =
        q.english_text.toLowerCase().includes(searchText.toLowerCase()) ||
        q.hindi_text.toLowerCase().includes(searchText.toLowerCase()) ||
        q.marathi_text.toLowerCase().includes(searchText.toLowerCase());

      const matchesDifficulty =
        difficultyFilter === null || q.difficulty_level === difficultyFilter;

      return matchesSearch && matchesDifficulty;
    });
  }, [questions, searchText, difficultyFilter]);

  const handleSave = () => {
    // Count questions by difficulty
    const easyCount = selected.filter(
      (q) => difficultyMap[q.difficulty_level]?.name.toLowerCase() === "easy"
    ).length;
    const mediumCount = selected.filter(
      (q) => difficultyMap[q.difficulty_level]?.name.toLowerCase() === "medium"
    ).length;
    const hardCount = selected.filter(
      (q) => difficultyMap[q.difficulty_level]?.name.toLowerCase() === "hard"
    ).length;

    // Validation: Check difficulty-specific counts FIRST (more specific feedback)
    if (easyCount !== 5) {
      const diff = 5 - easyCount;
      toast({
        title: "⚠️ Easy Questions Required",
        description: easyCount < 5
          ? `You have ${easyCount} Easy question${easyCount !== 1 ? 's' : ''}. Please select ${diff} more Easy question${diff > 1 ? 's' : ''}.`
          : `You have ${easyCount} Easy questions. Please remove ${Math.abs(diff)} Easy question${Math.abs(diff) > 1 ? 's' : ''}.`,
        variant: "destructive",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    if (mediumCount !== 8) {
      const diff = 8 - mediumCount;
      toast({
        title: "⚠️ Medium Questions Required",
        description: mediumCount < 8
          ? `You have ${mediumCount} Medium question${mediumCount !== 1 ? 's' : ''}. Please select ${diff} more Medium question${diff > 1 ? 's' : ''}.`
          : `You have ${mediumCount} Medium questions. Please remove ${Math.abs(diff)} Medium question${Math.abs(diff) > 1 ? 's' : ''}.`,
        variant: "destructive",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    if (hardCount !== 5) {
      const diff = 5 - hardCount;
      toast({
        title: "⚠️ Hard Questions Required",
        description: hardCount < 5
          ? `You have ${hardCount} Hard question${hardCount !== 1 ? 's' : ''}. Please select ${diff} more Hard question${diff > 1 ? 's' : ''}.`
          : `You have ${hardCount} Hard questions. Please remove ${Math.abs(diff)} Hard question${Math.abs(diff) > 1 ? 's' : ''}.`,
        variant: "destructive",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    // Check total count last (minimum 18 required, can be more)
    const totalCount = selected.length;
    if (totalCount < 18) {
      const diff = 18 - totalCount;
      toast({
        title: "⚠️ Minimum Questions Required",
        description: `You have selected ${totalCount} question${totalCount !== 1 ? 's' : ''}. Please select ${diff} more question${diff > 1 ? 's' : ''} to reach minimum of 18.`,
        variant: "destructive",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    onSave(selected);
    onClose();
  };

  // Calculate selected questions stats
  const selectedStats = useMemo(() => {
    const easyQuestions = selected.filter(
      (q) => difficultyMap[q.difficulty_level]?.name.toLowerCase() === "easy"
    );
    const mediumQuestions = selected.filter(
      (q) => difficultyMap[q.difficulty_level]?.name.toLowerCase() === "medium"
    );
    const hardQuestions = selected.filter(
      (q) => difficultyMap[q.difficulty_level]?.name.toLowerCase() === "hard"
    );

    // Fixed marks: Easy=1, Medium=2, Hard=3
    const easyMarks = easyQuestions.length * 1;
    const mediumMarks = mediumQuestions.length * 2;
    const hardMarks = hardQuestions.length * 3;

    return {
      total: selected.length,
      easy: easyQuestions.length,
      medium: mediumQuestions.length,
      hard: hardQuestions.length,
      totalMarks: easyMarks + mediumMarks + hardMarks,
      easyMarks,
      mediumMarks,
      hardMarks,
    };
  }, [selected, difficultyMap]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Choose Questions for{" "}
            <span className="font-semibold">{activeSet.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Search questions..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="flex-1 border rounded px-2 py-1"
          />
          <select
            value={difficultyFilter ?? ""}
            onChange={(e) =>
              setDifficultyFilter(
                e.target.value ? Number(e.target.value) : null,
              )
            }
            className="border rounded px-2 py-1"
          >
            <option value="">All Difficulties</option>
            {Array.isArray(difficultyLevel) &&
              difficultyLevel.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
          </select>
        </div>

        {/* Total Marks Display */}
        <div className="flex justify-between items-stretch gap-3 mb-3">
          <div className="flex items-center gap-3 text-xs bg-gray-50 border border-gray-300 rounded-lg px-4 py-2">
            <span
              className={`${selectedStats.easy === 5
                  ? "text-green-600 font-semibold"
                  : "text-red-600"
                }`}
            >
              Easy: {selectedStats.easy} / 5
            </span>
            <span
              className={`${selectedStats.medium === 8
                  ? "text-green-600 font-semibold"
                  : "text-red-600"
                }`}
            >
              Medium: {selectedStats.medium} / 8
            </span>
            <span
              className={`${selectedStats.hard === 5
                  ? "text-green-600 font-semibold"
                  : "text-red-600"
                }`}
            >
              Hard: {selectedStats.hard} / 5
            </span>
          </div>
          <div className="flex items-center bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 w-auto">
            <div className="text-base font-bold text-green-700">
              Total Marks: {selectedStats.totalMarks}
            </div>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto space-y-2 mt-3">
          {loading ? (
            <div className="text-center py-4">Loading questions...</div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-4">No questions found.</div>
          ) : (
            filteredQuestions.map((q) => {
              const diff = difficultyMap[q.difficulty_level];
              return (
                <div
                  key={q.id}
                  className="flex items-start gap-3 p-2 border rounded hover:bg-gray-50"
                >
                  <Checkbox
                    checked={selected.some((item) => item.id === q.id)}
                    onCheckedChange={() => toggle(q)}
                  />

                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(
                      diff?.id,
                    )}`}
                  >
                    {diff?.name || "Unknown"}
                  </span>

                  <div className="text-sm flex-1">{q.english_text}</div>
                  <div className="text-sm flex-1">{q.hindi_text}</div>
                  <div className="text-sm flex-1">{q.marathi_text}</div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="mt-4">
          <div className="flex-1 space-y-2">
            <div className="text-sm font-semibold text-gray-800">
              Total Selected: {selectedStats.total}
            </div>
            {/* <div className="flex gap-4 text-xs text-gray-600">
              <span
                className={`${
                  selectedStats.easy === 5
                    ? "text-green-600 font-semibold"
                    : "text-red-600"
                }`}
              >
                Easy: {selectedStats.easy} / 5
              </span>
              <span
                className={`${
                  selectedStats.medium === 8
                    ? "text-green-600 font-semibold"
                    : "text-red-600"
                }`}
              >
                Medium: {selectedStats.medium} / 8
              </span>
              <span
                className={`${
                  selectedStats.hard === 5
                    ? "text-green-600 font-semibold"
                    : "text-red-600"
                }`}
              >
                Hard: {selectedStats.hard} / 5
              </span>
            </div> */}
            <div className="text-xs text-orange-600 font-medium">
              ⚠️ Required: 18 questions (5 Easy + 8 Medium + 5 Hard)
            </div>
          </div>
          <Button onClick={handleSave}>Save</Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
