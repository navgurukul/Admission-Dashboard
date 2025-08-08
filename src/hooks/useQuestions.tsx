
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import type { Database } from '@/integrations/supabase/types';

interface QuestionFilters {
  status?: string;
  difficulty?: string;
  language?: string;
  question_type?: string;
  tags?: string[];
}

type QuestionStatus = Database['public']['Enums']['question_status'];
type DifficultyLevel = Database['public']['Enums']['difficulty_level'];
type QuestionType = Database['public']['Enums']['question_type'];

export function useQuestions(filters: QuestionFilters = {}, searchTerm = '') {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user: googleUser } = useGoogleAuth();

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status as QuestionStatus);
      }
      if (filters.difficulty) {
        query = query.eq('difficulty_level', filters.difficulty as DifficultyLevel);
      }
      if (filters.language) {
        query = query.eq('language', filters.language);
      }
      if (filters.question_type) {
        query = query.eq('question_type', filters.question_type as QuestionType);
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      // Apply search
      if (searchTerm) {
        query = query.ilike('question_text', `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch questions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createQuestion = async (questionData) => {
    const { data, error } = await supabase
      .from('questions')
      .insert([{
        ...questionData,
        created_by: googleUser?.id
      }])
      .select()
      .single();

    if (error) throw error;

    await fetchQuestions();
    return data;
  };

  const updateQuestion = async (id, questionData) => {
    const { data, error } = await supabase
      .from('questions')
      .update(questionData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await fetchQuestions();
    return data;
  };

  const deleteQuestion = async (id) => {
    // Check if question is used in any assessments
    const { data: assessmentQuestions } = await supabase
      .from('assessment_questions')
      .select('assessment_id')
      .eq('question_id', id);

    if (assessmentQuestions && assessmentQuestions.length > 0) {
      throw new Error('Cannot delete question that is used in active assessments. Archive it instead.');
    }

    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await fetchQuestions();
  };

  const archiveQuestion = async (id) => {
    const { error } = await supabase
      .from('questions')
      .update({ status: 'archived' })
      .eq('id', id);

    if (error) throw error;

    await fetchQuestions();
  };

  const restoreQuestion = async (id) => {
    const { error } = await supabase
      .from('questions')
      .update({ status: 'active' })
      .eq('id', id);

    if (error) throw error;

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
    refetch: fetchQuestions
  };
}
