export interface ApplicantData {
  id: string;
  mobile_no: string;
  unique_number: string | null;
  name: string | null;
  city: string | null;
  block: string | null;
  caste: string | null;
  gender: string | null;
  qualification: string | null;
  current_work: string | null;
  qualifying_school: string | null;
  whatsapp_number: string | null;
  set_name: string | null;
  exam_centre: string | null;
  date_of_testing: string | null;
  lr_status: string | null;
  lr_comments: string | null;
  cfr_status: string | null;
  cfr_comments: string | null;
  final_marks: number | null;
  offer_letter_status: string | null;
  allotted_school: string | null;
  joining_status: string | null;
  final_notes: string | null;
  triptis_notes: string | null;
  campus: string | null;
  stage: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = 'admission_dashboard_applicants';

// Generate a unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Get current timestamp
const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

// Get all applicants from localStorage
export const getApplicants = (): ApplicantData[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : [];
    console.log('getApplicants called, found', data.length, 'applicants in localStorage');
    return data;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
};

// Save applicants to localStorage
export const saveApplicants = (applicants: ApplicantData[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applicants));
    console.log('saveApplicants: saved', applicants.length, 'applicants to localStorage');
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

// Add new applicants
export const addApplicants = (newApplicants: Omit<ApplicantData, 'id' | 'created_at' | 'updated_at'>[]): ApplicantData[] => {
  const existingApplicants = getApplicants();
  const timestamp = getCurrentTimestamp();
  
  const applicantsToAdd = newApplicants.map(applicant => ({
    ...applicant,
    id: generateId(),
    created_at: timestamp,
    updated_at: timestamp,
  }));
  
  const updatedApplicants = [...existingApplicants, ...applicantsToAdd];
  console.log('addApplicants: adding', newApplicants.length, 'applicants to', existingApplicants.length, 'existing =', updatedApplicants.length, 'total');
  saveApplicants(updatedApplicants);
  return updatedApplicants;
};

// Update an applicant
export const updateApplicant = (id: string, updates: Partial<ApplicantData>): ApplicantData[] => {
  const applicants = getApplicants();
  const updatedApplicants = applicants.map(applicant => 
    applicant.id === id 
      ? { ...applicant, ...updates, updated_at: getCurrentTimestamp() }
      : applicant
  );
  saveApplicants(updatedApplicants);
  return updatedApplicants;
};

// Delete applicants by IDs
export const deleteApplicants = (ids: string[]): ApplicantData[] => {
  const applicants = getApplicants();
  const updatedApplicants = applicants.filter(applicant => !ids.includes(applicant.id));
  saveApplicants(updatedApplicants);
  return updatedApplicants;
};

// Bulk update applicants
export const bulkUpdateApplicants = (ids: string[], updates: Partial<ApplicantData>): ApplicantData[] => {
  const applicants = getApplicants();
  const updatedApplicants = applicants.map(applicant => 
    ids.includes(applicant.id)
      ? { ...applicant, ...updates, updated_at: getCurrentTimestamp() }
      : applicant
  );
  saveApplicants(updatedApplicants);
  return updatedApplicants;
};

// Get applicant by ID
export const getApplicantById = (id: string): ApplicantData | null => {
  const applicants = getApplicants();
  return applicants.find(applicant => applicant.id === id) || null;
};

// Clear all data (for testing/reset)
export const clearAllData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
}; 