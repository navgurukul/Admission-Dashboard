import { Student } from "./student.types";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Get auth token from sessionStorage ONLY
export const getAuthToken = (): string | null => {
  const token = sessionStorage.getItem("authToken"); // ✅ Only token in sessionStorage
  return token;
};

export const getAuthHeaders = (withJson: boolean = true): HeadersInit => {
  const token = getAuthToken();

  // Debug logging
  if (token) {
    // Check if token has Bearer prefix already
    if (token.startsWith("Bearer ")) {
      // console.warn('Token already has Bearer prefix!');
    }

    // Validate JWT format (3 parts separated by dots)
    const tokenParts = token.split(".");

    if (tokenParts.length !== 3) {
      // console.error(' Invalid JWT format - should have 3 parts separated by dots');
    }
  } else {
    // console.error(' No token found in localStorage');
  }

  const headers: HeadersInit = {
    ...(withJson ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return headers;
};

// Make authenticated API request
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
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

  return fetch(url, config);
};

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

// Login API - Store token in sessionStorage, user in localStorage
export const loginWithGoogle = async (
  googlePayload: GoogleAuthPayload,
): Promise<LoginResponse> => {
  const response = await fetch(`${BASE_URL}/users/login`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(googlePayload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  //  Store TOKEN in sessionStorage
  if (data.data?.token) {
    const tokenToStore = data.data.token.startsWith("Bearer ")
      ? data.data.token.substring(7)
      : data.data.token;

    sessionStorage.setItem("authToken", tokenToStore); // Token in sessionStorage
  }

  //  Store USER in localStorage (not sessionStorage)
  if (data.data?.user) {
    localStorage.setItem(
      "user",
      JSON.stringify({
        ...data.data.user,
        profile_pic: data.data.user.profile_pic || googlePayload.picture || "",
      }),
    );
  }

  return data;
};

// Get all users (with pagination)
export const getAllUsers = async (
  page: number = 1,
  limit: number = 10,
): Promise<{ users: User[]; total: number }> => {
  const response = await fetch(
    `${BASE_URL}/users?page=${page}&limit=${limit}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch users");
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
    total: result.data?.total || 0,
  };
};

export const getUserProfileImage = (): string => {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return "";

    const user = JSON.parse(userStr);
    return user.profile_pic || user.picture || "";
  } catch (error) {
    return "";
  }
};

// Get current user data for profile image
export const getCurrentUser = (): User | null => {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch (error) {
    return null;
  }
};

// Get user by ID
export const getUserById = async (id: string): Promise<User> => {
  const response = await fetch(`${BASE_URL}/users/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch user");
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
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to onboard user");
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

export const updateUser = async (
  id: string,
  userData: UpdateUserData,
): Promise<User> => {
  const response = await fetch(`${BASE_URL}/users/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update user");
  }

  return data;
};

// Delete user
export const deleteUser = async (id: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/users/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    body: JSON.stringify(id),
  });

  if (!response.ok) {
    const data = await response.json();
    const error = new Error(data.message || "Failed to delete user");
    (error as any).details = data.error || data.message;
    throw error;
  }
};

//search user
export const searchUsers = async (query: string): Promise<User[]> => {
  const response = await fetch(
    `${BASE_URL}/users/search?q=${encodeURIComponent(query)}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to search users");
  }

  return data.data || [];
};

export const bulkUploadStudents = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const headers = getAuthHeaders(false);

  // Create clean headers object with ONLY Authorization
  const uploadHeaders: HeadersInit = {};
  if (headers['Authorization']) {
    uploadHeaders['Authorization'] = headers['Authorization'] as string;
  }

  const res = await fetch(
    `${BASE_URL}/students/bulkUploadStudents`,
    { method: "POST", body: formData, headers: uploadHeaders },
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
    method: "DELETE",
    headers: getAuthHeaders(),
    body: JSON.stringify(id),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to delete student");
  }
};

// Create role
export const createRole = async (roleData: CreateRoleData): Promise<Role> => {
  const response = await fetch(`${BASE_URL}/roles/createRoles`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(roleData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create role");
  }

  return data.data as Role;
};

// Get all roles
export const getAllRolesNew = async (): Promise<Role[]> => {
  const response = await fetch(`${BASE_URL}/roles/getRoles`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch roles");
  }

  // Handle different response formats
  return data.data?.data || [];
};

// Get role by ID
export const getRoleById = async (id: string): Promise<Role> => {
  const response = await fetch(`${BASE_URL}/roles/getRoleById/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch role");
  }

  return data;
};

// Update role
export const updateRole = async (
  id: string | number,
  roleData: { name: string; status?: boolean },
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
  const response = await fetch(`${BASE_URL}/students/submit/learningRoundFeedback`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(row),
  });

  if (response.ok && row.student_id) {
    const data = await response.clone().json();
    const status = row.learning_round_status || data?.data?.learning_round_status || data?.learning_round_status;
    if (status) {
      await triggerStudentStatusUpdate(row.student_id, "learning", status);
    }
  }
  return response;
};

export const updateLearningRound = async (id: number, row: any) => {
  const response = await fetch(`${BASE_URL}/students/update/learningRoundFeedback/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(row),
  });

  if (response.ok) {
    // For updates, we might need to get student_id if not in row
    const studentId = row.student_id;
    const status = row.learning_round_status;
    if (studentId && status) {
      await triggerStudentStatusUpdate(studentId, "learning", status);
    }
  }
  return response;
};

// screening round Round APIs
export const submitScreeningRound = async (row: any) => {
  const response = await fetch(`${BASE_URL}/students/submit/screeningRoundFeedback`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(row),
  });

  if (response.ok && row.student_id) {
    const data = await response.clone().json();
    const status = row.status || data?.data?.status || data?.status;
    if (status) {
      await triggerStudentStatusUpdate(row.student_id, "screening", status);
    }
  }
  return response;
};

export const updateScreeningRound = async (id: number, row: any) => {
  const response = await fetch(`${BASE_URL}/students/update/screeningRoundFeedback/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(row),
  });

  if (response.ok) {
    const studentId = row.student_id;
    const status = row.status;
    if (studentId && status) {
      await triggerStudentStatusUpdate(studentId, "screening", status);
    }
  }
  return response;
};

// Cultural Fit APIs
export const submitCulturalFit = async (row: any) => {
  const response = await fetch(`${BASE_URL}/students/submit/culturalFitRoundFeedback`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(row),
  });

  if (response.ok && row.student_id) {
    const data = await response.clone().json();
    const status = row.cultural_fit_status || data?.data?.cultural_fit_status || data?.cultural_fit_status;
    if (status) {
      await triggerStudentStatusUpdate(row.student_id, "cultural", status);
    }
  }
  return response;
};

export const updateCulturalFit = async (id: number, row: any) => {
  const response = await fetch(`${BASE_URL}/students/update/culturalFitRoundFeedback/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(row),
  });

  if (response.ok) {
    const studentId = row.student_id;
    const status = row.cultural_fit_status;
    if (studentId && status) {
      await triggerStudentStatusUpdate(studentId, "cultural", status);
    }
  }
  return response;
};

export const updateStudentStatus = async (payload: {
  student_id: number;
  stage_id: number;
  stage_status_id: number;
}) => {
  return fetch(`${BASE_URL}/students/updateStudentStatus`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
};

/**
 * Helper to trigger student status update based on round and feedback status
 */
export const triggerStudentStatusUpdate = async (
  studentId: number,
  roundType: "screening" | "learning" | "cultural" | "final" | "onboarded",
  status: string
) => {
  let stageId: number;
  let stageStatusId: number | null = null;

  const normalizedStatus = status.toLowerCase().trim();

  switch (roundType) {
    case "screening":
      stageId = 3;
      if (normalizedStatus.includes("pass")) stageStatusId = 6;
      else if (normalizedStatus.includes("fail")) stageStatusId = 3;
      break;
    case "learning":
      stageId = 4;
      if (normalizedStatus.includes("pass")) stageStatusId = 10;
      else if (normalizedStatus.includes("fail")) stageStatusId = 9;
      break;
    case "cultural":
      stageId = 4;
      if (normalizedStatus.includes("pass")) stageStatusId = 23;
      else if (normalizedStatus.includes("fail")) stageStatusId = 15;
      break;
    case "final":
      stageId = 5;
      if (normalizedStatus === "offer declined") stageStatusId = 12;
      else if (normalizedStatus === "selected but not joined") stageStatusId = 11;
      else if (normalizedStatus === "offer letter sent") stageStatusId = 11;
      else if (normalizedStatus === "offer accepted") stageStatusId = 13;
      else if (normalizedStatus === "offer sent") stageStatusId = 11;
      else if (normalizedStatus === "decision pending based on diversity") stageStatusId = 17;
      else if (normalizedStatus === "diversity failed") stageStatusId = 19;
      break;
    case "onboarded":
      stageId = 6;
      if (normalizedStatus === "onboarded") stageStatusId = 14;
      break;
    default:
      return;
  }

  if (stageStatusId !== null) {
    try {
      await updateStudentStatus({
        student_id: studentId,
        stage_id: stageId,
        stage_status_id: stageStatusId,
      });
    } catch (error) {
      console.error("Failed to update student status automatically:", error);
    }
  }
};

// Delete APIs for feedback rounds
export const deleteScreeningRoundFeedback = async (id: number) => {
  const response = await fetch(`${BASE_URL}/students/delete/screeningRoundFeedback/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(false), // Don't include Content-Type for DELETE
  });
  return response;
};

export const deleteLearningRoundFeedback = async (id: number) => {
  const response = await fetch(`${BASE_URL}/students/delete/learningRoundFeedback/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(false), // Don't include Content-Type for DELETE
  });
  return response;
};

export const deleteCulturalFitRoundFeedback = async (id: number) => {
  const response = await fetch(`${BASE_URL}/students/delete/culturalFitRoundFeedback/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(false), // Don't include Content-Type for DELETE
  });
  return response;
};

// Map to dynamically select API based on type
export const API_MAP: Record<
  string,
  {
    submit: (row: any) => Promise<any>;
    update: (id: number, row: any) => Promise<any>;
    delete?: (id: number) => Promise<any>;
  }
> = {
  learning: {
    submit: submitLearningRound,
    update: updateLearningRound,
    delete: deleteLearningRoundFeedback
  },
  cultural: {
    submit: submitCulturalFit,
    update: updateCulturalFit,
    delete: deleteCulturalFitRoundFeedback
  },
  screening: {
    submit: submitScreeningRound,
    update: updateScreeningRound,
    delete: deleteScreeningRoundFeedback
  },
};

// update
export const submitFinalDecision = async (payload: any) => {
  const response = await fetch(`${BASE_URL}/students/submit/finalDecision`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (response.ok && payload.student_id) {
    if (payload.onboarded_status) {
      await triggerStudentStatusUpdate(payload.student_id, "onboarded", payload.onboarded_status);
    } else if (payload.offer_letter_status) {
      await triggerStudentStatusUpdate(payload.student_id, "final", payload.offer_letter_status);
    }
  }
  return response;
};

// Slot booking for students side

// creation
export const createStudentSlotBooking = async (payload: any) => {
  // console.log("payload",payload)
  return fetch(`${BASE_URL}/book-slot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
};

// For creating single and multiple slots.
export const createSlotBookingTimes = async (payload: any) => {
  // console.log("payload",payload)
  return fetch(`${BASE_URL}/slots/createSlots`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
};

// get Slot Booking by user id
export const getSlotByUserId = async (user_id: number): Promise<Role> => {
  const response = await fetch(`${BASE_URL}/slots/${user_id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch slot");
  }

  return data;
};

//  For getting the slots data by date:
export const getSlotByDate = async (
  date: string,
  slotType: "LR" | "CFR",
): Promise<Role> => {
  const response = await fetch(`${BASE_URL}/slots/date/${date}/${slotType}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch slot");
  }

  return data;
};

// Update slot API
export const updateSlot = async (
  slotId: number,
  payload: {
    start_time: string;
    end_time: string;
    slot_type: string;
    date: string;
  },
) => {
  const response = await fetch(`${BASE_URL}/slots/update/${slotId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update slot");
  }

  return data;
};

// Updated logout function
export const logoutUser = () => {
  sessionStorage.removeItem("authToken");
  localStorage.removeItem("user");
  localStorage.removeItem("userRole");
  localStorage.removeItem("googleUser");
  localStorage.removeItem("roleAccess");
  localStorage.removeItem("privileges");
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  const user = localStorage.getItem("user");
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
export const createCast = async (castData: {
  cast_name: string;
}): Promise<Cast> => {
  const response = await fetch(`${BASE_URL}/casts/createCast`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(castData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create cast");
  }

  return data;
};

// Get All Casts
export const getAllCasts = async (): Promise<Cast[]> => {
  const response = await fetch(`${BASE_URL}/casts/getCasts`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch casts");
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
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch cast");
  }

  return data;
};

// Update Cast
export const updateCast = async (
  id: string,
  castData: { cast_name: string },
): Promise<Cast> => {
  const response = await fetch(`${BASE_URL}/casts/updateCast/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(castData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update cast");
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
    method: "DELETE",
    headers: getAuthHeaders(),
    body: JSON.stringify(id),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to delete cast");
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
export const createReligion = async (religionData: {
  religion_name: string;
}): Promise<Religion> => {
  const response = await fetch(`${BASE_URL}/religions/createReligion`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(religionData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create religion");
  }

  return data;
};

// Get All Religions
export const getAllReligions = async (): Promise<Religion[]> => {
  const response = await fetch(`${BASE_URL}/religions/getReligions`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch religions");
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
export const updateReligion = async (
  id: string,
  religionData: { religion_name: string },
): Promise<Religion> => {
  const response = await fetch(`${BASE_URL}/religions/updateReligion/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(religionData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update religion");
  }

  return data;
};

// Get All Partners
export const getAllPartners = async (): Promise<any[]> => {
  try {
    const data = await getPartners(1, 1000);

    // Handle nested structure: data.data.data
    if (data && data.data && data.data.data && Array.isArray(data.data.data)) {
      return data.data.data;
    }
    // Handle structure: data.data
    if (data && data.data && Array.isArray(data.data)) {
      return data.data;
    }
    // Handle structure: data (if it's already an array)
    if (Array.isArray(data)) {
      return data;
    }
    // Handle potential response structure from findByFilter: { result: [...] }
    if (data && data.result && Array.isArray(data.result)) {
      return data.result;
    }

    return [];
  } catch (error) {
    console.error("Error in getAllPartners:", error);
    return [];
  }
};

// Get All Donors
// Get All Donors
export const getAllDonors = async (): Promise<any[]> => {
  const response = await fetch(`${BASE_URL}/donors/getDonors?page=1&pageSize=1000`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch donors");
  }

  // Handle different response formats
  if (data && data.data && data.data.data && Array.isArray(data.data.data)) {
    return data.data.data;
  } else if (data && data.data && Array.isArray(data.data)) {
    return data.data;
  } else if (Array.isArray(data)) {
    return data;
  } else {
    return [];
  }
};

// Delete Religion
export const deleteReligion = async (id: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/religions/deleteReligion/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to delete religion");
  }
};

export interface StudentStats {
  totalStudents: number;
  offerLetterSent: number;
  onboarded: number;
}

export const getStudentsStats = async (): Promise<StudentStats> => {
  const response = await fetch(`${BASE_URL}/students/getStudentsStats`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch student stats");
  }

  return data.data;
};

// Get All Students
export const getStudents = async (page, limit) => {
  const response = await apiRequest(
    `/students/getStudents?page=${page}&limit=${limit}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
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
    totalPages:
      Number(pagination.totalPages) || Math.ceil(students.length / limit),
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
      error?.response?.data?.message || "Failed to fetch student",
    );
  }
};

// Get Student By Email
export const getStudentDataByEmail = async (
  email: string,
): Promise<Student> => {
  try {
    const response = await axios.get<Student>(
      `${BASE_URL}/students/getByEmail/${email}`,
    );

    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Failed to fetch student",
    );
  }
};

// Get Student By Phone
export const getStudentDataByPhone = async (
  phone: string,
): Promise<Student> => {
  try {
    const response = await axios.get<Student>(
      `${BASE_URL}/students/getByPhone/${phone}`,
    );

    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Failed to fetch student by phone",
    );
  }
};

// Get Complete Student Data (student, exam_sessions, interview rounds, final decisions)
export interface CompleteStudentData {
  success: boolean;
  message: string;
  data: {
    student: any;
    exam_sessions: any[];
    interview_learner_round: any[];
    interview_schedules_lr: any[];
    interview_cultural_fit_round: any[];
    interview_schedules_cfr: any[];
    final_decisions: any[];
  };
}

export const getCompleteStudentData = async (
  email: string,
): Promise<CompleteStudentData> => {
  try {
    const response = await axios.get<CompleteStudentData>(
      `${BASE_URL}/students/getByEmail/${email}`,
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Failed to fetch complete student data",
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

// Bulk update students
export const bulkUpdateStudents = async (payload: {
  student_ids: number[];
  campus_id?: number;
  state?: string;
  district?: string;
  block?: string;
  current_status_id?: number;
  qualification_id?: number;
  cast_id?: number;
  partner_id?: number;
  donor_id?: number;
  offer_letter_status?: string;
  onboarded_status?: string;
  joining_date?: string;
}): Promise<any> => {
  const response = await fetch(`${BASE_URL}/students/bulk-update`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to bulk update students");
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
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch qualification");
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
  const response = await fetch(
    `${BASE_URL}/current-statuses/currentallstatuses`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch statuses");
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
    console.error("Data structure:", JSON.stringify(data, null, 2));
    return [];
  }
};

// create Student
export const createStudent = async (studentData: any): Promise<any> => {
  const response = await fetch(`${BASE_URL}/students/createStudent`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(studentData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create student");
  }

  if (data?.data?.error === true) {
    throw new Error(data.data.message || "Validation failed");
  }

  return data;
};

export const getFilterStudent = async (filters: any): Promise<{ data: any[], total: number, totalPages: number }> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "all") {
      if (Array.isArray(value)) {
        // Filter out "all" and empty strings, then join with comma
        const filteredValues = value.filter(v => v !== "all" && v !== "");
        if (filteredValues.length > 0) {
          params.append(key, filteredValues.join(','));
        }
      } else {
        params.append(key, String(value));
      }
    }
  });

  const query = params.toString();
  const response = await fetch(`${BASE_URL}/students/filter?${query}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch statuses");
  }

  // Return the data array and pagination info
  const students = data?.data?.data || data?.data || data?.statuses || (Array.isArray(data) ? data : []);
  const pagination = data?.data?.pagination || data?.pagination || {};

  return {
    data: students,
    total: Number(pagination.total) || students.length,
    totalPages: Number(pagination.totalPages) || 1
  };
};

// post student exam submission
export const createStudentExamSubmission = async (
  submissionData: any,
): Promise<any> => {
  const response = await fetch(`${BASE_URL}/questions/submitExam`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(submissionData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to submit exam");
  }

  return data;
};

// Questions (getQuestions, CreateQuestion)
export interface Option {
  id: number;
  text: string;
}

export interface Question {
  id: number;
  difficulty_level: number;
  question_type: string;
  topic: number;
  language: string;
  english_text: string;
  hindi_text: string;
  marathi_text: string;

  english_options: Option[];
  hindi_options: Option[];
  marathi_options: Option[];

  answer_key: number[]; // indexes of correct answers

  status: string;
  added_by: number;
  school_ids?: number[];
  created_at: string; // ISO date
  updated_at: string; // ISO date
}

export type CreateQuestionData = Omit<
  Question,
  "id" | "created_at" | "updated_at"
>;

export const createQuestion = async (
  questionData: CreateQuestionData,
): Promise<Question> => {
  const response = await fetch(`${BASE_URL}/questions/createQuestions`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(questionData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create questions");
  }

  return data.data as Question;
};

// Get questions
export const getQuestions = async (): Promise<Question[]> => {
  const response = await fetch(`${BASE_URL}/questions/getQuestions`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch Questions");
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
    console.error("Data structure:", JSON.stringify(data, null, 2));
    return [];
  }
};

// delete question by id
export const deleteQuestionbyId = async (id: number) => {
  const response = await fetch(`${BASE_URL}/questions/deleteQuestions/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to delete question");
  }
};

// delete question by id
export const getQuestionbyId = async (id: number) => {
  const response = await fetch(`${BASE_URL}/questions/getQuestionsById/${id}`, {
    method: "GET",
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to delete question");
  }
};

// Update Question
export const updateQuestion = async (
  id: number,
  questionData: Partial<CreateQuestionData>,
): Promise<Question> => {
  const response = await fetch(`${BASE_URL}/questions/updateQuestions/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(questionData),
  });

  const data = await response.json();
  if (!response.ok)
    throw new Error(data.message || "Failed to update question");

  return data.data as Question;
};

// Sets
interface QuestionSet {
  id: number;
  name: string;
  description: string;
  status: boolean;
  maximumMarks: number;
  is_default_online_set?: boolean;
  created_at: string;
  updated_at: string;
  partnerId?: number;
  partner_name?: string;
  school_ids?: number[];
}

// Get all question sets ...
export const getAllQuestionSets = async (): Promise<QuestionSet[]> => {
  const response = await fetch(`${BASE_URL}/questions/question-sets`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  const json = await response.json();

  if (Array.isArray(json)) return json;
  if (Array.isArray(json.data)) return json.data;
  if (json.data && Array.isArray(json.data.data)) return json.data.data;

  return [];
};

// Fetch questions for a given set name from external questions service
export const getQuestionsBySetName = async (setName: string) => {
  try {
    const url = `${BASE_URL}/questions/set/${encodeURIComponent(setName)}`;
    const headers = {
      ...(getAuthHeaders(false) as Record<string, string>),
    };

    const response = await axios.get(url, { headers, timeout: 10000 });
    return response.data;
  } catch (error) {
    console.error("getQuestionsBySetName error:", error);
    throw error;
  }
};

interface QuestionSetMapping {
  question_set_id: number;
  question_id: number;
  difficulty_level: number;
}

export const createQuestionSetMappings = async (
  mappings: QuestionSetMapping[],
): Promise<any> => {
  try {
    const response = await axios.post(
      `${BASE_URL}/questions/question-set-mappings`,
      mappings,
      {
        headers: {
          ...(getAuthHeaders() as Record<string, string>), // force object type for axios
        },
      },
    );

    return response.data;
  } catch (error: any) {
    console.error(
      "Failed to create mappings:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

// create test for students
export const getRandomQuestions = async (
  language: "english" | "hindi" | "marathi" = "english",
  studentId: number | string,
) => {
  try {
    const response = await axios.get(`${BASE_URL}/questions/random-for-test?student_id=${studentId}`, {
      headers: {
        ...(getAuthHeaders() as Record<string, string>),
      },
    });

    const questions =
      response.data?.data?.map((q: any) => ({
        id: q.id,
        question: q[`${language}_text`],
        options: q[`${language}_options`],
        difficulty_level: q.difficulty_level,
        answer: q.answer_key[0], // assuming first index in answer_key array is correct
      })) || [];

    // console.log("questions1",questions)
    return questions;
  } catch (error: any) {
    console.error("Error fetching questions:", error);
    throw error;
  }
};

export const getQuestionsBySetType = async (setType: string) => {
  try {
    const url = `${BASE_URL}/questions/set/${encodeURIComponent(setType)}`;
    const response = await axios.get(url);
    return response.data; // Adjust based on API response structure
  } catch (error: any) {
    console.error(`Error fetching questions for set ${setType}:`, error);
    throw error;
  }
};

// delete question from set
export const deleteQuestionFromSet = async (id: number) => {
  const response = await fetch(
    `${BASE_URL}/questions/question-set-mappings/remove/${id}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to delete question from set");
  }
};

// Create a question set
export const createQuestionSet = async (data: {
  name: string;
  description: string;
  maximumMarks?: number;
  isRandom?: boolean;
  questions?: { question_id: number; difficulty_level: number }[];
  partnerId?: number;
  partner_name?: string;
  school_ids?: number[];
  success?: boolean;
}): Promise<QuestionSet> => {
  const response = await fetch(`${BASE_URL}/questions/question-sets`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message || "Failed to create question set");
  }

  return json.data || json;
};

// Update a question set
export const updateQuestionSet = async (
  id: number,
  data: {
    name: string;
    description: string;
    maximumMarks?: number;
    isRandom?: boolean;
    school_ids?: number[];
    success?: boolean;
  }
): Promise<QuestionSet> => {
  const response = await fetch(
    `${BASE_URL}/questions/question-sets/${id}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message || "Failed to update question set");
  }

  return json.data || json;
};

// Delete a question set
export const deleteQuestionSet = async (id: number): Promise<void> => {
  const response = await fetch(
    `${BASE_URL}/questions/question-sets/${id}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
      body: JSON.stringify(id)
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete question set");
  }
};

// Set a question set as default for online tests
export const setDefaultOnlineQuestionSet = async (id: number): Promise<QuestionSet> => {
  const response = await fetch(
    `${BASE_URL}/questions/question-sets/${id}/set-default-online`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(id)
    }
  );

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message || "Failed to set default online question set");
  }

  return json.data || json;
};

// Download question set as PDF
export const downloadQuestionSetPDF = async (setId: number, language?: string): Promise<Blob> => {
  let url = `${BASE_URL}/questions/download-pdf/${setId}`;

  // Add language query parameter if provided and not English
  if (language && language.toLowerCase() !== 'english') {
    url += `?language=${language.toLowerCase()}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      ...getAuthHeaders(false), // Don't add Content-Type for blob response
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to download PDF" }));
    throw new Error(error.message || "Failed to download PDF");
  }

  return await response.blob();
};

export const bulkUploadQuestions = async (csvData: string): Promise<any> => {
  const blob = new Blob([csvData], { type: "text/csv" });
  const file = new File([blob], "questions.csv", { type: "text/csv" });

  const formData = new FormData();
  formData.append("file", file);
  formData.append("uploadType", "bulk");
  formData.append("timestamp", new Date().toISOString());

  const authHeaders = getAuthHeaders();
  const headers = { ...authHeaders };
  delete headers["Content-Type"];
  delete headers["content-type"];

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
export const createStage = async (stageData: {
  stage_name: string;
}): Promise<Stage> => {
  const response = await fetch(`${BASE_URL}/stages/createStage`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(stageData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create stage");
  }

  return data;
};

// Get All Stages
export const getAllStages = async (): Promise<Stage[]> => {
  const response = await fetch(`${BASE_URL}/stages/getStages`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch stages");
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
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch stage");
  }

  return data;
};

// Update Stage
export const updateStage = async (
  id: string,
  stageData: { stage_name: string; status: boolean },
): Promise<Stage> => {
  const response = await fetch(`${BASE_URL}/stages/updateStage/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(stageData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update stage");
  }

  return data;
};

// Delete Stage
export const deleteStage = async (id: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/stages/deleteStage/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    body: JSON.stringify(id),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to delete stage");
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
  const response = await fetch(
    `${BASE_URL}/current-statuses/currentallstatuses`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch statuses");
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
// Get Statuses by Stage ID
export const getStageStatuses = async (stage_id: number): Promise<any> => {
  const response = await fetch(
    `${BASE_URL}/stages/statuses/${stage_id}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch stage statuses");
  }

  return data;
};

// Get campuses with pagination
export const getCampuses = async (page: number = 1, limit: number = 10) => {
  const response = await fetch(`${BASE_URL}/campuses/getCampuses?page=${page}&pageSize=${limit}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch campuses");
  }

  return data;
};

// Get all campuses (legacy/convenience)
export const getCampusesApi = async (): Promise<
  { id: number; campus_name: string }[]
> => {
  const data = await getCampuses(1, 1000);

  let campusesData: any[] = [];
  if (data && data.data && data.data.data && Array.isArray(data.data.data)) {
    campusesData = data.data.data;
  } else if (data && data.data && Array.isArray(data.data)) {
    campusesData = data.data;
  } else if (Array.isArray(data)) {
    campusesData = data;
  } else if (data.campuses && Array.isArray(data.campuses)) {
    campusesData = data.campuses;
  } else if (data.result && Array.isArray(data.result)) {
    campusesData = data.result;
  } else {
    campusesData = [];
  }

  return campusesData.map((item: any) => ({
    id: item.id || item.campus_id,
    campus_name:
      item.campus_name || item.name || item.campusName || item.campus || "",
  }));
};

// Get campus by ID
export const getCampusById = async (id: number) => {
  const response = await fetch(`${BASE_URL}/campuses/getCampusById/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) throw new Error("Failed to fetch campus by ID");
  return response.json();
};

export interface CampusStudentStats {
  campusId: number;
  totalStudentsInCampus: number;
  studentsWithSchool: number;
  studentsWithoutSchool: number;
  schoolBreakdown: {
    [key: string]: number;
  };
}

// Get campus student stats
export const getCampusStudentStats = async (
  id: number,
): Promise<{ success: boolean; data: CampusStudentStats }> => {
  const response = await fetch(`${BASE_URL}/students/getCampusStudentStats/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) throw new Error("Failed to fetch campus student stats");
  return response.json();
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
    throw new Error(
      `Failed to create campus: ${response.status} ${response.statusText}`,
    );
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
    body: JSON.stringify({ id }),
  });

  const result = await response.json();

  // Check if there's an error in the nested data object
  if (result.data?.error) {
    throw new Error(result.data.details || result.data.error || "Failed to delete campus");
  }

  if (!response.ok) {
    throw new Error(result.message || result.error || "Failed to delete campus");
  }

  return result;
};

//  Create School
export const createSchool = async (schoolName: string, cutOffMarks?: number) => {
  const response = await fetch(`${BASE_URL}/schools/createSchool`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      school_name: schoolName,
      cut_off_marks: cutOffMarks
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to create school: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }
  return await response.json();
};

export interface School {
  id: number;
  school_name: string;
  cut_off_marks: number;
}

export const getAllSchools = async (): Promise<School[]> => {
  const response = await fetch(`${BASE_URL}/schools/getSchools`);
  const data = await response.json();

  let schoolsData: any[] = [];
  if (Array.isArray(data)) {
    schoolsData = data;
  } else if (data.data && Array.isArray(data.data)) {
    schoolsData = data.data;
  } else if (
    data.data &&
    typeof data.data === "object" &&
    data.data.data &&
    Array.isArray(data.data.data)
  ) {
    schoolsData = data.data.data;
  } else if (
    data.data &&
    typeof data.data === "object" &&
    data.data.schools &&
    Array.isArray(data.data.schools)
  ) {
    schoolsData = data.data.schools;
  } else if (
    data.data &&
    typeof data.data === "object" &&
    data.data.result &&
    Array.isArray(data.data.result)
  ) {
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
    cut_off_marks: school.cut_off_marks || 0,
  }));
};

//  Update School
export const updateSchool = async (id: number, updatedName: string, cutOffMarks?: number) => {
  const response = await fetch(`${BASE_URL}/schools/updateSchool/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      school_name: updatedName,
      cut_off_marks: cutOffMarks
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to update school: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }
  return await response.json();
};

//  Delete School
export const deleteSchool = async (id: number) => {
  const response = await fetch(`${BASE_URL}/schools/deleteSchool/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    body: JSON.stringify(id),
  });

  if (!response.ok) {
    // Parse the JSON response to get the actual error message
    const errorData = await response.json();

    // Create an error object that includes the parsed data
    const error: any = new Error(errorData?.message || 'Failed to delete school');
    error.data = errorData?.data || errorData;
    error.status = response.status;
    throw error;
  }

  return await response.json();
};

// state and district api
export const getAllStates = async () => {
  const response = await fetch(`${BASE_URL}/states/getAll`, {
    method: "GET",
  });
  if (!response.ok) throw new Error(`Failed to fetch states`);
  return await response.json();
};

//  Get districts by state_code
export const getDistrictsByState = async (
  stateIdentifier: string | number,
) => {
  // External API expects a numeric state_id. Accept either id or state code.
  let stateId: string | number = stateIdentifier;

  if (typeof stateIdentifier === "string" && !/^[0-9]+$/.test(stateIdentifier)) {
    try {
      const statesRes = await getAllStates();
      let statesArray: any[] = [];

      if (Array.isArray(statesRes)) {
        statesArray = statesRes;
      } else if (statesRes && Array.isArray(statesRes.data)) {
        statesArray = statesRes.data;
      } else if (statesRes && statesRes.states) {
        statesArray = statesRes.states;
      } else if (statesRes && statesRes.result) {
        statesArray = statesRes.result;
      }

      const found = statesArray.find(
        (s: any) =>
          String(s.state_code).toLowerCase() === String(stateIdentifier).toLowerCase() ||
          String(s.code).toLowerCase() === String(stateIdentifier).toLowerCase() ||
          String(s.name).toLowerCase() === String(stateIdentifier).toLowerCase(),
      );

      if (found) {
        stateId = found.id ?? found.state_id ?? found.ID ?? found.stateId ?? stateIdentifier;
      }
    } catch (err) {
      // ignore and let the downstream API return an error if unresolved
    }
  }

  const response = await fetch(
    `${BASE_URL}/districts/getByState?state_id=${encodeURIComponent(
      String(stateId),
    )}`,
    {
      method: "GET",
    },
  );

  if (!response.ok)
    throw new Error(`Failed to fetch districts for ${stateIdentifier}`);
  return await response.json();
};

//  Get blocks by district_code
export const getBlocksByDistrict = async (districtCode: string) => {
  const response = await fetch(
    `${BASE_URL}/districts/getByDistrict/${districtCode}`,
    {
      method: "GET",
    },
  );
  if (!response.ok)
    throw new Error(`Failed to fetch blocks for ${districtCode}`);
  return await response.json();
};

// Get all stages
export const getStagesApi = async () => {
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
};

// Get statuses by stage ID
export const getStatusesByStageId = async (stageId: number | string) => {
  try {
    const response = await fetch(`${BASE_URL}/stages/statuses/${stageId}`, {
      method: "GET",
    });

    if (!response.ok)
      throw new Error(`Failed to fetch statuses for stage ${stageId}`);
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
    },
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

// Interview Scheduling APIs

// Interface for scheduled interviews
export interface ScheduledInterview {
  id: number;
  student_id: number;
  slot_id: number;
  title: string;
  description: string;
  meeting_link: string;
  google_event_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
  student_name?: string;
  student_email?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
}

// Get available slots for interviewer by date
export const getMyAvailableSlots = async (date?: string): Promise<any> => {
  let url = `${BASE_URL}/slots/my-available-slots`;

  if (date) {
    url += `?date=${date}`;
  }

  const headers = getAuthHeaders();

  const response = await fetch(url, {
    method: "GET",
    headers: headers,
  });

  // Get response body for debugging
  const responseText = await response.text();

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    // console.error(' Failed to parse response as JSON');
    throw new Error("Invalid response format from server");
  }

  if (!response.ok) {
    if (response.status === 401) {
      sessionStorage.removeItem("authToken");
      localStorage.removeItem("user");
      throw new Error("Session expired. Please login again.");
    }

    throw new Error(data.message || "Failed to fetch available slots");
  }

  if (data?.data && Array.isArray(data.data)) {
    return data.data;
  } else if (Array.isArray(data)) {
    return data;
  } else if (data?.slots && Array.isArray(data.slots)) {
    return data.slots;
  } else {
    return data;
  }
};

// Schedule interview meeting by students
export const scheduleInterview = async (payload: any): Promise<any> => {
  // console.log(Scheduling interview...');
  // console.log(' Payload:', payload);

  const headers = getAuthHeaders();
  // console.log(' Headers:', headers);

  const response = await fetch(`${BASE_URL}/interview-schedules/create`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(payload),
  });

  // console.log(' Schedule response status:', response.status);

  const responseText = await response.text();
  // console.log(' Response body:', responseText);

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    // console.error(' Failed to parse response as JSON');
    throw new Error("Invalid response format from server");
  }

  if (!response.ok) {
    if (response.status === 401) {
      sessionStorage.removeItem("authToken");
      localStorage.removeItem("user");
      throw new Error("Session expired. Please login again.");
    }

    throw new Error(data.message || "Failed to schedule interview");
  }

  return data;
};

// Get interview schedule by student ID
export const getInterviewByStudentId = async (
  studentId: number,
): Promise<ScheduledInterview[]> => {
  const url = `${BASE_URL}/interview-schedules/getByStudentId/${studentId}`;

  const headers = getAuthHeaders();
  const response = await fetch(url, {
    method: "GET",
    headers: headers,
  });

  const responseText = await response.text();

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    // console.error(' Failed to parse response as JSON');
    throw new Error("Invalid response format from server");
  }

  if (!response.ok) {
    if (response.status === 401) {
      sessionStorage.removeItem("authToken");
      localStorage.removeItem("user");
      throw new Error("Session expired. Please login again.");
    }

    throw new Error(data.message || "Failed to fetch interview schedule");
  }

  if (data?.data && Array.isArray(data.data)) {
    return data.data;
  } else if (Array.isArray(data)) {
    return data;
  } else if (data?.interviews && Array.isArray(data.interviews)) {
    return data.interviews;
  } else {
    return [];
  }
};

