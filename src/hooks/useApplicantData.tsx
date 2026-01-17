import { useQuery } from "@tanstack/react-query";
import { getStudents } from "@/utils/api";

/**
 * ✅ CRITICAL OPTIMIZATION: Only fetch student data
 * The backend already returns name fields (campus_name, school_name, etc.)
 * Reference data is ONLY needed for editing dropdowns, not for display
 * This eliminates 11 unnecessary API calls on page load!
 */
export const useApplicantData = (currentPage: number, itemsPerPage: number) => {
  const {
    data: studentsData,
    isLoading: isStudentsLoading,
    isFetching: isStudentsFetching,
    refetch: refetchStudents,
  } = useQuery({
    queryKey: ["students", currentPage, itemsPerPage],
    queryFn: () => getStudents(currentPage, itemsPerPage),
    staleTime: 30000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const students = (studentsData as any)?.data || [];
  const totalStudents = (studentsData as any)?.totalCount || 0;
  const totalPagesFromAPI =
    (studentsData as any)?.totalPages ||
    Math.ceil(totalStudents / itemsPerPage);

  return {
    students,
    totalStudents,
    totalPagesFromAPI,
    isStudentsLoading,
    isStudentsFetching,
    refetchStudents,
  };
};
