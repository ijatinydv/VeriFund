import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens if needed
api.interceptors.request.use(
  (config) => {
    // Add auth token from localStorage if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      // Server responded with error status
      const errorMessage = error.response.data?.message || 'An error occurred';
      return Promise.reject(new Error(errorMessage));
    } else if (error.request) {
      // Request made but no response
      return Promise.reject(new Error('No response from server. Please check your connection.'));
    } else {
      // Something else happened
      return Promise.reject(error);
    }
  }
);

/**
 * Fetch projects with optional filters
 * @param {Object} params - Query parameters (status, category, etc.)
 * @returns {Promise} - Promise resolving to projects array
 */
export const fetchProjects = async (params = {}) => {
  const response = await api.get('/projects', { params });
  return response.data || [];
};

/**
 * Fetch a single project by ID
 * @param {string} projectId - The project ID
 * @returns {Promise} - Promise resolving to project object
 */
export const fetchProjectById = async (projectId) => {
  const response = await api.get(`/projects/${projectId}`);
  return response.data;
};

/**
 * Get nonce for wallet authentication
 * @param {string} walletAddress - The user's wallet address
 * @param {string} role - Optional role for new users
 * @returns {Promise} - Promise resolving to nonce object with message
 */
export const getNonce = async (walletAddress, role = null) => {
  // Normalize wallet address to lowercase to match backend storage
  const normalizedAddress = walletAddress.toLowerCase();
  const params = role ? { role } : {};
  const response = await api.get(`/auth/nonce/${normalizedAddress}`, { params });
  // Backend returns { success, data: { nonce, isNewUser, message, expiresAt } }
  return response.data || response;
};

/**
 * Login with wallet signature
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.walletAddress - Wallet address (will be normalized)
 * @param {string} credentials.signature - Signed message signature
 * @param {string} credentials.role - Optional role for new users
 * @returns {Promise} - Promise resolving to user and token
 */
export const loginWithWallet = async ({ walletAddress, signature, role = null }) => {
  // Normalize wallet address to lowercase to match backend storage
  const normalizedAddress = walletAddress.toLowerCase();
  const response = await api.post('/auth/login', {
    walletAddress: normalizedAddress,
    signature,
    role,
  });
  console.log('🔍 Login API Response:', response);
  console.log('🔍 Response.data:', response.data);
  console.log('🔍 Response.data.user:', response.data?.user);
  console.log('🔍 Response.data.user.role:', response.data?.user?.role);
  // Backend returns { success, data: { token, user } }
  return response.data || response;
};

/**
 * Update user role
 * @param {string} role - New role (Creator or Investor)
 * @returns {Promise} - Promise resolving to updated user and new token
 */
export const updateUserRole = async (role) => {
  const response = await api.put('/auth/role', { role });
  // Backend returns { success, data: { token, user } }
  return response.data || response;
};

/**
 * Logout user
 * @returns {Promise} - Promise resolving to logout confirmation
 */
export const logoutUser = async () => {
  const response = await api.post('/auth/logout');
  return response;
};

/**
 * Get current user profile
 * @returns {Promise} - Promise resolving to user object
 */
export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response;
};

/**
 * Create a new project
 * @param {Object} projectData - Project data object
 * @returns {Promise} - Promise resolving to created project
 */
export const createProject = async (projectData) => {
  const response = await api.post('/projects', projectData);
  return response.data;
};

/**
 * Fetch a single project by ID
 * @param {string} projectId - The project ID
 * @returns {Promise} - Promise resolving to project object
 */


/**
 * Record an investment transaction
 * @param {Object} investmentData - Investment details
 * @returns {Promise} - Promise resolving to investment record
 */
export const recordInvestment = async (investmentData) => {
  const response = await api.post('/investments', investmentData);
  return response.data;
};

/**
 * Fetch creator's own projects
 * @returns {Promise} - Promise resolving to array of projects
 */
export const fetchMyProjects = async () => {
  const response = await api.get('/projects/my/projects');
  return response.data || [];
};

/**
 * Fetch investor's investments
 * @returns {Promise} - Promise resolving to array of investments
 */
export const fetchMyInvestments = async () => {
  const response = await api.get('/investments/my');
  return response.data?.investments || [];
};

/**
 * Get AI-powered price suggestion for a project
 * @param {Object} projectData - Project data for price analysis
 * @returns {Promise} - Promise resolving to price suggestion
 */
export const suggestPrice = async (projectData) => {
  const response = await api.post('/projects/suggest-price', projectData);
  return response.data || response;
};

/**
 * Get AI-powered price suggestion for a project (alias)
 * @param {Object} creatorData - Creator/project data for price analysis
 * @returns {Promise} - Promise resolving to price suggestion with min, suggested, and max prices
 */
export const getAISuggestedPrice = suggestPrice;


export default api;
