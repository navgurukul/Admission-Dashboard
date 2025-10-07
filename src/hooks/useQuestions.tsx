import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  getQuestions, 
  createQuestion as apiCreateQuestion, 
  updateQuestion as updateQuestionApi, 
  deleteQuestionbyId 
} from "@/utils/api";
import { difficultyLevelAPI } from "@/utils/difficultyLevelAPI";

interface QuestionFilters {
  question_type?: string;
  difficulty_level?: string;
}

export interface DifficultyLevel {
  id: number;
  name: string;
  points: number;
}

export function useQuestions(filters: QuestionFilters = {}, searchTerm = "") {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficultyLevels, setDifficultyLevels] = useState<DifficultyLevel[]>([]);
  const { toast } = useToast();

  // Fetch difficulty levels once
  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const levelsRaw = await difficultyLevelAPI.getDifficultyLevels();

        const arr = Array.isArray(levelsRaw.data?.data)
          ? levelsRaw.data.data.map((item: any) => ({
              id: item.id,
              name: item.name,
              points: item.marks ?? 0,
            }))
          : [];

        setDifficultyLevels(arr);
      } catch (err) {
        console.error("Failed to fetch difficulty levels:", err);
        setDifficultyLevels([]); // fallback
      }
    };

    fetchLevels();
  }, []);

  // Helper: get difficulty label by id
  const getDifficultyLabel = (level: number | string) => {
    const lvl = difficultyLevels.find(
      (l) => l.id === Number(level) || l.name.toLowerCase() === String(level).toLowerCase()
    );
    return lvl ? lvl.name.toLowerCase() : "unknown";
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const data = await getQuestions();

      const filtered = data.filter((q) => {
        const difficultyValue = getDifficultyLabel(q.difficulty_level);

        if (
          filters.difficulty_level &&
          filters.difficulty_level !== "All" &&
          String(q.difficulty_level) !== String(filters.difficulty_level)
        )
          return false;

        if (
          filters.question_type &&
          filters.question_type !== "All" &&
          q.question_type !== filters.question_type
        )
          return false;

        if (
          searchTerm &&
          !q.english_text?.toLowerCase().includes(searchTerm.toLowerCase())
        )
          return false;

        return true;
      });

      setQuestions(filtered);
    } catch (error: any) {
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
      await fetchQuestions();
    } catch (error: any) {
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


  // console.log(difficultyLevels)
  return {
    questions,
    loading,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    archiveQuestion,
    restoreQuestion,
    refetch: fetchQuestions,
    difficultyLevels,
    getDifficultyLabel,
  };
}