// Get scheduled interviews by date
export const getScheduledInterviews = async (
  date?: string,
): Promise<ScheduledInterview[]> => {
  let url = `${BASE_URL}/interview-schedules/`;

  if (date) {
    url += `?date=${date}`;
  }

  const headers = getAuthHeaders();
  const response = await fetch(url, {
    method: "GET",
    headers: headers,
  });

  const responseText = await response.text();

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    // console.error(' Failed to parse response as JSON');
    throw new Error("Invalid response format from server");
  }

  if (!response.ok) {
    if (response.status === 401) {
      sessionStorage.removeItem("authToken");
      localStorage.removeItem("user");
      throw new Error("Session expired. Please login again.");
    }

    throw new Error(data.message || "Failed to fetch scheduled interviews");
  }

  if (data?.data && Array.isArray(data.data)) {
    return data.data;
  } else if (Array.isArray(data)) {
    return data;
  } else if (data?.interviews && Array.isArray(data.interviews)) {
    return data.interviews;
  } else {
    return [];
  }
};

export const updateScheduledInterview = async (
  scheduledInterviewId: number,
  payload: {
    slot_id: number;
    title: string;
    description: string;
    meeting_link: string;
    google_event_id?: string;
  },
): Promise<any> => {
  // console.log("Rescheduling interview ID:", scheduledInterviewId);
  // console.log("Reschedule payload:", payload);

  const response = await fetch(
    `${BASE_URL}/interview-schedules/${scheduledInterviewId}/reschedule`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to reschedule interview");
  }

  return data;
};

