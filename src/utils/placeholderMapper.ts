import { supabase } from "@/integrations/supabase/client";

export interface ApplicantData {
  id: string;
  name: string | null;
  mobile_no: string;
  whatsapp_number: string | null;
  campus: string | null;
  allotted_school: string | null;
  qualifying_school: string | null;
  final_marks: number | null;
  interview_date: string | null;
  offer_letter_status: string | null;
  joining_status: string | null;
  // Add other fields as needed
}

export const getApplicantData = async (
  applicantId: string,
): Promise<ApplicantData | null> => {
  try {
    const { data, error } = await supabase
      .from("admission_dashboard")
      .select("*")
      .eq("id", applicantId)
      .single();

    if (error) {
      console.error("Error fetching applicant data:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in getApplicantData:", error);
    return null;
  }
};

export const replacePlaceholders = (
  htmlContent: string,
  applicantData: ApplicantData,
): string => {
  let processedContent = htmlContent;

  // Define placeholder mappings
  const placeholderMappings: Record<string, string | number | null> = {
    STUDENT_NAME: applicantData.name,
    MOBILE_NUMBER: applicantData.mobile_no,
    WHATSAPP_NUMBER: applicantData.whatsapp_number,
    CAMPUS: applicantData.campus,
    ALLOTTED_SCHOOL: applicantData.allotted_school,
    QUALIFYING_SCHOOL: applicantData.qualifying_school,
    FINAL_MARKS: applicantData.final_marks,
    INTERVIEW_DATE: applicantData.interview_date
      ? new Date(applicantData.interview_date).toLocaleDateString()
      : null,
    OFFER_STATUS: applicantData.offer_letter_status,
    JOINING_STATUS: applicantData.joining_status,
  };

  // Replace placeholders in the format {{PLACEHOLDER_NAME}}
  Object.entries(placeholderMappings).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    const replacement = value?.toString() || `[${key}]`;
    processedContent = processedContent.replace(
      new RegExp(placeholder, "g"),
      replacement,
    );
  });

  return processedContent;
};
