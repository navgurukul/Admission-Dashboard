import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";
import {
  getQuestionsPaginated,
  createQuestion as apiCreateQuestion,
  updateQuestion as updateQuestionApi,
  deleteQuestionbyId,
} from "@/utils/api";
import { difficultyLevelAPI } from "@/utils/difficultyLevelAPI";

interface QuestionFilters {
  question_type?: string;
  difficulty_level?: string;
  topic?: string;
}

export interface DifficultyLevel {
  id: number;
  name: string;
  points: number;
}

export function useQuestions(filters: QuestionFilters = {}, searchTerm = "") {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [difficultyLevels, setDifficultyLevels] = useState<DifficultyLevel[]>(
    [],
  );
  const { toast } = useToast();

  // Fetch difficulty levels once
  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const levelsRaw:any = await difficultyLevelAPI.getDifficultyLevels();

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
      (l) =>
        l.id === Number(level) ||
        l.name.toLowerCase() === String(level).toLowerCase(),
    );
    return lvl ? lvl.name.toLowerCase() : "unknown";
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await getQuestionsPaginated({
        topic: filters.topic === "All" ? undefined : filters.topic,
        difficulty_level: filters.difficulty_level === "All" ? undefined : filters.difficulty_level,
        question_type: filters.question_type === "All" ? undefined : filters.question_type,
        search: searchTerm,
        page: currentPage,
      });

      setQuestions(response.questions);
      setCurrentPage(response.page || 1);
      setTotalPages(response.totalPages || 1);
      setTotalQuestions(response.total || response.questions.length);
    } catch (error: any) {
      console.error("Error fetching questions:", error);
      toast({
        title: "❌ Unable to Load Questions",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm]);

  const createQuestion = async (questionData: any) => {
    try {
      await apiCreateQuestion(questionData);
      await fetchQuestions();
    } catch (error: any) {
      toast({
        title: "❌ Unable to Create Question",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
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
        title: "❌ Unable to Update Question",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
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
        title: "❌ Unable to Delete Question",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
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
  }, [filters, searchTerm, currentPage]);

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
    currentPage,
    setCurrentPage,
    totalPages,
    totalQuestions,
  };
}
