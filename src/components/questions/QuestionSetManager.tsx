import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks, Trash2 } from "lucide-react";
import { QuestionPicker } from "./QuestionPicker";
import { useToast } from "@/components/ui/use-toast";
import {
  getAllQuestionSets,
  deleteQuestionFromSet,
  createQuestionSetMappings,
  getQuestionsBySetType,
} from "@/utils/api";

export function QuestionSetManager({ allQuestions, difficultyLevels }) {
  const { toast } = useToast();
  const [sets, setSets] = useState([]);
  const [activeSet, setActiveSet] = useState(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchSets = async () => {
      const setsFromApi = await getAllQuestionSets();

      // fetch mapped questions for each set
      const setsWithQuestions = await Promise.all(
        setsFromApi.map(async (s) => {
          const mapped = await getQuestionsBySetType(s.name); // fetch mapped questions
          return {
            id: s.id,
            name: s.name,
            limit: s.maximumMarks,
            questions: mapped.data || [], // actual selected questions
            active: s.status,
            created_at: s.created_at,
            updated_at: s.updated_at,
          };
        }),
      );

      setSets(setsWithQuestions);
    };
    fetchSets();
  }, []);

  // Function to handle saving selected questions
  const handleSaveQuestions = async (selected: any[], activeSet: any) => {
    try {
      const prevSelected = activeSet.questions || [];

      // Find newly added
      const added = selected.filter(
        (q) => !prevSelected.some((p) => p.id === q.id),
      );

      // Find removed
      const removed = prevSelected.filter(
        (p) => !selected.some((q) => q.id === p.id),
      );

      // Add new mappings
      if (added.length > 0) {
        const addPayload = added.map((q) => ({
          question_set_id: activeSet.id,
          question_id: q.id,
          difficulty_level: q.difficulty_level,
        }));
        await createQuestionSetMappings(addPayload);
      }

      // Delete removed mappings
      // if (removed.length > 0) {
      //   const removePayload = removed.map((q) => ({
      //     question_set_id: activeSet.id,
      //     question_id: q.id,
      //   }));
      //   await deleteQuestionFromSet(removePayload);
      // }

      if (removed.length > 0) {
        for (const q of removed) {
          await deleteQuestionFromSet(q.id);
        }
      }
      // Update local state
      setSets((prev) =>
        prev.map((s) =>
          s.id === activeSet.id ? { ...s, questions: selected } : s,
        ),
      );

      toast({
        title: "Questions updated",
        description: `Added: ${added.length}, Removed: ${removed.length}`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  //   Functions
  const addSet = () => {
    setSets((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: `Set ${String.fromCharCode(65 + prev.length)}`,
        limit: 0,
        questions: [],
        active: true,
      },
    ]);
    toast({
      title: "Set created",
      description: "A new question set has been added.",
    });
  };

  const deleteSet = async (id: number) => {
    try {
      // await deleteQuestionFromSet(id);
      setSets((prev) => prev.filter((s) => s.id !== id));
      toast({
        title: "Set deleted",
        description: "The set has been removed successfully.",
        variant: "destructive",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {sets.map((set) => (
        <Card key={set.id} className="relative">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-base font-semibold">
                {set.name}
              </CardTitle>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteSet(set.id)}
                  title="Delete set"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <p className="text-sm font-medium text-gray-600">
              You’ve selected <strong>{set.questions.length}</strong> question
              {set.questions.length !== 1 && "s"}.
            </p>

            {/* <p className="text-xs text-gray-500">
              Created: {new Date(set.created_at).toLocaleDateString()} <br />
              Updated: {new Date(set.updated_at).toLocaleDateString()}
            </p> */}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveSet(set)}
            >
              <ListChecks className="h-4 w-4 mr-2" />
              Pick Questions
            </Button>
          </CardContent>
        </Card>
      ))}

      {/* <Button onClick={addSet} variant="outline">
        <Plus className="h-4 w-4 mr-2" />
        Add Set
      </Button> */}

      {activeSet && (
        <QuestionPicker
          // allQuestions={allQuestions}
          activeSet={activeSet}
          onClose={() => setActiveSet(null)}
          difficultyLevel={difficultyLevels}
          onSave={(selected) => handleSaveQuestions(selected, activeSet)}
        />
      )}
    </div>
  );
}
