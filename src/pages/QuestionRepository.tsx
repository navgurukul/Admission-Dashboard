import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Filter,
  Upload,
  HelpCircle,
  X,
} from "lucide-react";
import {
  createTopic,
  deleteTopic,
  getAllSchools,
  getTopics,
  type TopicOption,
  updateTopic,
} from "@/utils/api";
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
import { ContextualHelpWidget } from "@/components/onboarding/ContextualHelpWidget";
import { QuestionSetManager } from "@/components/questions/QuestionSetManager";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { useLanguage } from "@/routes/LaunguageContext";
import { Language } from "@/utils/student.types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


export default function QuestionRepository() {
  const defaultFilters = {
    status: "All",
    difficulty_level: "All",
    question_type: "All",
    topic: "",
  };
  const [activeTab, setActiveTab] = useState("list");
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { debouncedValue: debouncedSearchTerm, isPending: isSearching } = useDebounce(searchTerm, 800);
  const [filters, setFilters] = useState(defaultFilters);
  const [draftFilters, setDraftFilters] = useState(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<any>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const { selectedLanguage, setSelectedLanguage } = useLanguage();

  const handleLanguageChange = (language: Language) => {
    setSelectedLanguage(language);
    localStorage.setItem("selectedLanguage", language);
  };

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
    currentPage,
    setCurrentPage,
    totalPages,
    totalQuestions,
  } = useQuestions(filters, debouncedSearchTerm);

  useEffect(() => { }, [questions]);

  useEffect(() => {
    const fetchSchoolsData = async () => {
      try {
        const data = await getAllSchools();
        setSchools(data || []);
      } catch (error) {
        console.error("Error fetching schools:", error);
      }
    };

    const fetchTopicsData = async () => {
      try {
        const data = await getTopics();
        setTopics((data || []).filter((topic) => topic?.status !== false));
      } catch (error) {
        console.error("Error fetching topics:", error);
      }
    };

    fetchSchoolsData();
    fetchTopicsData();
  }, []);

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

  const handleCreateTopic = async (topicName: string) => {
    const createdTopic = await createTopic({
      topic: topicName.trim(),
      status: true,
    });

    setTopics((prev) => [...prev, createdTopic]);
    return createdTopic;
  };

  const handleUpdateTopic = async (topicId: number, topicName: string) => {
    const updatedTopic = await updateTopic(topicId, {
      topic: topicName.trim(),
      status: true,
    });

    setTopics((prev) =>
      prev.map((topic) =>
        topic.id === topicId ? { ...topic, ...updatedTopic } : topic,
      ),
    );

    return updatedTopic;
  };

  const handleDeleteTopic = async (topicId: number) => {
    const result = await deleteTopic(topicId);
    setTopics((prev) => prev.filter((topic) => topic.id !== topicId));
    return result;
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

  const activeFilterChips: Array<{
    key: string;
    label: string;
    onRemove: () => void;
  }> = [];

  if (filters.difficulty_level !== defaultFilters.difficulty_level) {
    const difficulty = difficultyLevels.find(
      (level: any) => String(level.id) === String(filters.difficulty_level),
    );
    activeFilterChips.push({
      key: `difficulty-${filters.difficulty_level}`,
      label: `Difficulty: ${difficulty?.name || filters.difficulty_level}`,
      onRemove: () =>
        setFilters((prev) => ({ ...prev, difficulty_level: defaultFilters.difficulty_level })),
    });
  }

  if (filters.topic !== defaultFilters.topic) {
    const topic = topics.find(
      (topicItem) => String(topicItem.id) === String(filters.topic),
    );
    activeFilterChips.push({
      key: `topic-${filters.topic}`,
      label: `Topic: ${topic?.topic || filters.topic}`,
      onRemove: () => setFilters((prev) => ({ ...prev, topic: defaultFilters.topic })),
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <AdmissionsSidebar />
      <main className="md:ml-64 p-4 md:p-8 pt-16 md:pt-8 h-screen overflow-hidden">
        <div className="flex flex-col h-full">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Question Repository
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Manage and organize assessment questions for admissions screening
              </p>
            </div>

            <div className="flex items-center gap-2" data-onboarding="questions-header-actions">
              <ContextualHelpWidget
                sectionId="question-repository"
                sectionTitle="Question Repository"
                demo={{
                  title: "Question Repository Demo",
                  embedUrl: "https://www.youtube.com/embed/VIDEO_ID_QUESTION_REPOSITORY?rel=0",
                  note:
                    "Replace this placeholder with a short under-60-second repository demo.",
                }}
                faqs={[
                  {
                    question: "Which area is covered by this guide?",
                    answer:
                      "This onboarding covers the full repository flow: question library, editor, import, and set creation.",
                  },
                  {
                    question: "Does the guide switch tabs automatically?",
                    answer:
                      "Yes. The tour moves across Questions, Editor, Import, and Sets so each highlighted element is visible when needed.",
                  },
                  {
                    question: "How do I open help later?",
                    answer:
                      "Use Take Tour near the header or the floating help launcher at the bottom-right corner.",
                  },
                ]}
                steps={[
                  {
                    id: "questions-list-tab",
                    target: '[data-onboarding="questions-list-tab"]',
                    text: "Start in the questions library.",
                    onBeforeShow: () => setActiveTab("list"),
                  },
                  {
                    id: "questions-search",
                    target: '[data-onboarding="questions-search"]',
                    text: "Search questions from this box.",
                    onBeforeShow: () => setActiveTab("list"),
                  },
                  {
                    id: "questions-filter",
                    target: '[data-onboarding="questions-filter-button"]',
                    text: "Refine results with filters.",
                    onBeforeShow: () => setActiveTab("list"),
                  },
                  {
                    id: "questions-new",
                    target: '[data-onboarding="questions-new-button"]',
                    text: "Create a new question here.",
                  },
                  {
                    id: "questions-editor-tab",
                    target: '[data-onboarding="questions-editor-tab"]',
                    text: "Use Editor to add details.",
                    onBeforeShow: () => setActiveTab("editor"),
                  },
                  {
                    id: "questions-editor-panel",
                    target: '[data-onboarding="questions-editor-panel"]',
                    text: "Fill question content in this panel.",
                    onBeforeShow: () => setActiveTab("editor"),
                  },
                  {
                    id: "questions-import-button",
                    target: '[data-onboarding="questions-import-button"]',
                    text: "Import questions in bulk here.",
                  },
                  {
                    id: "questions-import-tab",
                    target: '[data-onboarding="questions-import-tab"]',
                    text: "The Import tab handles CSV uploads.",
                    onBeforeShow: () => setActiveTab("import"),
                  },
                  {
                    id: "questions-import-panel",
                    target: '[data-onboarding="questions-import-panel"]',
                    text: "Upload and validate import files here.",
                    onBeforeShow: () => setActiveTab("import"),
                  },
                  {
                    id: "sets-tab",
                    target: '[data-onboarding="questions-sets-tab"]',
                    text: "Open Sets to manage question groups.",
                    onBeforeShow: () => setActiveTab("sets"),
                  },
                  {
                    id: "sets-actions",
                    target: '[data-onboarding="questions-add-set"]',
                    text: "Create a new set here.",
                    onBeforeShow: () => setActiveTab("sets"),
                  },
                  {
                    id: "sets-download",
                    target: '[data-onboarding="questions-download-set"]',
                    text: "Export set PDFs from here.",
                    onBeforeShow: () => setActiveTab("sets"),
                  },
                  {
                    id: "sets-panel",
                    target: '[data-onboarding="questions-sets-panel"]',
                    text: "Review every saved set here.",
                    onBeforeShow: () => setActiveTab("sets"),
                  },
                ]}
              />

              <Button
                variant="outline"
                onClick={() => setActiveTab("import")}
                className="flex items-center gap-2"
                data-onboarding="questions-import-button"
              >
                <Upload className="w-4 h-4" />
                Bulk Import
              </Button>
              <Button
                onClick={handleCreateQuestion}
                className="flex items-center gap-2"
                data-onboarding="questions-new-button"
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
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="list" data-onboarding="questions-list-tab">
                Questions
              </TabsTrigger>
              <TabsTrigger value="editor" data-onboarding="questions-editor-tab">
                Editor
              </TabsTrigger>
              <TabsTrigger value="sets" data-onboarding="questions-sets-tab">
                Sets
              </TabsTrigger>
              <TabsTrigger value="import" data-onboarding="questions-import-tab">
                Import
              </TabsTrigger>
              {/* <TabsTrigger value="preview">Preview</TabsTrigger> */}
              {/* <TabsTrigger value="history">History</TabsTrigger> */}
              {/* <TabsTrigger value="tags">Tags</TabsTrigger> */}
            </TabsList>

            <TabsContent value="list" className="flex-1 overflow-hidden m-0">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Question Library
                    <div className="flex items-center gap-2">
                      <div className="relative" data-onboarding="questions-search">
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
                        onClick={() => {
                          setDraftFilters(filters);
                          setShowFilters(true);
                        }}
                        className="flex items-center gap-2"
                        data-onboarding="questions-filter-button"
                      >
                        <Filter className="w-4 h-4" />
                        Filters
                      </Button>
                      <Select
                        value={selectedLanguage}
                        onValueChange={(value) => handleLanguageChange(value as Language)}
                      >
                        <SelectTrigger className="h-10 w-[112px] rounded-2xl px-3 text-base font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="hindi">Hindi</SelectItem>
                          <SelectItem value="marathi">Marathi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col overflow-hidden">
                  {activeFilterChips.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {activeFilterChips.map((filter) => (
                        <Button
                          key={filter.key}
                          size="sm"
                          variant="ghost"
                          className="h-auto min-w-fit whitespace-nowrap rounded-full border px-2 py-1.5"
                          onClick={filter.onRemove}
                        >
                          <span className="inline-block text-sm">{filter.label}</span>
                          <X className="ml-2 h-3 w-3 flex-shrink-0" />
                        </Button>
                      ))}
                    </div>
                  )}
                  <div className="flex-1 overflow-y-auto pr-2">
                    <QuestionList
                      questions={questions}
                      loading={loading || isSearching}
                      onEdit={(q) => {
                        handleEditQuestion(q);
                        setActiveTab("editor");
                      }}
                      onArchive={handleArchiveQuestion}
                      onDelete={openDeleteConfirm}
                      schools={schools}
                      topics={topics}
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t pt-4">
                    <div className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                      {totalQuestions > 0 ? ` • ${totalQuestions} total questions` : ""}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1 || loading || isSearching}
                        onClick={() => setCurrentPage((prev: number) => Math.max(prev - 1, 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= totalPages || loading || isSearching}
                        onClick={() =>
                          setCurrentPage((prev: number) => Math.min(prev + 1, totalPages))
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="editor" className="flex-1 overflow-hidden m-0">
              <Card className="h-full flex flex-col" data-onboarding="questions-editor-panel">
                <CardHeader className="flex-shrink-0">
                  <CardTitle>
                    {selectedQuestion ? "Edit Question" : "Create New Question"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                  <QuestionEditor
                    difficultyLevels={difficultyLevels}
                    question={selectedQuestion}
                    onSave={handleSaveQuestion}
                    onCreateTopic={handleCreateTopic}
                    onUpdateTopic={handleUpdateTopic}
                    onDeleteTopic={handleDeleteTopic}
                    setSelectedQuestion={setSelectedQuestion}
                    onCancel={() => {
                      setActiveTab("list");
                      setSelectedQuestion(null);
                    }}
                    schools={schools}
                    topics={topics}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="sets" className="flex-1 overflow-hidden m-0">
              <Card className="h-full flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <CardTitle>Question Sets</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
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

            <TabsContent value="import" className="flex-1 overflow-hidden m-0">
              <Card className="h-full flex flex-col" data-onboarding="questions-import-panel">
                <CardHeader className="flex-shrink-0">
                  <CardTitle>Bulk Import Questions</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
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
        </div>
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

      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent className="mx-4 max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-2 text-lg">
              {/* <Filter className="h-5 w-5" /> */}
              Filters
            </DialogTitle>
          </DialogHeader>
          <QuestionFilters
            difficultyLevels={difficultyLevels}
            filters={draftFilters}
            onFiltersChange={setDraftFilters}
            topics={topics}
            className="mb-0"
          />
          <div className="mt-4 flex justify-between border-t pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDraftFilters(defaultFilters);
              }}
              size="sm"
            >
              Reset All
            </Button>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDraftFilters(filters);
                  setShowFilters(false);
                }}
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setFilters(draftFilters);
                  setShowFilters(false);
                }}
                size="sm"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
