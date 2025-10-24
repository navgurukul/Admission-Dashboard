import { Student } from "./student.types";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Get auth token from localStorage
export const getAuthToken = (): string | null => {
  const token = localStorage.getItem('authToken');
  return token;
};


export const getAuthHeaders = (withJson: boolean = true): HeadersInit => {
  const token = getAuthToken();
  return {
    ...(withJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

// Make authenticated API request
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = `${BASE_URL}${endpoint}`;
  const headers = getAuthHeaders();
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  };

return fetch(url,config)
};

// AUTHENTICATION FUNCTIONS (NEW) 

// User interfaces
export interface User {
   id: number;
  name: string;
  email: string;
  mobile?: string;
  user_name: string;
  user_role_id: number;
  status: boolean;
  created_at: string;
  updated_at: string;
  role_name?: string;
  profile_pic?: string;
}

export interface Role {
  id: number;
  name: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface GoogleAuthPayload {
  iss: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  iat: number;
  exp: number;
  picture: string;
  
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

// Login API - Google OAuth token exchange
export const loginWithGoogle = async (googlePayload: GoogleAuthPayload): Promise<LoginResponse> => {
  const response = await fetch(`${BASE_URL}/users/login`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(googlePayload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }

   if (data.data?.user) {
    localStorage.setItem('user', JSON.stringify({
      ...data.data.user,
      profile_pic: data.data.user.profile_pic || googlePayload.picture || ''
    }));
  }

  return data;
};


// Get all users (with pagination)
export const getAllUsers = async (page: number = 1, limit: number = 10): Promise<{users: User[], total: number}> => {
  const response = await fetch(`${BASE_URL}/users?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch users');
  }

  // API returns {success, message, data: {data: User[], total, totalPages}}
  // We need to transform it to {users: User[], total: number}
  // Also normalize user_role_id to role_id for consistency
  const users = (result.data?.data || []).map((user: any) => ({
    ...user,
    role_id: user.user_role_id,
  }));
  
  return {
    users,
    total: result.data?.total || 0
  };
  
};


export const getUserProfileImage = (): string => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return '';
    
    const user = JSON.parse(userStr);
    return user.profile_pic || user.picture || '';
  } catch (error) {
    // console.error('Error getting profile image:', error);
    return '';
  }
};

// Get current user data for profile image
export const getCurrentUser = (): User | null => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch (error) {
    // console.error('Error getting current user:', error);
    return null;
  }
};

// Get user by ID
export const getUserById = async (id: string): Promise<User> => {
  const response = await fetch(`${BASE_URL}/users/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch user');
  }

  return data;
};

// Onboard new user (Super Admin function)
export interface OnboardUserData {
  name: string;
  email: string;
  mobile: string;
  user_name: string;
  user_role_id: number;
}

export const onboardUser = async (userData: OnboardUserData): Promise<User> => {
  const response = await fetch(`${BASE_URL}/users/onboard`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to onboard user');
  }

  return data;
};


export interface UpdateUserData {
  name?: string;
  mobile?: string;
  email?: string;
  status?: boolean;
 user_role_id?: number;  
}

export const updateUser = async (id: string, userData: UpdateUserData): Promise<User> => {
  const response = await fetch(`${BASE_URL}/users/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update user');
  }

  return data;
};

// Delete user
export const deleteUser = async (id: string): Promise<void> => {
  
  const response = await fetch(`${BASE_URL}/users/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    body: JSON.stringify(id)
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to delete user');
  }
};

//search user
export const searchUsers = async (query: string): Promise<User[]> => {
  
  const response = await fetch(`${BASE_URL}/users/search?q=${encodeURIComponent(query)}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to search users');
  }

  return data.data || [];
};

export const bulkUploadStudents = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file); 

   const res = await fetch(
    "https://dev-new-admissions.navgurukul.org/api/v1/students/bulkUploadStudents",
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed: ${res.status} ${text}`);
  }

  return res.json();
};


export interface CreateRoleData {
  name: string;
  status: boolean;
}

export interface ApiResponse<T> {
  data: {
    data: T[];
  };
}



// Delete delete
export const deleteStudent = async (id: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/students/deleteStudents/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    body: JSON.stringify(id)
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to delete student');
  }
};


// Create role
export const createRole = async (roleData: CreateRoleData): Promise<Role> => {
  const response = await fetch(`${BASE_URL}/roles/createRoles`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(roleData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create role');
  }

  return data.data as Role;
};

// Get all roles
export const getAllRolesNew = async (): Promise<Role[]> => {
  const response = await fetch(`${BASE_URL}/roles/getRoles`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch roles');
  }

  
  // Handle different response formats
  return data.data?.data || [];
};

// Get role by ID
export const getRoleById = async (id: string): Promise<Role> => {
  const response = await fetch(`${BASE_URL}/roles/getRoleById/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch role');
  }

  return data;
};

// Update role
export const updateRole = async (
  id: string | number,
  roleData: { name: string; status?: boolean }
): Promise<Role> => {
  const response = await fetch(`${BASE_URL}/roles/updateRole/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(roleData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update role");
  }

  return data.data ?? data; // normalize response
};

export const deleteRole = async (id: string | number): Promise<void> => {
  const headers = getAuthHeaders();

  // Remove content-type if no body
  if (headers["Content-Type"]) {
    delete headers["Content-Type"];
  }

  const response = await fetch(`${BASE_URL}/roles/deleteRole/${id}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to delete role");
  }
};

// Learning Round APIs
export const submitLearningRound = async (row: any) => {
  return fetch(
    `${BASE_URL}/students/submit/learningRoundFeedback`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    }
  );
};

export const updateLearningRound = async (id: number, row: any) => {
  return fetch(
   `${BASE_URL}/students/update/learningRoundFeedback/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    }
  );
};

// screening round Round APIs
export const submitScreeningRound = async (row: any) => {
  return fetch(
    `${BASE_URL}/students/submit/screeningRoundFeedback`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    }
  );
};

export const updateScreeningRound = async (id: number, row: any) => {
  return fetch(
    `${BASE_URL}/students/update/screeningRoundFeedback/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    }
  );
};


// Cultural Fit APIs
export const submitCulturalFit = async (row: any) => {
  return fetch(
   `${BASE_URL}/students/submit/culturalFitRoundFeedback`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    }
  );
};

export const updateCulturalFit = async (id: number, row: any) => {
  return fetch(
    `${BASE_URL}/students/update/culturalFitRoundFeedback/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    }
  );
};

// Map to dynamically select API based on type
export const API_MAP: Record<
  string,
  { submit: (row: any) => Promise<any>; update: (id: number, row: any) => Promise<any> }
> = {
  learning: { submit: submitLearningRound, update: updateLearningRound },
  cultural: { submit: submitCulturalFit, update: updateCulturalFit },
  screening: { submit: submitScreeningRound, update: updateScreeningRound },
};

// update 
export const submitFinalDecision = async (payload: any) => {
  // console.log("payload",payload)
  return fetch(
    `${BASE_URL}/students/submit/finalDecision`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
};



// Slot booking for students side

// creation 
export const createStudentSlotBooking = async (payload: any) => {
  console.log("payload",payload)
  return fetch(
  
    `${BASE_URL}/book-slot`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
};

// For creating single and multiple slots.
export const createSlotBookingTimes = async (payload: any) => {
  console.log("payload",payload)
  return fetch(
  
    `${BASE_URL}/slots/createSlots`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }
  );
};

// get Slot Booking by user id
export const getSlotByUserId = async (user_id: number): Promise<Role> => {
  const response = await fetch(`${BASE_URL}/slots/${user_id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch slot');
  }

  return data;
};

//  For getting the slots data by date:
export const getSlotByDate = async (date: string): Promise<Role> => {
  const response = await fetch(`${BASE_URL}/slots/date/?date=${date}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch slot');
  }

  return data;
};



// Updated logout function
export const logoutUser = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('userRole');
  // Remove old NavGurukul data if exists
  localStorage.removeItem('googleUser');
  localStorage.removeItem('roleAccess');
  localStorage.removeItem('privileges');
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  const user = localStorage.getItem('user');
  return !!(token && user);
};

export interface Cast {
  id: number;
  cast_name: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

// Create Cast
export const createCast = async (castData: { cast_name: string }): Promise<Cast> => {
  const response = await fetch(`${BASE_URL}/casts/createCast`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(castData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create cast');
  }

  return data;
};

// Get All Casts
export const getAllCasts = async (): Promise<Cast[]> => {
  const response = await fetch(`${BASE_URL}/casts/getCasts`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch casts');
  }

 
  
  // Return the data array from the response
  if (data && data.data && data.data.data && Array.isArray(data.data.data)) {
    return data.data.data;
  } else if (data && data.data && Array.isArray(data.data)) {
    return data.data;
  } else if (data && data.castes && Array.isArray(data.castes)) {
    return data.castes;
  } else if (Array.isArray(data)) {
    return data;
  } else {
   
    return [];
  }
};

// Get Cast By ID
export const getCastById = async (id: string): Promise<Cast> => {
  const response = await fetch(`${BASE_URL}/casts/getCastById/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch cast');
  }

  return data;
};

// Update Cast
export const updateCast = async (id: string, castData: { cast_name: string }): Promise<Cast> => {
  const response = await fetch(`${BASE_URL}/casts/updateCast/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(castData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update cast');
  }

  return data;
};

// Delete Cast
export const deleteCast = async (id: string): Promise<void> => {
  
  const headers = getAuthHeaders();

  // Remove content-type if no body
  if (headers["Content-Type"]) {
    delete headers["Content-Type"];
  }


  const response = await fetch(`${BASE_URL}/casts/deleteCast/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    body: JSON.stringify(id)
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to delete cast');
  }
};


export interface Religion {
  id: number;
  religion_name: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

// Create Religion
export const createReligion = async (religionData: { religion_name: string }): Promise<Religion> => {
  const response = await fetch(`${BASE_URL}/religions/createReligion`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(religionData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create religion');
  }

  return data;
};

// Get All Religions
export const getAllReligions = async (): Promise<Religion[]> => {
  const response = await fetch(`${BASE_URL}/religions/getReligions`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch religions');
  }
  // Return the data array from the response
  if (data && data.data && data.data.data && Array.isArray(data.data.data)) {
  
    return data.data.data;
  } else if (data && data.data && Array.isArray(data.data)) {

    return data.data;
  } else if (data && data.religions && Array.isArray(data.religions)) {
  
    return data.religions;
  } else if (Array.isArray(data)) {
    return data;
  } else {
    // console.error('Unexpected API response format:', data);
    // console.error('Data structure:', JSON.stringify(data, null, 2));
    return [];
  }
};




// Update Religion
export const updateReligion = async (id: string, religionData: { religion_name: string }): Promise<Religion> => {
  const response = await fetch(`${BASE_URL}/religions/updateReligion/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(religionData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update religion');
  }

  return data;
};

// Delete Religion
export const deleteReligion = async (id: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/religions/deleteReligion/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to delete religion');
  }
};

// Get All Students
export const getStudents = async (page, limit) => {
  const response = await apiRequest(
    `/students/getStudents?page=${page}&limit=${limit}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  const dataParsed = await response.json();

  if (!response.ok) {
    throw new Error(dataParsed.message || "Failed to fetch students");
  }

  const students = dataParsed.data?.data || [];
  const pagination = dataParsed.data?.pagination || {};

  return {
    data: students,
    totalCount: Number(pagination.total) || students.length,
    totalPages: Number(pagination.totalPages) || Math.ceil(students.length / limit),
    page: pagination.page || page,
    limit: pagination.limit || limit,
  };
};

// Get Student By ID
export const getStudentById = async (id: string): Promise<Student> => {
  try {
    const response = await axios.get<Student>(
      `${BASE_URL}/students/getStudentsById/${id}`,
    );

    return response.data; 
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Failed to fetch student"
    );
  }
};

// update students
export const updateStudent = async (id: string, payload: any): Promise<any> => {
  const response = await fetch(`${BASE_URL}/students/updateStudents/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update student");
  }

  return response.json();
};

// Qualification Management API functions
export interface Qualification {
  id: number;
  qualification_name: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}


export const getAllQualification = async (): Promise<Qualification[]> => {
  const response = await fetch(`${BASE_URL}/qualifications/getQualifications`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch qualification');
  }
  
  // Return the data array from the response
  if (data && data.data && data.data.data && Array.isArray(data.data.data)) {
   
    return data.data.data;
  } else if (data && data.data && Array.isArray(data.data)) {
   
    return data.data;
  } else if (data && data.religions && Array.isArray(data.religions)) {
  
    return data.religions;
  } else if (Array.isArray(data)) {
   
    return data;
  } else {
    return [];
  }
};


// get All Status(ep working,student...)
export interface CurrentStatus {
  id: number;
  current_status_name: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export const getAllStatus = async (): Promise<CurrentStatus[]> => {
  const response = await fetch(`${BASE_URL}/current-statuses/currentallstatuses`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch statuses');
  }

  // Return the data array from the response
  if (data && data.data && data.data.data && Array.isArray(data.data.data)) {
    return data.data.data;
  } else if (data && data.data && Array.isArray(data.data)) {

    return data.data;
  } else if (data && data.statuses && Array.isArray(data.statuses)) {
   
    return data.statuses;
  } else if (Array.isArray(data)) {
  
    return data;
  } else {
    console.error('Data structure:', JSON.stringify(data, null, 2));
    return [];
  }
}


// create Student
export const createStudent = async (studentData: any): Promise<any> => {
  const response = await fetch(`${BASE_URL}/students/createStudent`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(studentData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create student');
  }

    if (data?.data?.error === true) {
    throw new Error(data.data.message || 'Validation failed');
  }

  return data;
};

export const getFilterStudent = async (filters: any): Promise<any[]> => {
  const query = new URLSearchParams(filters).toString();
  const response = await fetch(`${BASE_URL}/students/filter?${query}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch statuses');
  }

  // Return the data array from the response
  if (data && data.data && data.data.data && Array.isArray(data.data.data)) {
    return data.data.data;
  } else if (data && data.data && Array.isArray(data.data)) {

    return data.data;
  } else if (data && data.statuses && Array.isArray(data.statuses)) {
   
    return data.statuses;
  } else if (Array.isArray(data)) {
  
    return data;
  } else {
    console.error('Data structure:', JSON.stringify(data, null, 2));
    return [];
  }
}


// post student exam submission
export const createStudentExamSubmission = async (submissionData: any): Promise<any> => {
  const response = await fetch(`${BASE_URL}/questions/submitExam`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(submissionData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to submit exam');
  }

  return data;
};



// Questions (getQuestions, CreateQuestion)
export interface Question {
  id: number;
  difficulty_level: number;
  question_type: string; 
  topic: number;
  language: string;
  english_text: string;
  hindi_text: string;
  marathi_text: string;

  english_options: string[];
  hindi_options: string[];
  marathi_options: string[];

  answer_key: number[]; // indexes of correct answers

  status: string;
  added_by: number;

  created_at: string; // ISO date
  updated_at: string; // ISO date
}


export type CreateQuestionData = Omit<
  Question, "id" | "created_at" | "updated_at"
>;


export const createQuestion = async (questionData: CreateQuestionData
): Promise<Question>  => {
  const response = await fetch(`${BASE_URL}/questions/createQuestions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(questionData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create questions');
  }

  return data.data as Question;
};



// Get questions
export const getQuestions = async (): Promise<Question[]> => {
  const response = await fetch(`${BASE_URL}/questions/getQuestions`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch Questions');
  }
  // Return the data array from the response
  if (data && data.data && data.data.data && Array.isArray(data.data.data)) {
    
    return data.data.data;
  } else if (data && data.data && Array.isArray(data.data)) {

    return data.data;
  } else if (data && data.statuses && Array.isArray(data.statuses)) {
   
    return data.statuses;
  } else if (Array.isArray(data)) {
  
    return data;
  } else {
    console.error('Data structure:', JSON.stringify(data, null, 2));
    return [];
  }
};

// delete question by id
export const deleteQuestionbyId = async (id: number)=> {
  const response = await fetch(`${BASE_URL}/questions/deleteQuestions/${id}`, {
    method: 'DELETE',
   
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to delete question');
  }
};


// delete question by id
export const getQuestionbyId = async (id: number)=> {
  const response = await fetch(`${BASE_URL}/questions/getQuestionsById/${id}`, {
    method: 'GET',
   
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to delete question');
  }
};


// Update Question
export const updateQuestion = async (
  id: number,
  questionData: Partial<CreateQuestionData>
): Promise<Question> => {
  const response = await fetch(`${BASE_URL}/questions/updateQuestions/${id}`, {
    method: "PUT",              
    headers: getAuthHeaders(),
    body: JSON.stringify(questionData),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to update question");

  return data.data as Question;
};

// Sets
interface QuestionSet {
  id: number;
  name: string; 
  description: string;
  status: boolean; 
  maximumMarks: number;
  created_at: string;
  updated_at: string;
}

// Get all question sets ...
export const getAllQuestionSets = async (): Promise<QuestionSet[]> => {
  const response = await fetch(`${BASE_URL}/questions/question-sets`);
  const json = await response.json();

  const dataArray = Array.isArray(json.data) ? json.data : [];

  return dataArray;
};

interface QuestionSetMapping {
  question_set_id: number;
  question_id: number;
  difficulty_level:number;
}

export const createQuestionSetMappings = async (
  mappings: QuestionSetMapping[]
): Promise<any> => {
  try {
    const response = await axios.post(
      `${BASE_URL}/questions/question-set-mappings`,
      mappings,
      {
        headers: {
          ...getAuthHeaders() as Record<string, string>, // force object type for axios
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Failed to create mappings:", error.response?.data || error.message);
    throw error;
  }
};


// create test for students
export const getRandomQuestions = async (language: "english" | "hindi" | "marathi" = "english") => {
  try {
    const response = await axios.get(`${BASE_URL}/questions/random-for-test`);
    
    const questions = response.data?.data?.map((q: any) => ({
      id: q.id,
      question: q[`${language}_text`],
      options: q[`${language}_options`],
      difficulty_level : q.difficulty_level,
      answer: q.answer_key[0], // assuming first index in answer_key array is correct
    })) || [];

    console.log("questions1",questions)
    return questions;
  } catch (error: any) {
    console.error("Error fetching questions:", error);
    throw error;
  }
};

export const getQuestionsBySetType = async (setType: string) => {
  try {
    const url = `${BASE_URL}/questions/set/${setType}`;
    const response = await axios.get(url);
    return response.data; // Adjust based on API response structure
  } catch (error: any) {
    console.error(`Error fetching questions for set ${setType}:`, error);
    throw error;
  }
};

// delete question from set
export const deleteQuestionFromSet = async (id: number) => {
  const response = await fetch(`${BASE_URL}/questions/question-set-mappings/remove/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to delete question from set');
  }
};


export const bulkUploadQuestions = async (csvData: string): Promise<any> => {
  const blob = new Blob([csvData], { type: 'text/csv' });
  const file = new File([blob], 'questions.csv', { type: 'text/csv' });

  const formData = new FormData();
  formData.append('file', file);
  formData.append('uploadType', 'bulk');
  formData.append('timestamp', new Date().toISOString());

  const authHeaders = getAuthHeaders();
  const headers = { ...authHeaders };
  delete headers['Content-Type'];
  delete headers['content-type'];

  const response = await fetch(`${BASE_URL}/questions/bulkUpload`, {
    method: "POST",
    headers: headers,
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to upload questions");
  }
  return data;
};

// Stage Management API
export interface Stage {
  id: number;
  stage_name: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

// Create Stage
export const createStage = async (stageData: { stage_name: string }): Promise<Stage> => {
  const response = await fetch(`${BASE_URL}/stages/createStage`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(stageData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create stage');
  }

  return data;
};

// Get All Stages
export const getAllStages = async (): Promise<Stage[]> => {
  const response = await fetch(`${BASE_URL}/stages/getStages`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch stages');
  }

  // Handle multiple response formats like in casts/religions
  if (data && data.data && data.data.data && Array.isArray(data.data.data)) {
    return data.data.data;
  } else if (data && data.data && Array.isArray(data.data)) {
    return data.data;
  } else if (data && data.stages && Array.isArray(data.stages)) {
    return data.stages;
  } else if (Array.isArray(data)) {
    return data;
  } else {
    return [];
  }
};

// Get Stage By ID
export const getStageById = async (id: string): Promise<Stage> => {
  const response = await fetch(`${BASE_URL}/stages/getStageById/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch stage');
  }

  return data;
};

// Update Stage
export const updateStage = async (id: string, stageData: { stage_name: string; status: boolean }): Promise<Stage> => {
  const response = await fetch(`${BASE_URL}/stages/updateStage/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(stageData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update stage');
  }

  return data;
};

// Delete Stage
export const deleteStage = async (id: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/stages/deleteStage/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    body: JSON.stringify(id)
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to delete stage');
  }
};


// CurrentStatus interface
export interface CurrentStatus {
  id: number;
  current_status_name: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

// Get All Current Statuses
export const getAllStatuses = async (): Promise<CurrentStatus[]> => {
  const response = await fetch(`${BASE_URL}/current-statuses/currentallstatuses`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch statuses');
  }

  // Handle different possible shapes of the response, like nested data etc.
  if (data && data.data && data.data.data && Array.isArray(data.data.data)) {
    return data.data.data;
  } else if (data && data.data && Array.isArray(data.data)) {
    return data.data;
  } else if (data && data.statuses && Array.isArray(data.statuses)) {
    return data.statuses;
  } else if (Array.isArray(data)) {
    return data;
  } else {
    return [];
  }
};



// Get all campuses
export const getCampusesApi = async (): Promise<{ id: number; campus_name: string }[]> => {
  const response = await fetch(`${BASE_URL}/campuses/getCampuses`);
  const data = await response.json();

  let campusesData: any[] = [];
  if (Array.isArray(data)) {
    campusesData = data;
  } else if (data.data && Array.isArray(data.data)) {
    campusesData = data.data;
  } else if (data.data && typeof data.data === 'object' && data.data.data && Array.isArray(data.data.data)) {
    campusesData = data.data.data;
  } else if (data.data && typeof data.data === 'object' && data.data.campuses && Array.isArray(data.data.campuses)) {
    campusesData = data.data.campuses;
  } else if (data.data && typeof data.data === 'object' && data.data.result && Array.isArray(data.data.result)) {
    campusesData = data.data.result;
  } else if (data.campuses && Array.isArray(data.campuses)) {
    campusesData = data.campuses;
  } else if (data.result && Array.isArray(data.result)) {
    campusesData = data.result;
  } else {
    campusesData = [];
  }

  return campusesData.map((item: any) => ({
    id: item.id || item.campus_id,
    campus_name: item.campus_name || item.name || item.campusName || item.campus || "", 
  }));
};


// Create campus
export const createCampusApi = async (campusName: string) => {
  const response = await fetch(`${BASE_URL}/campuses/createCampus`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ campus_name: campusName }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create campus: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// Update campus
export const updateCampusApi = async (id: number, campus_name: string) => {
  const response = await fetch(`${BASE_URL}/campuses/updateCampus/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ campus_name }),
  });

  if (!response.ok) throw new Error("Failed to update campus");
  return response.json();
};

// Delete campus
export const deleteCampusApi = async (id: number) => {
  const response = await fetch(`${BASE_URL}/campuses/deleteCampus/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    body: JSON.stringify({id})
  });

  if (!response.ok) throw new Error("Failed to delete campus");
  return response.json();
};

//  Create School
export const createSchool = async (schoolName: string) => {
  try {
    const response = await fetch(`${BASE_URL}/schools/createSchool`, {
      method: "POST",
      headers: getAuthHeaders(),
    
      body: JSON.stringify({ school_name: schoolName }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create school: ${response.status} ${response.statusText} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

interface School {
  id: number;
  school_name: string;
}

export const getAllSchools = async (): Promise<School[]> => {
  const response = await fetch(`${BASE_URL}/schools/getSchools`);
  const data = await response.json();

  let schoolsData: any[] = [];
  if (Array.isArray(data)) {
    schoolsData = data;
  } else if (data.data && Array.isArray(data.data)) {
    schoolsData = data.data;
  } else if (data.data && typeof data.data === 'object' && data.data.data && Array.isArray(data.data.data)) {
    schoolsData = data.data.data;
  } else if (data.data && typeof data.data === 'object' && data.data.schools && Array.isArray(data.data.schools)) {
    schoolsData = data.data.schools;
  } else if (data.data && typeof data.data === 'object' && data.data.result && Array.isArray(data.data.result)) {
    schoolsData = data.data.result;
  } else if (data.schools && Array.isArray(data.schools)) {
    schoolsData = data.schools;
  } else if (data.result && Array.isArray(data.result)) {
    schoolsData = data.result;
  } else {
    schoolsData = [];
  }

  return schoolsData.map((school: any) => ({
    id: school.id || school.school_id,
    school_name: school.school_name || school.name || school.schoolName || "",
  }));
};

//  Update School
export const updateSchool = async (id: number, updatedName: string) => {
  try {
    const response = await fetch(`${BASE_URL}/schools/updateSchool/${id}`, {
      method: "PUT",
      headers:getAuthHeaders(),
      body: JSON.stringify({ school_name: updatedName }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update school: ${response.status} ${response.statusText} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

//  Delete School
export const deleteSchool = async (id: number) => {
  try {
    const response = await fetch(`${BASE_URL}/schools/deleteSchool/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      body: JSON.stringify(id)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete school: ${response.status} ${response.statusText} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    // console.error("Error deleting school:", error);
    throw error;
  }
};

// state and district api
export const getAllStates = async () => {
  try {
    const response = await fetch(`${BASE_URL}/states/getAll`, {
      method: "GET",
    });
    if (!response.ok) throw new Error(`Failed to fetch states`);
    return await response.json();
  } catch (error) {
    // console.error("Error fetching states:", error);
    throw error;
  }
};

//  Get districts by state_code
export const getDistrictsByState = async (stateCode: string) => {
  try {
    const response = await fetch(`${BASE_URL}/states/getByState/${stateCode}`, {
      method: "GET",
    });
    if (!response.ok) throw new Error(`Failed to fetch districts for ${stateCode}`);
    return await response.json();
  } catch (error) {
    // console.error("Error fetching districts:", error);
    throw error;
  }
};

//  Get blocks by district_code
export const getBlocksByDistrict = async (districtCode: string) => {
  try {
    const response = await fetch(`${BASE_URL}/districts/getByDistrict/${districtCode}`, {
      method: "GET",
    });
    if (!response.ok) throw new Error(`Failed to fetch blocks for ${districtCode}`);
    return await response.json();
  } catch (error) {
    // console.error("Error fetching blocks:", error);
    throw error;
  }
};

// Get all stages
export const getStagesApi = async () => {
  try {
    const response = await fetch(`${BASE_URL}/stages/getStages`, {
      method: "GET",
    });

    if (!response.ok) throw new Error("Failed to fetch stages");
    const data = await response.json();

    // Handle possible nested response formats
    if (data?.data && Array.isArray(data.data)) {
      return data.data;
    } else if (Array.isArray(data)) {
      return data;
    } else if (data?.stages && Array.isArray(data.stages)) {
      return data.stages;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching stages:", error);
    throw error;
  }
};

// Get statuses by stage ID
export const getStatusesByStageId = async (stageId: number | string) => {
  try {
    const response = await fetch(`${BASE_URL}/stages/statuses/${stageId}`, {
      method: "GET",
    });

    if (!response.ok) throw new Error(`Failed to fetch statuses for stage ${stageId}`);
    const data = await response.json();

    // Handle common response shapes
    if (data?.data && Array.isArray(data.data)) {
      return data.data;
    } else if (Array.isArray(data)) {
      return data;
    } else if (data?.statuses && Array.isArray(data.statuses)) {
      return data.statuses;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching statuses:", error);
    throw error;
  }
};

export const searchStudentsApi = async (searchTerm: string): Promise<any> => {
  const response = await fetch(
    `${BASE_URL}/students/search?search=${encodeURIComponent(searchTerm)}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to search students");
  }

  // Handle flexible response shapes (array or nested data)
  if (data?.data && Array.isArray(data.data)) {
    return data.data;
  } else if (Array.isArray(data)) {
    return data;
  } else {
    console.error("Unexpected search API response:", data);
    return [];
  }
};
