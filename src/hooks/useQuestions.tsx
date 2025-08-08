
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

// Hardcoded demo questions
const demoQuestions = [
  {
    id: 'demo-1',
    question_text: 'What is the capital of India?',
    question_type: 'multiple_choice',
    options: [
      { id: '1', text: 'Mumbai' },
      { id: '2', text: 'Delhi' },
      { id: '3', text: 'Kolkata' },
      { id: '4', text: 'Chennai' }
    ],
    correct_answer: '2',
    explanation: 'Delhi is the capital of India since 1911.',
    difficulty_level: 'easy',
    language: 'EN',
    time_limit_seconds: 30,
    points: 1,
    status: 'active',
    tags: ['geography', 'capitals', 'india'],
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    version_number: 1,
    created_by: null
  },
  {
    id: 'demo-2',
    question_text: 'Explain the concept of Object-Oriented Programming and its main principles.',
    question_type: 'long_answer',
    options: null,
    correct_answer: 'Object-Oriented Programming (OOP) is a programming paradigm based on the concept of objects. The main principles are: 1) Encapsulation - bundling data and methods together, 2) Inheritance - creating new classes based on existing ones, 3) Polymorphism - ability to take multiple forms, 4) Abstraction - hiding complex implementation details.',
    explanation: 'This question tests understanding of fundamental programming concepts and principles.',
    difficulty_level: 'hard',
    language: 'EN',
    time_limit_seconds: 300,
    points: 5,
    status: 'active',
    tags: ['programming', 'oop', 'computer-science'],
    created_at: '2024-01-16T14:30:00Z',
    updated_at: '2024-01-16T14:30:00Z',
    version_number: 1,
    created_by: null
  }
];

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

      // Combine database questions with demo questions
      let allQuestions = [...(data || [])];
      
      // Add demo questions if they match the current filters
      const filteredDemoQuestions = demoQuestions.filter(demoQuestion => {
        // Apply status filter
        if (filters.status && demoQuestion.status !== filters.status) {
          return false;
        }
        
        // Apply difficulty filter
        if (filters.difficulty && demoQuestion.difficulty_level !== filters.difficulty) {
          return false;
        }
        
        // Apply language filter
        if (filters.language && demoQuestion.language !== filters.language) {
          return false;
        }
        
        // Apply question type filter
        if (filters.question_type && demoQuestion.question_type !== filters.question_type) {
          return false;
        }
        
        // Apply tags filter
        if (filters.tags && filters.tags.length > 0) {
          const hasMatchingTag = filters.tags.some(tag => 
            demoQuestion.tags && demoQuestion.tags.includes(tag)
          );
          if (!hasMatchingTag) {
            return false;
          }
        }
        
        // Apply search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const questionTextLower = demoQuestion.question_text.toLowerCase();
          if (!questionTextLower.includes(searchLower)) {
            return false;
          }
        }
        
        return true;
      });
      
      allQuestions = [...filteredDemoQuestions, ...allQuestions];

      setQuestions(allQuestions);
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
