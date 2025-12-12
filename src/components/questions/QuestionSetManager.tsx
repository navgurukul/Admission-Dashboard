import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks, Trash2, Plus, Pencil, Download } from "lucide-react";
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
import {
  getAllQuestionSets,
  deleteQuestionFromSet,
  createQuestionSetMappings,
  getQuestionsBySetType,
  deleteQuestionSet,
  createQuestionSet,
  updateQuestionSet,
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
    maximumMarks: 0,
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
        created_at: s.created_at,
        updated_at: s.updated_at,
      }));

    setSets(setsWithQuestions);
  };
  useEffect(() => {
    fetchSets();
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
    setFormData({ name: "", description: "", maximumMarks: 0 });
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
    try {
      if (editingSet) {
        // Update existing set
        await updateQuestionSet(editingSet.id, formData);
        toast({
          title: "Set updated",
          description: "The question set has been updated successfully.",
        });
      } else {
        // Create new set
        await createQuestionSet(formData);
        toast({
          title: "Set created",
          description: "A new question set has been added.",
        });
      }
      setIsModalOpen(false);
      // Refetch only sets metadata (without questions for speed)
      await fetchSets(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const deleteSet = async (id: number) => {
    try {
      await deleteQuestionSet(id);
      setSets((prev) => prev.filter((s) => s.id !== id));
      toast({
        title: "Set deleted",
        description: "The set has been removed successfully.",
        variant: "destructive",
      });
      await fetchSets();
    } catch (err) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const downloadPDF = async () => {
    try {
      // Load all questions for all sets before generating PDF
      await fetchSets(true);

      // Wait a bit for state to update
      setTimeout(() => {
        const printContent = generatePDFContent();
        const printWindow = window.open("", "_blank");

        if (printWindow) {
          printWindow.document.write(printContent);
          printWindow.document.close();
          printWindow.focus();

          // Wait for content to load before printing
          setTimeout(() => {
            printWindow.print();
          }, 250);
        }
      }, 500);

      toast({
        title: "Download initiated",
        description: "Please wait while we prepare your PDF...",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const generatePDFContent = () => {
    const setsHTML = sets
      .map(
        (set) => `
        <div style="page-break-after: always; margin-bottom: 30px;">
          <h2 style="color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
            ${set.name}
          </h2>
          ${set.description ? `<p style="color: #6b7280; margin: 10px 0;"><strong>Description:</strong> ${set.description}</p>` : ""}
          <p style="color: #6b7280; margin: 10px 0;"><strong>Maximum Marks:</strong> ${set.limit}</p>
          <p style="color: #6b7280; margin: 10px 0 20px 0;"><strong>Total Questions:</strong> ${set.questions.length}</p>
          
          ${set.questions.length > 0 ? `
            <div style="margin-top: 20px;">
              ${set.questions
              .map(
                (q, idx) => `
                <div style="margin-bottom: 20px; padding: 15px; background: #f9fafb; border-left: 4px solid #3b82f6;">
                  <p style="font-weight: bold; margin-bottom: 10px;">Q${idx + 1}. ${q.question_text || q.text || "N/A"}</p>
                  <p style="color: #6b7280; margin: 5px 0;"><strong>Difficulty:</strong> ${q.difficulty_level || "N/A"}</p>
                  <p style="color: #6b7280; margin: 5px 0;"><strong>Marks:</strong> ${q.marks || "N/A"}</p>
                  ${q.options ? `<p style="color: #6b7280; margin: 5px 0;"><strong>Type:</strong> ${q.type || "Multiple Choice"}</p>` : ""}
                </div>
              `,
              )
              .join("")}
            </div>
          ` : '<p style="color: #9ca3af;">No questions added yet.</p>'}
        </div>
      `,
      )
      .join("");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Question Sets - ${new Date().toLocaleDateString()}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; }
              @page { margin: 1cm; }
            }
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #1f2937;
            }
          </style>
        </head>
        <body>
          <h1 style="text-align: center; color: #1f2937; margin-bottom: 30px;">
            Question Sets Report
          </h1>
          <p style="text-align: center; color: #6b7280; margin-bottom: 40px;">
            Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
          </p>
          ${setsHTML}
        </body>
      </html>
    `;
  };

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex justify-end gap-2 mb-4">
        <Button onClick={openAddModal} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Set
        </Button>
        <Button onClick={downloadPDF} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>

      <div className="flex-1 overflow-auto space-y-4 pr-2 [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-muted/30 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/50">
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
                    <Pencil className="h-4 w-4 text-blue-500" />
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
                    maximumMarks: parseInt(e.target.value) || 0,
                  })
                }
                placeholder=" Enter Marks"
                min="0"
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
