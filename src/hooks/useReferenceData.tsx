import { useState, useCallback } from "react";
import {
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
} from "@/utils/api";

// ✅ Global cache for reference data - persists across component remounts
const referenceDataCache: Record<string, any> = {};
const fetchPromises: Record<string, Promise<any>> = {};

/**
 * Hook for lazy-loading reference data only when needed (e.g., when editing)
 * This prevents unnecessary API calls on initial page load
 */
export const useReferenceData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [campusList, setCampusList] = useState<any[]>([]);
  const [schoolList, setSchoolsList] = useState<any[]>([]);
  const [currentstatusList, setCurrentStatusList] = useState<any[]>([]);
  const [stageList, setStageList] = useState<any[]>([]);
  const [religionList, setReligionList] = useState<any[]>([]);
  const [questionSetList, setQuestionSetList] = useState<any[]>([]);
  const [qualificationList, setQualificationList] = useState<any[]>([]);
  const [castList, setCastList] = useState<any[]>([]);
  const [partnerList, setPartnerList] = useState<any[]>([]);
  const [donorList, setDonorList] = useState<any[]>([]);
  const [stateList, setStateList] = useState<{ value: string; label: string }[]>([]);

  // Generic fetch function with caching
  const fetchReferenceData = useCallback(async (
    key: string,
    fetchFn: () => Promise<any>,
    setState: (data: any) => void,
    transform?: (data: any) => any
  ) => {
    console.log(`🔍 fetchReferenceData called for: ${key}`);
    
    // Return cached data if available
    if (referenceDataCache[key]) {
      console.log(`✅ Using cached data for: ${key}`, referenceDataCache[key].length, 'items');
      setState(referenceDataCache[key]);
      return referenceDataCache[key];
    }

    // Wait for existing fetch if in progress
    if (fetchPromises[key]) {
      console.log(`⏳ Waiting for existing fetch: ${key}`);
      const data = await fetchPromises[key];
      setState(data);
      return data;
    }

    // Start new fetch
    console.log(`📡 Starting new fetch for: ${key}`);
    fetchPromises[key] = (async () => {
      try {
        const rawData = await fetchFn();
        const transformedData = transform ? transform(rawData) : rawData;
        console.log(`✅ Fetched ${key}:`, transformedData.length, 'items');
        referenceDataCache[key] = transformedData;
        delete fetchPromises[key];
        return transformedData;
      } catch (error) {
        console.error(`❌ Failed to fetch ${key}:`, error);
        delete fetchPromises[key];
        return [];
      }
    })();

    const data = await fetchPromises[key];
    console.log(`🎯 Setting state for ${key}:`, data.length, 'items');
    setState(data);
    return data;
  }, []);

  // Individual fetch functions
  const fetchCampuses = useCallback(() =>
    fetchReferenceData("campuses", getCampusesApi, setCampusList),
    [fetchReferenceData]
  );

  const fetchSchools = useCallback(() => {
    console.log('🔵 fetchSchools called');
    return fetchReferenceData("schools", getAllSchools, setSchoolsList);
  }, [fetchReferenceData]);

  const fetchCurrentStatuses = useCallback(() =>
    fetchReferenceData("currentStatuses", getAllStatuses, setCurrentStatusList),
    [fetchReferenceData]
  );

  const fetchStages = useCallback(() =>
    fetchReferenceData("stages", getAllStages, setStageList),
    [fetchReferenceData]
  );

  const fetchReligions = useCallback(() => {
    console.log('🔵 fetchReligions called');
    return fetchReferenceData("religions", getAllReligions, setReligionList);
  }, [fetchReferenceData]);

  const fetchQuestionSets = useCallback(() =>
    fetchReferenceData("questionSets", getAllQuestionSets, setQuestionSetList),
    [fetchReferenceData]
  );

  const fetchQualifications = useCallback(() => {
    console.log('🔵 fetchQualifications called');
    return fetchReferenceData("qualifications", getAllQualification, setQualificationList);
  }, [fetchReferenceData]);

  const fetchCasts = useCallback(() => {
    console.log('🔵 fetchCasts called');
    return fetchReferenceData("casts", getAllCasts, setCastList);
  }, [fetchReferenceData]);

  const fetchPartners = useCallback(() => {
    console.log('🔵 fetchPartners called - lazy loading on-demand');
    return fetchReferenceData("partners", getAllPartners, setPartnerList);
  }, [fetchReferenceData]);

  const fetchDonors = useCallback(() => {
    console.log('🔵 fetchDonors called - lazy loading on-demand');
    return fetchReferenceData("donors", getAllDonors, setDonorList);
  }, [fetchReferenceData]);

  const fetchStates = useCallback(() => {
    console.log('🔵 fetchStates called');
    return fetchReferenceData(
      "states",
      getAllStates,
      setStateList,
      (states) => {
        const statesData = states?.data || states || [];
        return statesData.map((s: any) => ({
          value: s.state_code,
          label: s.state_name,
        }));
      }
    );
  }, [fetchReferenceData]);

  // Fetch all reference data at once (for cases where we need everything)
  // ✅ FULL ON-DEMAND OPTIMIZATION: ALL dropdown fields load only when user clicks to edit
  // No API calls on initial page load - everything loads on-demand
  const fetchAllReferenceData = useCallback(async () => {
    // Skip if already loaded or currently loading
    if (isLoading) {
      return;
    }
    
    setIsLoading(true);
    try {
      // ❌ ALL fields now load on-demand when user clicks to edit:
      // Campuses, CurrentStatuses, Stages, Schools, Religions, QuestionSets, 
      // Qualifications, Casts, Partners, Donors, States
      await Promise.all([
        // Empty - all data loads on-demand
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [
    isLoading,
  ]);

  return {
    // State
    isLoading,
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

    // Fetch functions
    fetchCampuses,
    fetchSchools,
    fetchCurrentStatuses,
    fetchStages,
    fetchReligions,
    fetchQuestionSets,
    fetchQualifications,
    fetchCasts,
    fetchPartners,
    fetchDonors,
    fetchStates,
    fetchAllReferenceData,
  };
};
