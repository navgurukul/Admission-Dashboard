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

  // Fetch static options (campuses, schools, religions, qualifications, casts)
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [campuses, schools, religions, qualifications, casts] = await Promise.all([
          getCampusesApi(),
          getAllSchools(),
          getAllReligions(),
          getAllQualification(),
          getAllCasts(),
        ]);
        setCampusList(campuses || []);
        setSchoolsList(schools || []);
        setReligionList(religions || []);
        setQualificationList(qualifications || []);
        setCastList(casts || []);
      } catch (error) {
        console.error("Failed to fetch campuses/schools/options:", error);
      }
    };
    fetchOptions();
  }, []);

  // Fetch stages and statuses
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [stages, statuses] = await Promise.all([
          getAllStages(),
          getAllStatuses(),
        ]);
        setStageList(stages || []);
        setcurrentstatusList(statuses || []);
      } catch (error) {
        console.error("Failed to fetch stages/statuses:", error);
      }
    };
    fetchOptions();
  }, []);

  // Fetch question sets
  useEffect(() => {
    const fetchQuestionSets = async () => {
      try {
        const response = await getAllQuestionSets();
        setQuestionSetList(response || []);
      } catch (error) {
        console.error("Error fetching question sets:", error);
      }
    };
    fetchQuestionSets();
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
  };
};
