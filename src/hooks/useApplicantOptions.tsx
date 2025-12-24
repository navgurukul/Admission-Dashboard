import { useState, useEffect } from "react";
import {
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

/**
 * Hook for fetching all dropdown/option lists used across the application
 * This hook can be used in:
 * - Filters (AdvancedFilterModal, ApplicantTable)
 * - Add/Edit Applicant Modal
 * - Any component needing dropdown options
 * 
 * Returns loading state and all option lists
 */
export const useApplicantOptions = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch all options in parallel
  useEffect(() => {
    const fetchAllOptions = async () => {
      setIsLoading(true);
      setError(null);
      
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
          getCampusesApi().catch(err => { console.error('getCampusesApi failed:', err); return []; }),
          getAllSchools().catch(err => { console.error('getAllSchools failed:', err); return []; }),
          getAllReligions().catch(err => { console.error('getAllReligions failed:', err); return []; }),
          getAllQualification().catch(err => { console.error('getAllQualification failed:', err); return []; }),
          getAllCasts().catch(err => { console.error('getAllCasts failed:', err); return []; }),
          getPartners().catch(err => { console.error('getPartners failed:', err); return []; }),
          getAllDonors().catch(err => { console.error('getAllDonors failed:', err); return []; }),
          getAllStates().catch(err => { console.error('getAllStates failed:', err); return []; }),
          getAllStages().catch(err => { console.error('getAllStages failed:', err); return []; }),
          getAllStatuses().catch(err => { console.error('getAllStatuses failed:', err); return []; }),
          getAllQuestionSets().catch(err => { console.error('getAllQuestionSets failed:', err); return []; }),
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
        
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to fetch options:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch options");
        setIsLoading(false);
      }
    };
    
    fetchAllOptions();
  }, []);

  return {
    // Loading states
    isLoading,
    error,
    
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
