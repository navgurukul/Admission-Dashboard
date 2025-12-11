import { getStudents, getAllStates, getDistrictsByState, getBlocksByDistrict } from "./api";

interface ExportOptions {
  schoolList: any[];
  campusList: any[];
  currentstatusList: any[];
  religionList: any[];
  questionSetList: any[];
  qualificationList?: any[]; // for resolving qualification_id
  castList?: any[]; //  for resolving cast_id
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

// Helper function to resolve location names from codes/IDs (SYNCHRONOUS - no API calls)
const resolveLocationName = (
  applicant: any,
  statesList: any[],
  districtsList: Map<string, any[]>,
  blocksList: Map<string, any[]>
) => {
  let stateName = "";
  let districtName = "";
  let blockName = "";

  // Resolve State
  if (applicant.state) {
    const stateObj = statesList.find(
      (s) => s.state_code === applicant.state || s.state_name === applicant.state
    );
    stateName = stateObj?.state_name || applicant.state;
  }

  // Resolve District
  if (applicant.district && applicant.state) {
    const districts = districtsList.get(applicant.state) || [];
    const districtObj = districts.find(
      (d) => d.district_code === applicant.district || d.district_name === applicant.district
    );
    districtName = districtObj?.district_name || applicant.district;
  }

  // Resolve Block
  if (applicant.block && applicant.district) {
    const blocks = blocksList.get(applicant.district) || [];
    const blockObj = blocks.find(
      (b) => b.block_code === applicant.block || b.block_name === applicant.block
    );
    blockName = blockObj?.block_name || applicant.block;
  }

  return {
    state: stateName || applicant.state_name || applicant.state || "",
    district: districtName || applicant.district_name || applicant.district || "",
    block: blockName || applicant.block_name || applicant.block || "",
  };
};

/**
 * Export all applicants to CSV format
 * Fetches ALL data from database regardless of current filters/search
 */
export const exportApplicantsToCSV = async (options: ExportOptions) => {
  const {
    schoolList,
    campusList,
    currentstatusList,
    religionList,
    questionSetList,
    qualificationList = [],
    castList = [],
    filteredData = [],
    selectedData = [],
    exportType = 'all', // Default: export all data
    toast,
  } = options;

  let dataToExport: any[] = [];
  let statesList: any[] = [];
  let districtsList: Map<string, any[]> = new Map();
  let blocksList: Map<string, any[]> = new Map();

  try {
    let allStudents: any[] = [];

    if (exportType === 'selected' && selectedData.length > 0) {
      // Export selected applicants
    //   console.log(`Exporting ${selectedData.length} selected students...`);
      allStudents = selectedData;
      
      toast({
        title: "Preparing Export",
        description: `Exporting ${selectedData.length} selected applicants...`,
      });
    } else if (exportType === 'filtered' && filteredData.length > 0) {
      // Export filtered/searched data
    //   console.log(`Exporting ${filteredData.length} filtered/searched students...`);
      allStudents = filteredData;
      
      toast({
        title: "Preparing Export",
        description: `Exporting ${filteredData.length} filtered/searched applicants...`,
      });
    } else {
      // Fetch ALL students from database
    //   console.log("Fetching all students for export...");
      
      toast({
        title: "Preparing Export",
        description: "Fetching all applicants...",
      });

      const allStudentsResponse = await getStudents(1, 100000);
      allStudents = allStudentsResponse.data || [];
    //   console.log("Fetched all students for export:", allStudents.length);
    }

    // Fetch all states for lookup
    try {
      const statesResponse = await getAllStates();
      statesList = statesResponse?.data || statesResponse || [];
      // console.log("Fetched states:", statesList.length);
    } catch (error) {
      console.error("Error fetching states:", error);
    }

    // Collect unique state codes and district codes from students
    const uniqueStates = new Set<string>();
    const uniqueDistricts = new Set<string>();
    
    allStudents.forEach((student: any) => {
      if (student.state) uniqueStates.add(student.state);
      if (student.district) uniqueDistricts.add(student.district);
    });

    // console.log(`Fetching location data for ${uniqueStates.size} states and ${uniqueDistricts.size} districts...`);

    // Fetch all districts in parallel (OPTIMIZED)
    const districtPromises = Array.from(uniqueStates).map(async (stateCode) => {
      try {
        const districtsResponse = await getDistrictsByState(stateCode);
        const districts = districtsResponse?.data || districtsResponse || [];
        return { stateCode, districts };
      } catch (error) {
        console.error(`Error fetching districts for state ${stateCode}:`, error);
        return { stateCode, districts: [] };
      }
    });

    // Fetch all blocks in parallel (OPTIMIZED)
    const blockPromises = Array.from(uniqueDistricts).map(async (districtCode) => {
      try {
        const blocksResponse = await getBlocksByDistrict(districtCode);
        const blocks = blocksResponse?.data || blocksResponse || [];
        return { districtCode, blocks };
      } catch (error) {
        console.error(`Error fetching blocks for district ${districtCode}:`, error);
        return { districtCode, blocks: [] };
      }
    });

    // Wait for all district and block fetches to complete in parallel
    const [districtResults, blockResults] = await Promise.all([
      Promise.all(districtPromises),
      Promise.all(blockPromises),
    ]);

    // Populate Maps with results
    districtResults.forEach(({ stateCode, districts }) => {
      districtsList.set(stateCode, districts);
    });

    blockResults.forEach(({ districtCode, blocks }) => {
      blocksList.set(districtCode, blocks);
    });

    // console.log(`✅ Fetched location data: ${statesList.length} states, ${districtsList.size} state districts, ${blocksList.size} district blocks`);
  
    // Map all students with related data and resolved location names (OPTIMIZED - synchronous)
    dataToExport = allStudents.map((student: any) => {
      const school = schoolList.find((s) => s.id === student.school_id);
      const campus = campusList.find((c) => c.id === student.campus_id);
      const current_status = currentstatusList.find(
        (s) => s.id === student.current_status_id,
      );
      const religion = religionList.find((r) => r.id === student.religion_id);
      const questionSet = questionSetList.find(
        (q) => q.id === student.question_set_id,
      );
      
      // Resolve qualification_id to qualification name
      const qualification = qualificationList.find(
        (q) => q.id === student.qualification_id,
      );
      
      // Resolve cast_id to cast name
      const cast = castList.find(
        (c) => c.id === student.cast_id,
      );

      // Resolve location names from codes/IDs (synchronous lookup)
      const locationNames = resolveLocationName(
        student,
        statesList,
        districtsList,
        blocksList
      );

      return {
        ...student,
        mobile_no: student.mobile_no || student.phone_number || "",
        name: `${student.first_name || ""} ${student.middle_name || ""} ${
          student.last_name || ""
        }`.trim(),
        school_name: school ? school.school_name : "N/A",
        campus_name: campus ? campus.campus_name : "N/A",
        current_status_name: current_status
          ? current_status.current_status_name
          : "N/A",
        religion_name: religion ? religion.religion_name : "N/A",
        question_set_name: questionSet ? questionSet.name : "N/A",
        maximumMarks: questionSet ? questionSet.maximumMarks : 0,
        // Resolved qualification and cast names
        qualification_name: qualification ? qualification.qualification_name : student.qualification_name || "N/A",
        cast_name: cast ? cast.cast_name : student.cast_name || "N/A",
        // Override with resolved location names
        resolved_state: locationNames.state,
        resolved_district: locationNames.district,
        resolved_block: locationNames.block,
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
        formatValue(applicant.resolved_state || applicant.state_name || applicant.state || ""),
        formatValue(applicant.city || applicant.city_name || ""),
        formatValue(applicant.resolved_district || applicant.district_name || applicant.district || ""),
        formatValue(applicant.resolved_block || applicant.block_name || applicant.block || ""),
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
