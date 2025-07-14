
-- Add comments table to track user comments with timestamps
CREATE TABLE public.applicant_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_id UUID NOT NULL REFERENCES public.admission_dashboard(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  stage TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for comments
ALTER TABLE public.applicant_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view comments" ON public.applicant_comments 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create comments" ON public.applicant_comments 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own comments" ON public.applicant_comments 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.applicant_comments 
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_applicant_comments_updated_at
  BEFORE UPDATE ON public.applicant_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_timestamp();

-- Add a general logs table for system-wide logging
CREATE TABLE public.system_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  user_name TEXT,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS for system logs
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view system logs" ON public.system_logs 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create system logs" ON public.system_logs 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
