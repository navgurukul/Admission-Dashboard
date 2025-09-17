import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getQuestions ,createQuestion as apiCreateQuestion} from "@/utils/api";

interface QuestionFilters {
  status?: string;
  difficulty?: string;
  language?: string;
  question_type?: string;
  tags?: string[];
}
export function useQuestions(filters: QuestionFilters = {}, searchTerm = "") {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchQuestions = async () => {
    try {
      const data = await getQuestions();
      setLoading(true);

      const filtered = data.filter((q) => {
        if (filters.status && q.status !== filters.status) return false;
        if (filters.difficulty && q.difficulty_level !== filters.difficulty)
          return false;
        if (filters.language && q.language !== filters.language) return false;
        if (filters.question_type && q.question_type !== filters.question_type)
          return false;
        if (
          searchTerm &&
          !q.english_text.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return false;
        }
        return true;
      });

      // console.log(data)
      setQuestions(data);
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

  const updateQuestion = async (id: string, data: any) => {
    
  return questions;
  };

  const deleteQuestion = async (id: string) => {

    await fetchQuestions();
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
