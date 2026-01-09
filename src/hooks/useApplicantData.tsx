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
  getAllPartners,
  getAllDonors,
  getAllStates,
  getStatusesByStageId,
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
  const [stageStatusList, setStageStatusList] = useState<any[]>([]);

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
          currentStatuses,
          stage1Statuses,
          stage2Statuses,
          stage3Statuses,
          stage4Statuses,
          stage5Statuses,
          stage6Statuses,
          questionSets
        ] = await Promise.all([
          getCampusesApi().catch(err => { console.error("Failed to load campuses:", err); return []; }),
          getAllSchools().catch(err => { console.error("Failed to load schools:", err); return []; }),
          getAllReligions().catch(err => { console.error("Failed to load religions:", err); return []; }),
          getAllQualification().catch(err => { console.error("Failed to load qualifications:", err); return []; }),
          getAllCasts().catch(err => { console.error("Failed to load casts:", err); return []; }),
          getAllPartners().catch(err => { console.error("Failed to load partners:", err); return []; }),
          getAllDonors().catch(err => { console.error("Failed to load donors:", err); return []; }),
          getAllStates().catch(err => { console.error("Failed to load states:", err); return []; }),
          getAllStages().catch(err => { console.error("Failed to load stages:", err); return []; }),
          getAllStatuses().catch(err => { console.error("Failed to load statuses:", err); return []; }),
          getStatusesByStageId(1).catch(err => { console.error("Failed to load stage 1 statuses:", err); return []; }),
          getStatusesByStageId(2).catch(err => { console.error("Failed to load stage 2 statuses:", err); return []; }),
          getStatusesByStageId(3).catch(err => { console.error("Failed to load stage 3 statuses:", err); return []; }),
          getStatusesByStageId(4).catch(err => { console.error("Failed to load stage 4 statuses:", err); return []; }),
          getStatusesByStageId(5).catch(err => { console.error("Failed to load stage 5 statuses:", err); return []; }),
          getStatusesByStageId(6).catch(err => { console.error("Failed to load stage 6 statuses:", err); return []; }),
          getAllQuestionSets().catch(err => { console.error("Failed to load question sets:", err); return []; }),
        ]);

        setCampusList(campuses || []);
        setSchoolsList(schools || []);
        setReligionList(religions || []);
        setQualificationList(qualifications || []);
        setCastList(casts || []);
        setPartnerList(partners || []);
        setDonorList(donors || []);
        setStageList(stages || []);
        setcurrentstatusList(currentStatuses || []);
        setQuestionSetList(questionSets || []);

        // Merge all stage statuses into one list for mapping
        const allStageStatuses = [
          ...(stage1Statuses || []),
          ...(stage2Statuses || []),
          ...(stage3Statuses || []),
          ...(stage4Statuses || []),
          ...(stage5Statuses || []),
          ...(stage6Statuses || []),
          // Also include general statuses (mapped to same structure)
          ...(currentStatuses || []).map((s: any) => ({
            id: s.id,
            status_name: s.current_status_name || s.status_name || s.name
          }))
        ];
        setStageStatusList(allStageStatuses);

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
    stageStatusList,
  };
};