// Delete interview slot
export const deleteInterviewSlot = async (slotId: number): Promise<void> => {
  const response = await fetch(`${BASE_URL}/slots/${slotId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    body: JSON.stringify(slotId),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(
      data.message || "Cannot delete booked slots or past date slots",
    );
  }
};

// Cancel scheduled interview from student side
export const cancelScheduledInterview = async (
  scheduledInterviewId: number,
  cancelReason: string,
): Promise<void> => {
  const response = await fetch(
    `${BASE_URL}/interview-schedules/${scheduledInterviewId}/cancel`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ cancel_reason: cancelReason }),
    },
  );

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to cancel interview");
  }
};

// Upload profile image
export const uploadProfileImage = async (
  file: File,
): Promise<{ key: string; url: string }> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BASE_URL}/media/upload-profile`, {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to upload image");
  }

  return result.data;
};

export const sendBulkOfferLetters = async (studentIds: number[]) => {
  const response = await fetch(`${BASE_URL}/students/sendBulkOfferLetters`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ student_ids: studentIds }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to send offer letters");
  }
  return data;
};

// Get all interview schedules with pagination and filters (Admin)
export interface InterviewScheduleResponse {
  success: boolean;
  message?: string;
  data: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const getAllInterviewSchedules = async (params: {
  page?: number;
  pageSize?: number;
  slot_type?: 'LR' | 'CFR' | string;
  date?: string;
  search?: string;
}): Promise<InterviewScheduleResponse> => {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  if (params.slot_type) queryParams.append('slot_type', params.slot_type);
  if (params.date) queryParams.append('date', params.date);
  if (params.search) queryParams.append('search', params.search);

  const response = await fetch(
    `${BASE_URL}/interview-schedules/all?${queryParams.toString()}`,
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch interview schedules');
  }

  return data;
};

// Get all slots with pagination and filters (Admin)
export interface SlotsResponse {
  success: boolean;
  message?: string;
  data: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const getAllSlots = async (params: {
  page?: number;
  pageSize?: number;
  slot_type?: 'LR' | 'CFR' | string;
  date?: string;
  status?: string;
  search?: string;
}): Promise<SlotsResponse> => {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  if (params.slot_type) queryParams.append('slot_type', params.slot_type);
  if (params.date) queryParams.append('date', params.date);
  if (params.status) queryParams.append('status', params.status);
  if (params.search) queryParams.append('search', params.search);

  const response = await fetch(
    `${BASE_URL}/slots/?${queryParams.toString()}`,
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch slots');
  }

  return data;
};

// Partner APIs
export interface Partner {
  id: number;
  partner_name: string;
  slug: string;
  created_at?: string;
  updated_at?: string;
  districts?: string[];
  state?: string;
  email?: string;
  notes?: string;
  meraki_link?: string;
  student_count?: number;
}

export const createPartner = async (payload: Partial<Partner>) => {
  const response = await fetch(`${BASE_URL}/partners/createPartner`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create partner");
  }

  return data;
};

export const getPartners = async (page: number = 1, limit: number = 10, partnerName?: string) => {
  // Build query parameters
  let queryParams = `page=${page}&pageSize=${limit}`;

  // Only add partner_name if it's provided and not empty
  if (partnerName && partnerName.trim()) {
    queryParams += `&partner_name=${encodeURIComponent(partnerName.trim())}`;
  }

  const response = await fetch(`${BASE_URL}/partners/getPartners?${queryParams}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch partners");
  }

  return data;
};

export const getPartnerById = async (id: number | string) => {
  const response = await fetch(`${BASE_URL}/partners/getPartnerById/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch partner");
  }

  return data;
};

export const updatePartner = async (id: number | string, payload: Partial<Partner>) => {
  const response = await fetch(`${BASE_URL}/partners/updatePartner/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update partner");
  }

  return data;
};

export const deletePartner = async (id: number | string) => {
  const headers = getAuthHeaders();
  if (headers["Content-Type"]) {
    delete headers["Content-Type"];
  }

  const response = await fetch(`${BASE_URL}/partners/deletePartner/${id}`, {
    method: "DELETE",
    headers: headers,
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to delete partner");
  }
};

export const getStudentsByPartnerId = async (id: number | string, page: number = 1, pageSize: number = 10, search: string = "") => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  if (search.trim()) {
    params.append("search", search.trim());
  }

  const response = await fetch(`${BASE_URL}/partners/getStudentsByPartnerId/${id}?${params.toString()}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch students by partner");
  }

  return data;
};


// Donor APIs
export interface Donor {
  id: number;
  donor_name: string;
  donor_email?: string;
  donor_phone?: number | string;
  donor_address?: string;
  donor_city?: string;
  donor_state?: string;
  donor_country?: string;
  status?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const createDonor = async (payload: Partial<Donor>) => {
  const response = await fetch(`${BASE_URL}/donors/createDonor`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create donor");
  }

  return data;
};

export const getDonors = async (page: number = 1, limit: number = 10, donorName?: string) => {
  // Build query parameters
  let queryParams = `page=${page}&pageSize=${limit}`;

  // Only add donor_name if it's provided and not empty
  if (donorName && donorName.trim()) {
    queryParams += `&donor_name=${encodeURIComponent(donorName.trim())}`;
  }

  const response = await fetch(`${BASE_URL}/donors/getDonors?${queryParams}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch donors");
  }

  // Return full response with pagination metadata
  return data;
};


export const getDonorById = async (id: number | string) => {
  const response = await fetch(`${BASE_URL}/donors/getDonorById/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch donor");
  }

  return data;
}

export const updateDonor = async (id: number | string, payload: Partial<Donor>) => {
  const response = await fetch(`${BASE_URL}/donors/updateDonor/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update donor");
  }

  return data;
}

export const deleteDonor = async (id: number | string) => {
  const headers = getAuthHeaders();
  if (headers["Content-Type"]) {
    delete headers["Content-Type"];
  }

  const response = await fetch(`${BASE_URL}/donors/deleteDonor/${id}`, {
    method: "DELETE",
    headers: headers,
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to delete donor");
  }
}

export const getStudentsByDonorId = async (id: number | string, page: number = 1, pageSize: number = 10, search: string = "") => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  if (search.trim()) {
    params.append("search", search.trim());
  }

  const response = await fetch(`${BASE_URL}/donors/getStudentsByDonorId/${id}?${params.toString()}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch students by donor");
  }

  return data;
}

// Get Feedbacks
export const getFeedbacks = async (): Promise<any> => {
  const response = await fetch(`${BASE_URL}/feedback/getFeedbacks`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch feedbacks");
  }

  return data;
};

// Create Feedback
export const createFeedback = async (payload: any): Promise<any> => {
  const response = await fetch(`${BASE_URL}/feedback/createFeedback`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create feedback");
  }

  return data;
};

// Get Feedback By ID
export const getFeedbackById = async (id: number): Promise<any> => {
  const response = await fetch(`${BASE_URL}/feedback/getFeedbackById/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to get feedback");
  }

  return data;
};

// Get Feedbacks By Student ID
export const getFeedbacksByStudentId = async (student_id: number): Promise<any> => {
  const response = await fetch(
    `${BASE_URL}/feedback/getFeedbacksByStudent/${student_id}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch student feedbacks");
  }

  return data;
};

// Update Feedback
export const updateFeedback = async (id: number, payload: any): Promise<any> => {
  const response = await fetch(`${BASE_URL}/feedback/updateFeedback/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update feedback");
  }

  return data;
};

// Delete Feedback
export const deleteFeedback = async (id: number): Promise<any> => {
  const response = await fetch(`${BASE_URL}/feedback/deleteFeedback/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    body: JSON.stringify(id)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete feedback");
  }

  return data;
};
