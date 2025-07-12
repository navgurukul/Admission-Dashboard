
-- Update existing CFR Qualified status to Offer Pending in admission_dashboard
UPDATE public.admission_dashboard 
SET status = 'offer_pending' 
WHERE status = 'cfr_qualified';

-- Update the automatic stage function to use offer_pending instead of cfr_qualified
CREATE OR REPLACE FUNCTION public.update_stage_automatically()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
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
      NEW.status = 'offer_pending';
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
$function$;
