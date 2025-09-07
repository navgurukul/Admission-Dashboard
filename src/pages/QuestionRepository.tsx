import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Filter, Upload, Archive, Edit, Trash2, Eye, History } from 'lucide-react';
import { QuestionEditor } from '@/components/questions/QuestionEditor';
import { QuestionList } from '@/components/questions/QuestionList';
import { QuestionBulkImport } from '@/components/questions/QuestionBulkImport';
import { QuestionFilters } from '@/components/questions/QuestionFilters';
// import { QuestionPreview } from '@/components/questions/QuestionPreview';
// import { QuestionVersionHistory } from '@/components/questions/QuestionVersionHistory';
import { DifficultyLevelManager } from '@/components/difficulty-levels/DifficultyLevelManager';
// import { TagManagement } from '@/components/questions/TagManagement';
import { useQuestions } from '@/hooks/useQuestions';
import { useToast } from '@/hooks/use-toast';
import { AdmissionsSidebar } from '@/components/AdmissionsSidebar';

export default function QuestionRepository() {
  const [activeTab, setActiveTab] = useState('list');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'active',
    difficulty: '',
    language: '',
    tags: [],
    question_type: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const { toast } = useToast();
  const {
    questions,
    loading,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    archiveQuestion,
    restoreQuestion
  } = useQuestions(filters, searchTerm);

  const handleCreateQuestion = () => {
    setSelectedQuestion(null);
    setActiveTab('editor');
  };

  const handleEditQuestion = (question) => {
    setSelectedQuestion(question);
    setActiveTab('editor');
  };

  const handlePreviewQuestion = (question) => {
    setSelectedQuestion(question);
    setActiveTab('preview');
  };

  const handleViewHistory = (question) => {
    setSelectedQuestion(question);
    setActiveTab('history');
  };

  const handleSaveQuestion = async (questionData) => {
    try {
      if (selectedQuestion) {
        await updateQuestion(selectedQuestion.id, questionData);
        toast({
          title: "Question Updated",
          description: "The question has been successfully updated."
        });
      } else {
        await createQuestion(questionData);
        toast({
          title: "Question Created",
          description: "The question has been successfully created."
        });
      }
      setActiveTab('list');
      setSelectedQuestion(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to save question",
        variant: "destructive"
      });
    }
  };

  const handleArchiveQuestion = async (questionId) => {
    try {
      await archiveQuestion(questionId);
      toast({
        title: "Question Archived",
        description: "The question has been archived successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to archive question",
        variant: "destructive"
      });
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      await deleteQuestion(questionId);
      toast({
        title: "Question Deleted",
        description: "The question has been permanently deleted."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete question",
        variant: "destructive"
      });
    }
  };

  return (
    
        <div className="min-h-screen bg-background">
          <AdmissionsSidebar/>
          <main className="md:ml-64 p-4 md:p-8 pt-16 md:pt-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 ">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Question Repository</h1>
              <p className="text-muted-foreground">
                Manage and organize assessment questions for admissions screening
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setActiveTab('import')}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Bulk Import
              </Button>
              <Button onClick={handleCreateQuestion} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Question
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 my-6">
              <TabsTrigger value="list">Questions</TabsTrigger>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              {/* <TabsTrigger value="preview">Preview</TabsTrigger> */}
              {/* <TabsTrigger value="history">History</TabsTrigger> */}
              <TabsTrigger value="import">Import</TabsTrigger>
              {/* <TabsTrigger value="tags">Tags</TabsTrigger> */}
              <TabsTrigger value='difficulty-levels'>Difficulty Levels</TabsTrigger>
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
                <CardContent>
                  {showFilters && (
                    <div className="mb-6">
                      <QuestionFilters
                        filters={filters}
                        onFiltersChange={setFilters}
                      />
                    </div>
                  )}

                  <QuestionList
                    questions={questions}
                    loading={loading}
                    onEdit={handleEditQuestion}
                    onPreview={handlePreviewQuestion}
                    onHistory={handleViewHistory}
                    onArchive={handleArchiveQuestion}
                    onDelete={handleDeleteQuestion}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="editor">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedQuestion ? 'Edit Question' : 'Create New Question'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <QuestionEditor
                    question={selectedQuestion}
                    onSave={handleSaveQuestion}
                    onCancel={() => setActiveTab('list')}
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
                    <QuestionPreview question={selectedQuestion} />
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
                  <QuestionBulkImport onImportComplete={() => setActiveTab('list')} />
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

            <TabsContent value="difficulty-levels">
              <Card>
                <CardHeader>
                  {/* <CardTitle>Difficulty Levels Management</CardTitle> */}
                </CardHeader>
                <CardContent>
                  <DifficultyLevelManager />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        {/* </div>
       */}
       </main>
    </div>
  );
}
