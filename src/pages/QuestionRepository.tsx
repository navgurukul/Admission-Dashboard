import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Filter,
  Upload,
  Archive,
  Edit,
  Trash2,
  Eye,
  History,
  HelpCircle,
} from "lucide-react";
import { QuestionEditor } from "@/components/questions/QuestionEditor";
import { QuestionList } from "@/components/questions/QuestionList";
import { QuestionBulkImport } from "@/components/questions/QuestionBulkImport";
import { QuestionFilters } from "@/components/questions/QuestionFilters";
// import { QuestionPreview } from '@/components/questions/QuestionPreview';
// import { QuestionVersionHistory } from '@/components/questions/QuestionVersionHistory';
import { DifficultyLevelManager } from "@/components/difficulty-levels/DifficultyLevelManager";
// import { TagManagement } from '@/components/questions/TagManagement';
import { useQuestions } from "@/hooks/useQuestions";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/use-toast";
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { QuestionSetManager } from "@/components/questions/QuestionSetManager";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


export default function QuestionRepository() {
  const [activeTab, setActiveTab] = useState("list");
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { debouncedValue: debouncedSearchTerm, isPending: isSearching } = useDebounce(searchTerm, 800);
  const [filters, setFilters] = useState({
    status: "All",
    difficulty_level: "All",
    question_type: "All",
    topic: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<any>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const { toast } = useToast();
  const {
    questions,
    loading,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    archiveQuestion,
    restoreQuestion,
    difficultyLevels,
    refetch,
  } = useQuestions(filters, debouncedSearchTerm);

  useEffect(() => { }, [questions]);

  const handleImportComplete = () => {
    refetch();
    toast({
      title: "✅ Import Successful",
      description: "Questions have been imported and list is refreshed.",
      variant: "default",
      className: "border-green-500 bg-green-50 text-green-900",
    });
    setActiveTab("list");
  };

  const handleCreateQuestion = () => {
    setSelectedQuestion(null);
    setActiveTab("editor");
  };

  const handleEditQuestion = (question) => {
    setSelectedQuestion(question);
    setActiveTab("editor");
  };

  const handlePreviewQuestion = (question) => {
    setSelectedQuestion(question);
    setActiveTab("preview");
  };

  const handleViewHistory = (question) => {
    setSelectedQuestion(question);
    setActiveTab("history");
  };

  const handleSaveQuestion = async (questionData) => {
    try {
      if (selectedQuestion) {
        await updateQuestion(selectedQuestion.id, questionData);
        toast({
          title: "✅ Question Updated",
          description: "The question has been successfully updated.",
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900",
        });
      } else {
        await createQuestion(questionData);
        toast({
          title: "✅ Question Created",
          description: "The question has been successfully created.",
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900",
        });
      }
      setActiveTab("list");
      setSelectedQuestion(null);
    } catch (error) {
      toast({
        title: "Unable to complete action",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    }
  };

  const handleArchiveQuestion = async (questionId) => {
    try {
      await archiveQuestion(questionId);
      toast({
        title: "✅ Question Archived",
        description: "The question has been archived successfully.",
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });
    } catch (error) {
      toast({
        title: "Unable to complete action",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      await deleteQuestion(questionId);
      toast({
        title: "✅ Question Deleted",
        description: "The question has been permanently deleted.",
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });
      setDeleteConfirmOpen(false);
      setQuestionToDelete(null);
    } catch (error) {
      toast({
        title: "Unable to complete action",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    }
  };

  const openDeleteConfirm = (questionId) => {
    setQuestionToDelete(questionId);
    setDeleteConfirmOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <AdmissionsSidebar />
      <main className="md:ml-64 p-4 md:p-8 pt-16 md:pt-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 ">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Question Repository
            </h1>
            <p className="text-muted-foreground">
              Manage and organize assessment questions for admissions screening
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setActiveTab("import")}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Bulk Import
            </Button>
            <Button
              onClick={handleCreateQuestion}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Question
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHelpModal(true)}
              className="text-primary hover:text-primary/80"
              title="How to use Question Repository"
            >
              <HelpCircle className="h-6 w-6" />
            </Button>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4 my-6">
            <TabsTrigger value="list">Questions</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="sets">Sets</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
            {/* <TabsTrigger value="preview">Preview</TabsTrigger> */}
            {/* <TabsTrigger value="history">History</TabsTrigger> */}
            {/* <TabsTrigger value="tags">Tags</TabsTrigger> */}
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Question Library
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search questions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2"
                    >
                      <Filter className="w-4 h-4" />
                      Filters
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col h-[620px]">
                {showFilters && (
                  <div className="mb-6">
                    <QuestionFilters
                      difficultyLevels={difficultyLevels}
                      filters={filters}
                      onFiltersChange={setFilters}
                    />
                  </div>
                )}

                <div className="flex-1 overflow-auto">
                  <QuestionList
                    questions={questions}
                    loading={loading || isSearching}
                    onEdit={(q) => {
                      handleEditQuestion(q);
                      setActiveTab("editor");
                    }}
                    onArchive={handleArchiveQuestion}
                    onDelete={openDeleteConfirm}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="editor">
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedQuestion ? "Edit Question" : "Create New Question"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuestionEditor
                  difficultyLevels={difficultyLevels}
                  question={selectedQuestion}
                  onSave={handleSaveQuestion}
                  setSelectedQuestion={setSelectedQuestion}
                  onCancel={() => {
                    setActiveTab("list");
                    setSelectedQuestion(null);
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="sets">
            <Card>
              <CardHeader>
                <CardTitle>Question Sets</CardTitle>
              </CardHeader>
              <CardContent>
                <QuestionSetManager
                  allQuestions={questions}
                  difficultyLevels={difficultyLevels}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* <TabsContent value="preview">
              <Card>
                <CardHeader>
                  <CardTitle>Question Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedQuestion ? (
                    <QuestionPreview question={QuestionFiltersselectedQuestion} />
                  ) : (
                    <p className="text-muted-foreground">Select a question to preview</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent> */}

          {/* <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Version History</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedQuestion ? (
                    <QuestionVersionHistory questionId={selectedQuestion.id} />
                  ) : (
                    <p className="text-muted-foreground">Select a question to view its history</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent> */}

          <TabsContent value="import">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Import Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <QuestionBulkImport onImportComplete={handleImportComplete} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* <TabsContent value="tags">
              <Card>
                <CardHeader>
                  <CardTitle>Tag Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <TagManagement />
                </CardContent>
              </Card>
            </TabsContent> */}
        </Tabs>
        {/* </div>
         */}
      </main>

      {/* Help Dialog */}
      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold text-primary">
              How to Use Question Repository
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 px-2">
            <div className="space-y-5">
              <div className="border-l-4 border-primary pl-4 py-2">
                <h3 className="font-semibold text-lg mb-2">📝 Step 1: Create Questions</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Click <strong>"New Question"</strong> button (top right)</li>
                  <li>Select <strong>Question Type</strong> (MCQ) and <strong>Difficulty Level</strong> (Easy/Medium/Hard)</li>
                  <li>Enter question text in all three languages: <strong>English, Hindi, Marathi</strong></li>
                  <li>Add 4 options in all three languages</li>
                  <li>Select the correct answer by clicking the circle (○) next to the right option</li>
                  <li>Click <strong>"Save Question"</strong> button</li>
                </ul>
              </div>

              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <h3 className="font-semibold text-lg mb-2">📦 Step 2: Bulk Import Questions (Optional)</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Click <strong>"Bulk Import"</strong> button OR go to <strong>"Import"</strong> tab</li>
                  <li>Click <strong>"Download Template"</strong> to get sample CSV format</li>
                  <li>Fill the CSV template with your questions data</li>
                  <li>Either upload the CSV file OR paste CSV content in the text area</li>
                  <li>Click <strong>"Parse CSV"</strong> button to validate your data</li>
                  <li>Review parsed questions and click <strong>"Import Questions"</strong></li>
                </ul>
              </div>

              <div className="border-l-4 border-green-500 pl-4 py-2">
                <h3 className="font-semibold text-lg mb-2">📋 Step 3: Create Question Sets</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Go to <strong>"Sets"</strong> tab</li>
                  <li>Click <strong>"Add Set"</strong> button</li>
                  <li>Choose: <strong>Random</strong> (auto name) OR <strong>Custom Name</strong></li>
                  <li>Enter set description (optional)</li>
                  <li><strong>For Random:</strong> Click <strong>"Create"</strong> - questions will be auto-selected</li>
                  <li><strong>For Custom Name:</strong> Click <strong>"Next"</strong> → then click <strong>"Pick Questions"</strong></li>
                  <li><strong>Important:</strong> Must select exactly 5 Easy + 8 Medium + 5 Hard = <strong>18 total questions</strong></li>
                  <li>Click <strong>"Save Selected Questions"</strong> when done</li>
                </ul>
              </div>

              <div className="border-l-4 border-orange-500 pl-4 py-2">
                <h3 className="font-semibold text-lg mb-2">🔍 Step 4: Search & Filter Questions</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Go to <strong>"Questions"</strong> tab to view all questions</li>
                  <li>Use <strong>search bar</strong> to find questions by text (searches in all languages)</li>
                  <li>Click <strong>"Filters"</strong> button to filter by difficulty level or question type</li>
                  <li>Click <strong>"Clear All"</strong> to reset filters</li>
                </ul>
              </div>

              <div className="border-l-4 border-purple-500 pl-4 py-2">
                <h3 className="font-semibold text-lg mb-2">✏️ Step 5: Edit & Delete</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li><strong>Edit Question:</strong> Click <strong>Edit icon (pencil)</strong> → make changes → Save</li>
                  <li><strong>Delete Question:</strong> Click <strong>Delete icon (trash)</strong> → confirm deletion</li>
                  <li><strong>Edit Set:</strong> Go to Sets tab → click <strong>Edit icon</strong> on any set</li>
                  <li><strong>Delete Set:</strong> Click <strong>Delete icon</strong> → confirm (all questions in set will be removed)</li>
                </ul>
              </div>

              <div className="border-l-4 border-red-500 pl-4 py-2">
                <h3 className="font-semibold text-lg mb-2">📥 Step 6: Download Question Set PDF</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Go to <strong>"Sets"</strong> tab</li>
                  <li>Click <strong>"Download PDF"</strong> button (top right)</li>
                  <li>Select question set from dropdown</li>
                  <li>Choose language: English, Hindi, or Marathi</li>
                  <li>Click <strong>"Download"</strong> - PDF will be saved to your computer</li>
                </ul>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setQuestionToDelete(null);
        }}
        onConfirm={() => handleDeleteQuestion(questionToDelete)}
        title="Delete Question"
        description="Are you sure you want to permanently delete this question? This action cannot be revert."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
