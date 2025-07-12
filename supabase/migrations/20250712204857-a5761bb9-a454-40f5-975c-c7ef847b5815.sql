
-- Remove the existing unique constraint on template_type, language, program_type, version_number
ALTER TABLE public.offer_templates 
DROP CONSTRAINT IF EXISTS offer_templates_template_type_language_program_type_version_key;

-- Add a unique constraint on template name instead
ALTER TABLE public.offer_templates 
ADD CONSTRAINT offer_templates_name_unique UNIQUE (name);
