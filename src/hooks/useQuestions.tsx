import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getQuestions ,createQuestion as apiCreateQuestion,updateQuestion as updateQuestionApi,getQuestionbyId,deleteQuestionbyId} from "@/utils/api";

interface QuestionFilters {
  question_type?: string;
  difficulty_level?: string;
}

export function useQuestions(filters: QuestionFilters = {}, searchTerm = "") {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // need to modify the logic
  const difficultyMap: Record<string | number, string> = {
    1: "easy",
    2: "medium",
    3: "hard",
    easy: "1",
    medium: "2",
    hard: "3",
  };

  // const getQuestionTypeLabel = (type: string) => {
  //   const labels: Record<string, string> = {
  //     MCQ: "MCQ",
  //     TrueFalse: "True/False",
  //     ShortAnswer: "Short Answer",
  //     LongAnswer: "Long Answer",
  //     Coding: "Coding",
  //     FillInBlank: "Fill in Blank",
  //   };
  //   return labels[type] || type;
  // };

  const getDifficultyLabel = (level: number | string) => {
    return difficultyMap[level] || "Unknown";
  };

  const fetchQuestions = async () => {
    try {
      const data = await getQuestions(); 
      setLoading(true);
      // Apply filters
      const filtered = data.filter((q) => {
        const difficultyValue = getDifficultyLabel(q.difficulty_level);
        // const questionType = getQuestionTypeLabel();
        if (
          filters.difficulty_level &&
          filters.difficulty_level !== "All" &&
          difficultyValue !== filters.difficulty_level
        )
          return false;
        if (
          filters.question_type &&
          filters.question_type !== "All" &&
          q.question_type !== filters.question_type
        ) {
          
          return false;
        }

        // search
        if (
          searchTerm &&
          !q.english_text?.toLowerCase().includes(searchTerm.toLowerCase())
        )
          return false;

        return true;
      });

      setQuestions(filtered);
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch questions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createQuestion = async (questionData: any) => {
    try {
      await apiCreateQuestion(questionData);
      await fetchQuestions(); // Refresh list after creation
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create question",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateQuestion = async (id: number, data: any) => {
    try {
      await updateQuestionApi(id, data);
      await fetchQuestions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update question",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteQuestion = async (id: string | number) => {
    try {
      await deleteQuestionbyId(Number(id));
      await fetchQuestions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete question",
        variant: "destructive",
      });
      throw error;
    }
  };

  const archiveQuestion = async (id: string) => {

    await fetchQuestions();
  };

  const restoreQuestion = async (id: string) => {
    
    await fetchQuestions();
  };

  useEffect(() => {
    fetchQuestions();
  }, [filters, searchTerm]);

  return {
    questions,
    loading,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    archiveQuestion,
    restoreQuestion,
    refetch: fetchQuestions,
  };
}
