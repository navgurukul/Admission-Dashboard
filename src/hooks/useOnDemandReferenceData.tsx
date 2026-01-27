import { useRef, useCallback } from "react";
import { useReferenceData } from "./useReferenceData";

/**
 * Hook for on-demand loading of reference data in modals
 * Only loads data when user interacts with a specific field
 * Uses DRY principle to avoid code duplication across modals
 */
export const useOnDemandReferenceData = () => {
  const {
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
  } = useReferenceData();

  // Track which fields have been loaded
  const loadedFields = useRef<Set<string>>(new Set());
  const loadingFields = useRef<Set<string>>(new Set());

  /**
   * Load data for a specific field on-demand
   * @param fieldName - The field name (e.g., 'campus', 'school', 'religion')
   * @returns Promise that resolves when data is loaded
   */
  const loadFieldData = useCallback(async (fieldName: string): Promise<void> => {
    // Skip if already loaded or currently loading
    if (loadedFields.current.has(fieldName) || loadingFields.current.has(fieldName)) {
      // console.log(`✅ Field "${fieldName}" already loaded or loading, skipping...`);
      return;
    }
// 
    // console.log(`🔄 Loading data on-demand for field: "${fieldName}"`);
    loadingFields.current.add(fieldName);

    try {
      switch (fieldName) {
        case 'campus':
        case 'campus_id':
          if (campusList.length === 0) {
            await fetchCampuses();
          }
          break;

        case 'school':
        case 'school_id':
        case 'qualifying_school_id':
          if (schoolList.length === 0) {
            await fetchSchools();
          }
          break;

        case 'current_status':
        case 'current_status_id':
        case 'currentStatus':
          if (currentstatusList.length === 0) {
            await fetchCurrentStatuses();
          }
          break;

        case 'stage':
        case 'stage_id':
          if (stageList.length === 0) {
            await fetchStages();
          }
          break;

        case 'religion':
        case 'religion_id':
          if (religionList.length === 0) {
            await fetchReligions();
          }
          break;

        case 'question_set':
        case 'question_set_id':
          if (questionSetList.length === 0) {
            await fetchQuestionSets();
          }
          break;

        case 'qualification':
        case 'qualification_id':
          if (qualificationList.length === 0) {
            await fetchQualifications();
          }
          break;

        case 'cast':
        case 'cast_id':
          if (castList.length === 0) {
            await fetchCasts();
          }
          break;

        case 'partner':
        case 'partner_org':
        case 'partner_id':
        case 'partnerFilter':
          if (partnerList.length === 0) {
            await fetchPartners();
          }
          break;

        case 'donor':
        case 'donor_id':
          if (donorList.length === 0) {
            await fetchDonors();
          }
          break;

        case 'state':
        case 'state_code':
          if (stateList.length === 0) {
            await fetchStates();
          }
          break;

        default:
          console.warn(`⚠️ No loader defined for field: "${fieldName}"`);
      }

      loadedFields.current.add(fieldName);
      // console.log(`✅ Successfully loaded data for field: "${fieldName}"`);
    } catch (error) {
      console.error(`❌ Failed to load data for field: "${fieldName}"`, error);
    } finally {
      loadingFields.current.delete(fieldName);
    }
  }, [
    campusList.length,
    schoolList.length,
    currentstatusList.length,
    stageList.length,
    religionList.length,
    questionSetList.length,
    qualificationList.length,
    castList.length,
    partnerList.length,
    donorList.length,
    stateList.length,
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
  ]);

  /**
   * Load multiple fields at once
   * @param fieldNames - Array of field names to load
   */
  const loadMultipleFields = useCallback(async (fieldNames: string[]): Promise<void> => {
    // console.log(`🔄 Loading multiple fields: ${fieldNames.join(', ')}`);
    await Promise.all(fieldNames.map(field => loadFieldData(field)));
  }, [loadFieldData]);

  /**
   * Check if a field's data is currently loaded
   * @param fieldName - The field name to check
   * @returns true if data is loaded, false otherwise
   */
  const isFieldLoaded = useCallback((fieldName: string): boolean => {
    return loadedFields.current.has(fieldName);
  }, []);

  /**
   * Reset loaded fields tracking (useful when modal closes)
   */
  const resetLoadedFields = useCallback(() => {
    // console.log('🔄 Resetting loaded fields tracking');
    loadedFields.current.clear();
    loadingFields.current.clear();
  }, []);

  return {
    // Reference data state
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

    // On-demand loading functions
    loadFieldData,
    loadMultipleFields,
    isFieldLoaded,
    resetLoadedFields,
  };
};
