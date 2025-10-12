import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * VeriFund Authentication Store
 * Manages user authentication state using Zustand
 * Persists auth data to localStorage for session persistence
 */
const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      /**
       * Set user and token on successful login
       * @param {Object} userData - User profile object
       * @param {string} authToken - JWT authentication token
       */
      setUser: (userData, authToken) => {
        set({
          user: userData,
          token: authToken,
          isAuthenticated: true,
          error: null,
        });
        // Store token in localStorage for API requests
        localStorage.setItem('authToken', authToken);
      },

      /**
       * Clear user data on logout
       */
      clearUser: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
        // Remove token from localStorage
        localStorage.removeItem('authToken');
      },

      /**
       * Set loading state during authentication
       * @param {boolean} loading - Loading status
       */
      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      /**
       * Set error message
       * @param {string} error - Error message
       */
      setError: (error) => {
        set({ error, isLoading: false });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Update user profile
       * @param {Object} updates - Partial user object with updates
       */
      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },

      /**
       * Update user role and token
       * @param {string} role - New role
       * @param {string} newToken - New JWT token
       */
      updateRole: (role, newToken) => {
        set((state) => ({
          user: state.user ? { ...state.user, role } : null,
          token: newToken,
        }));
        // Update token in localStorage
        if (newToken) {
          localStorage.setItem('authToken', newToken);
        }
      },
    }),
    {
      name: 'verifund-auth', // localStorage key
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }), // Only persist these fields
    }
  )
);

export default useAuthStore;
