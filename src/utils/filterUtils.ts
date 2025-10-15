import { 
  getAllStates, 
  getDistrictsByState, 
  getCampusesApi, 
  getAllSchools, 
  getAllReligions, 
  getAllStatuses 
} from "./api";

// Types for filter data
export interface State {
  id: string;
  name: string;
  state_code?: string;
}

export interface District {
  id: string;
  name: string;
  district_code?: string;
  state_code?: string;
}

export interface Campus {
  id: number;
  campus_name: string;
}

export interface School {
  id: number;
  school_name: string;
}

export interface Religion {
  id: number;
  religion_name: string;
}

export interface CurrentStatus {
  id: number;
  current_status_name: string;
}

// Cache for API responses
const cache = {
  states: null as State[] | null,
  campuses: null as Campus[] | null,
  schools: null as School[] | null,
  religions: null as Religion[] | null,
  statuses: null as CurrentStatus[] | null,
  districts: new Map<string, District[]>(),
};

// Get all states with caching
export const getStatesList = async (): Promise<State[]> => {
  if (cache.states) {
    return cache.states;
  }

  try {
    const response = await getAllStates();
    
    // Handle different response formats
    let statesData: any[] = [];
    if (Array.isArray(response)) {
      statesData = response;
    } else if (response.data && Array.isArray(response.data)) {
      statesData = response.data;
    } else if (response.states && Array.isArray(response.states)) {
      statesData = response.states;
    }

    const states = statesData.map((state: any) => ({
      id: state.id || state.state_id || state.code,
      name: state.name || state.state_name || "Unknown State",
      state_code: state.state_code || state.code,
    }));

    cache.states = states;
    return states;
  } catch (error) {
    // console.error("Error fetching states:", error);
    return [];
  }
};

// Get districts by state with caching
export const getDistrictsList = async (stateCode: string): Promise<District[]> => {
  if (cache.districts.has(stateCode)) {
    return cache.districts.get(stateCode)!;
  }

  try {
    const response = await getDistrictsByState(stateCode);
    
    let districtsData: any[] = [];
    if (Array.isArray(response)) {
      districtsData = response;
    } else if (response.data && Array.isArray(response.data)) {
      districtsData = response.data;
    } else if (response.districts && Array.isArray(response.districts)) {
      districtsData = response.districts;
    }

    const districts = districtsData.map((district: any) => ({
      id: district.id || district.district_id || district.code,
      name: district.name || district.district_name || "Unknown District",
      district_code: district.district_code || district.code,
      state_code: district.state_code || stateCode,
    }));

    cache.districts.set(stateCode, districts);
    return districts;
  } catch (error) {
    // console.error(`Error fetching districts for state ${stateCode}:`, error);
    return [];
  }
};

// Get campuses with caching
export const getCampusesList = async (): Promise<Campus[]> => {
  if (cache.campuses) {
    return cache.campuses;
  }

  try {
    const campuses = await getCampusesApi();
    cache.campuses = campuses;
    return campuses;
  } catch (error) {
    // console.error("Error fetching campuses:", error);
    return [];
  }
};

// Get schools with caching
export const getSchoolsList = async (): Promise<School[]> => {
  if (cache.schools) {
    return cache.schools;
  }

  try {
    const schools = await getAllSchools();
    cache.schools = schools;
    return schools;
  } catch (error) {
    // console.error("Error fetching schools:", error);
    return [];
  }
};

// Get religions with caching
export const getReligionsList = async (): Promise<Religion[]> => {
  if (cache.religions) {
    return cache.religions;
  }

  try {
    const religions = await getAllReligions();
    cache.religions = religions;
    return religions;
  } catch (error) {
    // console.error("Error fetching religions:", error);
    return [];
  }
};

// Get statuses with caching
export const getStatusesList = async (): Promise<CurrentStatus[]> => {
  if (cache.statuses) {
    return cache.statuses;
  }

  try {
    const statuses = await getAllStatuses();
    cache.statuses = statuses;
    return statuses;
  } catch (error) {
    // console.error("Error fetching statuses:", error);
    return [];
  }
};

// Extract unique values from students data
export const extractUniqueValues = (students: any[], fieldName: string, fallbackFields: string[] = []): string[] => {
  if (!students || students.length === 0) return [];
  
  const allFields = [fieldName, ...fallbackFields];
  const values = new Set<string>();
  
  students.forEach((student) => {
    if (!student || typeof student !== 'object') return;
    
    for (const field of allFields) {
      const value = student[field];
      if (value && typeof value === 'string' && value.trim() !== '') {
        values.add(value.trim());
        break;
      }
    }
  });
  
  return Array.from(values).sort();
};

// Extract partners from students
export const getPartnersFromStudents = (students: any[]): string[] => {
  return extractUniqueValues(students, 'partner', [
    'partner_name', 
    'partnerName',
    'partner_organization'
  ]);
};

// Extract districts/cities from students
export const getDistrictsFromStudents = (students: any[]): string[] => {
  return extractUniqueValues(students, 'district', [
    'city', 
    'district_name', 
    'city_name',
    'location'
  ]);
};

// Extract states from students
export const getStatesFromStudents = (students: any[]): string[] => {
  return extractUniqueValues(students, 'state', [
    'state_name',
    'current_state'
  ]);
};

// Clear cache (useful for testing or when data needs refresh)
export const clearFilterCache = () => {
  cache.states = null;
  cache.campuses = null;
  cache.schools = null;
  cache.religions = null;
  cache.statuses = null;
  cache.districts.clear();
};