import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, ListChecks, Trash2, Pencil } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { QuestionPicker } from "./QuestionPicker";
import { useToast } from "@/components/ui/use-toast";

export function QuestionSetManager({ allQuestions }) {
  const { toast } = useToast();
  const [sets, setSets] = useState([
    { id: 1, name: "Set A", limit: 0, questions: [], active: true },
  ]);

  const [activeSet, setActiveSet] = useState(null);
  const [editingId, setEditingId] = useState<number | null>(null);

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

  const updateSet = (id, key, value) => {
    setSets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [key]: value } : s))
    );
  };

  const deleteSet = (id) => {
    setSets((prev) => prev.filter((s) => s.id !== id));
    toast({
      title: "Set deleted",
      description: "The set has been removed successfully.",
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-4">
      {sets.map((set) => (
        <Card key={set.id} className="relative">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
  <CardTitle className="text-base font-semibold">{set.name}</CardTitle>

               <div className="flex items-center gap-2">
                <Switch
                  checked={set.active}
                  disabled={editingId !== set.id}
                  onCheckedChange={(val) => updateSet(set.id, "active", val)}
                />

                {editingId === set.id ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingId(set.id)}
                    title="Edit set"
                  >
                    <Pencil className="h-4 w-4 text-gray-600" />
                  </Button>
                )}

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
            <div className="flex flex-wrap items-center gap-3">
  <label className="text-sm font-medium min-w-[100px]">Max Questions</label>  <Input
                type="number"
                value={set.limit}
                onChange={(e) =>
                  updateSet(set.id, "limit", parseInt(e.target.value) || 0)
                }
                placeholder="e.g. 100"
                className="flex-1 min-w-[120px]"
                disabled={editingId !== set.id}
              />
            </div>

            <p
              className={`text-sm font-medium ${
                set.limit && set.questions.length > set.limit
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              You’ve selected <strong>{set.questions.length}</strong> question
              {set.questions.length !== 1 && "s"}
              {set.limit ? (
                <>
                  {" "}
                  out of <strong>{set.limit}</strong> total
                </>
              ) : (
                ""
              )}
              .
            </p>

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

      <Button onClick={addSet} variant="outline">
        <Plus className="h-4 w-4 mr-2" />
        Add Set
      </Button>

      {activeSet && (
        <QuestionPicker
          allQuestions={allQuestions}
          activeSet={activeSet}
          onClose={() => setActiveSet(null)}
          onSave={(selected) => updateSet(activeSet.id, "questions", selected)}
        />
      )}
    </div>
  );
}
