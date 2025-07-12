
-- Create enum types for question management
CREATE TYPE public.question_type AS ENUM (
  'multiple_choice',
  'true_false', 
  'short_answer',
  'long_answer',
  'coding',
  'fill_in_blank'
);

CREATE TYPE public.difficulty_level AS ENUM (
  'easy',
  'medium',
  'hard'
);

CREATE TYPE public.question_status AS ENUM (
  'active',
  'archived',
  'draft'
);

-- Create question_tags table for managing topic tags
CREATE TABLE public.question_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create main questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text TEXT NOT NULL,
  question_type question_type NOT NULL,
  options JSONB, -- For MCQ options, true/false, etc.
  correct_answer JSONB NOT NULL, -- Store correct answer(s)
  explanation TEXT, -- Optional explanation for the answer
  difficulty_level difficulty_level NOT NULL DEFAULT 'medium',
  language TEXT NOT NULL DEFAULT 'EN',
  time_limit_seconds INTEGER, -- Optional time limit
  points INTEGER NOT NULL DEFAULT 1,
  status question_status NOT NULL DEFAULT 'active',
  tags TEXT[] DEFAULT '{}', -- Array of tag slugs
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  version_number INTEGER NOT NULL DEFAULT 1
);

-- Create question_versions table for version history
CREATE TABLE public.question_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_type question_type NOT NULL,
  options JSONB,
  correct_answer JSONB NOT NULL,
  explanation TEXT,
  difficulty_level difficulty_level NOT NULL,
  language TEXT NOT NULL,
  time_limit_seconds INTEGER,
  points INTEGER NOT NULL,
  tags TEXT[],
  edited_by UUID REFERENCES auth.users(id),
  edited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  change_summary TEXT -- Brief description of what changed
);

-- Create assessment_questions join table for future assessment builder
CREATE TABLE public.assessment_questions (
  assessment_id UUID NOT NULL, -- Will reference assessments table when created
  question_id UUID NOT NULL REFERENCES public.questions(id),
  question_version INTEGER NOT NULL,
  order_index INTEGER NOT NULL,
  custom_points INTEGER, -- Override default points if needed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (assessment_id, question_id)
);

-- Add RLS policies
ALTER TABLE public.question_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;

-- Question tags policies
CREATE POLICY "Authenticated users can view question tags"
  ON public.question_tags FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage question tags"
  ON public.question_tags FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Questions policies
CREATE POLICY "Authenticated users can view questions"
  ON public.questions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage questions"
  ON public.questions FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Question versions policies
CREATE POLICY "Authenticated users can view question versions"
  ON public.question_versions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create question versions"
  ON public.question_versions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Assessment questions policies
CREATE POLICY "Authenticated users can view assessment questions"
  ON public.assessment_questions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage assessment questions"
  ON public.assessment_questions FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Create indexes for better performance
CREATE INDEX idx_questions_status ON public.questions(status);
CREATE INDEX idx_questions_difficulty ON public.questions(difficulty_level);
CREATE INDEX idx_questions_language ON public.questions(language);
CREATE INDEX idx_questions_tags ON public.questions USING GIN(tags);
CREATE INDEX idx_questions_created_at ON public.questions(created_at DESC);
CREATE INDEX idx_question_versions_question_id ON public.question_versions(question_id);
CREATE INDEX idx_question_tags_slug ON public.question_tags(slug);

-- Create function to automatically create version history
CREATE OR REPLACE FUNCTION public.create_question_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if this is an update (not insert)
  IF TG_OP = 'UPDATE' THEN
    -- Increment version number
    NEW.version_number = OLD.version_number + 1;
    NEW.updated_at = now();
    
    -- Insert into version history
    INSERT INTO public.question_versions (
      question_id,
      version_number,
      question_text,
      question_type,
      options,
      correct_answer,
      explanation,
      difficulty_level,
      language,
      time_limit_seconds,
      points,
      tags,
      edited_by,
      edited_at
    ) VALUES (
      OLD.id,
      OLD.version_number,
      OLD.question_text,
      OLD.question_type,
      OLD.options,
      OLD.correct_answer,
      OLD.explanation,
      OLD.difficulty_level,
      OLD.language,
      OLD.time_limit_seconds,
      OLD.points,
      OLD.tags,
      auth.uid(),
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for version history
CREATE TRIGGER trigger_create_question_version
  BEFORE UPDATE ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.create_question_version();

-- Create trigger for updating timestamps
CREATE TRIGGER trigger_update_question_tags_timestamp
  BEFORE UPDATE ON public.question_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default tags
INSERT INTO public.question_tags (slug, display_name, description) VALUES
('html-basics', 'HTML Basics', 'Fundamental HTML concepts and structure'),
('css-fundamentals', 'CSS Fundamentals', 'Core CSS styling and layout'),
('javascript-basics', 'JavaScript Basics', 'Basic JavaScript programming concepts'),
('python-fundamentals', 'Python Fundamentals', 'Core Python programming concepts'),
('logical-reasoning', 'Logical Reasoning', 'Problem-solving and logical thinking'),
('english-comprehension', 'English Comprehension', 'Reading comprehension and language skills'),
('mathematics', 'Mathematics', 'Basic mathematical concepts and problem solving'),
('computer-basics', 'Computer Basics', 'Fundamental computer literacy');
