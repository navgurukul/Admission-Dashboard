
-- Add campus column to admission_dashboard table
ALTER TABLE public.admission_dashboard 
ADD COLUMN campus text;

-- Create campus_options table to store available campuses
CREATE TABLE public.campus_options (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert the campus options
INSERT INTO public.campus_options (name) VALUES 
  ('Pune'),
  ('Dharamshala'),
  ('Bangalore'),
  ('Sarjapura'),
  ('Tripura'),
  ('Delhi'),
  ('Amravati'),
  ('Jashpur'),
  ('Udaipur'),
  ('Dantewada');

-- Add RLS policies for campus_options table
ALTER TABLE public.campus_options ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view campus options
CREATE POLICY "Allow authenticated users to view campus options" 
  ON public.campus_options 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Enable real-time for admission_dashboard table
ALTER TABLE public.admission_dashboard REPLICA IDENTITY FULL;

-- Add admission_dashboard to realtime publication if not already added
ALTER PUBLICATION supabase_realtime ADD TABLE public.admission_dashboard;

-- Enable real-time for campus_options table
ALTER TABLE public.campus_options REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campus_options;

-- Create trigger to update updated_at on campus_options
CREATE TRIGGER update_campus_options_updated_at
  BEFORE UPDATE ON public.campus_options
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
