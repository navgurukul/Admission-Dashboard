import { getStudents } from "./api";

interface ExportOptions {
  questionSetList: any[];
  filteredData?: any[]; //filtered/searched data to export
  selectedData?: any[]; //selected applicants data to export
  exportType?: 'all' | 'filtered' | 'selected'; // 'all' = all data, 'filtered' = current filtered/searched data, 'selected' = selected rows only
  toast: (options: {
    title: string;
    description: string;
    variant?: "default" | "destructive";
    duration?: number;
  }) => void;
}

/**
 * Export all applicants to CSV format
 * Uses resolved names from API response (state_name, district_name, block_name, cast_name, qualification_name, current_status_name, stage_name, school_name, campus_name, religion_name)
 */
export const exportApplicantsToCSV = async (options: ExportOptions) => {
  const {
    questionSetList,
    filteredData = [],
    selectedData = [],
    exportType = 'all', // Default: export all data
    toast,
  } = options;

  let dataToExport: any[] = [];

  try {
    let allStudents: any[] = [];

    if (exportType === 'selected' && selectedData.length > 0) {
      // Export selected applicants
      allStudents = selectedData;
      
      toast({
        title: "Preparing Export",
        description: `Exporting ${selectedData.length} selected applicants...`,
      });
    } else if (exportType === 'filtered' && filteredData.length > 0) {
      // Export filtered/searched data
      allStudents = filteredData;
      
      toast({
        title: "Preparing Export",
        description: `Exporting ${filteredData.length} filtered/searched applicants...`,
      });
    } else {
      // Fetch ALL students from database
      toast({
        title: "Preparing Export",
        description: "Fetching all applicants...",
      });

      const allStudentsResponse = await getStudents(1, 100000);
      allStudents = allStudentsResponse.data || [];
    }
  
    // Map all students with related data (using resolved names from API)
    dataToExport = allStudents.map((student: any) => {
      const questionSet = questionSetList.find(
        (q) => q.id === student.question_set_id,
      );

      return {
        ...student,
        mobile_no: student.mobile_no || student.phone_number || "",
        name: `${student.first_name || ""} ${student.middle_name || ""} ${
          student.last_name || ""
        }`.trim(),
        question_set_name: questionSet ? questionSet.name : "N/A",
        maximumMarks: questionSet ? questionSet.maximumMarks : 0,
        // All other resolved names come directly from API response:
        // school_name, campus_name, religion_name, qualification_name, 
        // cast_name, current_status_name, stage_name, state_name, 
        // district_name, block_name
      };
    });
  } catch (error: any) {
    console.error("Error fetching all students for export:", error);
    toast({
      title: "Export Error",
      description:
        error?.message || "Failed to fetch all students for export.",
      variant: "destructive",
    });
    throw error; // Re-throw to let caller handle
  }

  if (!dataToExport.length) {
    toast({
      title: "No Data",
      description: "No applicants to export",
      variant: "destructive",
    });
    return;
  }

  // Headers matching the required import format
  const headers = [
    "FirstName",
    "MiddleName",
    "LastName",
    "Gender",
    "DOB",
    "Email",
    "PhoneNumber",
    "WhatsappNumber",
    "State",
    "City",
    "District",
    "Block",
    "PinCode",
    "Qualification",
    "CurrentStatus",
    "Cast",
    "Religion",
    "School",
    "Campus",
    "CommunicationNotes",
    "QuestionSetName",
    "ExamCentre",
    "DateOfTest",
    "ObtainedMarks",
    "ExamStatus",
    "ExamLastUpdatedByEmail",
    "LearningRoundStatus",
    "LearningRoundComments",
    "LearningRoundLastUpdatedByEmail",
    "CulturalFitStatus",
    "CulturalFitComments",
    "CulturalFitLastUpdatedByEmail",
    "OfferLetterStatus",
    "OnboardedStatus",
    "FinalNotes",
    "JoiningDate",
    "OfferLetterSentByEmail",
    "FinalStatusUpdatedByEmail",
  ];

  // Helper to format CSV values (escape special characters)
  const formatValue = (value: any) => {
    if (value === null || value === undefined) return "";
    const s = String(value).trim();
    // Special handling for fields with tabs, commas or quotes
    if (
      s.includes("\t") ||
      s.includes(",") ||
      s.includes('"') ||
      s.includes("\n")
    ) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  // Helper to format date to DD-MM-YYYY
  const formatDate = (dateStr: any) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr; // Return as-is if invalid
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateStr;
    }
  };

  // Map applicant data to CSV rows
  const csvContent = [
    headers.join(","),
    ...dataToExport.map((applicant: any) => {
      // Extract data from nested structures (if available) or flat fields - using LAST value
      const examSessions = applicant.exam_sessions || [];
      const learningRounds = applicant.interview_learner_round || [];
      const culturalFitRounds = applicant.interview_cultural_fit_round || [];
      const finalDecisions = applicant.final_decisions || [];

    //    console.log(applicant)


      const examSession =
        examSessions.length > 0
          ? examSessions[examSessions.length - 1]
          : {};
      const learningRound =
        learningRounds.length > 0
          ? learningRounds[learningRounds.length - 1]
          : {};
      const culturalFitRound =
        culturalFitRounds.length > 0
          ? culturalFitRounds[culturalFitRounds.length - 1]
          : {};
      const finalDecision =
        finalDecisions.length > 0
          ? finalDecisions[finalDecisions.length - 1]
          : {};

      // Resolve question set name from exam session's question_set_id
      let questionSetNameResolved = applicant.question_set_name || applicant.set_name || "";
      if (examSession.question_set_id) {
        const examQuestionSet = questionSetList.find(
          (q) => q.id === examSession.question_set_id
        );
        if (examQuestionSet) {
          questionSetNameResolved = examQuestionSet.name;
        }
      }

      const row = [
        formatValue(applicant.first_name),
        formatValue(applicant.middle_name),
        formatValue(applicant.last_name),
        formatValue(applicant.gender),
        formatValue(applicant.dob),
        formatValue(applicant.email),
        formatValue(applicant.phone_number),
        formatValue(applicant.whatsapp_number),
        formatValue(applicant.state_name || applicant.state || ""),
        formatValue(applicant.city || applicant.city_name || ""),
        formatValue(applicant.district_name || applicant.district || ""),
        formatValue(applicant.block_name || applicant.block || ""),
        formatValue(applicant.pin_code || applicant.pincode || ""),
        formatValue(applicant.qualification_name || applicant.qualification || ""),
        formatValue(applicant.current_status_name || applicant.current_work),
        formatValue(applicant.cast_name || applicant.caste),
        formatValue(applicant.religion_name || applicant.religion),
        formatValue(applicant.school_name),
        formatValue(applicant.campus_name),
        formatValue(applicant.communication_notes),
        formatValue(questionSetNameResolved),
        formatValue(examSession.exam_centre || applicant.exam_centre || ""),
        formatDate(examSession.date_of_test || applicant.date_of_test),
        formatValue(examSession.obtained_marks || applicant.obtained_marks || ""),
        formatValue(examSession.status || applicant.exam_status || applicant.status || ""),
        formatValue(examSession.last_updated_by || applicant.exam_last_updated_by || ""),
        formatValue(learningRound.learning_round_status || applicant.lr_status || ""),
        formatValue(learningRound.comments || applicant.lr_comments || ""),
        formatValue(learningRound.last_updated_by || applicant.lr_last_updated_by || ""),
        formatValue(
          culturalFitRound.cultural_fit_status || applicant.cfr_status,
        ),
        formatValue(culturalFitRound.comments || applicant.cfr_comments),
        formatValue(
          culturalFitRound.last_updated_by || applicant.cfr_last_updated_by,
        ),
        formatValue(
          finalDecision.offer_letter_status || applicant.offer_letter_status,
        ),
        formatValue(
          finalDecision.onboarded_status ||
            applicant.onboarded_status ||
            applicant.joining_status,
        ),
        formatValue(finalDecision.final_notes || applicant.final_notes),
        formatDate(finalDecision.joining_date || applicant.joining_date),
        formatValue(
          finalDecision.offer_letter_sent_by || applicant.offer_letter_sent_by,
        ),
        formatValue(
          finalDecision.last_status_updated_by || applicant.last_status_updated_by,
        ),
      ];
      return row.join(",");
    }),
  ].join("\n");

  

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `applicants_${new Date().toISOString().split("T")[0]}.csv`,
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  toast({
    title: "✅ Export Complete",
    description: `Exported ${dataToExport.length} applicants with all details to CSV. Please wait a moment before trying again..`,
    duration: 5000,
  });
};
