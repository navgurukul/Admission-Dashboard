
-- Create a table for imported questions
CREATE TABLE public.imported_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text TEXT NOT NULL,
  question_type public.question_type NOT NULL,
  options JSONB,
  correct_answer JSONB NOT NULL,
  explanation TEXT,
  difficulty_level public.difficulty_level NOT NULL DEFAULT 'medium',
  language TEXT NOT NULL DEFAULT 'EN',
  points INTEGER NOT NULL DEFAULT 1,
  tags TEXT[],
  time_limit_seconds INTEGER,
  import_batch_id UUID DEFAULT gen_random_uuid(),
  imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  imported_by UUID REFERENCES auth.users(id),
  is_processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.imported_questions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view imported questions" 
  ON public.imported_questions 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert imported questions" 
  ON public.imported_questions 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update imported questions" 
  ON public.imported_questions 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete imported questions" 
  ON public.imported_questions 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- Create index for better performance
CREATE INDEX idx_imported_questions_batch_id ON public.imported_questions(import_batch_id);
CREATE INDEX idx_imported_questions_imported_by ON public.imported_questions(imported_by);
CREATE INDEX idx_imported_questions_is_processed ON public.imported_questions(is_processed);

-- Add trigger for updated_at
CREATE TRIGGER update_imported_questions_updated_at
  BEFORE UPDATE ON public.imported_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
