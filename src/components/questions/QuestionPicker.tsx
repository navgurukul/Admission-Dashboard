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
      if (exists) return prev.filter((item) => item.id !== q.id);
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
    onSave(selected);
    onClose();
  };

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
          <div className="text-sm text-gray-600 mr-auto">
            Selected: {selected.length}
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
