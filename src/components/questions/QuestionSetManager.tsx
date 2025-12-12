import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListChecks, Trash2, Plus, Edit, Download } from "lucide-react";
import { QuestionPicker } from "./QuestionPicker";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getAllQuestionSets,
  deleteQuestionFromSet,
  createQuestionSetMappings,
  getQuestionsBySetType,
  deleteQuestionSet,
  createQuestionSet,
  updateQuestionSet,
  setDefaultOnlineQuestionSet,
} from "@/utils/api";

export function QuestionSetManager({ allQuestions, difficultyLevels }) {
  const { toast } = useToast();
  const [sets, setSets] = useState([]);
  const [activeSet, setActiveSet] = useState(null);
  // const [editingId, setEditingId] = useState<number | null>(null);.
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    maximumMarks: "" as any,
  });


  const fetchSets = async (loadQuestions = true) => {
    const setsFromApi = await getAllQuestionSets();

    // fetch mapped questions for each set only if needed
    const setsWithQuestions = loadQuestions
      ? await Promise.all(
        setsFromApi.map(async (s) => {
          try {
            const mapped = await getQuestionsBySetType(s.name); // fetch mapped questions
            return {
              id: s.id,
              name: s.name,
              description: s.description,
              limit: s.maximumMarks,
              questions: mapped.data || [], // actual selected questions
              active: s.status,
              is_default_online_set: s.is_default_online_set,
              created_at: s.created_at,
              updated_at: s.updated_at,
            };
          } catch (error) {
            return {
              id: s.id,
              name: s.name,
              description: s.description,
              limit: s.maximumMarks,
              questions: [],
              active: s.status,
              is_default_online_set: s.is_default_online_set,
              created_at: s.created_at,
              updated_at: s.updated_at,
            };
          }
        }),
      )
      : setsFromApi.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        limit: s.maximumMarks,
        questions: [],
        active: s.status,
        is_default_online_set: s.is_default_online_set,
        created_at: s.created_at,
        updated_at: s.updated_at,
      }));

    setSets(setsWithQuestions);
  };
  useEffect(() => {
    fetchSets(true);
  }, []);

  const loadSetQuestions = async (setId: number) => {
    try {
      const set = sets.find((s) => s.id === setId);
      if (!set) return;

      const mapped = await getQuestionsBySetType(set.name);
      setSets((prev) =>
        prev.map((s) =>
          s.id === setId ? { ...s, questions: mapped?.data || [] } : s,
        ),
      );
    } catch (error) {
      console.warn(`Error loading questions for set ${setId}:`, error);
    }
  };

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
        await Promise.all(removed.map((q) => deleteQuestionFromSet(q.id)));
      }
      // Update local state
      setSets((prev) =>
        prev.map((s) =>
          s.id === activeSet.id ? { ...s, questions: selected } : s,
        ),
      );

      toast({
        title: "✅ Questions Apdated Successfully",
        description: `Added: ${added.length}`,
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });
    } catch (err: any) {
      toast({
        title: " Failed to Update Questions",
        description: err.message || "An error occurred while updating questions. Please try again.",
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    }
  };

  //   Functions
  // const addSet = () => {
  //   setSets((prev) => [
  //     ...prev,
  //     {
  //       id: Date.now(),
  //       name: `Set ${String.fromCharCode(65 + prev.length)}`,
  //       limit: 0,
  //       questions: [],
  //       active: true,
  //     },
  //   ]);
  //   toast({
  //     title: "Set created",
  //     description: "A new question set has been added.",
  //   });
  // };

  const openAddModal = () => {
    setEditingSet(null);
    setFormData({ name: "", description: "", maximumMarks:  "" as any });
    setIsModalOpen(true);
  };

  const openEditModal = (set: any) => {
    setEditingSet(set);
    setFormData({
      name: set.name,
      description: set.description || "",
      maximumMarks: set.limit,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast({
        title: "⚠️ Required Field Missing",
        description: "Please enter a set name",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    if (formData.maximumMarks <= 0) {
      toast({
        title: "⚠️ Invalid Value",
        description: "Maximum marks must be greater than 0",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    try {
      const payload = {
        ...formData,
        maximumMarks: parseInt(formData.maximumMarks) || 0,
      };

      if (editingSet) {
        // Update existing set
        await updateQuestionSet(editingSet.id, payload);
        toast({
          title: "✅ Set Updated Successfully",
          description: `"${formData.name}" has been updated successfully.`,
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900",
        });
      } else {
        // Create new set
        await createQuestionSet(payload);
        toast({
          title: "✅ Set Created Successfully",
          description: `"${formData.name}" has been added.`,
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900",
        });
      }
      setIsModalOpen(false);
      // Refetch only sets metadata (without questions for speed)
      await fetchSets(false);
    } catch (err: any) {
      toast({
        title: "❌ Operation Failed",
        description: err.message || "An error occurred. Please try again.",
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    }
  };

  const deleteSet = async (id: number) => {
    const setToDelete = sets.find((s) => s.id === id);
    
    try {
      await deleteQuestionSet(id);
      setSets((prev) => prev.filter((s) => s.id !== id));
      toast({
        title: "✅ Set Deleted Successfully",
        description: `"${setToDelete?.name || 'Set'}" has been removed.`,
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });
      await fetchSets(false);
    } catch (err: any) {
      toast({
        title: "❌ Failed to Delete Set",
        description: err.message || "Unable to delete the set. It may contain questions or be in use.",
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    }
  };

  const defaultSet = sets.find((s) => s.is_default_online_set);

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex justify-end items-center gap-3 mb-4">
        <Button onClick={openAddModal} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Set
        </Button>
        {defaultSet && (
          <div className="flex items-center gap-2 border border-green-300 rounded-md px-3 py-1.5 bg-green-50">
            <span className="text-sm font-medium text-green-700">Default Set:</span>
            <span className="text-sm font-semibold text-green-800">
              {defaultSet.name}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto space-y-4 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {sets.length === 0 && (
          <p className="text-gray-500 text-sm">No question sets found. Click "Add Set" to create one.</p>
        )}
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
                    onClick={() => openEditModal(set)}
                    title="Edit set"
                  >
                    <Edit className="h-4 w-4 text-black-500" />
                  </Button>
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

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await loadSetQuestions(set.id)
                    setActiveSet(set)
                  }}
                >
                  <ListChecks className="h-4 w-4 mr-2" />
                  Pick Questions
                </Button>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`default-${set.id}`}
                    checked={set.is_default_online_set || false}
                    className="rounded-none data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    onCheckedChange={async (checked) => {
                      if (checked) {
                        try {
                          await setDefaultOnlineQuestionSet(set.id);
                          setSets((prev) =>
                            prev.map((s) => ({
                              ...s,
                              is_default_online_set: s.id === set.id,
                            }))
                          );
                          toast({
                            title: "✅ Default Set Updated",
                            description: `"${set.name}" is now the default online test set.`,
                            variant: "default",
                            className: "border-green-500 bg-green-50 text-green-900",
                          });
                        } catch (err: any) {
                          toast({
                            title: "❌ Failed to Set Default",
                            description: err.message || "Unable to set default online test set. Please try again.",
                            variant: "destructive",
                            className: "border-red-500 bg-red-50 text-red-900",
                          });
                        }
                      }
                    }}
                  />
                  <Label
                    htmlFor={`default-${set.id}`}
                    className="text-xs cursor-pointer whitespace-nowrap"
                  >
                    Mark Default
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* <Button onClick={addSet} variant="outline">
        <Plus className="h-4 w-4 mr-2" />
        Add Set
      </Button> */}

      {activeSet && (
        <QuestionPicker
          // allQuestions={allQuestions}
          activeSet={sets.find((s) => s.id === activeSet.id) || activeSet}
          onClose={() => setActiveSet(null)}
          difficultyLevel={difficultyLevels}
          onSave={(selected) => handleSaveQuestions(selected, activeSet)}
        />
      )}
      {/* Add/Edit Set Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSet ? "Edit Question Set" : "Create Question Set"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Set Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter Set name"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of this question set"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="maximumMarks">Maximum Marks</Label>
              <Input
                id="maximumMarks"
                type="number"
                value={formData.maximumMarks}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maximumMarks: e.target.value,
                  })
                }
                placeholder="Enter Marks"
                min="1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingSet ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
