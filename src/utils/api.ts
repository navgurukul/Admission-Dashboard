const BASE_URL = import.meta.env.VITE_API_BASE_URL;


// Get auth token from localStorage
export const getAuthToken = (): string | null => {
  const token =  localStorage.getItem('authToken');
  console.log('authToken from localStorage:', token);
  return token;
  
};



// Create headers with authentication
export const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  console.log(token,"token checking") 
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
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

// Logout function
export const logoutUser = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('roleAccess');
  localStorage.removeItem('privileges');
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  const user = localStorage.getItem('user');
  return !!(token && user);
};

// Get current user
export const getCurrentUser = () => {
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
};

// Cast Management API functions
export interface Cast {
  id: number;
  cast_name: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

// Create Cast
export const createCast = async (castData: { cast_name: string }): Promise<Cast> => {
  const response = await fetch(`${API_BASE_URL}/casts/createCast`, {
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
  const response = await fetch(`${API_BASE_URL}/casts/getCasts`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch casts');
  }

  console.log('API Response for getAllCasts:', data);
  console.log('Data type:', typeof data);
  console.log('Data keys:', Object.keys(data));
  
  // Return the data array from the response
  if (data && data.data && data.data.data && Array.isArray(data.data.data)) {
    console.log('Found data.data.data array:', data.data.data);
    return data.data.data;
  } else if (data && data.data && Array.isArray(data.data)) {
    console.log('Found data.data array:', data.data);
    return data.data;
  } else if (data && data.castes && Array.isArray(data.castes)) {
    console.log('Found data.castes array:', data.castes);
    return data.castes;
  } else if (Array.isArray(data)) {
    console.log('Data is directly an array:', data);
    return data;
  } else {
    console.error('Unexpected API response format:', data);
    console.error('Data structure:', JSON.stringify(data, null, 2));
    return [];
  }
};

// Get Cast By ID
export const getCastById = async (id: string): Promise<Cast> => {
  const response = await fetch(`${API_BASE_URL}/casts/getCastById/${id}`, {
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
  const response = await fetch(`${API_BASE_URL}/casts/updateCast/${id}`, {
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
  const response = await fetch(`${API_BASE_URL}/casts/deleteCast/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to delete cast');
  }
};

// Religion Management API functions
export interface Religion {
  id: number;
  religion_name: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

// Create Religion
export const createReligion = async (religionData: { religion_name: string }): Promise<Religion> => {
  const response = await fetch(`${API_BASE_URL}/religions/createReligion`, {
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
  const response = await fetch(`${API_BASE_URL}/religions/getReligions`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch religions');
  }

  console.log('API Response for getAllReligions:', data);
  console.log('Data type:', typeof data);
  console.log('Data keys:', Object.keys(data));
  
  // Return the data array from the response
  if (data && data.data && data.data.data && Array.isArray(data.data.data)) {
    console.log('Found data.data.data array:', data.data.data);
    return data.data.data;
  } else if (data && data.data && Array.isArray(data.data)) {
    console.log('Found data.data array:', data.data);
    return data.data;
  } else if (data && data.religions && Array.isArray(data.religions)) {
    console.log('Found data.religions array:', data.religions);
    return data.religions;
  } else if (Array.isArray(data)) {
    console.log('Data is directly an array:', data);
    return data;
  } else {
    console.error('Unexpected API response format:', data);
    console.error('Data structure:', JSON.stringify(data, null, 2));
    return [];
  }
};

// Get Religion By ID
export const getReligionById = async (id: string): Promise<Religion> => {
  const response = await fetch(`${API_BASE_URL}/religions/getReligionById/${id}`, {
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
  const response = await fetch(`${API_BASE_URL}/religions/updateReligion/${id}`, {
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
  const response = await fetch(`${API_BASE_URL}/religions/deleteReligion/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to delete religion');
  }
}; 