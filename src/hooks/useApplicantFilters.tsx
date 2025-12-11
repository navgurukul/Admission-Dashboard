import { useState, useEffect, useMemo } from "react";
import { searchStudentsApi } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";

interface FilterState {
  stage: string;
  stage_status: string;
  examMode: string;
  interviewMode: string;
  partner: any[];
  district: any[];
  market: any[];
  school: any[];
  religion: any[];
  qualification: any[];
  currentStatus: any[];
  state: any;
  gender: any;
  dateRange: { type: "applicant" | string; from: any; to: any };
}

export const useApplicantFilters = (
  applicantsToDisplay: any[],
  campusList: any[],
  schoolList: any[],
  currentstatusList: any[],
  religionList: any[],
  questionSetList: any[]
) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    stage: "all",
    stage_status: "all",
    examMode: "all",
    interviewMode: "all",
    partner: [],
    district: [],
    market: [],
    school: [],
    religion: [],
    qualification: [],
    currentStatus: [],
    state: undefined,
    gender: undefined,
    dateRange: { type: "applicant" as const, from: undefined, to: undefined },
  });

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  const { toast } = useToast();

  // Handle search with debounce
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        return;
      }

      // Clear filters when search is performed
      setHasActiveFilters(false);
      setFilteredStudents([]);

      try {
        setIsSearching(true);
        const results = await searchStudentsApi(searchTerm.trim());
        setSearchResults(results || []);
      } catch (error: any) {
        console.error("Search error:", error);
        toast({
          title: "Search Error",
          description:
            error?.message ||
            error?.toString() ||
            "Unable to fetch search results. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, toast]);

  // Compute filtered applicants with mapped data
  const filteredApplicants = useMemo(() => {
    // Priority: 1. Search results 2. Filtered students 3. All students
    let source;
    if (searchTerm.trim()) {
      source = searchResults;
    } else if (hasActiveFilters) {
      source = filteredStudents;
    } else {
      source = applicantsToDisplay;
    }

    return source.map((student) => {
      // Handle both API response formats:
      // 1. Regular API: returns IDs (campus_id, school_id, etc.)
      // 2. Filter API: returns names directly (campus_name, school_name, etc.)

      const school = schoolList.find((s) => s.id === student.school_id);
      const campus = campusList.find((c) => c.id === student.campus_id);
      const current_status = currentstatusList.find(
        (s) => s.id === student.current_status_id
      );
      const religion = religionList.find((r) => r.id === student.religion_id);
      const questionSet = questionSetList.find(
        (q) => q.id === student.question_set_id
      );

      return {
        ...student,
        name: `${student.first_name || ""} ${student.middle_name || ""} ${
          student.last_name || ""
        }`.trim(),
        // Use the name from filter API if available, otherwise lookup by ID
        school_name:
          student.school_name || (school ? school.school_name : "N/A"),
        campus_name:
          student.campus_name || (campus ? campus.campus_name : "N/A"),
        current_status_name:
          student.current_status_name ||
          (current_status ? current_status.current_status_name : "N/A"),
        religion_name:
          student.religion_name || (religion ? religion.religion_name : "N/A"),
        question_set_name:
          student.question_set_name || (questionSet ? questionSet.name : "N/A"),
        maximumMarks: questionSet ? questionSet.maximumMarks : 0,
        stage_name: student.stage_name || "N/A",
      };
    });
  }, [
    searchTerm,
    searchResults,
    hasActiveFilters,
    filteredStudents,
    applicantsToDisplay,
    schoolList,
    campusList,
    currentstatusList,
    religionList,
    questionSetList,
  ]);

  return {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    searchResults,
    setSearchResults,
    isSearching,
    filteredStudents,
    setFilteredStudents,
    isFiltering,
    setIsFiltering,
    hasActiveFilters,
    setHasActiveFilters,
    filteredApplicants,
  };
};
