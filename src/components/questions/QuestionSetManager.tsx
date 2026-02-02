import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListChecks, Trash2, Plus, Edit, Download, Eye } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { QuestionPicker } from "./QuestionPicker";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  getAllQuestionSets,
  deleteQuestionFromSet,
  createQuestionSetMappings,
  getQuestionsBySetType,
  deleteQuestionSet,
  createQuestionSet,
  updateQuestionSet,
  setDefaultOnlineQuestionSet,
  downloadQuestionSetPDF,
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
    nameType: "random", // "random" | "custom"
    isRandom: true,
  });
  const [pendingSetData, setPendingSetData] = useState<any>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadFormData, setDownloadFormData] = useState({
    selectedSet: "",
    language: "English",
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [setToDelete, setSetToDelete] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingSet, setViewingSet] = useState<any>(null);


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
    fetchSets(false); // prevent unnecessary api call for sets.
  }, []);

  const loadSetQuestions = async (setId: number) => {
    try {
      const set = sets.find((s) => s.id === setId);
      if (!set) return null;

      const mapped = await getQuestionsBySetType(set.name);
      const updatedSet = { ...set, questions: mapped?.data || [] };
      
      setSets((prev) =>
        prev.map((s) =>
          s.id === setId ? updatedSet : s,
        ),
      );
      
      return updatedSet;
    } catch (error) {
      console.warn(`Error loading questions for set ${setId}:`, error);
      return null;
    }
  };

  // Function to handle saving selected questions
  const handleSaveQuestions = async (selected: any[], activeSet: any) => {
    try {
      // If this is a new custom set that hasn't been created yet
      if (activeSet.id === -1 && pendingSetData) {
        const payload = {
          name: pendingSetData.name,
          description: pendingSetData.description,
          isRandom: false,
          questions: selected.map((q) => ({
            question_id: q.id,
            difficulty_level: q.difficulty_level
          }))
        };

        await createQuestionSet(payload);
        toast({
          title: "✅ Set Created Successfully",
          description: `"${pendingSetData.name}" has been created with ${selected.length} questions.`,
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900",
        });

        setActiveSet(null);
        setPendingSetData(null);
        await fetchSets(false);
        return;
      }

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
        title: "✅ Questions Added Successfully",
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
    const randomName = `Set ${sets.length + 1}`;
    setFormData({ name: randomName, description: "", nameType: "random", isRandom: true });
    setIsModalOpen(true);
  };

  const openEditModal = (set: any) => {
    setEditingSet(set);
    setFormData({
      name: set.name,
      description: set.description || "",
      nameType: "custom", // Always custom when editing
      isRandom: false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    // Validation
    // let limit = 0; // Default limit since we removed the field
    let finalName = formData.name;

    if (!formData.name.trim()) {
      toast({
        title: "⚠️ Required Field Missing",
        description: "Please enter a set name",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: "⚠️ Required Field Missing",
        description: "Please enter a description",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }



    try {
      const payload = {
        name: finalName,
        description: formData.description,
        isRandom: formData.isRandom,
      };

      if (editingSet) {
        // Update existing set
        await updateQuestionSet(editingSet.id, payload);
        toast({
          title: "✅ Set Updated Successfully",
          description: `"${finalName}" has been updated successfully.`,
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900",
        });
        setIsModalOpen(false);
        await fetchSets(false);
      } else {
        // Create new set

        // If Custom Name (and thus "Next" flow), defer creation
        if (formData.nameType === "custom") {
          setIsModalOpen(false);
          setPendingSetData({
            name: finalName,
            description: formData.description
          });

          // Create a temporary "fake" set to trigger the picker
          const tempSet = {
            id: -1, // signal that this is new
            name: finalName,
            limit: 0,
            questions: [],
            active: true,
            isNewCustom: true // Optional helper flag
          };
          setActiveSet(tempSet);
          return;
        }

        const newSet = await createQuestionSet(payload);
        toast({
          title: "✅ Set Created Successfully",
          description: `"${finalName}" has been added.`,
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900",
        });

        setIsModalOpen(false);
        await fetchSets(false);
      }
    } catch (err: any) {
      toast({
  title: "Oops!",
  description: "There was a small issue while processing your request. Please try again.",
  variant: "destructive",
  className: "border-red-500 bg-red-50 text-red-900",
});
    }
  };

  const openDeleteConfirm = (set: any) => {
    setSetToDelete(set);
    setDeleteConfirmOpen(true);
  };

  const deleteSet = async () => {
    if (!setToDelete) return;

    try {
      await deleteQuestionSet(setToDelete.id);
      setSets((prev) => prev.filter((s) => s.id !== setToDelete.id));
      toast({
        title: "✅ Set Deleted Successfully",
        description: `"${setToDelete?.name || 'Set'}" has been removed.`,
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });
      await fetchSets(false);
      setDeleteConfirmOpen(false);
      setSetToDelete(null);
    } catch (err: any) {
      toast({
        title: "❌ Failed to Delete Set",
        description: err.message || "Unable to delete the set. It may contain questions or be in use.",
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    }
  };

  // const defaultSet = sets.find((s) => s.is_default_online_set);

  const handleDownloadSubmit = async () => {
    if (!downloadFormData.selectedSet) {
      toast({
        title: "⚠️ Required Field Missing",
        description: "Please select a question set",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    try {
      // Find the set ID from the selected set name
      const selectedSet = sets.find((s) => s.name === downloadFormData.selectedSet);
      if (!selectedSet) {
        throw new Error("Selected set not found");
      }

      toast({
        title: "⏳ Generating PDF...",
        description: `Please wait while we generate the PDF`,
        variant: "default",
        className: "border-blue-500 bg-blue-50 text-blue-900",
      });

      // Call the API to download PDF
      const pdfBlob = await downloadQuestionSetPDF(
        selectedSet.id,
        downloadFormData.language
      );

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${downloadFormData.selectedSet}_${downloadFormData.language}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "✅ PDF Downloaded",
        description: `${downloadFormData.selectedSet} in ${downloadFormData.language} has been downloaded`,
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });
      setIsDownloadModalOpen(false);
    } catch (err: any) {
      toast({
        title: "❌ Download Failed",
        description: err.message || "Unable to download PDF. Please try again.",
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    }
  };

  const openDownloadModal = () => {
    setDownloadFormData({
      selectedSet: "",
      language: "English",
    });
    setIsDownloadModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end items-center gap-3">
        <Button onClick={openAddModal} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Set
        </Button>
        <Button onClick={openDownloadModal} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
        {/* {defaultSet && (
          <div className="flex items-center gap-2 border border-green-300 rounded-md px-3 py-1.5 bg-green-50">
            <span className="text-sm font-medium text-green-700">Default Set:</span>
            <span className="text-sm font-semibold text-green-800">
              {defaultSet.name}
            </span>
          </div>
        )} */}
      </div>

      <div className="space-y-4">
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
                    onClick={async () => {
                      const updatedSet = await loadSetQuestions(set.id);
                      console.log('Viewing set:', updatedSet);
                      console.log('Selected questions:', updatedSet?.questions);
                      setViewingSet(updatedSet || set);
                      setIsViewModalOpen(true);
                    }}
                    title="View questions"
                  >
                    <Eye className="h-4 w-4 text-blue-500" />
                  </Button>
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
                    onClick={() => openDeleteConfirm(set)}
                    title="Delete set"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <p className="text-sm font-medium text-gray-600">
                {set.questions.length > 0 ? (
                  <>
                    You've selected <strong>{set.questions.length}</strong> question
                    {set.questions.length !== 1 && "s"}.
                  </>
                ) : (
                  <span className="text-muted-foreground">Click "Pick Questions" to view and manage questions</span>
                )}
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

                {/* <div className="flex items-center gap-2">
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
                </div> */}
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
            <div className="space-y-2">
              <Label className="block">Set Generation Method</Label>
              <RadioGroup
                value={formData.nameType}
                onValueChange={(val) => {
                  const isRandom = val === "random";
                  const newName = isRandom ? `Set ${sets.length + 1}` : "";
                  setFormData({ ...formData, nameType: val, name: newName, isRandom });
                }}
                className="flex items-center gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="random" id="r-random" />
                  <Label htmlFor="r-random">Random</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="r-custom" />
                  <Label htmlFor="r-custom">Custom Name</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Set Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter Set name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
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




          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingSet ? "Update" : (formData.nameType === "custom" ? "Next" : "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Download PDF Modal */}
      <Dialog open={isDownloadModalOpen} onOpenChange={setIsDownloadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download Question Set PDF</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="set-select">Select Question Set</Label>
              <Select
                value={downloadFormData.selectedSet}
                onValueChange={(value) =>
                  setDownloadFormData({ ...downloadFormData, selectedSet: value })
                }
              >
                <SelectTrigger id="set-select">
                  <SelectValue placeholder="Choose a question set" />
                </SelectTrigger>
                <SelectContent>
                  {sets.map((set) => (
                    <SelectItem key={set.id} value={set.name}>
                      {set.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language-select">Language</Label>
              <Select
                value={downloadFormData.language}
                onValueChange={(value) =>
                  setDownloadFormData({ ...downloadFormData, language: value })
                }
              >
                <SelectTrigger id="language-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Marathi">Marathi</SelectItem>
                  <SelectItem value="Hindi">Hindi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDownloadModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDownloadSubmit}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setSetToDelete(null);
        }}
        onConfirm={deleteSet}
        title="Delete Question Set"
        description={`Are you sure you want to delete "${setToDelete?.name || 'this set'}"?\n\nThis action cannot be revert. All questions in this set will be removed from the set.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* View Questions Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{viewingSet?.name || 'Question Set'}</DialogTitle>
          </DialogHeader>
          
          {viewingSet && (
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="space-y-4">
                {viewingSet.description && (
                  <p className="text-sm text-gray-600 italic">
                    {viewingSet.description}
                  </p>
                )}
                {viewingSet.questions && viewingSet.questions.length > 0 ? (
                  <div className="space-y-3">
                    {viewingSet.questions.map((question: any, index: number) => (
                      <div key={question.id} className="p-4 border rounded-lg bg-white">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 mb-2">
                              {index + 1}. <span className="font-semibold">English:</span> {question.english_text || question.question_text || question.question || 'N/A'}
                            </div>
                            {question.hindi_text && (
                              <div className="text-sm text-gray-700 mb-1">
                                <span className="font-semibold">Hindi:</span> {question.hindi_text}
                              </div>
                            )}
                            {question.marathi_text && (
                              <div className="text-sm text-gray-700">
                                <span className="font-semibold">Marathi:</span> {question.marathi_text}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Badge variant="outline" className="text-xs">
                            {difficultyLevels?.find((d: any) => d.id === question.difficulty_level)?.name || question.difficulty_level || 'N/A'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {question.question_type || 'N/A'}
                          </Badge>
                          {question.time_limit && (
                            <Badge variant="outline" className="text-xs">
                              {question.time_limit}s
                            </Badge>
                          )}
                        </div>
                        
                        {question.question_type === 'MCQ' && question.english_options && question.english_options.length > 0 && (
                          <div className="mt-4">
                            <div className="space-y-2">
                              {question.english_options.map((option: any, optIndex: number) => {
                                const optionText = typeof option === 'string' ? option : option.text || option.value;
                                const optionId = typeof option === 'string' ? optIndex + 1 : option.id;
                                const isCorrect = question.answer_key && question.answer_key.includes(optionId);
                                
                                return (
                                  <div key={optIndex} className="p-2 bg-gray-50 rounded">
                                    <div className="flex items-start gap-2">
                                      <span className="font-medium text-gray-700 min-w-[24px]">
                                        {String.fromCharCode(65 + optIndex)}.
                                      </span>
                                      <div className="flex-1">
                                        <div className="text-sm text-gray-900">
                                          <span className="font-semibold">English:</span> {optionText}
                                          {isCorrect && (
                                            <span className="ml-2 text-green-600 font-semibold">✓ Correct</span>
                                          )}
                                        </div>
                                        {question.hindi_options && question.hindi_options[optIndex] && (
                                          <div className="text-xs text-gray-600 mt-1">
                                            <span className="font-semibold">Hindi:</span> {typeof question.hindi_options[optIndex] === 'string' ? question.hindi_options[optIndex] : question.hindi_options[optIndex]?.text || question.hindi_options[optIndex]?.value}
                                          </div>
                                        )}
                                        {question.marathi_options && question.marathi_options[optIndex] && (
                                          <div className="text-xs text-gray-600 mt-1">
                                            <span className="font-semibold">Marathi:</span> {typeof question.marathi_options[optIndex] === 'string' ? question.marathi_options[optIndex] : question.marathi_options[optIndex]?.text || question.marathi_options[optIndex]?.value}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No questions in this set
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter className="flex-shrink-0 mt-4">
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
