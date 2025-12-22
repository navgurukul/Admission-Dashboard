import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getStudents,
  getAllSchools,
  getCampusesApi,
  getAllStatuses,
  getAllStages,
  getAllReligions,
  getAllQuestionSets,
  getAllQualification,
  getAllCasts,
  getPartners,
  getAllDonors,
  getAllStates,
} from "@/utils/api";

export const useApplicantData = (currentPage: number, itemsPerPage: number) => {
  // Option lists
  const [campusList, setCampusList] = useState<any[]>([]);
  const [schoolList, setSchoolsList] = useState<any[]>([]);
  const [currentstatusList, setcurrentstatusList] = useState<any[]>([]);
  const [stageList, setStageList] = useState<any[]>([]);
  const [religionList, setReligionList] = useState<any[]>([]);
  const [questionSetList, setQuestionSetList] = useState<any[]>([]);
  const [qualificationList, setQualificationList] = useState<any[]>([]);
  const [castList, setCastList] = useState<any[]>([]);
  const [partnerList, setPartnerList] = useState<any[]>([]);
  const [donorList, setDonorList] = useState<any[]>([]);
  const [stateList, setStateList] = useState<{ value: string; label: string }[]>([]);

  // Fetch students with server-side pagination
  const {
    data: studentsData,
    isLoading: isStudentsLoading,
    isFetching: isStudentsFetching,
    refetch: refetchStudents,
  } = useQuery({
    queryKey: ["students", currentPage, itemsPerPage],
    queryFn: () => {
      // Use itemsPerPage directly - let backend handle the limit
      // When "All" is selected, itemsPerPage will be set to totalStudents
      return getStudents(currentPage, itemsPerPage);
    },
    staleTime: 30000, // Cache for 30 seconds to prevent excessive refetching
  });

  const students = (studentsData as any)?.data || [];
  const totalStudents = (studentsData as any)?.totalCount || 0;
  const totalPagesFromAPI =
    (studentsData as any)?.totalPages ||
    Math.max(1, Math.ceil(totalStudents / itemsPerPage));

  // Fetch static options (campuses, schools, religions, qualifications, casts, partners, donors, states, stages, statuses, questionSets)
  // All fetched in a single useEffect to prevent multiple state updates and re-renders
  useEffect(() => {
    const fetchAllOptions = async () => {
      try {
        const [
          campuses, 
          schools, 
          religions, 
          qualifications, 
          casts, 
          partners, 
          donors, 
          states,
          stages,
          statuses,
          questionSets
        ] = await Promise.all([
          getCampusesApi(),
          getAllSchools(),
          getAllReligions(),
          getAllQualification(),
          getAllCasts(),
          getPartners(),
          getAllDonors(),
          getAllStates(),
          getAllStages(),
          getAllStatuses(),
          getAllQuestionSets(),
        ]);
        
        setCampusList(campuses || []);
        setSchoolsList(schools || []);
        setReligionList(religions || []);
        setQualificationList(qualifications || []);
        setCastList(casts || []);
        setPartnerList(partners || []);
        setDonorList(donors || []);
        setStageList(stages || []);
        setcurrentstatusList(statuses || []);
        setQuestionSetList(questionSets || []);
        
        // Map states to { value, label } format
        const statesData = states?.data || states || [];
        const mappedStates = statesData.map((s: any) => ({
          value: s.state_code,
          label: s.state_name,
        }));
        setStateList(mappedStates);
      } catch (error) {
        console.error("Failed to fetch options:", error);
      }
    };
    fetchAllOptions();
  }, []);

  return {
    // Student data
    students,
    totalStudents,
    totalPagesFromAPI,
    isStudentsLoading,
    isStudentsFetching,
    refetchStudents,
    
    // Option lists
    campusList,
    schoolList,
    currentstatusList,
    stageList,
    religionList,
    questionSetList,
    qualificationList,
    castList,
    partnerList,
    donorList,
    stateList,
  };
};
