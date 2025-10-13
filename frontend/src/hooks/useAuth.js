import { useCallback } from 'react';
import { useSignMessage, useAccount } from 'wagmi';
import useAuthStore from '../store/authStore';
import { getNonce, loginWithWallet, logoutUser, updateUserRole } from '../services/api';

/**
 * Custom hook for wallet-based authentication
 * Handles login, logout, and authentication state
 * 
 * Authentication Flow:
 * 1. Fetch nonce from backend for the wallet address
 * 2. Sign the nonce message using the user's wallet
 * 3. Send signature to backend for verification
 * 4. Store JWT token and user profile on success
 */
function useAuth() {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    setUser,
    clearUser,
    setLoading,
    setError,
    clearError,
    updateRole: updateRoleInStore,
  } = useAuthStore();

  // Wagmi hooks
  const { isConnected, connector } = useAccount();
  const { signMessageAsync } = useSignMessage();

  /**
   * Login function - Complete wallet authentication flow
   * @param {string} walletAddress - User's wallet address
   * @param {string} role - Optional role for new users
   */
  const login = useCallback(
    async (walletAddress, role = null) => {
      try {
        setLoading(true);
        clearError();

        // Check if wallet is still connected
        if (!isConnected) {
          throw new Error('Wallet is not connected. Please reconnect your wallet.');
        }

        // Check if connector is available (ensures wallet is ready)
        if (!connector) {
          console.warn('⚠️ Connector not ready yet, waiting...');
          // Wait a bit for connector to be ready
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // If still not ready after waiting, proceed anyway and let error handling catch issues
          console.log('🔌 Connector status after wait:', !!connector);
        }

        // Normalize the wallet address to avoid case mismatch issues
        const normalizedAddress = walletAddress.toLowerCase();

        // Step 1: Get nonce from backend
        console.log('📡 Fetching nonce for wallet:', normalizedAddress, 'with role:', role || 'none');
        const nonceResponse = await getNonce(normalizedAddress, role);
        console.log('📥 Nonce response:', nonceResponse);
        
        const { nonce, isNewUser, message: backendMessage } = nonceResponse;

        if (!nonce) {
          throw new Error('Failed to retrieve authentication nonce');
        }

        // Step 2: Use the exact message from backend to ensure format matches
        const message = backendMessage;

        console.log('✍️ Requesting signature from wallet...');
        console.log('📝 Message to sign:', message);
        console.log('🔌 Connector available:', !!connector);

        // Step 3: Request user to sign message with explicit error handling
        let signature;
        try {
          // Ensure we're passing the message as a plain string
          signature = await signMessageAsync({ 
            message: message,
          });
          console.log('✅ Signature received:', signature.substring(0, 20) + '...');
        } catch (signError) {
          console.error('❌ Signature error details:', signError);
          console.error('Error name:', signError.name);
          console.error('Error code:', signError.code);
          console.error('Error message:', signError.message);
          
          // User rejected the signature request
          if (signError.code === 4001 || 
              signError.code === 'ACTION_REJECTED' ||
              signError.message?.includes('User rejected') ||
              signError.message?.includes('User denied')) {
            throw new Error('Signature request was rejected. Please approve the signature to authenticate.');
          }
          
          // Wallet not connected or other connector errors
          if (signError.message?.includes('Connector') || 
              signError.message?.includes('not connected') ||
              signError.name === 'ConnectorNotConnectedError') {
            throw new Error('Wallet connection lost. Please reconnect and try again.');
          }
          
          // Re-throw other signature errors with more context
          throw new Error(`Failed to sign message: ${signError.message || 'Unknown error'}`);
        }

        console.log('✅ Signature obtained, verifying with backend...');

        // Step 4: Send signature to backend for verification (use normalized address)
        const response = await loginWithWallet({
          walletAddress: normalizedAddress,
          signature,
          role,
        });

        console.log('📥 Login response:', response);

        if (!response.user || !response.token) {
          throw new Error('Invalid authentication response from server');
        }

        // Step 5: Store user and token in Zustand store
        setUser(response.user, response.token);

        console.log('✅ Authentication successful! User:', response.user);
        console.log('🎭 User role:', response.user.role);
        console.log('🔑 Token stored');
        
        return { 
          success: true, 
          user: response.user,
          isNewUser,
        };
      } catch (err) {
        console.error('❌ Authentication error:', err);
        
        // Handle user rejection
        if (err.message?.includes('User rejected') || 
            err.message?.includes('rejected') ||
            err.message?.includes('denied') ||
            err.code === 4001 || 
            err.code === 'ACTION_REJECTED' ||
            err.name === 'UserRejectedRequestError') {
          setError('Authentication cancelled by user');
          return { success: false, error: 'Authentication cancelled by user' };
        }

        // Handle connector not connected error
        if (err.name === 'ConnectorNotConnectedError' || 
            err.message?.includes('not connected') ||
            err.message?.includes('not fully established') ||
            err.message?.includes('Connector')) {
          setError('Wallet disconnected. Please reconnect and try again.');
          return { success: false, error: 'Wallet disconnected. Please reconnect and try again.' };
        }

        // Handle other errors
        const errorMessage = err.message || 'Authentication failed. Please try again.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [signMessageAsync, setUser, setLoading, setError, clearError, isConnected, connector]
  );

  /**
   * Update user role
   * @param {string} newRole - New role (Creator or Investor)
   */
  const updateRole = useCallback(
    async (newRole) => {
      try {
        setLoading(true);
        clearError();

        const response = await updateUserRole(newRole);

        if (!response.user || !response.token) {
          throw new Error('Invalid response from server');
        }

        // Update role and token in store
        updateRoleInStore(response.user.role, response.token);

        return { success: true, user: response.user };
      } catch (err) {
        console.error('Update role error:', err);
        const errorMessage = err.message || 'Failed to update role';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [updateRoleInStore, setLoading, setError, clearError]
  );

  /**
   * Logout function - Clear authentication state
   */
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      
      // Optional: Notify backend of logout
      try {
        await logoutUser();
      } catch (err) {
        console.warn('Backend logout failed:', err);
        // Continue with local logout even if backend fails
      }

      // Clear local auth state
      clearUser();
      
      console.log('Logged out successfully');
      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      // Still clear user data even on error
      clearUser();
      return { success: true };
    } finally {
      setLoading(false);
    }
  }, [clearUser, setLoading]);

  return {
    // State
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    
    // Actions
    login,
    logout,
    updateRole,
    clearError,
  };
}

export default useAuth;
