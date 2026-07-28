import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, History } from "lucide-react";
import {
  getInterviewQuestions,
  submitCulturalFitRoundFeedback,
  updateCulturalFitRoundFeedback,
} from "@/utils/api";

interface Question {
  id?: number;
  question?: string;
  context_text?: string;
  answer?: string;
  isCustom?: boolean;
}

interface CfrFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number;
  existingData?: any; // The CFR round data from interview_cultural_fit_round
  onSuccess?: () => void;
}

export function CfrFeedbackModal({
  isOpen,
  onClose,
  studentId,
  existingData,
  onSuccess,
}: CfrFeedbackModalProps) {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string>("");
  
  const [status, setStatus] = useState("");
  const [comments, setComments] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (existingData?.cultural_fit_status) {
         setStatus(existingData.cultural_fit_status);
      }
      if (existingData?.comments) {
         setComments(existingData.comments);
      }
      fetchQuestions();
    }
  }, [isOpen, existingData]);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const stageId = 4;
      const response = await getInterviewQuestions(stageId);
      const data = response?.data || response || [];
      
      let mappedQuestions = data.map((q: any) => ({
        id: q.id,
        question: q.question_text,
        context_text: q.context_text || "General Questions",
        answer: "",
        isCustom: false,
      }));

      // Merge answers if we are editing existing data
      if (existingData?.qna && Array.isArray(existingData.qna)) {
        const existingQnaMap = new Map();
        const customQs: Question[] = [];
        let maxId = Math.max(...mappedQuestions.map((q: any) => q.id || 0), Date.now());

        existingData.qna.forEach((q: any) => {
          if (q.question.startsWith("CUSTOM QUESTION:")) {
            maxId++;
            customQs.push({
              id: maxId,
              question: q.question,
              context_text: "Custom Questions",
              answer: q.answer || "",
              isCustom: true
            });
          } else {
            existingQnaMap.set(q.question, q.answer || "");
          }
        });

        mappedQuestions = mappedQuestions.map((q: any) => ({
          ...q,
          answer: existingQnaMap.get(q.question) || q.answer
        }));

        mappedQuestions = [...mappedQuestions, ...customQs];
      }
      
      setQuestions(mappedQuestions);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
      toast({
        title: "Error",
        description: "Failed to load interview questions.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomQuestion = () => {
    const newId = Date.now();
    setQuestions([
      ...questions,
      {
        id: newId,
        question: "CUSTOM QUESTION: ",
        context_text: "Custom Questions",
        answer: "",
        isCustom: true,
      },
    ]);
    setActiveGroup("Custom Questions");
  };

  const handleRemoveCustomQuestion = (id: number) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleAnswerChange = (id: number, value: string) => {
    setQuestions(questions.map((q) => q.id === id ? { ...q, answer: value } : q));
  };

  const handleCustomQuestionChange = (id: number, value: string) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, question: value } : q))
    );
  };

  const handleSubmit = async () => {
    if (!status) {
      toast({
        title: "Select Status",
        description: "Please select a status before submitting.",
        // variant: "destructive",
         variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    if (!comments || comments.trim() === "") {
      toast({
        title: "Add Feedback ",
        description: "Please add your CFR Feedback and Overall Feedback before submitting.",
        // variant: "destructive",
         variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const qna = questions.map((q) => ({
        question: q.question,
        answer: q.answer || "",
      }));

      const payload = {
        student_id: studentId,
        cultural_fit_status: status,
        comments,
        qna,
      };

      if (existingData?.id) {
        await updateCulturalFitRoundFeedback(existingData.id, payload);
      } else {
        await submitCulturalFitRoundFeedback(payload);
      }

      toast({
        title: "Success",
        description: "Cultural Fit Round feedback saved successfully.",
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to save feedback:", error);
      toast({
        title: "Error",
        description: "Failed to save feedback.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // In read-only mode, hide questions that have no answers
  const displayQuestions = existingData?._isReadOnly
    ? questions.filter((q) => q.answer && q.answer.trim() !== "")
    : questions;

  // Group questions by context
  const groupedQuestions = displayQuestions.reduce((acc: Record<string, Question[]>, q) => {
    const group = q.context_text || "General Questions";
    if (!acc[group]) acc[group] = [];
    acc[group].push(q);
    return acc;
  }, {});
  
  const groups = Object.keys(groupedQuestions);

  useEffect(() => {
    if (groups.length > 0 && !activeGroup) {
      setActiveGroup(groups[0]);
    }
  }, [groups, activeGroup]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] h-[95vh] flex flex-col overflow-hidden">
        <DialogHeader>
          {/* <DialogTitle>Cultural Fit Round Feedback</DialogTitle> */}
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex flex-1 justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto p-1 space-y-6">
              <Tabs defaultValue="questions" className="w-full">
              <div className="flex w-full justify-center mb-6">
                <TabsList>
                  <TabsTrigger value="questions" className="px-6">Cultural Fit Round Feedback</TabsTrigger>
                  <TabsTrigger value="general" className="px-6">Overall Feedback</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="general" className="space-y-4">
                <div>
                  {/* <label className="text-sm font-medium">General Comments *</label> */}
                  <Textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Overall Feedback..."
                    className="mt-1 border-pink-300 focus-visible:ring-pink-500 focus-visible:border-pink-500"
                    rows={6}
                    disabled={existingData?._isReadOnly}
                  />
                </div>
              </TabsContent>

              <TabsContent value="questions" className="space-y-6">
                <div className="w-1/2">
                  <label className="text-sm font-medium">Status *</label>
                  <select
                    className="w-full mt-1 p-2 border rounded-md focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={existingData?._isReadOnly}
                  >
                    <option value="disabled hidden">Selection</option>
                    <option value="Culture Fit Round Pass">Culture Fit Round Pass</option>
                    <option value="Culture Fit Round Fail">Culture Fit Round Fail</option>
                    <option value="Not Eligible">Not Eligible</option>
                    <option value="Disinterested">Disinterested</option>
                    <option value="Reschedule">Reschedule</option>
                    <option value="No Show">No Show</option>
                  </select>
                </div>

                <div className="flex justify-between items-center border-t pt-4">
                  <h3 className="text-lg font-semibold">Questions</h3>
                  {!existingData?._isReadOnly && (
                    <Button onClick={handleAddCustomQuestion} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Custom Question
                    </Button>
                  )}
                </div>

                {displayQuestions.length > 0 ? (
                  <div className="flex flex-col md:flex-row gap-4 border rounded-md min-h-[500px]">
                    {/* Sidebar */}
                    <div className="w-full md:w-1/3 border-r bg-gray-50/50 p-2 overflow-y-auto max-h-[500px]">
                      {groups.map((group, index) => (
                        <button
                          key={group}
                          onClick={() => setActiveGroup(group)}
                          className={`w-full text-left px-3 py-3 rounded-md text-sm font-medium mb-1 transition-colors ${
                            activeGroup === group
                              ? "bg-pink-100 text-pink-700"
                              : "bg-pink-50/30 hover:bg-pink-50 text-gray-700"
                          }`}
                        >
                          <span className="font-semibold text-sm leading-tight block">{group}</span>
                        </button>
                      ))}
                    </div>
                    
                    {/* Content */}
                    <div className="w-full md:w-2/3 p-4 overflow-y-auto max-h-[500px]">
                      <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
                        {activeGroup}
                      </h3>
                      <div className="space-y-8">
                        {groupedQuestions[activeGroup]?.map((q, index) => (
                          <div key={q.id} className="space-y-3 bg-white p-4 rounded-lg border shadow-sm">
                            {q.isCustom ? (
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Custom Question</label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    className="flex-1 p-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                    value={q.question}
                                    onChange={(e) => handleCustomQuestionChange(q.id!, e.target.value)}
                                    disabled={existingData?._isReadOnly}
                                  />
                                  {!existingData?._isReadOnly && (
                                    <Button 
                                      variant="destructive" 
                                      size="icon"
                                      onClick={() => handleRemoveCustomQuestion(q.id!)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex gap-2">
                                   <span className="font-bold text-gray-400 min-w-max">Q {index + 1}.</span>
                                   <h4 className="font-medium text-md text-gray-800">{q.question}</h4>
                                </div>
                              </div>
                            )}
                            
                            <div className="pt-2">
                              <label className="text-sm font-medium text-gray-700 mb-1 block">Answer</label>
                              <Textarea
                                rows={4}
                                placeholder="Type the answer here..."
                                value={q.answer || ""}
                                onChange={(e) => handleAnswerChange(q.id!, e.target.value)}
                                className="bg-gray-50 focus:bg-white"
                                disabled={existingData?._isReadOnly}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 border border-dashed rounded-xl bg-gray-50/50 text-gray-500 min-h-[220px]">
                    <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center mb-3 border shadow-sm">
                      <History className="h-5 w-5 text-gray-400" />
                    </div>
                    <p className="text-center text-base font-semibold text-gray-700">
                      Question details are unavailable.
                    </p>
                    <p className="text-center text-sm text-gray-500 mt-1 max-w-lg leading-relaxed">
                      This interview was completed before detailed question tracking was available.
                    </p>
                    {existingData?._isReadOnly && (
                      <div className="mt-4 pt-3 border-t border-gray-200 w-full max-w-xl">
                        <p className="text-center text-xs text-gray-400 font-medium leading-relaxed">
                          To add interview answers or custom questions, please click the Edit (pencil) icon on the row.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t bg-white shrink-0 mt-4">
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                {existingData?._isReadOnly ? "Close" : "Cancel"}
              </Button>
              {!existingData?._isReadOnly && (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
