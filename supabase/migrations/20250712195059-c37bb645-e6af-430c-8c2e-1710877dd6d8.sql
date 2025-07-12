
-- Add field_mapping and conditional_logic columns to offer_placeholders table
ALTER TABLE public.offer_placeholders 
ADD COLUMN field_mapping jsonb,
ADD COLUMN conditional_logic jsonb;
