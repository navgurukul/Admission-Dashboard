import { useState, useCallback } from "react";
import {
  getAllSchools,
  getCampusesApi,
  getAllStatuses,
  getAllStages,
  getAllReligions,
  getAllQuestionSets,
  getAllQualification,
  getAllCategories,
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
  const [categoryList, setCategoryList] = useState<any[]>([]);
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
    // console.log(`🔍 fetchReferenceData called for: ${key}`);
    
    // Return cached data if available
    if (referenceDataCache[key]) {
      // console.log(`✅ Using cached data for: ${key}`, referenceDataCache[key].length, 'items');
      setState(referenceDataCache[key]);
      return referenceDataCache[key];
    }

    // Wait for existing fetch if in progress
    if (fetchPromises[key]) {
      // console.log(`⏳ Waiting for existing fetch: ${key}`);
      const data = await fetchPromises[key];
      setState(data);
      return data;
    }

    // Start new fetch
    // console.log(`📡 Starting new fetch for: ${key}`);
    fetchPromises[key] = (async () => {
      try {
        const rawData = await fetchFn();
        const transformedData = transform ? transform(rawData) : rawData;
        // console.log(`✅ Fetched ${key}:`, transformedData.length, 'items');
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
    // console.log(`🎯 Setting state for ${key}:`, data.length, 'items');
    setState(data);
    return data;
  }, []);

  // Individual fetch functions
  const fetchCampuses = useCallback(() =>
    fetchReferenceData("campuses", getCampusesApi, setCampusList),
    [fetchReferenceData]
  );

  const fetchSchools = useCallback(() => {
    // console.log('🔵 fetchSchools called');
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
    // console.log('🔵 fetchReligions called');
    return fetchReferenceData("religions", getAllReligions, setReligionList);
  }, [fetchReferenceData]);

  const fetchQuestionSets = useCallback(() =>
    fetchReferenceData("questionSets", getAllQuestionSets, setQuestionSetList),
    [fetchReferenceData]
  );

  const fetchQualifications = useCallback(() => {
    // console.log('🔵 fetchQualifications called');
    return fetchReferenceData("qualifications", getAllQualification, setQualificationList);
  }, [fetchReferenceData]);

  const fetchCategories = useCallback(() => {
    // console.log('🔵 fetchCategories called');
    return fetchReferenceData("categories", getAllCategories, setCategoryList);
  }, [fetchReferenceData]);

  const fetchPartners = useCallback(async () => {
    // console.log('🔵 fetchPartners called - lazy loading on-demand');
    const data = await fetchReferenceData("partners", getAllPartners, setPartnerList);
    // console.log('🔵 fetchPartners completed - data:', data);
    // console.log('🔵 fetchPartners - sample item:', data && data.length > 0 ? data[0] : 'No data');
    return data;
  }, [fetchReferenceData]);

  const fetchDonors = useCallback(() => {
    // console.log('🔵 fetchDonors called - lazy loading on-demand');
    return fetchReferenceData("donors", getAllDonors, setDonorList);
  }, [fetchReferenceData]);

  const fetchStates = useCallback(() => {
    // console.log('🔵 fetchStates called');
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
  // Used by ApplicantTable for filter tags display
  const fetchAllReferenceData = useCallback(async () => {
    // Skip if already loaded or currently loading
    if (isLoading) {
      return;
    }
    
    setIsLoading(true);
    try {
      // Load all reference data needed for filter tags
      await Promise.all([
        fetchCampuses(),
        fetchSchools(),
        fetchCurrentStatuses(),
        fetchStages(),
        fetchReligions(),
        fetchQuestionSets(),
        fetchQualifications(),
        fetchCategories(),
        fetchPartners(),
        fetchDonors(),
        fetchStates(),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [
    isLoading,
    fetchCampuses,
    fetchSchools,
    fetchCurrentStatuses,
    fetchStages,
    fetchReligions,
    fetchQuestionSets,
    fetchQualifications,
    fetchCategories,
    fetchPartners,
    fetchDonors,
    fetchStates,
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
    categoryList,
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
    fetchCategories,
    fetchPartners,
    fetchDonors,
    fetchStates,
    fetchAllReferenceData,
  };
};
