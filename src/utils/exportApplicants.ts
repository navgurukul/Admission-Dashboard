import { getStudents, getFilterStudent, searchStudentsApi } from "./api";

interface ExportOptions {
  questionSetList: any[];
  filteredData?: any[]; //filtered/searched data to export
  selectedData?: any[]; //selected applicants data to export
  filterParams?: any; // Filter parameters for batch fetching
  searchTerm?: string; // Search term for search export
  exportType?: 'all' | 'filtered' | 'selected'; // 'all' = all data, 'filtered' = current filtered/searched data, 'selected' = selected rows only
  selectedFields?: string[]; // Selected fields to include in export
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
    filterParams = null,
    searchTerm = "",
    exportType = 'all', // Default: export all data
    selectedFields = [], // Default: empty array means all fields
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
    } else if (exportType === 'filtered' && searchTerm) {
      // Export search results
      toast({
        title: "Preparing Export",
        description: "Fetching search results...",
      });

      const searchResults = await searchStudentsApi(searchTerm);
      allStudents = searchResults || [];

      toast({
        title: "Data Loaded",
        description: `Found ${allStudents.length} applicants matching your search.`,
        duration: 2000,
      });
    } else if (exportType === 'filtered' && filterParams) {
      // Export filtered data - fetch ALL filtered results in batches
      toast({
        title: "Preparing Export",
        description: "Fetching filtered applicants...",
      });

      const batchSize = 1000;
      const firstBatch = await getFilterStudent({
        ...filterParams,
        page: 1,
        limit: batchSize,
      });

      const totalCount = firstBatch.total || 0;
      const totalPages = firstBatch.totalPages || 1;

      allStudents = firstBatch.data || [];

      // If there are more pages, fetch them
      if (totalPages > 1) {
        toast({
          title: "Fetching Filtered Data",
          description: `Loading ${totalCount} filtered applicants (page 1 of ${totalPages})...`,
          duration: 2000,
        });

        for (let page = 2; page <= totalPages; page++) {
          toast({
            title: "Fetching Filtered Data",
            description: `Loading ${totalCount} filtered applicants (page ${page} of ${totalPages})...`,
            duration: 1000,
          });

          const batch = await getFilterStudent({
            ...filterParams,
            page,
            limit: batchSize,
          });
          allStudents = [...allStudents, ...(batch.data || [])];
        }

        toast({
          title: "Data Loaded",
          description: `Successfully loaded ${allStudents.length} filtered applicants. Preparing CSV...`,
          duration: 2000,
        });
      }
    } else {
      // Fetch ALL students from database in batches
      toast({
        title: "Preparing Export",
        description: "Fetching all applicants...",
      });

      // First, fetch page 1 to get total count
      const batchSize = 1000;
      const firstBatch = await getStudents(1, batchSize);
      const totalCount = firstBatch.totalCount || 0;
      const totalPages = firstBatch.totalPages || 1;

      allStudents = firstBatch.data || [];

      // If there are more pages, fetch them
      if (totalPages > 1) {
        toast({
          title: "Fetching Data",
          description: `Loading ${totalCount} applicants (page 1 of ${totalPages})...`,
          duration: 2000,
        });

        // Fetch remaining pages
        for (let page = 2; page <= totalPages; page++) {
          toast({
            title: "Fetching Data",
            description: `Loading ${totalCount} applicants (page ${page} of ${totalPages})...`,
            duration: 1000,
          });

          const batch = await getStudents(page, batchSize);
          allStudents = [...allStudents, ...(batch.data || [])];
        }

        toast({
          title: "Data Loaded",
          description: `Successfully loaded ${allStudents.length} applicants. Preparing CSV...`,
          duration: 2000,
        });
      }
    }

    // Map all students with related data (using resolved names from API)
    dataToExport = allStudents.map((student: any) => {
      const questionSet = questionSetList.find(
        (q) => q.id === student.question_set_id,
      );

      return {
        ...student,
        mobile_no: student.mobile_no || student.phone_number || "",
        name: `${student.first_name || ""} ${student.middle_name || ""} ${student.last_name || ""
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

  // Field mapping: internal field ID to CSV header and data accessor
  const fieldMapping: Record<string, { header: string; accessor: (applicant: any) => any }> = {
    first_name: { header: "FirstName", accessor: (a) => a.first_name },
    middle_name: { header: "MiddleName", accessor: (a) => a.middle_name },
    last_name: { header: "LastName", accessor: (a) => a.last_name },
    gender: { header: "Gender", accessor: (a) => a.gender },
    dob: { header: "DOB", accessor: (a) => a.dob },
    email: { header: "Email", accessor: (a) => a.email },
    phone_number: { header: "PhoneNumber", accessor: (a) => a.phone_number },
    whatsapp_number: { header: "WhatsappNumber", accessor: (a) => a.whatsapp_number },
    state: { header: "State", accessor: (a) => a.state_name || a.state || "" },
    city: { header: "City", accessor: (a) => a.city || a.city_name || "" },
    district: { header: "District", accessor: (a) => a.district_name || a.district || "" },
    block: { header: "Block", accessor: (a) => a.block_name || a.block || "" },
    pin_code: { header: "PinCode", accessor: (a) => a.pin_code || a.pincode || "" },
    qualification: { header: "Qualification", accessor: (a) => a.qualification_name || a.qualification || "" },
    current_status: { header: "CurrentStatus", accessor: (a) => a.current_status_name || a.current_work },
    cast: { header: "Cast", accessor: (a) => a.cast_name || a.caste },
    school: { header: "School", accessor: (a) => a.school_name },
    campus: { header: "Campus", accessor: (a) => a.campus_name },
    communication_notes: { header: "CommunicationNotes", accessor: (a) => a.communication_notes },
    question_set_name: { 
      header: "QuestionSetName", 
      accessor: (a) => {
        const examSessions = a.exam_sessions || [];
        const examSession = examSessions.length > 0 ? examSessions[examSessions.length - 1] : {};
        let questionSetName = a.question_set_name || a.set_name || "";
        if (examSession.question_set_id) {
          const examQuestionSet = questionSetList.find((q) => q.id === examSession.question_set_id);
          if (examQuestionSet) {
            questionSetName = examQuestionSet.name;
          }
        }
        return questionSetName;
      }
    },
    exam_centre: { 
      header: "ExamCentre", 
      accessor: (a) => {
        const examSessions = a.exam_sessions || [];
        const examSession = examSessions.length > 0 ? examSessions[examSessions.length - 1] : {};
        return examSession.exam_centre || a.exam_centre || "";
      }
    },
    date_of_test: { 
      header: "DateOfTest", 
      accessor: (a) => {
        const examSessions = a.exam_sessions || [];
        const examSession = examSessions.length > 0 ? examSessions[examSessions.length - 1] : {};
        return examSession.date_of_test || a.date_of_test;
      }
    },
    obtained_marks: { 
      header: "ObtainedMarks", 
      accessor: (a) => {
        const examSessions = a.exam_sessions || [];
        const examSession = examSessions.length > 0 ? examSessions[examSessions.length - 1] : {};
        return examSession.obtained_marks || a.obtained_marks || "";
      }
    },
    exam_status: { 
      header: "ExamStatus", 
      accessor: (a) => {
        const examSessions = a.exam_sessions || [];
        const examSession = examSessions.length > 0 ? examSessions[examSessions.length - 1] : {};
        return examSession.status || a.exam_status || a.status || "";
      }
    },
    exam_last_updated_by: { 
      header: "ExamLastUpdatedByEmail", 
      accessor: (a) => {
        const examSessions = a.exam_sessions || [];
        const examSession = examSessions.length > 0 ? examSessions[examSessions.length - 1] : {};
        return examSession.last_updated_by || a.exam_last_updated_by || "";
      }
    },
    learning_round_status: { 
      header: "LearningRoundStatus", 
      accessor: (a) => {
        const learningRounds = a.interview_learner_round || [];
        const learningRound = learningRounds.length > 0 ? learningRounds[learningRounds.length - 1] : {};
        return learningRound.learning_round_status || a.lr_status || "";
      }
    },
    learning_round_comments: { 
      header: "LearningRoundComments", 
      accessor: (a) => {
        const learningRounds = a.interview_learner_round || [];
        const learningRound = learningRounds.length > 0 ? learningRounds[learningRounds.length - 1] : {};
        return learningRound.comments || a.lr_comments || "";
      }
    },
    learning_round_last_updated_by: { 
      header: "LearningRoundLastUpdatedByEmail", 
      accessor: (a) => {
        const learningRounds = a.interview_learner_round || [];
        const learningRound = learningRounds.length > 0 ? learningRounds[learningRounds.length - 1] : {};
        return learningRound.last_updated_by || a.lr_last_updated_by || "";
      }
    },
    cultural_fit_status: { 
      header: "CulturalFitStatus", 
      accessor: (a) => {
        const culturalFitRounds = a.interview_cultural_fit_round || [];
        const culturalFitRound = culturalFitRounds.length > 0 ? culturalFitRounds[culturalFitRounds.length - 1] : {};
        return culturalFitRound.cultural_fit_status || a.cfr_status;
      }
    },
    cultural_fit_comments: { 
      header: "CulturalFitComments", 
      accessor: (a) => {
        const culturalFitRounds = a.interview_cultural_fit_round || [];
        const culturalFitRound = culturalFitRounds.length > 0 ? culturalFitRounds[culturalFitRounds.length - 1] : {};
        return culturalFitRound.comments || a.cfr_comments;
      }
    },
    cultural_fit_last_updated_by: { 
      header: "CulturalFitLastUpdatedByEmail", 
      accessor: (a) => {
        const culturalFitRounds = a.interview_cultural_fit_round || [];
        const culturalFitRound = culturalFitRounds.length > 0 ? culturalFitRounds[culturalFitRounds.length - 1] : {};
        return culturalFitRound.last_updated_by || a.cfr_last_updated_by;
      }
    },
    offer_letter_status: { 
      header: "OfferLetterStatus", 
      accessor: (a) => {
        const finalDecisions = a.final_decisions || [];
        const finalDecision = finalDecisions.length > 0 ? finalDecisions[finalDecisions.length - 1] : {};
        return finalDecision.offer_letter_status || a.offer_letter_status;
      }
    },
    onboarded_status: { 
      header: "OnboardedStatus", 
      accessor: (a) => {
        const finalDecisions = a.final_decisions || [];
        const finalDecision = finalDecisions.length > 0 ? finalDecisions[finalDecisions.length - 1] : {};
        return finalDecision.onboarded_status || a.onboarded_status || a.joining_status;
      }
    },
    final_notes: { 
      header: "FinalNotes", 
      accessor: (a) => {
        const finalDecisions = a.final_decisions || [];
        const finalDecision = finalDecisions.length > 0 ? finalDecisions[finalDecisions.length - 1] : {};
        return finalDecision.final_notes || a.final_notes;
      }
    },
    joining_date: { 
      header: "JoiningDate", 
      accessor: (a) => {
        const finalDecisions = a.final_decisions || [];
        const finalDecision = finalDecisions.length > 0 ? finalDecisions[finalDecisions.length - 1] : {};
        return finalDecision.joining_date || a.joining_date;
      }
    },
    offer_letter_sent_by: { 
      header: "OfferLetterSentByEmail", 
      accessor: (a) => {
        const finalDecisions = a.final_decisions || [];
        const finalDecision = finalDecisions.length > 0 ? finalDecisions[finalDecisions.length - 1] : {};
        return finalDecision.offer_letter_sent_by || a.offer_letter_sent_by;
      }
    },
    final_status_updated_by: { 
      header: "FinalStatusUpdatedByEmail", 
      accessor: (a) => {
        const finalDecisions = a.final_decisions || [];
        const finalDecision = finalDecisions.length > 0 ? finalDecisions[finalDecisions.length - 1] : {};
        return finalDecision.last_status_updated_by || a.last_status_updated_by;
      }
    },
  };

  // Determine which fields to export
  // If selectedFields is empty or not provided, export all fields (backward compatibility)
  const fieldsToExport = selectedFields && selectedFields.length > 0 
    ? selectedFields.filter(field => fieldMapping[field]) // Only include valid fields
    : Object.keys(fieldMapping); // Export all fields if none selected

  // Safety check: ensure we have at least required fields
  if (fieldsToExport.length === 0) {
    toast({
      title: "⚠️ No Fields Selected",
      description: "Please select at least one field to export",
      variant: "destructive",
    });
    return;
  }

  // Generate headers
  const headers = fieldsToExport.map(fieldId => fieldMapping[fieldId].header);

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
      const row = fieldsToExport.map(fieldId => {
        const field = fieldMapping[fieldId];
        const value = field.accessor(applicant);
        
        // Apply date formatting for date fields
        if (fieldId === 'dob' || fieldId === 'date_of_test' || fieldId === 'joining_date') {
          return formatValue(formatDate(value));
        }
        
        return formatValue(value);
      });
      
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
