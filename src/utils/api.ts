
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

  return fetch(url, config);
};

// AUTHENTICATION FUNCTIONS (NEW) 

// User interfaces
export interface User {
   id: number;
  name: string;
  email: string;
  mobile?: string;
  user_name: string;
  role_id: number;
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

  console.log('Login Response:', data);
  return data;
};


// Get all users (with pagination)
export const getAllUsers = async (page: number = 1, limit: number = 10): Promise<{users: User[], total: number}> => {
  const response = await fetch(`${BASE_URL}/users?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch users');
  }

  return data;
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
    headers:getAuthHeaders(false),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to delete user');
  }
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

  console.log('Get Roles Response:', data);
  
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
    headers 
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
    console.error('Unexpected API response format:', data);
    console.error('Data structure:', JSON.stringify(data, null, 2));
    return [];
  }
};

// Get Religion By ID
export const getReligionById = async (id: string): Promise<Religion> => {
  const response = await fetch(`${BASE_URL}/religions/getReligionById/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch religion');
  }

  return data;
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
export const getStudents = async (page = 1, limit = 10) => {
  const response = await apiRequest(`/students/getStudents?page=${page}&limit=${limit}`, {
    method: "GET",
     headers: getAuthHeaders()
  });

  const dataParsed = await response.json();

  if (!response.ok) {
    throw new Error(dataParsed.message || "Failed to fetch students");
  }

  // Handle different response formats if backend wraps data
  if (dataParsed && dataParsed.data && Array.isArray(dataParsed.data)) {
    return dataParsed.data;
  } else if (dataParsed && Array.isArray(dataParsed.data.data)) {
    return dataParsed.data.data;
  } else if (Array.isArray(dataParsed)) {
    return dataParsed;
  } else {
    return [];
  }
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
    console.error('Data structure:', JSON.stringify(data, null, 2));
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

  console.log('API Response for getAllStatus:', data);
  console.log('Data type:', typeof data);
  console.log('Data keys:', Object.keys(data));
  
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
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(studentData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create student');
  }

  return data;
};
