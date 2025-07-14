
-- Update existing applicants with empty/null status to have default status based on their stage
UPDATE public.admission_dashboard 
SET status = CASE 
  WHEN stage = 'sourcing' THEN 'Enrollment Key Generated'
  WHEN stage = 'screening' THEN 'Pending'
  WHEN stage = 'interviews' THEN 'Pending Booking'
  WHEN stage = 'decision' THEN 'Offer Pending'
  WHEN stage = 'onboarded' THEN 'Onboarded'
  ELSE 'Enrollment Key Generated' -- Default for any other stage or null stage
END,
last_updated = now()
WHERE status IS NULL OR status = '';
