
-- Add new columns to admission_dashboard table for enhanced stage and status management
ALTER TABLE public.admission_dashboard 
ADD COLUMN IF NOT EXISTS stage text DEFAULT 'contact',
ADD COLUMN IF NOT EXISTS status text,
ADD COLUMN IF NOT EXISTS interview_mode text,
ADD COLUMN IF NOT EXISTS exam_mode text DEFAULT 'online',
ADD COLUMN IF NOT EXISTS partner text,
ADD COLUMN IF NOT EXISTS district text,
ADD COLUMN IF NOT EXISTS market text,
ADD COLUMN IF NOT EXISTS interview_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_updated timestamp with time zone DEFAULT now();

-- Create filter_presets table for saving named filter combinations
CREATE TABLE IF NOT EXISTS public.filter_presets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  filters jsonb NOT NULL,
  is_shared boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on filter_presets
ALTER TABLE public.filter_presets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for filter_presets
CREATE POLICY "Users can view their own presets and shared presets" 
  ON public.filter_presets 
  FOR SELECT 
  USING (auth.uid() = user_id OR is_shared = true);

CREATE POLICY "Users can create their own presets" 
  ON public.filter_presets 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presets" 
  ON public.filter_presets 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own presets" 
  ON public.filter_presets 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to automatically update stage based on data
CREATE OR REPLACE FUNCTION update_stage_automatically()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-update stage based on data progression
  IF NEW.joining_status IS NOT NULL AND (NEW.joining_status = 'Joined' OR NEW.joining_status = 'joined') THEN
    NEW.stage = 'decision';
    NEW.status = 'offer_accepted';
  ELSIF NEW.offer_letter_status IS NOT NULL THEN
    NEW.stage = 'decision';
    IF NEW.offer_letter_status ILIKE '%sent%' THEN
      NEW.status = 'offer_sent';
    ELSIF NEW.offer_letter_status ILIKE '%pending%' THEN
      NEW.status = 'offer_pending';
    ELSIF NEW.offer_letter_status ILIKE '%reject%' THEN
      NEW.status = 'offer_rejected';
    END IF;
  ELSIF NEW.lr_status IS NOT NULL OR NEW.cfr_status IS NOT NULL THEN
    NEW.stage = 'interviews';
    IF NEW.cfr_status ILIKE '%pass%' OR NEW.cfr_status ILIKE '%qualified%' THEN
      NEW.status = 'cfr_qualified';
    ELSIF NEW.cfr_status ILIKE '%fail%' THEN
      NEW.status = 'cfr_failed';
    ELSIF NEW.lr_status ILIKE '%pass%' OR NEW.lr_status ILIKE '%qualified%' THEN
      NEW.status = 'lr_qualified';
    ELSIF NEW.lr_status ILIKE '%fail%' THEN
      NEW.status = 'lr_failed';
    ELSE
      NEW.status = 'pending';
    END IF;
  ELSIF NEW.final_marks IS NOT NULL OR NEW.qualifying_school IS NOT NULL THEN
    NEW.stage = 'screening';
    IF NEW.final_marks >= 18 THEN
      NEW.status = 'pass';
    ELSIF NEW.final_marks IS NOT NULL AND NEW.final_marks < 18 THEN
      NEW.status = 'fail';
    ELSE
      NEW.status = 'pending';
    END IF;
  ELSE
    NEW.stage = 'contact';
    NEW.status = NULL;
  END IF;
  
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic stage updates
DROP TRIGGER IF EXISTS trigger_update_stage_automatically ON public.admission_dashboard;
CREATE TRIGGER trigger_update_stage_automatically
  BEFORE INSERT OR UPDATE ON public.admission_dashboard
  FOR EACH ROW
  EXECUTE FUNCTION update_stage_automatically();

-- Update existing records to set proper stages and statuses
UPDATE public.admission_dashboard 
SET stage = CASE
  WHEN joining_status = 'Joined' OR joining_status = 'joined' THEN 'decision'
  WHEN offer_letter_status IS NOT NULL THEN 'decision'
  WHEN lr_status IS NOT NULL OR cfr_status IS NOT NULL THEN 'interviews'
  WHEN final_marks IS NOT NULL OR qualifying_school IS NOT NULL THEN 'screening'
  ELSE 'contact'
END,
status = CASE
  WHEN joining_status = 'Joined' OR joining_status = 'joined' THEN 'offer_accepted'
  WHEN offer_letter_status ILIKE '%sent%' THEN 'offer_sent'
  WHEN offer_letter_status ILIKE '%pending%' THEN 'offer_pending' 
  WHEN offer_letter_status ILIKE '%reject%' THEN 'offer_rejected'
  WHEN cfr_status ILIKE '%pass%' OR cfr_status ILIKE '%qualified%' THEN 'cfr_qualified'
  WHEN cfr_status ILIKE '%fail%' THEN 'cfr_failed'
  WHEN lr_status ILIKE '%pass%' OR lr_status ILIKE '%qualified%' THEN 'lr_qualified'
  WHEN lr_status ILIKE '%fail%' THEN 'lr_failed'
  WHEN (lr_status IS NOT NULL OR cfr_status IS NOT NULL) AND status IS NULL THEN 'pending'
  WHEN final_marks >= 18 THEN 'pass'
  WHEN final_marks IS NOT NULL AND final_marks < 18 THEN 'fail'
  WHEN (final_marks IS NOT NULL OR qualifying_school IS NOT NULL) AND status IS NULL THEN 'pending'
  ELSE NULL
END,
last_updated = now()
WHERE stage IS NULL OR status IS NULL;
