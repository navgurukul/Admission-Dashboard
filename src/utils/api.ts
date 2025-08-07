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